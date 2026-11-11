"""Music and rooms are free; paid membership grants cosmetic benefits only."""
import time

VIP_FRAMES=('solar','galaxy','imperial','crimson','ice','eclipse')


def install(namespace):
    db=namespace['DB'];personal=namespace['WM_PERSONAL'];identity=namespace['WM_IDENTITY'];frames=namespace['WM_FRAMES']
    original_entitlement=personal.entitlement

    def premium(uid):
        if uid==namespace['OWNER']:return True
        row=db.execute('SELECT until FROM wm_personal_subs WHERE uid=?',(uid,)).fetchone()
        return bool(row and row[0]>int(time.time()))

    async def entitlement(uid):
        value=await original_entitlement(uid)
        value.update(allowed=True,free_core=True,premium=premium(int(uid)),benefits=['vip_frames','vip_badge'])
        if not value['premium']:value['via']='free'
        return value
    personal.entitlement=entitlement

    # Six-month purchases are first-class memberships; retain old three-month
    # receipts and their existing badge without modifying financial history.
    def badge(uid):
        now=int(time.time());row=db.execute('SELECT until FROM wm_personal_subs WHERE uid=?',(uid,)).fetchone()
        if not row or row[0]<=now:return None
        paid=db.execute('SELECT months,max(until) FROM wm_identity_purchases WHERE uid=? AND until>? GROUP BY months ORDER BY months DESC LIMIT 1',(uid,now)).fetchone()
        if paid:return identity.badge('personal_'+str(paid[0]),80,{1:1,3:2,6:2,12:3}.get(paid[0],1),min(row[0],paid[1]))
        return identity.badge('personal',80,until=row[0])
    identity.personal=badge
    old_role,old_allowed=frames.role,frames.allowed
    def role(uid):return old_role(uid) or ('vip' if premium(uid) else None)
    def allowed(uid):return tuple(dict.fromkeys((*old_allowed(uid),*(VIP_FRAMES if premium(uid) else ()))))
    frames.role=role;frames.allowed=allowed
    old_staff,old_quote=frames.staff,frames.mint_quote
    def target(value):
        result=namespace['WM_ADMIN'].target(value)
        if not result:raise ValueError('recipient_not_found')
        return result
    def staff(actor,uid,enabled):
        frames.require_creator(actor)
        return old_staff(actor,target(uid),enabled)
    def quote(actor,body):
        frames.require_creator(actor)
        return old_quote(actor,dict(body,uid=target(body.get('uid'))))
    frames.staff=staff;frames.mint_quote=quote
    finance=namespace['WM_FINANCE'];old_grant=finance.grant
    def financial_access(actor,uid,level):
        finance.require(actor,owner=True)
        return old_grant(actor,target(uid),level)
    finance.grant=financial_access
    community=namespace['WM_COMMUNITY70']
    old_selected,old_choose=frames.selected,community.choose
    def selected(uid):
        choice=db.execute('SELECT frame FROM wm_frame_choices WHERE uid=?',(uid,)).fetchone()
        if choice and choice[0] in ('none','halo'):return None
        # Respect an explicit legacy selection when there is no later frame choice.
        if not choice and community.row(uid)['halo']:return None
        return old_selected(uid)
    frames.selected=selected
    async def choose_halo(uid,body):
        result=await old_choose(uid,body)
        with db:db.execute('INSERT INTO wm_frame_choices(uid,frame,ts) VALUES(?,?,?) ON CONFLICT(uid) DO UPDATE SET frame=excluded.frame,ts=excluded.ts',(uid,'none' if body.get('halo')=='none' else 'halo',int(time.time())))
        result['profile']=await community.profile(uid,uid,True)
        return result
    community.choose=choose_halo
    public=community.public
    def profile(uid,viewer=None,*args,**kwargs):
        value=public(uid,viewer,*args,**kwargs)
        selected_frame=frames.selected(uid)
        value['frame_style']={'role':role(uid),'frame':selected_frame} if selected_frame else None
        if selected_frame:value['halo']=None
        return value
    namespace['WM_COMMUNITY70'].public=profile
    namespace['WM_PREMIUM']=premium
