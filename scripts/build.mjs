import {build} from 'vite';
import {existsSync,writeFileSync,readFileSync} from 'node:fs';
const shell=JSON.parse(readFileSync('public/wakhan-shell.json','utf8'));
if(shell.programs?.length!==76||shell.programs.some(p=>/Telegram\.WebApp|window\.Telegram|https:\/\/t\.me\/|tg:\/\//.test(p.code)))throw Error('Unexpected application shell');
writeFileSync('public/build-flags.json',JSON.stringify({push:process.env.WAKHAN_BUILD_PLATFORM!=='ios'&&existsSync('android/app/google-services.json')}));
await build({build:{target:'chrome80',sourcemap:false,minify:true}});
