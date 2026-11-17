import hashlib,json,os,re,shutil,subprocess,tempfile,zipfile,struct,urllib.request
from pathlib import Path


FIELDS = {'store': ('storefile', 'keystorefile', 'keystorepath', 'storepath', 'keystore'), 'alias': ('keyalias', 'releasealias', 'alias'), 'store_pass': ('storepassword', 'keystorepassword', 'keystorepass', 'storepass', 'password'), 'key_pass': ('keypassword', 'keypass')}

def unescape(value):

    def decode(m):
        s = m.group(1)
        if s.startswith('u') and len(s) == 5:
            return chr(int(s[1:], 16))
        return {'t': '\t', 'n': '\n', 'r': '\r', 'f': '\x0c'}.get(s, s)
    return re.sub('\\\\(u[0-9a-fA-F]{4}|.)', decode, value)

def properties(text, env=False):
    result = {}
    pending = ''
    for raw in text.splitlines():
        line = pending + raw.lstrip() if pending else raw
        if len(line) - len(line.rstrip('\\')) & 1:
            pending = line[:-1]
            continue
        pending = ''
        line = line.lstrip()
        if not line or line.startswith(('#', '!')):
            continue
        if env and line.startswith('export '):
            line = line[7:].lstrip()
        m = re.match('((?:\\\\.|[^\\s:=])+)(?:\\s*[=:]\\s*|\\s+)(.*)\\Z', line)
        if not m:
            continue
        key, value = m.groups()
        if env and len(value) >= 2 and (value[0] == value[-1]) and (value[0] in ('"', "'")):
            quote = value[0]
            value = value[1:-1]
            if quote == '"':
                value = value.replace('\\"', '"').replace('\\\\', '\\')
        elif not env:
            value = unescape(value)
        result[unescape(key)] = value
    return result

def normalize(values):
    normalized = {re.sub('[^a-z0-9]', '', str(k).lower()): v for k, v in values.items() if isinstance(v, (str, Path))}
    output = {}
    for field, endings in FIELDS.items():
        found = []
        for key, value in normalized.items():
            if any((key == ending or (key.endswith(ending) and any((prefix in key for prefix in ('wakhan', 'android', 'release', 'upload', 'signing', 'myapp')))) for ending in endings)):
                found.append(str(value))
        unique = list(dict.fromkeys(found))
        if len(unique) == 1:
            output[field] = unique[0]
        elif len(unique) > 1:
            return None
    if 'store' not in output or 'store_pass' not in output:
        return None
    output.setdefault('key_pass', output['store_pass'])
    output.setdefault('alias', '')
    return output

