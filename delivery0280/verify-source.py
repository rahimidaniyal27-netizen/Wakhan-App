import hashlib,json,stat,zipfile
from pathlib import Path
root=Path(__file__).resolve().parent
meta=json.loads((root/'SOURCE.json').read_text());archive=root/'Wakhan-0.2.80-source.zip'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==meta['source_sha256']
with zipfile.ZipFile(archive)as z:
 assert z.testzip()is None
 for i in z.infolist():
  p=Path(i.filename);assert not p.is_absolute()and'..'not in p.parts and not stat.S_ISLNK(i.external_attr>>16)
 z.extractall('input280')
p=Path('input280/project');assert hashlib.sha256((p/'public/wakhan-shell.json').read_bytes()).hexdigest()==meta['shell_sha256']
assert json.loads((p/'package.json').read_text())['wakhanBuild']==95
print('Reviewed source SHA256, shell and build verified')

public=json.loads((p/'signin-public.json').read_text());assert public['google_ios_client_id'] and public['google_server_client_id'] and public['google_android_client_ids'] and public['apple_enabled']is False
assert hashlib.sha256((p/'signin-public.json').read_bytes()).hexdigest()==meta['public_signin_sha256']
