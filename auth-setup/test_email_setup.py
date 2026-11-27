import importlib.util,json,os,stat
from pathlib import Path
from types import SimpleNamespace
import pytest
spec=importlib.util.spec_from_file_location('setup_email',Path(__file__).parent/'setup-email.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)


def test_only_existing_mail_keys_change_and_other_secrets_are_preserved():
 original={'base':'/app','owner':42,'database':'/shared/music.db','env':{'TURN_SECRET':'old-turn','WKA_GOOGLE_CLIENT_ID':'old-google','WKA_STRIPE_SECRET':'old-payment'}}
 updated,values=m.configuration(original,'owner@gmail.com','abcd efgh ijkl mnop')
 assert {k:v for k,v in updated['env'].items()if k not in m.KEYS}==original['env']
 assert {k:v for k,v in updated.items()if k!='env'}=={k:v for k,v in original.items()if k!='env'}
 assert values['WKA_SMTP_PASS']=='abcdefghijklmnop'and values['WKA_SMTP_HOST']=='smtp.gmail.com'and values['WKA_SMTP_PORT']=='587'
 assert 'WKA_SMTP_PASS'not in original['env']


@pytest.mark.parametrize('email,password',[('owner@gmail.com\r\nBcc:x@y.test','abcdefghijklmnop'),('owner@unverified.test','abcdefghijklmnop'),('owner@gmail.com','ordinary-password'),('owner@gmail.com','1234567890123456')])
def test_sender_injection_and_non_app_password_are_rejected(email,password):
 with pytest.raises(RuntimeError):m.configuration({},email,password)


def test_systemd_overrides_stop_before_any_configuration_write():
 with pytest.raises(RuntimeError,match='SYSTEMD_ENV_OVERRIDE:WKA_SMTP_HOST'):
  m.check_overrides({'process_env':{'WKA_SMTP_HOST':'other-host'}},{'WKA_SMTP_HOST':'smtp.gmail.com'})


def test_delivery_uses_verified_tls_and_only_sends_to_sender_without_exposing_password(monkeypatch,capsys):
 calls=[];password='abcdefghijklmnop'
 class SMTP:
  def __init__(self,host,port,timeout):calls.append(('connect',host,port,timeout))
  def __enter__(self):return self
  def __exit__(self,*a):pass
  def starttls(self,context):assert context.check_hostname;calls.append(('tls',))
  def login(self,email,secret):assert secret==password;calls.append(('login',email))
  def send_message(self,message):
   assert message['To']=='owner@gmail.com'and message['From']=='Wakhan <owner@gmail.com>'
   assert password not in message.as_string();assert '123456'in message.get_content();calls.append(('send',));return{}
 monkeypatch.setattr(m.smtplib,'SMTP',SMTP);monkeypatch.setattr(m.secrets,'randbelow',lambda n:123456)
 assert m.test_delivery('owner@gmail.com',password)=='123456'
 assert [r[0]for r in calls]==['connect','tls','login','send'];assert password not in capsys.readouterr().out


def test_smtp_authentication_error_never_prints_server_response_or_secret(monkeypatch):
 class SMTP:
  def __init__(self,*a,**k):pass
  def __enter__(self):return self
  def __exit__(self,*a):pass
  def starttls(self,context):pass
  def login(self,*a):raise m.smtplib.SMTPAuthenticationError(535,b'sensitive-provider-response')
 monkeypatch.setattr(m.smtplib,'SMTP',SMTP)
 with pytest.raises(RuntimeError)as e:m.test_delivery('owner@gmail.com','abcdefghijklmnop')
 assert str(e.value)=='GMAIL_APP_PASSWORD_REJECTED'


def context(tmp_path):
 path=tmp_path/'runtime.json';data={'base':'/app','owner':42,'database':'/shared/music.db','env':{'WKA_GOOGLE_CLIENT_ID':'same-google','TURN_SECRET':'unchanged'}}
 path.write_text(json.dumps(data));path.chmod(0o600)
 return dict(path=path,raw=path.read_bytes(),settings=data,st=path.stat(),owner=SimpleNamespace(pw_uid=os.getuid(),pw_gid=os.getgid()),process_env={})


def redirect_backup(tmp_path,monkeypatch):
 original=m.tempfile.mkdtemp
 def create(*args,**kwargs):
  if kwargs.get('dir')=='/root':kwargs['dir']=tmp_path
  return original(*args,**kwargs)
 monkeypatch.setattr(m.tempfile,'mkdtemp',create)


def test_failed_restart_restores_exact_private_config_and_leaves_database_untouched(tmp_path,monkeypatch,capsys):
 c=context(tmp_path);updated,_=m.configuration(c['settings'],'owner@gmail.com','abcdefghijklmnop');db=tmp_path/'music.db';db.write_bytes(b'unchanged-database-content')
 baseline={'ok':True,'email':False,'google':'same-google','signin':{'version':1,'intent_version':1}}
 monkeypatch.setattr(m,'live_config',lambda:baseline);commands=[];monkeypatch.setattr(m,'run',lambda a:commands.append(a)or'')
 def health(enabled):
  if enabled:
   assert json.loads(c['path'].read_text())['env']['WKA_SMTP_PASS']=='abcdefghijklmnop'
   raise RuntimeError('SIMULATED_BAD_START')
  return baseline
 monkeypatch.setattr(m,'healthy',health);redirect_backup(tmp_path,monkeypatch)
 with pytest.raises(RuntimeError,match='SIMULATED_BAD_START'):m.apply(c,updated)
 assert c['path'].read_bytes()==c['raw']and c['path'].stat().st_mode&0o777==0o600
 assert db.read_bytes()==b'unchanged-database-content'
 assert commands==[['systemctl','restart','wakhan-app']]*2
 backup=next(tmp_path.glob('wakhan-email-backup-*'));assert backup.stat().st_mode&0o777==0o700;assert(backup/'runtime-config.json').stat().st_mode&0o777==0o600
 assert 'abcdefghijklmnop'not in capsys.readouterr().out


def test_success_enables_only_email_preserving_google_and_secure_permissions(tmp_path,monkeypatch):
 c=context(tmp_path);updated,_=m.configuration(c['settings'],'owner@gmail.com','abcdefghijklmnop')
 baseline={'ok':True,'email':False,'google':'same-google','signin':{'version':1,'intent_version':1}}
 monkeypatch.setattr(m,'live_config',lambda:baseline);monkeypatch.setattr(m,'run',lambda a:'');monkeypatch.setattr(m,'healthy',lambda enabled:{**baseline,'email':enabled});redirect_backup(tmp_path,monkeypatch)
 backup=m.apply(c,updated)
 assert json.loads(c['path'].read_text())==updated
 assert c['path'].stat().st_uid==c['st'].st_uid and c['path'].stat().st_mode&0o777==0o600
 assert(backup/'runtime-config.json').read_bytes()==c['raw']
