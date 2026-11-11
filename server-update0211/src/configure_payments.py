#!/usr/bin/env python3
"""Run privately on the server after merchant identity verification is complete."""
import argparse,asyncio,getpass,json,os,stat,subprocess,tempfile
from pathlib import Path
from native_payment_gateways import Gateways,GatewayError


async def configure(provider,config):
    if provider!='stripe':raise ValueError('payment_unavailable')
    settings=json.loads(config.read_text());env=dict(settings.get('env',{}));origin='https://music.kabulcafe.uk'
    print('Enter credentials here on your server. Never send them in chat.')
    if provider=='stripe':
        secret=getpass.getpass('Stripe LIVE secret key: ').strip()
        if not secret.startswith('sk_live_'):raise ValueError('LIVE_KEY_REQUIRED')
        env['WKA_STRIPE_SECRET']=secret;gateway=Gateways(env)
        try:
            account=await gateway.request('GET','https://api.stripe.com/v1/account',headers={'Authorization':'Bearer '+secret})
            if account.get('charges_enabled') is not True:raise ValueError('MERCHANT_ACCOUNT_NOT_READY')
            print('In Stripe Workbench, create a LIVE webhook for: '+origin+'/api/payments/stripe/webhook')
            print('Events: checkout.session.completed and checkout.session.async_payment_succeeded')
            webhook=getpass.getpass('Webhook signing secret (whsec_): ').strip()
            if not webhook.startswith('whsec_') or len(webhook)<20:raise ValueError('WEBHOOK_SECRET_REQUIRED')
            env['WKA_STRIPE_WEBHOOK_SECRET']=webhook
        finally:await gateway.close()
    settings['env']=env
    # Do not print settings, provider responses, IDs or credentials.
    previous=config.stat();fd,name=tempfile.mkstemp(prefix='.payments-',dir=config.parent)
    try:
        with os.fdopen(fd,'w') as file:json.dump(settings,file);file.flush();os.fsync(file.fileno())
        os.chown(name,previous.st_uid,previous.st_gid);os.chmod(name,0o600);os.replace(name,config)
    finally:
        if os.path.exists(name):os.unlink(name)
    subprocess.run(['systemctl','restart','wakhan-app.service'],check=True)
    print('Saved privately. Test one real purchase and confirm its ledger entry before announcing payments.')


def main():
    if os.geteuid()!=0:raise SystemExit('RUN_AS_ROOT_ON_YOUR_SERVER')
    parser=argparse.ArgumentParser();parser.add_argument('provider',choices=('stripe',));parser.add_argument('--config',type=Path,default=Path(__file__).resolve().parent/'private/app.json');args=parser.parse_args()
    try:asyncio.run(configure(args.provider,args.config))
    except (ValueError,GatewayError) as error:raise SystemExit(str(error)) from None


if __name__=='__main__':main()
