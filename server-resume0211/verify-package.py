import ast,base64,hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parent
m=json.loads((root/'repair-manifest.json').read_text());source=(root/'wakhan-resume-0211.py').read_bytes()
assert hashlib.sha256(source).hexdigest()==m['resume_sha256']
names=('ORIGINAL_SHA256','ORIGINAL_PROBE_SHA256','CORRECTED_PROBE_SHA256','CORRECTED_PROBE')
v={n.targets[0].id:ast.literal_eval(n.value) for n in ast.parse(source).body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in names}
code=base64.b64decode(v['CORRECTED_PROBE']);assert hashlib.sha256(code).hexdigest()==m['corrected_probe_sha256']==v['CORRECTED_PROBE_SHA256']
assert v['ORIGINAL_SHA256']==m['original_installer_sha256']
assert v['ORIGINAL_PROBE_SHA256']==m['original_probe_sha256']
assert code==(root.parent/'server-update0211/src/release_probe.py').read_bytes()
compile(code,'release_probe.py','exec');print('REPAIR_PACKAGE_VERIFIED')
