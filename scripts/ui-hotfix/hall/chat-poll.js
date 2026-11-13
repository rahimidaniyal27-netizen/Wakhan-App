async function wm70PollHall(){
 if(TAB!=='c'||CV!=='hall'||!CID||CS?.mine<0||WM70.hallBusy)return;
 const room=CID,seq=WM70.hallSeq,reset=typeof H2!=='undefined'&&H2.state.royalChatBaseline;
 WM70.hallBusy=true;
 try{
  const result=await wm70Request('hall?room='+encodeURIComponent(room)+'&after='+(reset?0:WM70.hallCursor));
  if(TAB!=='c'||CV!=='hall'||CID!==room||seq!==WM70.hallSeq)return;
  if(reset){H2.state.base=Number(result.cursor)||0;H2.state.royalChatBaseline=false;WM70.hallMessages=[]}
  else{const ids=new Set(WM70.hallMessages.map(m=>m.id));for(const message of result.messages){wm70Remember(message.sender);if(!ids.has(message.id))WM70.hallMessages.push(message)}}
  WM70.hallMessages=WM70.hallMessages.slice(-100);WM70.hallCursor=result.cursor;WM70.hallPeople=result.people;
  for(const person of result.people||[])wm70Remember(person);wm70HallMessages();
 }catch{}finally{if(seq===WM70.hallSeq)WM70.hallBusy=false}
}
