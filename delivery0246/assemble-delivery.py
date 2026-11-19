import hashlib,json,shutil,subprocess,sys,zipfile
from pathlib import Path
out=Path('release246');out.mkdir()
source=Path('restore0246/Wakhan-0.2.46-source.zip');assert hashlib.sha256(source.read_bytes()).hexdigest()=='ce7e80e2a9a6a8a5325628bb21c346984cfffb541b56e8b60c5f3ec9cbc8f25c'
input_path=Path('delivery0246/delivery-input.zip');assert hashlib.sha256(input_path.read_bytes()).hexdigest()=='40599d53848e7dbd6f2c1b94dbe6ff6d5ec99dcc4a932964439d174986ae21fc'
with zipfile.ZipFile(input_path)as z:
 assert z.testzip()is None;z.extractall(out)
for folder,name in [('ios246','Wakhan-0.2.46-beta.ipa'),('android246','app-release-unsigned.apk'),('android246','app-release.aab')]:
 paths=list(Path(folder).rglob(name));assert len(paths)==1;shutil.copy2(paths[0],out/name)
shutil.copy2(source,out/source.name);subprocess.run([sys.executable,str(out/'verify-native.py'),str(out)],check=True)
for name in ['sign-and-publish.py','backend_restore.py','preserve_salon_data.py']:compile((out/name).read_text(),name,'exec')
files=list(Path('browser246').rglob('bootstrap-results.json'));assert len(files)==1
browser=json.loads(files[0].read_text());assert {x['engine']for x in browser}=={'chromium','webkit'}
assert all(x['full_bootstrap']and x['intro_removed']and x['home_visible']and x['no_mutation_loop']and not x['errors']for x in browser)
assert all(x['navigation']['retained_music_nodes']and x['navigation']['scroll_reset']and x['navigation']['refresh_independent_of_tab_paint']for x in browser)
assert all(x['salon_audit']['actual_slr3']and x['salon_audit']['seat_lock_hold_ms']==1000 and x['salon_audit']['seat_lock_early_release_cancelled']and x['salon_audit']['mini_removed_on_card_and_game_return']and x['salon_audit']['game_actions_preserve_voice']and x['salon_audit']['media_stop_preserves_live_voice']for x in browser)
for p in Path('browser246').rglob('*'):
 if p.is_file():shutil.copy2(p,out/'review'/('ci-'+p.name))
with zipfile.ZipFile(source)as z:
 assert z.read('source-verification.json')==(out/'source-verification.json').read_bytes()
 for name in ['backend_restore.py','preserve_salon_data.py','restore-baseline.json']:assert z.read('deployment/'+name)==(out/name).read_bytes()
manifest=dict(version='0.2.46-beta',build=61,ui_reference='0.2.44-beta',base_version='0.2.45-beta',base_build=60,seat_lock_hold_ms=1000,server_update_required=True,physical_device_verified=False,installer_revision='0246-exact-previous-ui-current-data-protected-restore',build_run=44510995609,source_commit='12353ddd8b00df9f8f418b75ec86f7bce0e8d141',sha256={p.relative_to(out).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()for p in sorted(out.rglob('*'))if p.is_file()and p.name!='PACKAGE.json'})
(out/'PACKAGE.json').write_text(json.dumps(manifest,indent=2));print('VERIFIED previous interface, one-second seat hold, both native platforms, exact source and guarded current-data restoration.')
