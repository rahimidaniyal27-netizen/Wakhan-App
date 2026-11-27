#!/usr/bin/env python3
"""Inspect metadata formats and fixed-code warnings, without selection/deployment."""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

TRACE=Path('/root/wakhan-trace-youtube.py')
PIN='f1c4d56395a2e8b2588320a8fd0761cb0212e8f43100560c6264566e0c8685ce'
WARNINGS={'signature_challenge_failed','js_runtime_missing','token_failed','verification_required',
          'formats_skipped','only_images','client_restricted','drm','sabr','format_unavailable','other_warning'}
INJECTION=r'''
 original_extract=yt_dlp.YoutubeDL.extract_info
 warnings=set()
 def warning_reason(text):
  text=str(text).lower()
  if any(v in text for v in ('signature extraction failed','n challenge solving failed','nsig extraction failed','challenge solving failed')):return 'signature_challenge_failed'
  if 'javascript runtime' in text:return 'js_runtime_missing'
  if 'token' in text and any(v in text for v in ('fail','not available','unavailable','error','missing')):return 'token_failed'
  if 'not a bot' in text or 'sign in to confirm' in text:return 'verification_required'
  if 'sabr' in text:return 'sabr'
  if 'only images' in text:return 'only_images'
  if 'formats' in text and 'skipped' in text:return 'formats_skipped'
  if 'client' in text and any(v in text for v in ('unsupported','not support','skip')):return 'client_restricted'
  if 'drm' in text:return 'drm'
  if 'requested format' in text:return 'format_unavailable'
  return 'other_warning'
 class Logger:
  def debug(self,*args):pass
  def warning(self,text,*args):warnings.add(warning_reason(text))
  def error(self,text,*args):warnings.add(warning_reason(text))
 def inspect_formats(self,url,*args,**kwargs):
  self.params['logger']=Logger()
  try:
   info=original_extract(self,url,download=False,process=False)
   formats=[]
   for fmt in (info.get('formats') or [])[:80]:
    if not isinstance(fmt,dict):continue
    acodec=str(fmt.get('acodec') or 'unknown');vcodec=str(fmt.get('vcodec') or 'unknown')
    acodec=next((v for v in ('none','mp4a','aac','mp3','opus','vorbis') if acodec==v or acodec.startswith(v+'.')),'other')
    vcodec=next((v for v in ('none','avc1','h264','vp9','vp09','av01','hev1','hvc1') if vcodec==v or vcodec.startswith(v+'.')),'other')
    protocol=fmt.get('protocol');ext=fmt.get('ext');ident=str(fmt.get('format_id') or '')
    formats.append({'id':ident if re.fullmatch('[A-Za-z0-9_.+-]{1,40}',ident) else 'other',
      'ext':ext if ext in ('m4a','mp4','mp3','webm','mhtml') else 'other',
      'protocol':protocol if protocol in ('https','http','m3u8','m3u8_native','http_dash_segments','mhtml') else 'other',
      'acodec':acodec,'vcodec':vcodec,'allowed_cdn':module.allowed_audio_url(fmt.get('url'),'youtube'),
      'fragmented':bool(fmt.get('fragments')),'drm':bool(fmt.get('has_drm'))})
   print('WKFORMATS '+json.dumps({'formats':formats,'total':len(info.get('formats') or []),'warnings':sorted(warnings)}),file=sys.stderr,flush=True)
  except Exception:
   print('WKFORMATS '+json.dumps({'formats':[],'warnings':sorted(warnings),'extraction_failed':True}),file=sys.stderr,flush=True)
   raise
  raise module.AudioUnavailable('metadata_inspection_complete')
 yt_dlp.YoutubeDL.extract_info=inspect_formats
'''


def augment_report(raw,report):
    for line in raw.decode('utf-8','replace').splitlines():
        if not line.startswith('WKFORMATS '):continue
        try:
            value=json.loads(line[10:]);formats=[]
            for fmt in value.get('formats',[])[:80]:
                item={}
                for key,allowed in {'ext':{'m4a','mp4','mp3','webm','mhtml','other'},
                    'protocol':{'https','http','m3u8','m3u8_native','http_dash_segments','mhtml','other'},
                    'acodec':{'none','mp4a','aac','mp3','opus','vorbis','other'},
                    'vcodec':{'none','avc1','h264','vp9','vp09','av01','hev1','hvc1','other'}}.items():
                    item[key]=fmt.get(key) if fmt.get(key) in allowed else 'other'
                ident=fmt.get('id');item['id']=ident if isinstance(ident,str) and re.fullmatch('[A-Za-z0-9_.+-]{1,40}',ident) else 'other'
                for key in ('allowed_cdn','fragmented','drm'):item[key]=fmt.get(key) is True
                formats.append(item)
            report['formats']=formats
            report['warnings']=[v for v in value.get('warnings',[]) if isinstance(v,str) and v in WARNINGS]
            if type(value.get('total')) is int and 0<=value['total']<=10000:report['format_count']=value['total']
            report['format_inspection_failed']=value.get('extraction_failed') is True
        except (ValueError,TypeError,AttributeError):continue
    # This diagnostic deliberately stops before choosing or starting playback.
    report.pop('metadata_ok',None);report.pop('reason',None)
    return report


def main():
    if hashlib.sha256(TRACE.read_bytes()).hexdigest()!=PIN:raise ValueError()
    spec=importlib.util.spec_from_file_location('_wk_original_trace',TRACE)
    trace=importlib.util.module_from_spec(spec);sys.dont_write_bytecode=True;spec.loader.exec_module(trace)
    needle=" value=module.resolve_audio('https://www.youtube.com/watch?v=HKDb1xi2uGE','youtube',options,source_root=root)"
    if trace.CHILD.count(needle)!=1:raise ValueError()
    trace.CHILD=trace.CHILD.replace(needle,INJECTION+'\n'+needle)
    previous=trace.parse_trace
    trace.parse_trace=lambda raw:augment_report(raw,previous(raw))
    trace.main()


if __name__=='__main__':
    try:main()
    except Exception:raise SystemExit('STOP: FORMAT_INSPECTION_UNAVAILABLE_NO_SERVICE_CHANGE')
