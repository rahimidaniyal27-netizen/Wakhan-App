import hashlib,json,shutil,subprocess,sys,zipfile
from pathlib import Path
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
out=Path('release247');out.mkdir()
source=Path('announcement0247/Wakhan-0.2.47-source.zip');assert sha(source)=='c13343536e29218d8fc53bbe471a321fd1b809597fc1e5836b8d9fb6eff873e0'
input_path=Path('delivery0247/delivery-input.zip');assert sha(input_path)=='9aea97b8ea8fa3de8235209a753eb534ba4837a0b0b60a6ac51dc68d37d55e7e'
with zipfile.ZipFile(input_path)as z:
 assert z.testzip()is None;z.extractall(out)
for folder,name in [('ios247','Wakhan-0.2.47-beta.ipa'),('android247','app-release-unsigned.apk'),('android247','app-release.aab')]:
 paths=list(Path(folder).rglob(name));assert len(paths)==1;shutil.copy2(paths[0],out/name)
shutil.copy2(source,out/source.name);subprocess.run([sys.executable,str(out/'verify-native.py'),str(out)],check=True)
for name in ['sign-and-publish.py','announcement_backend.py']:compile((out/name).read_text(),name,'exec')
browser=json.loads((out/'review/browser-results.json').read_text());assert {x['engine']for x in browser}=={'chromium','webkit'}
assert all(x['full_bootstrap']and x['intro_removed']and x['home_visible']and x['no_mutation_loop']and not x['errors']for x in browser)
assert all(x['navigation']['retained_music_nodes']and x['navigation']['scroll_reset']and x['navigation']['refresh_independent_of_tab_paint']for x in browser)
for x in browser:
 audit=x['salon_audit'];assert audit['seat_lock_hold_ms']==1000
 for flag in ['actual_slr3','seat_lock_early_release_cancelled','mini_removed_on_card_and_game_return','game_actions_preserve_voice','media_stop_preserves_live_voice','announcement_saved_in_chat','announcement_scrolls_with_messages','announcement_not_reposted_on_restore','announcement_list_subtitle','glass_editor','announcement_guest_readonly']:assert audit[flag],flag
with zipfile.ZipFile(source)as z:
 assert z.read('source-verification.json')==(out/'source-verification.json').read_bytes()
 assert z.read('sign-and-publish.py')==(out/'sign-and-publish.py').read_bytes()
 for name in ['announcement_backend.py','announcement-baseline.json']:assert z.read('deployment/'+name)==(out/name).read_bytes()
manifest=dict(version='0.2.47-beta',build=62,ui_reference='0.2.44-beta',base_version='0.2.46-beta',base_build=61,seat_lock_hold_ms=1000,server_update_required=True,physical_device_verified=False,database_migration=False,installer_revision='0247-inline-entry-announcement-glass-editor',build_run=44552159813,browser_validation='local Chromium and WebKit',source_commit='819bff67ab0e23108ba9e754ac85d6d978a5445e',sha256={p.relative_to(out).as_posix():sha(p)for p in sorted(out.rglob('*'))if p.is_file()and p.name!='PACKAGE.json'})
(out/'PACKAGE.json').write_text(json.dumps(manifest,indent=2));print('VERIFIED inline chat announcement, glass editor, original room functions and both native platforms.')
