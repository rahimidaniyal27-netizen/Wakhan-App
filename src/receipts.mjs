/* Receipts are submitted privately to Wakhan; approval stays on the server. */
export function installReceipts({fetch,origin}){
 const fa=()=>!document.documentElement.lang.startsWith('en');
 async function open(kind,bill){
  if(!['wallet','personal'].includes(kind)||!Number.isSafeInteger(Number(bill.id))||Number(bill.id)<=0)return;
  document.getElementById('wk-receipt')?.remove();
  const dialog=document.createElement('dialog');dialog.id='wk-receipt';dialog.style.cssText='background:var(--bg,#101e2a);color:var(--txt,#fff);border:1px solid var(--ln,#536273);border-radius:18px;padding:18px;width:calc(100% - 32px);max-width:460px';
  dialog.innerHTML='<form><header style="display:flex;align-items:center;gap:12px"><button type="button" data-close style="min-width:48px;min-height:48px;font-size:26px;background:none;color:inherit;border:0">×</button><strong data-title></strong></header><p data-help></p><label><span data-note></span><textarea maxlength="400" rows="4" style="box-sizing:border-box;width:100%;margin:8px 0;font:inherit" dir="auto"></textarea></label><label><span data-photo></span><input type="file" accept="image/jpeg,image/png,image/webp" style="display:block;margin:12px 0"></label><p role="status" aria-live="polite"></p><button type="submit" style="min-height:48px;width:100%" data-send></button></form>';
  const text=(selector,value)=>dialog.querySelector(selector).textContent=value;
  text('[data-title]',fa()?'فرستادن رسید':'Submit receipt');text('[data-help]',fa()?'پس از بررسی مدیریت، نتیجه داخل واخان نشان داده می‌شود.':'Your receipt will be reviewed by Wakhan staff.');text('[data-note]',fa()?'شمارهٔ رسید یا توضیح':'Receipt number or note');text('[data-photo]',fa()?'تصویر رسید (حداکثر ۴ مگابایت)':'Receipt image (up to 4 MB)');text('[data-send]',fa()?'فرستادن رسید':'Submit receipt');
  document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  let busy=false;dialog.querySelector('form').onsubmit=async event=>{
   event.preventDefault();if(busy)return;
   const file=dialog.querySelector('input').files[0],note=dialog.querySelector('textarea').value.trim(),status=dialog.querySelector('[role=status]');
   if(!file&&note.length<4){status.textContent=fa()?'شمارهٔ رسید یا تصویر را اضافه کن.':'Add a receipt number or an image.';return}
   if(file&&(file.size>4_000_000||!['image/jpeg','image/png','image/webp'].includes(file.type))){status.textContent=fa()?'تصویر JPEG، PNG یا WebP کمتر از ۴ مگابایت انتخاب کن.':'Choose a JPEG, PNG or WebP image under 4 MB.';return}
   busy=true;const button=dialog.querySelector('[data-send]');button.disabled=true;status.textContent=fa()?'در حال فرستادن…':'Submitting…';
   try{
    const photo=file?await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)}):undefined;
    const response=await fetch(origin+'/api/app/payments/receipt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,id:Number(bill.id),note,photo})}),result=await response.json();
    if(!response.ok||!result.ok)throw Error('receipt_failed');
    if(typeof CB!=='undefined'&&kind==='personal'&&CB.bill?.id===Number(bill.id)){CB.bill=result.bill;try{cbRender()}catch{}}
    if(kind==='wallet')try{wc23Refresh()}catch{}
    text('[data-title]',fa()?'رسید ثبت شد':'Receipt submitted');status.textContent=fa()?'در انتظار بررسی مدیریت است.':'Awaiting staff review.';
    dialog.querySelector('textarea').disabled=true;dialog.querySelector('input').disabled=true;
   }catch{status.textContent=fa()?'نتیجهٔ ارسال مشخص نشد. وضعیت سفارش را تازه کن و سپس دوباره کوشش کن.':'Submission could not be confirmed. Refresh the order status before trying again.';button.disabled=false;busy=false}
  };
 }
 window.WakhanReceipt={open};return {open};
}
