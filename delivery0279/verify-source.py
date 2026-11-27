import hashlib,json,stat,zipfile
from pathlib import Path
root=Path(__file__).resolve().parent
meta=json.loads((root/'SOURCE.json').read_text());archive=root/'Wakhan-0.2.79-source.zip'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==meta['source_sha256']
with zipfile.ZipFile(archive)as z:
 assert z.testzip()is None
 for i in z.infolist():
  p=Path(i.filename);assert not p.is_absolute()and'..'not in p.parts and not stat.S_ISLNK(i.external_attr>>16)
 z.extractall('input279')
p=Path('input279/project');assert hashlib.sha256((p/'public/wakhan-shell.json').read_bytes()).hexdigest()==meta['shell_sha256']
assert json.loads((p/'package.json').read_text())['wakhanBuild']==94
print('Reviewed source SHA256, shell and build verified')
