"""Settings of the media engine, kept in the app's own database (table wkm_settings) - never in .env.

Server-side use (the owner runs it on the server, nothing is typed into a chat):
    python3 -m wakhan_media.config --db /path/to/app.db list
    python3 -m wakhan_media.config --db /path/to/app.db set egress_cap_mbps 300
    python3 -m wakhan_media.config --db /path/to/app.db set youtube_api_key        (asks for the value, hidden)
"""
import argparse
import getpass
import os
import secrets
import sqlite3
import threading

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULTS = {
    'root': os.path.join(os.path.dirname(HERE), 'media-data'),   # HLS files + uploads live here
    'store_gb': '20',              # disk quota of the HLS cache; the least recently used is removed first
    'egress_cap_mbps': '400',      # total outgoing budget of /media/hls
    'audio_jobs': '3',             # transcodes at the same time
    'video_jobs': '1',
    'upload_audio_mb': '50',
    'upload_store_gb': '5',        # shared quota for original uploads, separate from the HLS cache
    'auth_trusted_proxy_ip': '0',  # enable only after the Wakhan proxy overwrites its dedicated client-IP header
    'upload_video_mb': '2048',
    'upload_audio_min': '15',      # longest audio upload, minutes
    'uploads_per_day': '20',
    'session_hours': '2',          # 'session' cache: removed this long after the last use
    'youtube_api_key': '',         # YouTube Data API v3 key for search (official API); empty = YouTube search off
    'room_cap': '200',             # most sockets in one salon
    'max_video': '1080',           # highest video quality: 1080 (Full HD) or 2160 (4K; heavy on CPU and bandwidth)
}
SECRET_KEYS = ('youtube_api_key', 'sign_key')


class Settings:
    def __init__(self, db):
        self.db = db
        self.lock = threading.Lock()
        self.cache = {}

    def init(self):
        with self.lock, self.db:
            self.db.execute('CREATE TABLE IF NOT EXISTS wkm_settings(k TEXT PRIMARY KEY, v TEXT NOT NULL)')
            if not self.db.execute("SELECT 1 FROM wkm_settings WHERE k='sign_key'").fetchone():
                self.db.execute("INSERT INTO wkm_settings VALUES('sign_key',?)", (secrets.token_hex(32),))
        self.cache.clear()

    def get(self, key):
        if key not in self.cache:
            row = self.db.execute('SELECT v FROM wkm_settings WHERE k=?', (key,)).fetchone()
            self.cache[key] = row[0] if row else DEFAULTS.get(key, '')
        return self.cache[key]

    def num(self, key):
        try:
            return float(self.get(key))
        except (TypeError, ValueError):
            return float(DEFAULTS.get(key) or 0)

    def set(self, key, value):
        with self.lock, self.db:
            self.db.execute('INSERT OR REPLACE INTO wkm_settings VALUES(?,?)', (key, str(value)))
        self.cache.pop(key, None)

    def all(self):
        out = dict(DEFAULTS)
        out.update({k: v for k, v in self.db.execute('SELECT k,v FROM wkm_settings')})
        return out


def main(argv=None):
    p = argparse.ArgumentParser(prog='wakhan_media.config')
    p.add_argument('--db', required=True)
    sub = p.add_subparsers(dest='cmd', required=True)
    sub.add_parser('list')
    s = sub.add_parser('set')
    s.add_argument('key')
    s.add_argument('value', nargs='?')
    a = p.parse_args(argv)
    st = Settings(sqlite3.connect(a.db))
    st.init()
    if a.cmd == 'list':
        for k, v in sorted(st.all().items()):
            print('%-18s %s' % (k, ('set' if v else '-') if k in SECRET_KEYS else v))
        return 0
    if a.key not in DEFAULTS:
        print('unknown key: ' + a.key)
        return 2
    value = a.value if a.value is not None else getpass.getpass(a.key + ': ')
    st.set(a.key, value.strip())
    print('saved ' + a.key)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
