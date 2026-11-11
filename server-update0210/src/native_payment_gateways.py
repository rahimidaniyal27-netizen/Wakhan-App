"""Hosted checkout only; credentials and provider responses never reach the client."""
import hashlib,hmac,json,time
from decimal import Decimal,InvalidOperation
import aiohttp

PAYPAL_CURRENCIES=frozenset('AUD BRL CAD CNY CZK DKK EUR GBP HKD HUF ILS JPY MYR MXN NOK NZD PHP PLN SEK SGD THB TWD USD'.split())


class GatewayError(Exception):pass


class Gateways:
    def __init__(self,env):self.env=env;self.session=None

    def enabled(self,provider,currency=None):
        if provider=='stripe':return bool(self.env.get('WKA_STRIPE_SECRET','').startswith('sk_live_') and self.env.get('WKA_STRIPE_WEBHOOK_SECRET','').startswith('whsec_'))
        return provider=='paypal' and bool(self.env.get('WKA_PAYPAL_CLIENT_ID') and self.env.get('WKA_PAYPAL_SECRET') and self.env.get('WKA_PAYPAL_WEBHOOK_ID') and self.env.get('WKA_PAYPAL_ENV')=='live' and (currency is None or currency in PAYPAL_CURRENCIES))

    async def request(self,method,url,**kwargs):
        if self.session is None:self.session=aiohttp.ClientSession(trust_env=True,timeout=aiohttp.ClientTimeout(total=25))
        try:
            async with self.session.request(method,url,allow_redirects=False,**kwargs) as response:
                if response.status>=300:raise GatewayError('payment_provider_unavailable')
                value=await response.json()
                if not isinstance(value,dict):raise GatewayError('payment_provider_unavailable')
                return value
        except (aiohttp.ClientError,TimeoutError,ValueError):raise GatewayError('payment_provider_unavailable') from None

    async def paypal_token(self):
        value=await self.request('POST','https://api-m.paypal.com/v1/oauth2/token',auth=aiohttp.BasicAuth(self.env['WKA_PAYPAL_CLIENT_ID'],self.env['WKA_PAYPAL_SECRET']),data={'grant_type':'client_credentials'})
        token=value.get('access_token')
        if not isinstance(token,str):raise GatewayError('payment_provider_unavailable')
        return token

    async def create(self,provider,order):
        if not self.enabled(provider,order['currency']):raise GatewayError('payment_unavailable')
        origin='https://music.kabulcafe.uk';return_url=origin+'/pay/return?order='+order['token']
        label='Wakhan '+(str(order['coins'])+' coins' if order['coins'] else str(order['months'])+' month access')
        if provider=='stripe':
            data={'mode':'payment','success_url':return_url,'cancel_url':return_url+'&cancelled=1','client_reference_id':order['token'],'metadata[wakhan_order]':order['token'],'billing_address_collection':'required','line_items[0][quantity]':'1','line_items[0][price_data][currency]':order['currency'].lower(),'line_items[0][price_data][unit_amount]':str(order['amount']),'line_items[0][price_data][product_data][name]':label,'line_items[0][price_data][tax_behavior]':'inclusive'}
            value=await self.request('POST','https://api.stripe.com/v1/checkout/sessions',headers={'Authorization':'Bearer '+self.env['WKA_STRIPE_SECRET'],'Idempotency-Key':'wakhan-'+order['token']},data=data)
            return value.get('id'),value.get('url')
        token=await self.paypal_token()
        value=await self.request('POST','https://api-m.paypal.com/v2/checkout/orders',headers={'Authorization':'Bearer '+token,'PayPal-Request-Id':order['token']},json={'intent':'CAPTURE','purchase_units':[{'custom_id':order['token'],'description':label,'amount':{'currency_code':order['currency'],'value':format(Decimal(order['amount'])/100,'.2f')}}],'payment_source':{'paypal':{'experience_context':{'user_action':'PAY_NOW','return_url':return_url,'cancel_url':return_url+'&cancelled=1'}}}})
        link=next((item.get('href') for item in value.get('links',[]) if item.get('rel') in ('payer-action','approve')),None)
        return value.get('id'),link

    def verify_stripe(self,raw,header):
        secret=self.env.get('WKA_STRIPE_WEBHOOK_SECRET','')
        if not self.enabled('stripe') or len(header)>4096:raise GatewayError('bad_signature')
        try:
            fields=[part.strip().split('=',1) for part in header.split(',')];timestamp=int(next(value for key,value in fields if key=='t'))
            if abs(time.time()-timestamp)>300:raise ValueError()
            signature=hmac.new(secret.encode(),str(timestamp).encode()+b'.'+raw,hashlib.sha256).hexdigest()
            if not any(key=='v1' and hmac.compare_digest(value,signature) for key,value in fields):raise ValueError()
            value=json.loads(raw)
            if not isinstance(value,dict) or value.get('livemode') is not True:raise ValueError()
            return value
        except (ValueError,StopIteration,TypeError):raise GatewayError('bad_signature') from None

    async def verify_paypal(self,event,headers):
        if not self.enabled('paypal'):raise GatewayError('bad_signature')
        required={'transmission_id':'PAYPAL-TRANSMISSION-ID','transmission_time':'PAYPAL-TRANSMISSION-TIME','cert_url':'PAYPAL-CERT-URL','auth_algo':'PAYPAL-AUTH-ALGO','transmission_sig':'PAYPAL-TRANSMISSION-SIG'}
        data={key:headers.get(name,'') for key,name in required.items()}
        if any(not value or len(value)>4096 for value in data.values()):raise GatewayError('bad_signature')
        data.update(webhook_id=self.env['WKA_PAYPAL_WEBHOOK_ID'],webhook_event=event)
        token=await self.paypal_token();result=await self.request('POST','https://api-m.paypal.com/v1/notifications/verify-webhook-signature',headers={'Authorization':'Bearer '+token},json=data)
        if result.get('verification_status')!='SUCCESS':raise GatewayError('bad_signature')

    async def capture(self,reference,order_token):
        if not self.enabled('paypal'):raise GatewayError('payment_unavailable')
        if not isinstance(reference,str) or not reference.isalnum() or len(reference)>40:raise GatewayError('bad_reference')
        token=await self.paypal_token()
        headers={'Authorization':'Bearer '+token,'PayPal-Request-Id':'capture-'+order_token}
        try:return await self.request('POST','https://api-m.paypal.com/v2/checkout/orders/'+reference+'/capture',headers=headers,json={})
        except GatewayError:
            # A lost capture response can still represent a completed payment.
            # Retrieve authoritative state; callers still check the captured sum.
            return await self.request('GET','https://api-m.paypal.com/v2/checkout/orders/'+reference,headers={'Authorization':'Bearer '+token})

    async def close(self):
        if self.session:await self.session.close()
