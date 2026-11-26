"""Restrict SQLite files to the service owner without reading or rewriting data."""
import os
from pathlib import Path
import stat


def secure_database_files(database):
    database = Path(database)
    changes = []
    for suffix in ('', '-wal', '-shm', '-journal'):
        path = Path(str(database) + suffix)
        try:
            fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        except FileNotFoundError:
            if not suffix:
                raise
            continue
        try:
            info = os.fstat(fd)
            if not stat.S_ISREG(info.st_mode):
                raise ValueError('DATABASE_FILE_TYPE_INVALID')
            if info.st_uid != os.geteuid() and os.geteuid() != 0:
                raise PermissionError('DATABASE_FILE_OWNER_MISMATCH')
            os.fchmod(fd, 0o600)
            changes.append({'file': path.name, 'before': oct(stat.S_IMODE(info.st_mode)), 'after': '0o600'})
        finally:
            os.close(fd)
    return changes
