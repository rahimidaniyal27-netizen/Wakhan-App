"""Package the current live M81 application snapshot, not the earlier development snapshot."""
from pathlib import Path
from urllib.parse import urlsplit
import hashlib,json,re,shutil
MOBILE=Path(__file__).resolve().parents[1];ROOT=MOBILE;SNAP=MOBILE/'snapshots/server';PUBLIC=MOBILE/'public';PUBLIC.mkdir(exist_ok=True);ASSETS=PUBLIC/'s';ASSETS.mkdir(exist_ok=True)
manifest=json.loads((SNAP/'MANIFEST.json').read_text());assert manifest['origin']=='https://music.kabulcafe.uk';page=(SNAP/'index.html').read_text();assert hashlib.sha256((SNAP/'index.html').read_bytes()).hexdigest()==manifest['index_sha256']
# The native bootstrap supplies a Keystore-backed key. Never run M81's localStorage key loader.
page=re.sub(r'<!--WK81-->[\s\S]*?<!--/WK81-->','',page)
programs=[]
for i,m in enumerate(re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script>',page)):
 attrs,code=m.groups();src=re.search(r'\bsrc=["\']([^"\']+)',attrs)
 if src:
  url=src[1]
  if url.startswith('https://telegram.org/'):continue
  name=urlsplit(url).path.rsplit('/',1)[1]
  if name=='app.js':continue
  row=manifest['assets'].get(url)
  if not row:raise ValueError('Missing live application dependency: '+url)
  path=SNAP/row['file'];assert hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256'];code=path.read_text();name=name
 else:name='inline-'+str(i).zfill(2)+'.js'
 # All source definitions load first; then boot runs once with the native session.
 code=re.sub(r'\bboot\(\);\s*$','/* Native bootstrap waits for every existing UI module. */',code)
 programs.append({'id':name,'code':code})
body=re.search(r'<body\b[^>]*>([\s\S]*?)</body>',page)[1];body=re.sub(r'<script\b[^>]*>[\s\S]*?</script>','',body);head=re.search(r'<head>([\s\S]*?)</head>',page)[1];head=re.sub(r'<script\b[^>]*>[\s\S]*?</script>','',head)
for tag in re.findall(r'<link\b[^>]+>',head):
 href=re.search(r'href=["\']([^"\']+)',tag)
 if href and urlsplit(href[1]).path.endswith('.css'):
  url=href[1];name=urlsplit(url).path.rsplit('/',1)[1]
  if name=='app.css':head=head.replace(tag,'');continue
  row=manifest['assets'].get(url)
  if not row:raise ValueError('Missing live stylesheet: '+url)
  data=(SNAP/row['file']).read_bytes();assert hashlib.sha256(data).hexdigest()==row['sha256'];head=head.replace(tag,'<style>'+data.decode()+'</style>')
# Keep existing imagery and provider assets at their real server URLs. Preserve approved hero bytes.
shutil.copyfile(ROOT/'app/wn61_original_logo.svg',PUBLIC/'brand.svg');shutil.copyfile(ROOT/'app/glass72/headphones.png',ASSETS/'wm72_glass_headphones.png');assert hashlib.sha256((ASSETS/'wm72_glass_headphones.png').read_bytes()).hexdigest()=='7424d7159890521a800a99e0eef933802a63b57bc9567b9f68c544f99324c451'
for p in (ROOT/'app/glass72').iterdir():
 if p.name in ('cinema.png','cinema.webp','headphones.webp'):shutil.copyfile(p,ASSETS/('wm72_glass_'+p.name))
for program in programs:program['code']=program['code'].replace('/s/wm72_glass_','https://localhost/s/wm72_glass_')
# Share one catalog between native sign-in, device detection and the app language sheet.
catalog=json.loads((MOBILE/'src/language-catalog.mjs').read_text().split('=',1)[1].strip().rstrip(';'))
bengali=dict(line.split('|',1) for line in (MOBILE/'src/app-bengali.txt').read_text().splitlines())
for program in programs:
 if program['id']=='lang13.js':
  prefix,payload=program['code'].split('window.WM13_DATA=',1)
  data,end=json.JSONDecoder().raw_decode(payload)
  assert set(bengali)==set(data['tr']['de']), 'Bengali UI dictionary is incomplete'
  data['langs']=catalog;data['tr']['bn']=bengali
  program['code']=prefix+'window.WM13_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+payload[end:]
programs.append({'id':'native-n1-features.js','code':(MOBILE/'src/native-features.js').read_text()})

bundle={'version':'native-n1-m81','head':head,'body':body,'programs':programs,'source':manifest['origin'],'source_sha256':manifest['index_sha256']}
(PUBLIC/'wakhan-shell.json').write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')))
print('Current live M81 application bundled:',len(programs),'scripts; v2 switch only in the native app; original Home headphones preserved.')
