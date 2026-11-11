"""Keep the authenticated seat handler bound to the actual room capacity."""
import ast


def upgrade(source):
    tree=ast.parse(source)
    handler=next((node for node in tree.body if isinstance(node,ast.AsyncFunctionDef) and node.name=='api_cinctl'),None)
    if handler is None:raise RuntimeError('ROOM_CONTROL_HANDLER_CHANGED')
    matches=[]
    for node in ast.walk(handler):
        if isinstance(node,ast.Compare) and ast.unparse(node)=='0 <= i < SEATS':matches.append(node)
    if not matches and not any(isinstance(node,ast.Compare) and ast.unparse(node)=="0 <= i < len(c['seats'])" for node in ast.walk(handler)):raise RuntimeError('ROOM_SEAT_LIMIT_CHANGED')
    if len(matches)>1:raise RuntimeError('ROOM_SEAT_LIMIT_AMBIGUOUS')
    if matches:matches[0].comparators[-1]=ast.parse("len(c['seats'])",mode='eval').body
    voice=next(node for node in tree.body if isinstance(node,ast.AsyncFunctionDef) and node.name=='api_cv')
    limits=[node for node in ast.walk(voice) if isinstance(node,ast.Compare) and ast.unparse(node)=="len(r['m']) >= SEATS"]
    if len(limits)>1:raise RuntimeError('ROOM_VOICE_LIMIT_AMBIGUOUS')
    if not limits and not any(isinstance(node,ast.Compare) and ast.unparse(node)=="len(r['m']) >= len(c['seats'])" for node in ast.walk(voice)):raise RuntimeError('ROOM_VOICE_LIMIT_CHANGED')
    if limits:limits[0].comparators[0]=ast.parse("len(c['seats'])",mode='eval').body
    ast.fix_missing_locations(tree)
    return ast.unparse(tree)+'\n'
