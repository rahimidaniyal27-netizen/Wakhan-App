import hashlib,hmac,os,socket,ssl,struct,time
MAGIC=0x2112A442
def attr(kind, value):
    return struct.pack('!HH', kind, len(value)) + value + b'\x00' * (-len(value) % 4)

def message(kind, attrs, transaction, key=None):
    body = b''.join(attrs)
    header = struct.pack('!HHI12s', kind, len(body) + (24 if key else 0), MAGIC, transaction)
    if key:
        body += attr(8, hmac.new(key, header + body, hashlib.sha1).digest())
    return header + body

def parse(data, transaction):
    if len(data) < 20:
        raise ValueError('truncated')
    kind, size, magic, received = struct.unpack('!HHI12s', data[:20])
    if magic != MAGIC or received != transaction or len(data) != 20 + size:
        raise ValueError('invalid_response')
    values = {}
    at = 20
    while at + 4 <= len(data):
        field, length = struct.unpack('!HH', data[at:at + 4])
        at += 4
        if at + length > len(data):
            raise ValueError('truncated_attribute')
        values[field] = data[at:at + length]
        at += length + -length % 4
    return (kind, values)

def receive(sock, tcp):
    if not tcp:
        return sock.recv(65535)

    def exactly(size):
        output = b''
        while len(output) < size:
            part = sock.recv(size - len(output))
            if not part:
                raise ValueError('closed')
            output += part
        return output
    header = exactly(20)
    size = struct.unpack('!H', header[2:4])[0]
    return header + exactly(size)

def code(values):
    value = values.get(9, b'')
    return (value[2] & 7) * 100 + value[3] if len(value) >= 4 else None

def allocate(host, port, username, password, tcp=False, timeout=4, tls_hostname=None, tls_context=None):
    if tls_hostname and (not tcp):
        raise ValueError('tls_requires_tcp')
    result = {'transport': 'tcp' if tcp else 'udp', 'port': port, 'allocated': False, 'released': False}
    start = time.monotonic()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM if tcp else socket.SOCK_DGRAM)
    sock.settimeout(timeout)
    nonce = realm = None
    key = None
    allocated = False

    def exchange(kind, attributes, auth=False):
        transaction = os.urandom(12)
        if auth:
            attributes = attributes + [attr(6, username.encode()), attr(20, realm), attr(21, nonce)]
        request = message(kind, attributes, transaction, key if auth else None)
        sock.sendall(request)
        return parse(receive(sock, tcp), transaction)
    try:
        sock.connect((host, port))
        if tls_hostname:
            sock = (tls_context or ssl.create_default_context()).wrap_socket(sock, server_hostname=tls_hostname)
            result['tls_verified'] = True
        response, values = exchange(3, [attr(25, b'\x11\x00\x00\x00')])
        if response == 259:
            allocated = True
            result['unauthenticated_allocate'] = True
        else:
            error = code(values)
            result['challenge_status'] = error
            if error not in (401, 438) or 20 not in values or 21 not in values:
                return result
            realm = values[20]
            nonce = values[21]
            key = hashlib.md5(username.encode() + b':' + realm + b':' + password.encode()).digest()
            response, values = exchange(3, [attr(25, b'\x11\x00\x00\x00')], True)
            if response != 259:
                result['authenticated_error'] = code(values)
                return result
            allocated = True
            result['unauthenticated_allocate'] = False
        result['allocated'] = True
        result['server_local_round_trip_ms'] = round((time.monotonic() - start) * 1000, 1)
    except (OSError, ValueError) as error:
        result['error'] = 'timeout' if isinstance(error, TimeoutError) else 'connection_or_protocol_error'
    finally:
        if allocated:
            try:
                response, _ = exchange(4, [attr(13, struct.pack('!I', 0))], key is not None)
                result['released'] = response == 260
            except (OSError, ValueError):
                pass
        sock.close()
    return result
