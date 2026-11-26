"""Private account-level listening affinity; no rewards or public counters."""
import json,re,time,unicodedata

def clean(value):return unicodedata.normalize('NFKC',str(value or '')).strip().casefold()[:150]
def signals(track):
    result=[];artist=clean(track.get('artist'));genre=clean(track.get('genre'))
    if artist and artist not in ('youtube','soundcloud'):result.append(('artist',artist))
    if genre:result.append(('genre',genre))
    text=track.get('title','')+' '+track.get('artist','');lang=clean(track.get('language'))
    if not lang:lang='ps' if re.search('[ښڅځږګڼټډړ]',text) else 'fa' if re.search('[پچژگ]',text) else 'arabic_script' if re.search('[\u0600-\u06ff]',text) else 'latin' if re.search('[a-zA-Z]',text) else ''
    if lang:result.append(('language',lang))
    return result

class Preferences:
    def __init__(self,db):
        self.db=db
        db.executescript('CREATE TABLE IF NOT EXISTS wkm_affinity(uid INTEGER NOT NULL,kind TEXT NOT NULL,value TEXT NOT NULL,weight REAL NOT NULL DEFAULT 0,updated INTEGER NOT NULL,PRIMARY KEY(uid,kind,value));CREATE TABLE IF NOT EXISTS wkm_listen_once(uid INTEGER NOT NULL,track TEXT NOT NULL,ts INTEGER NOT NULL,PRIMARY KEY(uid,track));')
        db.commit()
    def profile(self,uid):return self.db.execute('SELECT kind,value,weight FROM wkm_affinity WHERE uid=? ORDER BY weight DESC LIMIT 30',(uid,)).fetchall()
    def listen(self,uid,track,seconds,now=None):
        now=int(now or time.time());seconds=float(seconds)
        if not 20<=seconds<=120:raise ValueError('seconds')
        last=self.db.execute('SELECT ts FROM wkm_listen_once WHERE uid=? AND track=?',(uid,track['id'])).fetchone()
        if last and now-last[0]<90:return False
        with self.db:
            self.db.execute('INSERT INTO wkm_listen_once VALUES(?,?,?) ON CONFLICT(uid,track) DO UPDATE SET ts=excluded.ts',(uid,track['id'],now))
            for kind,value in signals(track):
                self.db.execute('INSERT INTO wkm_affinity VALUES(?,?,?,?,?) ON CONFLICT(uid,kind,value) DO UPDATE SET weight=min(10000,wkm_affinity.weight+excluded.weight),updated=excluded.updated',(uid,kind,value,min(seconds,60)/30,now))
            self.db.execute('DELETE FROM wkm_listen_once WHERE ts<?',(now-30*86400,))
        return True
    def rank(self,uid,items):
        weights={(k,v):float(w)for k,v,w in self.profile(uid)}
        def score(t):return sum(weights.get((k,v),0)*(3 if k=='artist'else 1.5 if k=='genre'else 1) for k,v in signals(t))
        return [dict(t,personalized=bool(weights))for t in sorted(items,key=score,reverse=True)]
    def query(self,uid,language='fa'):
        rows=self.profile(uid);artists=[v for k,v,w in rows if k=='artist']
        if artists:return artists[0]
        langs=[v for k,v,w in rows if k=='language']
        lang=langs[0]if langs else language
        return {'fa':'آهنگ فارسی','arabic_script':'آهنگ فارسی','ps':'پښتو سندرې','ar':'موسيقى','latin':'music'}.get(lang,'music')
