#!/usr/bin/env python3
"""Download, verify and run the owner-approved Wakhan build95 update."""
import hashlib
import argparse
import os
from pathlib import Path, PurePosixPath
import stat
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile

URL = 'https://github.com/rahimidaniyal27-netizen/Wakhan-App/releases/download/native-0.2.80-beta/Wakhan-0.2.80-iPhone-Android.zip'
EXPECTED = '6a6976e1fc07e1ffda2ec3f2443ae411c83a99c488ed066b7410de28db32b421'


def unpack(archive, directory):
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == EXPECTED, 'ARCHIVE_SHA_MISMATCH'
    with zipfile.ZipFile(archive) as z:
        items = z.infolist()
        assert len(items) <= 100 and len({i.filename for i in items}) == len(items), 'INVALID_ARCHIVE'
        assert sum(i.file_size for i in items) < 100 * 1024**2, 'ARCHIVE_TOO_LARGE'
        for i in items:
            p = PurePosixPath(i.filename)
            assert not p.is_absolute() and '..' not in p.parts and '\\' not in i.filename and not stat.S_ISLNK(i.external_attr >> 16), 'INVALID_ARCHIVE_PATH'
        assert z.testzip() is None, 'CORRUPT_ARCHIVE'
        z.extractall(directory)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--email-only', action='store_true', help='Set up Gmail privately; do not reinstall native Google/backend/APK')
    args = parser.parse_args()
    assert os.geteuid() == 0, 'RUN_AS_ROOT'
    os.umask(0o077)
    directory = Path(tempfile.mkdtemp(prefix='wakhan-0280-install-', dir='/root'))
    archive = directory / 'Wakhan-0.2.80-iPhone-Android.zip'
    deadline = time.monotonic() + 180
    request = urllib.request.Request(URL, headers={'User-Agent': 'Wakhan-owner-installer/0.2.80'})
    try:
        with urllib.request.urlopen(request, timeout=45) as response, archive.open('xb') as output:
            total = 0
            while raw := response.read(1024 * 1024):
                total += len(raw)
                assert total < 64 * 1024**2 and time.monotonic() < deadline, 'DOWNLOAD_LIMIT'
                output.write(raw)
        unpack(archive, directory)
    except Exception as exc:
        print('دریافت یا تأیید بسته انجام نشد؛ هیچ تغییری در سرویس داده نشد. ' + type(exc).__name__)
        return 1
    print('بسته با SHA256 تأیید شد. پوشهٔ نصب: ' + str(directory), flush=True)
    if args.email_only:
        return subprocess.run([sys.executable, str(directory / 'setup-email.py'), '--configure']).returncode
    code = subprocess.run([sys.executable, str(directory / 'install.py'), '--apply']).returncode
    if code == 0:
        print('تنظیم ورود بومی گوگل روی سرور انجام شد؛ نسخهٔ0.2.80/build95 را روی گوشی نصب کنید.', flush=True)
        print('برای تنظیم خصوصی Gmail بعد از ساخت App Password: python3 ' + str(Path(__file__).resolve()) + ' --email-only', flush=True)
    return code


if __name__ == '__main__':
    try: sys.exit(main())
    except Exception as exc:
        print('STOP: ' + (str(exc) if type(exc) is AssertionError else type(exc).__name__))
        sys.exit(1)
