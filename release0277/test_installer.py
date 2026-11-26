import importlib.util,json,os,sqlite3,hashlib
from pathlib import Path
import pytest
spec=importlib.util.spec_from_file_location('installer',Path(__file__).parent/'server-package/install.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def fixture(tmp_path):
 root=tmp_path/'package';app=tmp_path/'app';(root/'backend').mkdir(parents=True);app.mkdir()
 old=b'VALUE = 1\n';new=b'VALUE = 2\n'
 (app/'a.py').write_bytes(old);(root/'backend/a.py').write_bytes(new)
 manifest={'files':{'a.py':{'sha256':hashlib.sha256(new).hexdigest(),'before':hashlib.sha256(old).hexdigest()}}}
 return root,app,manifest

def test_unreviewed_live_source_aborts_before_any_write(tmp_path):
 root,app,manifest=fixture(tmp_path);(app/'a.py').write_text('PRIVATE = 3\n')
 before=(app/'a.py').read_bytes()
 with pytest.raises(RuntimeError,match='CURRENT_SOURCE_CHANGED'):m.validate_payload(root,app,manifest)
 assert (app/'a.py').read_bytes()==before

def test_unknown_existing_new_module_is_not_overwritten(tmp_path):
 root,app,manifest=fixture(tmp_path);manifest['files']['a.py']['before']=None
 with pytest.raises(RuntimeError,match='CURRENT_SOURCE_CHANGED'):m.validate_payload(root,app,manifest)

def test_payload_tampering_and_directory_link_are_rejected(tmp_path):
 root,app,manifest=fixture(tmp_path);(root/'backend/a.py').write_text('VALUE = 99')
 with pytest.raises(RuntimeError,match='PAYLOAD_CHANGED'):m.validate_payload(root,app,manifest)
 outside=tmp_path/'outside';outside.mkdir();(app/'pkg').symlink_to(outside,target_is_directory=True)
 (root/'backend/pkg').mkdir();(root/'backend/pkg/a.py').write_text('VALUE=1')
 manifest={'files':{'pkg/a.py':{'sha256':m.sha(root/'backend/pkg/a.py'),'before':None}}}
 with pytest.raises(RuntimeError,match='SOURCE_DIRECTORY_LINK'):m.validate_payload(root,app,manifest)

def test_restore_rolls_back_code_and_apk_keeps_new_user_data(tmp_path):
 app=tmp_path/'app';app.mkdir();backup=tmp_path/'backup';backup.mkdir()
 (app/'old.py').write_text('VALUE=1');(app/'Wakhan.apk').write_bytes(b'old APK');(app/'old.py').chmod(0o640)
 paths={'old.py':app/'old.py','new.py':app/'new.py','releases/Wakhan.apk':app/'Wakhan.apk'}
 m.snapshot(paths,backup)
 (app/'old.py').write_text('VALUE=2');(app/'new.py').write_text('NEW=True');(app/'Wakhan.apk').write_bytes(b'new APK')
 db=sqlite3.connect(app/'music.db');db.execute('create table messages(body text)');db.execute("insert into messages values('after deployment')");db.commit()
 m.restore(paths,backup)
 assert (app/'old.py').read_text()=='VALUE=1' and not (app/'new.py').exists()
 assert (app/'old.py').stat().st_mode&0o777==0o640 and (app/'Wakhan.apk').read_bytes()==b'old APK'
 assert db.execute('select body from messages').fetchone()[0]=='after deployment';db.close()

def test_sqlite_backup_preserves_wal_and_external_data_directory(tmp_path):
 external=tmp_path/'external';external.mkdir();app=tmp_path/'app';app.mkdir();(app/'data').symlink_to(external,target_is_directory=True)
 database=app/'data/music.db';db=sqlite3.connect(database);db.execute('pragma journal_mode=wal');db.execute('create table balances(uid integer,amount integer)');db.execute('insert into balances values(1,12345)');db.commit()
 backup=tmp_path/'backup';backup.mkdir();m.backup_database(database.resolve(),backup)
 with sqlite3.connect(backup/'database.sqlite3')as saved:assert saved.execute('select amount from balances').fetchone()[0]==12345
 db.execute('insert into balances values(2,9)');db.commit();assert db.execute('select count(*) from balances').fetchone()[0]==2;db.close()
 assert (backup/'database.sqlite3').stat().st_mode&0o777==0o600

def test_command_failures_never_echo_secrets(monkeypatch):
 class Result:returncode=1;stdout=b'password secret';stderr=b'private'
 monkeypatch.setattr(m.subprocess,'run',lambda *a,**k:Result())
 with pytest.raises(RuntimeError)as e:m.run(['/bin/tool','--password','secret'])
 assert str(e.value)=='COMMAND_FAILED:tool'

def test_health_checks_actual_nested_signin_shape(monkeypatch):
 calls=[]
 class Response:
  status=200
  def __init__(self,raw):self.raw=raw
  def __enter__(self):return self
  def __exit__(self,*a):pass
  def read(self,n):return json.dumps(self.raw).encode()
 class Opener:
  def open(self,url,timeout):
   calls.append(url)
   if url.endswith('/health'):return Response({'ok':True})
   if url.endswith('/config'):return Response({'ok':True,'signin':{'version':1}})
   raise m.urllib.error.HTTPError(url,401,'auth',{},None)
 monkeypatch.setattr(m.urllib.request,'build_opener',lambda *a:Opener())
 m.health(True);assert len(calls)==3

def test_mismatched_android_certificate_cannot_publish(tmp_path,monkeypatch):
 package=tmp_path/'package';package.mkdir();releases=tmp_path/'releases';releases.mkdir();work=tmp_path/'work';work.mkdir()
 (package/'Wakhan-0.2.77-unsigned.apk').write_bytes(b'unsigned');(releases/'Wakhan.apk').write_bytes(b'original installed APK')
 keys=tmp_path/'release.properties';keys.write_text('storeFile=key.jks\nstorePassword=private\nkeyAlias=release\n');(tmp_path/'key.jks').write_bytes(b'local key')
 monkeypatch.setattr(m,'KEYS',keys);monkeypatch.setattr(m,'build_tools',lambda:Path('/tools'))
 monkeypatch.setattr(m,'certificate',lambda t,p:'OLD'if p.name=='Wakhan.apk'else'NEW')
 monkeypatch.setattr(m,'run',lambda *a,**k:'')
 with pytest.raises(RuntimeError,match='ANDROID_CERTIFICATE_CHANGED'):m.sign_android(package,releases,work,{'android_sha256':m.sha(package/'Wakhan-0.2.77-unsigned.apk')})
 assert (releases/'Wakhan.apk').read_bytes()==b'original installed APK'

def test_apply_health_failure_restores_code_apk_but_preserves_new_database_writes(tmp_path,monkeypatch):
 from types import SimpleNamespace
 root,app,manifest=fixture(tmp_path);releases=app/'releases';releases.mkdir()
 (releases/'Wakhan.apk').write_bytes(b'old APK');(releases/'latest.json').write_text('{"build":91}')
 (root/'Wakhan-0.2.77-unsigned.apk').write_bytes(b'unsigned')
 manifest.update(version=m.VERSION,build=m.BUILD,android_sha256=m.sha(root/'Wakhan-0.2.77-unsigned.apk'))
 (root/'MANIFEST.json').write_text(json.dumps(manifest));keys=tmp_path/'keys';keys.write_text('private local key settings')
 dbpath=app/'music.db'
 with sqlite3.connect(dbpath)as db:db.execute('create table messages(body text)');db.execute("insert into messages values('before')")
 owner=SimpleNamespace(pw_uid=os.getuid(),pw_gid=os.getgid())
 monkeypatch.setattr(m,'APP',app);monkeypatch.setattr(m,'ROOT',root);monkeypatch.setattr(m,'KEYS',keys)
 monkeypatch.setattr(m.os,'geteuid',lambda:0);monkeypatch.setattr(m.pwd,'getpwnam',lambda name:owner)
 monkeypatch.setattr(m,'context',lambda a:(owner,dbpath));monkeypatch.setattr(m,'build_tools',lambda:Path('/tools'))
 monkeypatch.setattr(m.shutil,'disk_usage',lambda p:SimpleNamespace(free=1024**4))
 commands=[];monkeypatch.setattr(m,'run',lambda args,**kw:commands.append(args)or'')
 def sign(root,releases,work,manifest):
  target=work/'signed.apk';target.write_bytes(b'new signed APK');return target
 monkeypatch.setattr(m,'sign_android',sign)
 original_mkdtemp=m.tempfile.mkdtemp
 def temporary(*args,**kwargs):
  if kwargs.get('dir')=='/root':kwargs['dir']=tmp_path
  if len(args)>2 and args[2]=='/root':args=(*args[:2],str(tmp_path),*args[3:])
  return original_mkdtemp(*args,**kwargs)
 monkeypatch.setattr(m.tempfile,'mkdtemp',temporary)
 def check(updated):
  if updated:
   assert (app/'a.py').read_text()=='VALUE = 2\n'
   with sqlite3.connect(dbpath)as db:db.execute("insert into messages values('new message accepted')")
   raise RuntimeError('SIMULATED_NEW_RUNTIME_FAILURE')
 monkeypatch.setattr(m,'health',check);monkeypatch.setattr(m.sys,'argv',['install.py','--apply'])
 with pytest.raises(RuntimeError,match='SIMULATED_NEW_RUNTIME_FAILURE'):m.main()
 assert (app/'a.py').read_text()=='VALUE = 1\n'
 assert (releases/'Wakhan.apk').read_bytes()==b'old APK'
 assert json.loads((releases/'latest.json').read_text())['build']==91
 with sqlite3.connect(dbpath)as db:assert db.execute('select body from messages').fetchall()==[('before',),('new message accepted',)]
 backup=next(tmp_path.glob('wakhan-0277-backup-*'))
 with sqlite3.connect(backup/'database.sqlite3')as db:assert db.execute('select body from messages').fetchall()==[('before',)]
 assert commands==[['systemctl','stop',m.SERVICE],['systemctl','start',m.SERVICE],['systemctl','stop',m.SERVICE],['systemctl','start',m.SERVICE]]
