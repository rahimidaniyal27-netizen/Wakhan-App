"""Eight-digit public account IDs. Private database/ledger IDs never change."""
import secrets
import sqlite3

LOW, HIGH = 10_000_000, 99_999_999


class PublicIds:
    def __init__(self, db):
        self.db = db
        db.execute('''create table if not exists wka_public_ids (
            public_id integer primary key check(public_id between 10000000 and 99999999),
            uid integer unique, retired integer not null default 0 check(retired in (0,1)),
            check((retired=0 and uid is not null) or (retired=1 and uid is null)))''')
        db.commit()

    def get(self, uid):
        row = self.db.execute('select public_id from wka_public_ids where uid=? and retired=0', (uid,)).fetchone()
        return int(row[0]) if row else None

    def available(self, public_id, uid):
        if type(public_id) is not int or not LOW <= public_id <= HIGH:
            return False
        # Avoid ambiguity with older client versions still using a private 8-digit ID.
        return (not self.db.execute('select 1 from wka_public_ids where public_id=?', (public_id,)).fetchone()
            and not self.db.execute('select 1 from users where uid=? and uid<>?', (public_id, uid)).fetchone())

    def assign(self, uid, sevens=False):
        if type(uid) is not int or uid <= 0:
            raise ValueError('BAD_ACCOUNT_ID')
        if not self.db.execute('select 1 from wka_accounts where uid=?', (uid,)).fetchone():
            raise ValueError('ACCOUNT_NOT_FOUND')
        existing = self.get(uid)
        if existing is not None:
            return existing
        preferred = [77_777_777, 77_777_717, 77_777_177, 77_771_777, 77_717_777, 77_177_777] if sevens else []
        self.db.execute('savepoint wka_id_assign')
        try:
            for attempt in range(128):
                candidate = preferred[attempt] if attempt < len(preferred) else (77_000_000 + secrets.randbelow(1_000_000) if sevens else LOW + secrets.randbelow(HIGH - LOW + 1))
                if not self.available(candidate, uid):
                    continue
                try:
                    self.db.execute('insert into wka_public_ids(public_id,uid) values(?,?)', (candidate, uid))
                except sqlite3.IntegrityError:
                    existing = self.get(uid)
                    if existing is not None:
                        self.db.execute('release wka_id_assign')
                        return existing
                    continue
                self.db.execute('release wka_id_assign')
                return candidate
            raise RuntimeError('PUBLIC_ID_ALLOCATION_BUSY')
        except BaseException:
            self.db.execute('rollback to wka_id_assign')
            self.db.execute('release wka_id_assign')
            raise

    def resolve(self, public_id):
        if type(public_id) is not int or not LOW <= public_id <= HIGH:
            return None
        row = self.db.execute('''select p.uid from wka_public_ids p join wka_accounts a on a.uid=p.uid
            where p.public_id=? and p.retired=0 and a.done=1 and a.blocked=0''', (public_id,)).fetchone()
        return int(row[0]) if row else None

    def retire(self, uid):
        # Keep an anonymous tombstone to prevent a future user inheriting an old ID.
        self.db.execute('update wka_public_ids set uid=null,retired=1 where uid=?', (uid,))

    def assign_existing(self, owner):
        if not self.db.execute('select 1 from wka_accounts where uid=?', (owner,)).fetchone():
            raise ValueError('OWNER_ACCOUNT_NOT_FOUND')
        result = {'owner_public_id': self.assign(owner, sevens=True), 'assigned': 1}
        for (uid,) in self.db.execute('select uid from wka_accounts where uid<>? order by uid', (owner,)).fetchall():
            self.assign(int(uid)); result['assigned'] += 1
        return result
