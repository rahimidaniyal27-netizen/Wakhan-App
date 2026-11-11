"""One explicitly authorized legacy-account cleanup; never renumber internal UIDs."""
LEGACY_ACCOUNTS=(8434419791,8584042529)
AUDIT_CUTOFF=1794300518


def cleanup_legacy_accounts(namespace,accounts,requested):
    if not requested:return {'removed':0,'already_absent':0}
    if not isinstance(requested,list) or any(type(uid) is not int for uid in requested) or tuple(sorted(requested))!=tuple(sorted(LEGACY_ACCOUNTS)):
        raise RuntimeError('UNAUTHORIZED_LEGACY_ACCOUNT_SET')
    db=namespace['DB'];columns={row[1] for row in db.execute('PRAGMA table_info(wka_accounts)')}
    linked=[name for name in ('email','google','facebook') if name in columns]
    ready=[];absent=0
    for uid in requested:
        if uid==namespace['OWNER']:raise RuntimeError('OWNER_CLEANUP_FORBIDDEN')
        row=db.execute('SELECT created,'+','.join(linked)+' FROM wka_accounts WHERE uid=?',(uid,)).fetchone()
        if not row:absent+=1;continue
        if int(row[0])>AUDIT_CUTOFF or any(value for value in row[1:]):raise RuntimeError('LEGACY_ACCOUNT_STATE_CHANGED')
        ready.append(uid)
    for uid in ready:
        accounts.wipe(uid)
        if db.execute('SELECT 1 FROM wka_accounts WHERE uid=?',(uid,)).fetchone():raise RuntimeError('LEGACY_ACCOUNT_CLEANUP_INCOMPLETE')
    return {'removed':len(ready),'already_absent':absent}
