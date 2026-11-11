/* On-demand diagnostics only. No microphone, recording, SDP or address export. */
const MAX_PROBES=8;
const elapsed=start=>Math.max(0,Date.now()-start);
const number=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
const token=(v,allowed)=>allowed.includes(v)?v:'unknown';
const bound=(v,fallback,min,max)=>Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;

function relayPaths(ice){
  const paths=[],seen=new Set();
  for(const server of Array.isArray(ice)?ice:[]){
    if(!server||typeof server!=='object')continue;
    for(const url of Array.isArray(server.urls)?server.urls:[server.urls]){
      if(typeof url!=='string')continue;
      const match=/^(turns?):(?:\[[^\]]+\]|[^:/?\s]+)(?::(\d+))?(?:\?transport=(udp|tcp))?$/i.exec(url);
      if(!match||seen.has(url))continue;
      const scheme=match[1].toLowerCase(),transport=(match[3]||'udp').toLowerCase();
      if(scheme==='turns'&&match[3]&&transport!=='tcp')continue;
      const port=match[2]?Number(match[2]):scheme==='turns'?5349:3478;
      if(port<1||port>65535)continue;
      seen.add(url);
      paths.push({label:scheme==='turns'?'tls':transport,port,
        server:{urls:url,username:server.username,credential:server.credential}});
      if(paths.length===MAX_PROBES)return paths;
    }
  }
  return paths;
}

export function probeRelay(path,{PeerConnection=globalThis.RTCPeerConnection,signal,timeoutMs=10000}={}){
  const start=Date.now();
  return new Promise(resolve=>{
    let pc=null,timer=null,done=false;
    const errorCodes=new Set();
    const finish=status=>{
      if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);
      if(pc){pc.onicecandidate=null;pc.onicecandidateerror=null;pc.onicegatheringstatechange=null;try{pc.close()}catch{}}
      resolve({transport:path.label,port:path.port,status,elapsed_ms:elapsed(start),error_codes:[...errorCodes]});
    };
    const abort=()=>finish('cancelled');
    if(signal?.aborted){finish('cancelled');return}
    signal?.addEventListener('abort',abort,{once:true});
    if(typeof PeerConnection!=='function'){finish('unsupported');return}
    timer=setTimeout(()=>finish('timeout'),bound(timeoutMs,10000,50,20000));
    try{
      pc=new PeerConnection({iceServers:[path.server],iceTransportPolicy:'relay'});
      pc.onicecandidate=event=>{
        const candidate=event.candidate;
        if(candidate&&(candidate.type==='relay'||/\btyp relay\b/.test(candidate.candidate||'')))finish('relay_allocated');
        else if(!candidate)finish('no_relay_candidate');
      };
      pc.onicecandidateerror=event=>{
        const code=number(event.errorCode);
        if(code!==null&&code>=0&&code<=999&&errorCodes.size<8)errorCodes.add(Math.trunc(code));
        // Do not export errorText, URLs or hostCandidate: they can contain identifiers.
      };
      pc.onicegatheringstatechange=()=>{if(pc.iceGatheringState==='complete')finish('no_relay_candidate')};
      // A data channel initiates ICE gathering without requesting audio permission.
      pc.createDataChannel('network-check');
      Promise.resolve().then(()=>pc.createOffer()).then(offer=>{
        if(done)return;
        return pc.setLocalDescription(offer);
      }).catch(()=>finish('probe_error'));
    }catch{finish('probe_error')}
  });
}

