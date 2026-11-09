/* Device language is automatic; only a choice made in Account becomes an override. */
import {LANGUAGE_CATALOG} from './language-catalog.mjs';
const byCode=new Map(LANGUAGE_CATALOG.map(item=>[item.c.toLowerCase(),item]));
export const LOCALE_KEYS={override:'wk_native_lang_override',source:'wk_native_lang_source',last:'wk_native_lang_last'};
export function matchLanguage(tag){if(typeof tag!=='string')return null;const key=tag.trim().replaceAll('_','-').toLowerCase();if(!key)return null;const base=key.split('-')[0],alias={prs:'fa',in:'id'}[base];return byCode.get(key)||byCode.get(alias||base)||null}
export function languageInfo(code){return matchLanguage(code)||byCode.get('en')}
function read(storage,key){try{return storage?.getItem(key)||null}catch{return null}}
export function chooseLocale({storage,preferred=[]}={}){
 const manual=matchLanguage(read(storage,LOCALE_KEYS.override));if(manual)return {...manual,source:'manual'};
 const source=read(storage,LOCALE_KEYS.source),last=read(storage,LOCALE_KEYS.last);
 for(const key of ['wm13_lang','wka_lang']){const value=read(storage,key),item=matchLanguage(value);if(item&&(!source||source!=='system'||item.c!==last))return {...item,source:'manual'}}
 for(const tag of preferred){const item=matchLanguage(tag);if(item)return {...item,source:'system'}}
 return {...byCode.get('en'),source:'system'};
}
export function applyLocale(storage,selection){
 for(const [key,value]of Object.entries({wm13_lang:selection.c,wka_lang:selection.c,wm_lg:selection.b,wm_native_pref_lg:selection.b,[LOCALE_KEYS.source]:selection.source,[LOCALE_KEYS.last]:selection.c})){try{storage.setItem(key,value)}catch{}}
 if(selection.source==='manual')try{storage.setItem(LOCALE_KEYS.override,selection.c)}catch{}
 return selection;
}
export function setManualLocale(storage,code){const item=matchLanguage(code);if(!item)return null;return applyLocale(storage,{...item,source:'manual'})}
export function useSystemLocale(storage,preferred){for(const key of [LOCALE_KEYS.override,'wm13_lang','wka_lang',LOCALE_KEYS.source,LOCALE_KEYS.last])try{storage.removeItem(key)}catch{}return applyLocale(storage,chooseLocale({storage,preferred}))}
