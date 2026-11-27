#!/usr/bin/env python3
"""Download, verify and run the owner-approved Wakhan build94 update."""
import hashlib
import os
from pathlib import Path, PurePosixPath
import stat
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile

URL = 'https://github.com/rahimidaniyal27-netizen/Wakhan-App/releases/download/native-0.2.79-beta/Wakhan-0.2.79-iPhone-Android.zip'
EXPECTED = '9ae0bb783e06f5ecd4291bcfe5dacfcdba6fb198db826ba1afbce114ecd09b93'


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
    assert os.geteuid() == 0, 'RUN_AS_ROOT'
    os.umask(0o077)
    directory = Path(tempfile.mkdtemp(prefix='wakhan-0279-install-', dir='/root'))
    archive = directory / 'Wakhan-0.2.79-iPhone-Android.zip'
    deadline = time.monotonic() + 180
    request = urllib.request.Request(URL, headers={'User-Agent': 'Wakhan-owner-installer/0.2.79'})
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
    print('مرحلهٔ1: نصب تفکیک ورود/ثبت‌نام و امضای اندروید', flush=True)
    code = subprocess.run([sys.executable, str(directory / 'install.py'), '--apply']).returncode
    if code:
        return code
    print('مرحلهٔ2: لوگوی اصلی شرایط و حریم خصوصی', flush=True)
    code = subprocess.run([sys.executable, str(directory / 'fix-legal-logo.py'), '--apply']).returncode
    if code:
        print('ورود و اندروید نصب شدند؛ مرحلهٔ لوگو موفق نشد. خروجی همین خطا را بفرستید.', flush=True)
    else:
        print('هر دو مرحله موفق شدند. اکنون نسخهٔ0.2.79 / build94 را روی گوشی نصب کنید.', flush=True)
    return code


if __name__ == '__main__':
    try: sys.exit(main())
    except Exception as exc:
        print('STOP: ' + (str(exc) if type(exc) is AssertionError else type(exc).__name__))
        sys.exit(1)
