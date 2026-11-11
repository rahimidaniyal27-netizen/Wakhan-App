"""Versioned regional prices. Amounts are integer minor units, never client supplied."""
VERSION='2026-11-v1'
COINS=(50,150,300,750,1600,4200)
MONTHS=(1,6,12)
EUR_COUNTRIES=frozenset('AT BE CY EE FI FR DE GR HR IE IT LT LU LV MT NL PT SI SK ES'.split())
REGIONS={
 'EUR':('EUR',(99,249,499,1099,2199,4999),(99,499,899)),
 'US':('USD',(99,249,499,1099,2199,4999),(99,499,899)),
 'AF':('AFN',(5000,14000,27000,65000,135000,340000),(4900,24900,44900)),
 'PK':('PKR',(19900,54900,99900,229900,449900,1099900),(19900,99900,179900)),
 'IN':('INR',(6900,17900,32900,74900,149900,359900),(4900,24900,44900)),
 'GB':('GBP',(89,229,429,999,1999,4499),(89,449,799)),
 'CA':('CAD',(129,349,649,1499,2999,6499),(129,649,1199)),
 'AU':('AUD',(149,399,749,1699,3399,7499),(149,749,1399)),
 'AE':('AED',(399,999,1999,4499,8499,19999),(399,1999,3499)),
}


def country(value):
    if not isinstance(value,str) or len(value)!=2 or not value.isascii() or not value.isalpha():raise ValueError('bad_country')
    return value.upper()


def catalog(region):
    region=country(region);key='EUR' if region in EUR_COUNTRIES else region
    currency,coins,plans=REGIONS.get(key,REGIONS['US'])
    return {'version':VERSION,'country':region,'currency':currency,
        'packs':[{'sku':'coins_'+str(count),'coins':count,'months':0,'amount':price} for count,price in zip(COINS,coins)],
        'plans':[{'sku':'subscription_'+str(months),'coins':0,'months':months,'amount':price,'days':{1:30,6:180,12:365}[months],'renewing':False} for months,price in zip(MONTHS,plans)]}


def product(region,sku):
    value=catalog(region)
    found=next((item for item in value['packs']+value['plans'] if item['sku']==sku),None)
    if not found:raise ValueError('bad_product')
    return dict(found,country=value['country'],currency=value['currency'],catalog_version=VERSION)
