"""App session signing key storage; no messaging SDK or bot credentials at runtime."""
import os
from pathlib import Path
import stat


def read_key(path):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_mode & 0o077:
            raise ValueError('APP_KEY_PERMISSIONS_INVALID')
        key = os.read(fd, 33)
        if len(key) != 32:
            raise ValueError('APP_KEY_SIZE_INVALID')
        return key
    finally:
        os.close(fd)


def create_key(path, value=None):
    """A migration may supply the existing 32-byte derived app key to retain sessions."""
    value = os.urandom(32) if value is None else value
    if not isinstance(value, bytes) or len(value) != 32:
        raise ValueError('APP_KEY_SIZE_INVALID')
    path = Path(path)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        with os.fdopen(fd, 'wb') as handle:
            handle.write(value)
            handle.flush()
            os.fsync(handle.fileno())
    except BaseException:
        path.unlink(missing_ok=True)
        raise
    return value
