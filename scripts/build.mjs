import {spawnSync} from 'node:child_process';
import {build} from 'vite';
const prep=spawnSync('python',['scripts/prepare-web.py'],{stdio:'inherit'});if(prep.status!==0)process.exit(prep.status||1);import {existsSync,writeFileSync} from 'node:fs';writeFileSync('public/build-flags.json',JSON.stringify({push:existsSync('android/app/google-services.json')}));await build();
