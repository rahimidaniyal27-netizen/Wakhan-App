import plistlib, sys

pl = sys.argv[1]
with open(pl, 'rb') as f:
    p = plistlib.load(f)

p['NSAppTransportSecurity'] = {'NSAllowsArbitraryLoads': True}

with open(pl, 'wb') as f:
    plistlib.dump(p, f)

print('ATS fix applied successfully')