export async function inspectVoicePeers(peers){
  const list=Object.values(peers||{}).slice(0,10);
  return Promise.all(list.map(async entry=>{
    const pc=entry?.pc||entry;
    const result={connection:token(pc?.connectionState,['new','connecting','connected','disconnected','failed','closed']),
      ice:token(pc?.iceConnectionState,['new','checking','connected','completed','disconnected','failed','closed']),
      selected_path:null,audio:{packets_sent:0,packets_received:0,bytes_sent:0,bytes_received:0,packets_lost:0,jitter_ms:null}};
    if(typeof pc?.getStats!=='function'){result.stats='unsupported';return result}
    try{
      // A broken WebView must not hold a diagnostic operation open indefinitely.
      let timer;
      const stats=await Promise.race([Promise.resolve().then(()=>pc.getStats()),new Promise((_,reject)=>{
        timer=setTimeout(()=>reject(Error('timeout')),2500);
      })]).finally(()=>clearTimeout(timer));
      let selected;
      for(const row of stats.values()){
        if(row.type==='transport'&&row.selectedCandidatePairId){const pair=stats.get(row.selectedCandidatePairId);if(pair)selected=pair}
      }
      if(!selected)for(const row of stats.values()){
        if(row.type==='candidate-pair'&&row.state==='succeeded'&&(row.selected||row.nominated)){selected=row;break}
      }
      if(selected){
        const local=stats.get(selected.localCandidateId),remote=stats.get(selected.remoteCandidateId);
        const rtt=number(selected.currentRoundTripTime);
        result.selected_path={local_type:token(local?.candidateType,['host','srflx','prflx','relay']),
          remote_type:token(remote?.candidateType,['host','srflx','prflx','relay']),
          protocol:token(local?.protocol,['udp','tcp']),relay_protocol:token(local?.relayProtocol,['udp','tcp','tls']),
          round_trip_ms:rtt===null?null:Math.round(rtt*1000)};
      }
      for(const row of stats.values()){
        if(row.kind!=='audio'&&row.mediaType!=='audio')continue;
        if(row.type==='outbound-rtp'){
          result.audio.packets_sent+=Math.max(0,number(row.packetsSent)||0);
          result.audio.bytes_sent+=Math.max(0,number(row.bytesSent)||0);
        }else if(row.type==='inbound-rtp'){
          result.audio.packets_received+=Math.max(0,number(row.packetsReceived)||0);
          result.audio.bytes_received+=Math.max(0,number(row.bytesReceived)||0);
          result.audio.packets_lost+=number(row.packetsLost)||0;
          const jitter=number(row.jitter);
          if(jitter!==null)result.audio.jitter_ms=Math.max(result.audio.jitter_ms||0,Math.round(jitter*1000));
        }
      }
      result.stats='available';
    }catch{result.stats='unavailable'}
    return result;
  }));
}

export function installVoiceNetworkDiagnostics({getIce,getPeers,PeerConnection=globalThis.RTCPeerConnection}={}){
  let active=null;
  return {
    cancel(){active?.abort()},
    snapshot(){return inspectVoicePeers(getPeers?.()||{})},
    async check({signal,timeoutMs}={}){
      active?.abort();const job=new AbortController();active=job;
      const abort=()=>job.abort();signal?.addEventListener('abort',abort,{once:true});
      if(signal?.aborted)job.abort();
      const report={schema:1,scope:'relay allocation only; does not verify two-way audio',paths:[]};
      try{
        if(job.signal.aborted){report.status='cancelled';return report}
        let timer;
        const reply=await Promise.race([
          Promise.resolve().then(()=>getIce({signal:job.signal})),
          new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('ice_timeout')),10000)}),
          new Promise((_,reject)=>{job.signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true})})
        ]).finally(()=>clearTimeout(timer));
        if(job.signal.aborted){report.status='cancelled';return report}
        const paths=relayPaths(reply?.ice||reply);
        if(!paths.length){report.status='no_advertised_relay';return report}
        for(const path of paths){
          if(job.signal.aborted)break;
          report.paths.push(await probeRelay(path,{PeerConnection,signal:job.signal,timeoutMs}));
        }
        report.status=job.signal.aborted?'cancelled':'complete';
      }catch{report.status=job.signal.aborted?'cancelled':'ice_api_failed'}
      finally{signal?.removeEventListener('abort',abort);if(active===job)active=null}
      return report;
    }
  };
}
