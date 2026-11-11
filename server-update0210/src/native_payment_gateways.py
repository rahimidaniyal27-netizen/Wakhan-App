"""Hosted checkout only; credentials and provider responses never reach the client."""
import hashlib,hmac,json,time
import aiohttp

class GatewayError(Exception):pass


class Gateways:
    def __init__(self,env):self.env=env;self.session=None

    def enabled(self,provider,currency=None):
        if provider=='stripe':return bool(self.env.get('WKA_STRIPE_SECRET','').startswith('sk_live_') and self.env.get('WKA_STRIPE_WEBHOOK_SECRET','').startswith('whsec_'))
        return False

    async def request(self,method,url,**kwargs):
        if self.session is None:self.session=aiohttp.ClientSession(trust_env=True,timeout=aiohttp.ClientTimeout(total=25))
        try:
            async with self.session.request(method,url,allow_redirects=False,**kwargs) as response:
                if response.status>=300:raise GatewayError('payment_provider_unavailable')
                value=await response.json()
                if not isinstance(value,dict):raise GatewayError('payment_provider_unavailable')
                return value
        except (aiohttp.ClientError,TimeoutError,ValueError):raise GatewayError('payment_provider_unavailable') from None


    async def create(self,provider,order):
        if not self.enabled(provider,order['currency']):raise GatewayError('payment_unavailable')
        origin='https://music.kabulcafe.uk';return_url=origin+'/pay/return?order='+order['token']
        label='Wakhan '+(str(order['coins'])+' coins' if order['coins'] else str(order['months'])+' month access')
        if provider=='stripe':
            data={'mode':'payment','excluded_payment_method_types[0]':'paypal','success_url':return_url,'cancel_url':return_url+'&cancelled=1','client_reference_id':order['token'],'metadata[wakhan_order]':order['token'],'billing_address_collection':'required','line_items[0][quantity]':'1','line_items[0][price_data][currency]':order['currency'].lower(),'line_items[0][price_data][unit_amount]':str(order['amount']),'line_items[0][price_data][product_data][name]':label,'line_items[0][price_data][tax_behavior]':'inclusive'}
            value=await self.request('POST','https://api.stripe.com/v1/checkout/sessions',headers={'Authorization':'Bearer '+self.env['WKA_STRIPE_SECRET'],'Idempotency-Key':'wakhan-'+order['token']},data=data)
            return value.get('id'),value.get('url')
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



    async def close(self):
        if self.session:await self.session.close()