def key_certificate(config):
    keytool = shutil.which('keytool')
    if not keytool:
        raise RuntimeError('JAVA_KEYTOOL_NOT_FOUND')
    env = {**os.environ, 'WAKHAN_SIGNING_STORE_PASS': config['store_pass']}
    try:
        if not config.get('alias'):
            listed = subprocess.run([keytool, '-J-Duser.language=en', '-list', '-rfc', '-keystore', config['store'], '-storepass:env', 'WAKHAN_SIGNING_STORE_PASS'], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
            if listed.returncode:
                return None
            aliases = re.findall('^Alias name: (.+)$', listed.stdout.decode('utf-8', 'replace'), re.M)
            if len(aliases) != 1:
                return None
            config['alias'] = aliases[0].strip()
        result = subprocess.run([keytool, '-exportcert', '-keystore', config['store'], '-alias', config['alias'], '-storepass:env', 'WAKHAN_SIGNING_STORE_PASS'], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
        return hashlib.sha256(result.stdout).hexdigest() if result.returncode == 0 else None
    finally:
        env.pop('WAKHAN_SIGNING_STORE_PASS', None)

def read_existing_configuration(path, expected_certificate):
    path = Path(path)
    if not path.is_file() or path.is_symlink():
        raise RuntimeError('EXISTING_RELEASE_PROPERTIES_NOT_FOUND')
    config = normalize(properties(path.read_text()))
    if not config:
        raise RuntimeError('EXISTING_RELEASE_PROPERTIES_INVALID')
    store = Path(config['store'])
    if not store.is_absolute():
        store = path.parent / store
    if not store.is_file():
        raise RuntimeError('EXISTING_RELEASE_KEYSTORE_NOT_FOUND')
    config['store'] = str(store.resolve())
    if key_certificate(config) != expected_certificate:
        config.clear()
        raise RuntimeError('EXISTING_RELEASE_CERTIFICATE_MISMATCH')
    return config

def sign_release(apk, tools, work, config, run, report):
    aligned = work / 'aligned.apk'
    signed = work / 'signed.apk'
    run([tools / 'zipalign', '-f', '-P', '16', '4', apk, aligned], work, 'ALIGN_APK', report, 120)
    store_name = 'WAKHAN_BETA27_STORE_PASSWORD'
    key_name = 'WAKHAN_BETA27_KEY_PASSWORD'
    previous = {name: os.environ.get(name) for name in (store_name, key_name)}
    try:
        os.environ[store_name] = config['store_pass']
        os.environ[key_name] = config['key_pass']
        run([tools / 'apksigner', 'sign', '--ks', config['store'], '--ks-key-alias', config['alias'], '--ks-pass', 'env:' + store_name, '--key-pass', 'env:' + key_name, '--out', signed, aligned], work, 'SIGN_APK', report, 120)
    finally:
        for name, value in previous.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value
        config.clear()
    return signed

def lp(data, at=0):
    if at + 4 > len(data):
        raise ValueError('APK_SIGNATURE_TRUNCATED')
    size = struct.unpack_from('<I', data, at)[0]
    end = at + 4 + size
    if end > len(data):
        raise ValueError('APK_SIGNATURE_TRUNCATED')
    return (data[at + 4:end], end)

def signer_hashes(path):
    data = Path(path).read_bytes()
    eocd = data.rfind(b'PK\x05\x06', max(0, len(data) - 65557))
    if eocd < 0:
        raise ValueError('APK_DIRECTORY_NOT_FOUND')
    central = struct.unpack_from('<I', data, eocd + 16)[0]
    if data[central - 16:central] != b'APK Sig Block 42':
        raise ValueError('APK_SIGNING_BLOCK_NOT_FOUND')
    size = struct.unpack_from('<Q', data, central - 24)[0]
    start = central - size - 8
    if start < 0 or struct.unpack_from('<Q', data, start)[0] != size:
        raise ValueError('APK_SIGNING_BLOCK_INVALID')
    hashes = set()
    at = start + 8
    while at < central - 24:
        length = struct.unpack_from('<Q', data, at)[0]
        at += 8
        end = at + length
        if length < 4 or end > central - 24:
            raise ValueError('APK_SIGNATURE_TRUNCATED')
        kind = struct.unpack_from('<I', data, at)[0]
        value = data[at + 4:end]
        at = end
        if kind not in (1896449818, 4031998144):
            continue
        signers, _ = lp(value)
        pos = 0
        while pos < len(signers):
            signer, pos = lp(signers, pos)
            signed, _ = lp(signer)
            _, offset = lp(signed)
            certificates, _ = lp(signed, offset)
            certificate, _ = lp(certificates)
            hashes.add(hashlib.sha256(certificate).hexdigest())
    if not hashes:
        raise ValueError('APK_NO_SIGNER_CERTIFICATE')
    return sorted(hashes)

def sign_bundle(bundle, work, config, expected, run, report):
    try:
        return _sign_bundle(bundle, work, config, expected, run, report)
    finally:
        config.clear()

def _sign_bundle(bundle, work, config, expected, run, report):
    executable = shutil.which('jarsigner')
    java = shutil.which('java')
    keytool = shutil.which('keytool')
    jarsigner = [executable] if executable else [java, '-m', 'jdk.jartool/sun.security.tools.jarsigner.Main'] if java else []
    if not jarsigner or not keytool:
        raise RuntimeError('BUNDLE_SIGNING_TOOLS_NOT_FOUND')
    clean = work / 'unsigned-clean.aab'
    signed = work / 'signed.aab'
    with zipfile.ZipFile(bundle) as source, zipfile.ZipFile(clean, 'x', zipfile.ZIP_DEFLATED) as target:
        if 'BundleConfig.pb' not in source.namelist():
            raise RuntimeError('ANDROID_BUNDLE_INVALID')
        for entry in source.infolist():
            if entry.filename.upper() == 'META-INF/MANIFEST.MF' or re.fullmatch('META-INF/[^/]+\\.(SF|RSA|DSA|EC)', entry.filename, re.I):
                continue
            target.writestr(entry, source.read(entry))
    names = ('WAKHAN028_BUNDLE_STORE_PASSWORD', 'WAKHAN028_BUNDLE_KEY_PASSWORD')
    previous = {name: os.environ.get(name) for name in names}
    try:
        os.environ[names[0]] = config['store_pass']
        os.environ[names[1]] = config['key_pass']
        run([*jarsigner, '-keystore', config['store'], '-storepass:env', names[0], '-keypass:env', names[1], '-digestalg', 'SHA-256', '-signedjar', signed, clean, config['alias']], work, 'SIGN_AAB', report, 120)
        run([*jarsigner, '-verify', signed], work, 'VERIFY_AAB_SIGNATURE', report, 120)
        result = run([keytool, '-printcert', '-jarfile', signed], work, 'VERIFY_AAB_CERTIFICATE', report, 120).decode('utf-8', 'replace')
        certificates = {value.replace(':', '').lower() for value in re.findall('SHA256:\\s*([0-9A-Fa-f:]{64,95})', result)}
        if certificates != {expected}:
            raise RuntimeError('AAB_RELEASE_CERTIFICATE_MISMATCH')
    finally:
        for name, value in previous.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value
        config.clear()
    return signed

VERSION = '0.2.38-beta'
BUILD = 53
CERTIFICATE = 'eb3eab7d1e1b109187295ebe26e36d7ec4e260c12810f74c2c8114be8dbee1b4'
SHELL = 'aa623223555d995507bcefebce54a5f2825db69578ef6ee08e2b0e04c8569d4f'
SOURCE = Path('/opt/wakhan-android/wakhan-beta236-home-jm1pszwp/project')
STATE = Path('/root/wakhan-0238-state.json')
PATCHES = ['android/app/build.gradle', 'ios-assets/native/WakhanLocalePlugin.swift', 'package-lock.json', 'package.json', 'public/home-ui/src/home.js', 'public/home-ui/src/native-home.css', 'public/home-ui/src/native-link.js', 'public/wakhan-release.json', 'public/wakhan-shell.json', 'scripts/build.mjs', 'src/approved-home.mjs', 'src/home-rank-feed.mjs', 'src/main.mjs', 'src/shared-navigation.mjs', 'tests/home-rank-feed.test.mjs', 'tests/salon-patch-manifest.json']

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def require(value, message):
    if not value:
        raise RuntimeError(message)

def run(args, cwd, phase, report, timeout=120):
    print(phase, flush=True)
    result = subprocess.run([str(a) for a in args], cwd=cwd, capture_output=True, timeout=timeout)
    require(result.returncode == 0, phase + '_FAILED')
    return result.stdout

def copy_atomic(source, target):
    stat = target.stat()
    fd, temporary = tempfile.mkstemp(prefix='.wakhan-0238-', dir=target.parent)
    try:
        with os.fdopen(fd, 'wb') as out, Path(source).open('rb') as inp:
            shutil.copyfileobj(inp, out)
            out.flush()
            os.fsync(out.fileno())
            os.fchown(out.fileno(), stat.st_uid, stat.st_gid)
            os.fchmod(out.fileno(), stat.st_mode & 0o777)
        os.replace(temporary, target)
    finally:
        Path(temporary).unlink(missing_ok=True)

def execute(directory, report):
    require(os.geteuid() == 0, 'RUN_AS_ROOT')
    manifest = json.loads((directory / 'PACKAGE.json').read_text())
    require(manifest.get('version') == VERSION and manifest.get('build') == BUILD, 'WRONG_PACKAGE')
    for name, digest in manifest['sha256'].items():
        path = directory / name
        require(not path.is_symlink() and path.resolve().is_relative_to(directory.resolve())
                and sha(path) == digest, 'PACKAGE_FILE_CHANGED')
    saved_state = STATE
    if saved_state.exists():
        require(not saved_state.is_symlink(), 'STATE_PATH_INVALID')
        saved = json.loads(saved_state.read_text())
        require(saved.get('package_sha256') == sha(directory / 'PACKAGE.json'), 'PREVIOUS_PACKAGE_DIFFERS')
        for field, digest in [('signed_apk', 'apk_sha256'), ('signed_aab', 'aab_sha256'), ('published_path', 'apk_sha256')]:
            path = Path(saved[field])
            require(not path.is_symlink() and path.is_file() and sha(path) == saved[digest], 'PREVIOUS_OUTPUT_CHANGED')
        report.update(saved)
        print('ALREADY_COMPLETED_AND_VERIFIED', flush=True)
        return
    baseline = json.loads((directory / 'base0236.json').read_text())
    require(not SOURCE.is_symlink() and SOURCE.is_dir(), 'CURRENT_0234_SOURCE_MISSING')
    for name, digest in baseline.items():
        path = SOURCE / name
        require(path.is_file() and not path.is_symlink() and sha(path) == digest,
                'CURRENT_SOURCE_CHANGED:' + name)
    unsigned = directory / 'app-release-unsigned.apk'
    with zipfile.ZipFile(unsigned) as z:
        require(z.testzip() is None, 'ANDROID_ZIP_INVALID')
        require(hashlib.sha256(z.read('assets/public/wakhan-shell.json')).hexdigest() == SHELL,
                'ME_AND_SALON_SOURCE_DIFFER')
        release = json.loads(z.read('assets/public/wakhan-release.json'))
        require(release.get('version') == VERSION and release.get('build') == BUILD, 'APK_RELEASE_MISMATCH')
    service = subprocess.run(['systemctl', 'show', 'wakhan-app.service', '-p', 'WorkingDirectory', '--value'],
                             capture_output=True, text=True, check=True).stdout.strip()
    live = Path(service)
    require(live.is_absolute() and live.is_dir() and not live.is_symlink(), 'LIVE_APP_DIRECTORY_INVALID')
    releases = live / 'releases'
    target = releases / 'Wakhan.apk'
    require(releases.is_dir() and not releases.is_symlink() and target.is_file()
            and not target.is_symlink(), 'CURRENT_DOWNLOAD_MISSING')
    require(signer_hashes(target) == [CERTIFICATE], 'CURRENT_APK_SIGNER_DIFFERS')
    require(sha(target) == '4ce01ac4434f6d6a5a5d7a4e8d5082683333886ced386a681ca8d4601c39e1f8', 'CURRENT_PUBLIC_APK_CHANGED')
    require(sha(live / 'wakhan_home_rankings.py') == '9abf0df62104653578d457124f4b468a932dc1d8dd0c1536524785da9ee67aa2', 'HOME_RANKINGS_SOURCE_CHANGED')
    sdk_roots = [Path(v) for v in (os.environ.get('ANDROID_HOME'), os.environ.get('ANDROID_SDK_ROOT')) if v]
    sdk_roots += [Path(v) for v in ('/opt/android-sdk', '/opt/android-sdk-linux', '/root/Android/Sdk',
                                  '/usr/lib/android-sdk', '/opt/wakhan-android/sdk', '/opt/wakhan-android/android-sdk')]
    tools = [p for sdk in sdk_roots for p in sdk.glob('build-tools/*/apksigner') if p.is_file()]
    require(tools, 'ANDROID_BUILD_TOOLS_NOT_FOUND')
    signer = sorted(tools, key=lambda p: [int(x) if x.isdigit() else x for x in re.split(r'(\d+)', str(p))])[-1]
    tool_dir = signer.parent
    require((tool_dir / 'aapt').is_file(), 'AAPT_NOT_FOUND')
    def check_apk(apk):
        value = run([tool_dir / 'aapt', 'dump', 'badging', apk], directory, 'CHECK_APK_VERSION', report).decode()
        match = re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'", value)
        require(match and match.groups() == ('app.wakhan.music', str(BUILD), VERSION), 'APK_BINARY_VERSION_MISMATCH')
    check_apk(unsigned)
    work = Path(tempfile.mkdtemp(prefix='wakhan-0238-sign-', dir='/opt/wakhan-android'))
    config = read_existing_configuration('/opt/wakhan-android/keys/release.properties', CERTIFICATE)
    signed = sign_release(unsigned, tool_dir, work, config, run, report)
    run([signer, 'verify', '--verbose', signed], work, 'VERIFY_APK_SIGNATURE', report)
    require(signer_hashes(signed) == [CERTIFICATE], 'SIGNED_APK_CERTIFICATE_MISMATCH')
    check_apk(signed)
    config = read_existing_configuration('/opt/wakhan-android/keys/release.properties', CERTIFICATE)
    bundle = sign_bundle(directory / 'app-release.aab', work, config, CERTIFICATE, run, report)
    for artifact, filename in [(signed, 'Wakhan-0.2.38-beta-test.apk'), (bundle, 'Wakhan-0.2.38-beta-release.aab')]:
        destination = Path('/root') / filename
        require(not destination.exists() or (not destination.is_symlink() and sha(destination) == sha(artifact)),
                'DIFFERENT_OUTPUT_ALREADY_EXISTS')
        if not destination.exists():
            with destination.open('xb') as out, artifact.open('rb') as inp:
                os.fchmod(out.fileno(), 0o600)
                shutil.copyfileobj(inp, out)
    stage = Path(tempfile.mkdtemp(prefix='wakhan-beta238-home-', dir='/opt/wakhan-android')) / 'project'
    shutil.copytree(SOURCE, stage, symlinks=True,
                    ignore=shutil.ignore_patterns('node_modules', '.git', '.gradle', 'build', 'www', 'dist'))
    with zipfile.ZipFile(directory / 'Wakhan-0.2.38-source.zip') as z:
        for name in PATCHES:
            destination = stage / name
            require(not destination.is_symlink() and destination.resolve().is_relative_to(stage.resolve()), 'STAGE_PATH_INVALID')
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(z.read('project/' + name))
    assets = stage / 'android/app/src/main/assets'
    if (assets / 'public').exists():
        shutil.rmtree(assets / 'public')
    with zipfile.ZipFile(unsigned) as z:
        for name in z.namelist():
            if name.startswith('assets/') and not name.endswith('/'):
                relative = Path(name.removeprefix('assets/'))
                require(not relative.is_absolute() and '..' not in relative.parts, 'ASSET_PATH_INVALID')
                destination = assets / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(z.read(name))
    require(sha(stage / 'public/wakhan-shell.json') == SHELL, 'STAGE_SHELL_CHANGED')
    previous_sha = sha(target)
    backup = releases / ('Wakhan-before-0.2.38-' + previous_sha[:16] + '.apk')
    require(not backup.exists() or (not backup.is_symlink() and sha(backup) == previous_sha), 'BACKUP_CONFLICT')
    if not backup.exists():
        with backup.open('xb') as out, target.open('rb') as inp:
            os.fchmod(out.fileno(), target.stat().st_mode & 0o777)
            os.fchown(out.fileno(), target.stat().st_uid, target.stat().st_gid)
            shutil.copyfileobj(inp, out)
            out.flush()
            os.fsync(out.fileno())
    copy_atomic(signed, target)
    try:
        request = urllib.request.Request('http://127.0.0.1:10010/download/Wakhan.apk', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=30) as response:
            digest = hashlib.sha256()
            while chunk := response.read(1024 * 1024):
                digest.update(chunk)
        require(digest.hexdigest() == sha(signed), 'PUBLISHED_DOWNLOAD_DIFFERS')
    except BaseException:
        copy_atomic(backup, target)
        report['download_rolled_back'] = True
        raise
    report.update(ok=True, version=VERSION, build=BUILD, original_signer_verified=True,
                  signed_apk='/root/Wakhan-0.2.38-beta-test.apk', apk_sha256=sha(signed),
                  signed_aab='/root/Wakhan-0.2.38-beta-release.aab', aab_sha256=sha(bundle),
                  source_project=str(stage), download_published=True, previous_apk_retained=True,
                  services_changed=False, database_changed=False, physical_device_verified=False,
                  published_path=str(target), package_sha256=sha(directory / 'PACKAGE.json'))
    fd, temporary = tempfile.mkstemp(prefix='.wakhan-0238-state-', dir='/root')
    try:
        with os.fdopen(fd, 'w') as out:
            json.dump(report, out, indent=2)
            out.flush()
            os.fsync(out.fileno())
        os.replace(temporary, saved_state)
    except BaseException:
        copy_atomic(backup, target)
        report['ok'] = False
        report['download_rolled_back'] = True
        raise
    finally:
        Path(temporary).unlink(missing_ok=True)

if __name__ == '__main__':
    report = {'ok': False, 'services_changed': False, 'database_changed': False}
    try:
        import fcntl
        lock = open('/root/.wakhan-home0238.lock', 'a')
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        execute(Path(__file__).resolve().parent, report)
    except Exception as error:
        report['ok'] = False
        report['error'] = str(error) if isinstance(error, RuntimeError) else type(error).__name__
        print('STOP:', report['error'], flush=True)
    finally:
        destination = Path('/root/wakhan-0238-result.zip')
        fd, temporary = tempfile.mkstemp(prefix='.wakhan-0238-report-', dir='/root')
        with os.fdopen(fd, 'wb') as handle, zipfile.ZipFile(handle, 'w', zipfile.ZIP_DEFLATED) as z:
            z.writestr('result.json', json.dumps(report, indent=2))
        os.replace(temporary, destination)
        print('REPORT:', destination, flush=True)
    if not report['ok']:
        raise SystemExit(1)
    print('ANDROID_READY: https://music.kabulcafe.uk/download/Wakhan.apk?build=53', flush=True)
