"""Conservative response headers; preserves native voice, OAuth and media players."""
from aiohttp import web


@web.middleware
async def security_headers(req, handler):
    failure = None
    try:
        response = await handler(req)
    except web.HTTPException as error:
        response = error
        failure = error
    # A prepared stream/WebSocket has already sent its headers.
    if response.prepared:
        return response
    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('Referrer-Policy', 'no-referrer')
    response.headers.setdefault('X-Frame-Options', 'DENY')
    # Browsers apply HSTS only when received over a valid HTTPS connection.
    # Do not include subdomains: unrelated services may use this domain tree.
    response.headers.setdefault('Strict-Transport-Security', 'max-age=31536000')
    if req.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'private, no-store'
        if response.content_type == 'application/json':
            response.headers.setdefault('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
    if failure is not None:
        raise failure
    return response


def install(app):
    if security_headers not in app.middlewares:
        app.middlewares.append(security_headers)
