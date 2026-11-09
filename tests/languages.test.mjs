import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COPY} from '../src/auth-locales.mjs';
import {LANGUAGE_CATALOG} from '../src/language-catalog.mjs';
import {chooseLocale,matchLanguage} from '../src/locale.mjs';

test('all 18 languages can open a complete translated sign-in flow from a phone locale',()=>{
 const codes=['fa','ps','en','de','fr','es','pt','it','ru','ar','tr','ur','hi','bn','zh','ja','ko','id'];
 assert.deepEqual(LANGUAGE_CATALOG.map(l=>l.c),codes);
 assert.equal(new Set(codes).size,18);
 for(const code of codes){
  assert.equal(chooseLocale({preferred:[code+'-XX']}).c,code);
  for(const key of Object.keys(COPY.en))assert.ok(typeof COPY[code][key]==='string'&&COPY[code][key].trim(),`${code}: ${key}`);
 }
 assert.equal(matchLanguage('prs-AF').c,'fa');
 assert.equal(matchLanguage('in-ID').c,'id');
});
test('the bundled app offers the same 18 languages and Bengali has all shared UI labels',()=>{
 const shell=JSON.parse(readFileSync(new URL('../public/wakhan-shell.json',import.meta.url),'utf8'));
 const script=shell.programs.find(p=>p.id==='lang13.js').code;
 const data=JSON.parse(script.split('window.WM13_DATA=')[1].split(';\n(()=>')[0]);
 assert.deepEqual(data.langs,LANGUAGE_CATALOG);
 const expected=Object.keys(data.tr.de).sort();
 for(const {c} of LANGUAGE_CATALOG.filter(l=>!['fa','ps','en'].includes(l.c))){
  assert.deepEqual(Object.keys(data.tr[c]).sort(),expected,c);
  for(const value of Object.values(data.tr[c]))assert.ok(value.trim(),c);
 }
});
