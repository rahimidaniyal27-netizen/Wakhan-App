"""Wakhan Chat Backend — Python Flask Routes"""
"""Features: DM, Groups, Channels, Messages, Uploads, Calls, Lounge"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
from bson import ObjectId
import os
import uuid

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

# ─── Helpers ───
def get_db():
    return g.db

def serialize_msg(msg):
    msg['id'] = str(msg.pop('_id'))
    msg['senderId'] = str(msg.get('senderId', ''))
    msg['chatId'] = str(msg.get('chatId', ''))
    if 'replyTo' in msg and msg['replyTo']:
        msg['replyTo']['senderId'] = str(msg['replyTo'].get('senderId', ''))
    return msg

def serialize_chat(chat):
    chat['id'] = str(chat.pop('_id'))
    if 'participants' in chat:
        chat['participants'] = [
            {**p, 'userId': str(p['userId'])} if isinstance(p.get('userId'), ObjectId) else p
            for p in chat['participants']
        ]
    return chat

# ─── Conversations ───
@chat_bp.route('/conversations', methods=['GET'])
def get_conversations():
    user_id = g.current_user.get('id') if hasattr(g, 'current_user') else request.args.get('userId')
    db = get_db()

    chats = list(db.chats.find({
        'participants': {
            '$elemMatch': {
                'userId': ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
            }
        }
    }).sort('updatedAt', -1))

    result = []
    for chat in chats:
        chat = serialize_chat(chat)
        # Get unread count
        unread = db.messages.count_documents({
            'chatId': ObjectId(chat['id']),
            'readBy': {'$nin': [ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id]},
            'senderId': {'$ne': ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id}
        })
        chat['unreadCount'] = unread
        # Get last message
        last = db.messages.find_one({'chatId': ObjectId(chat['id'])}, sort=[('createdAt', -1)])
        if last:
            chat['lastMessage'] = serialize_msg(last)
        result.append(chat)

    return jsonify(result)

@chat_bp.route('/conversations', methods=['POST'])
def create_conversation():
    data = request.get_json()
    db = get_db()
    user_id = g.current_user.get('id') if hasattr(g, 'current_user') else data.get('userId')

    chat = {
        'name': data.get('name', 'New Chat'),
        'isGroup': data.get('isGroup', False),
        'isChannel': data.get('isChannel', False),
        'participants': [
            {'userId': ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id, 'role': 'admin', 'online': False}
        ] + [
            {'userId': ObjectId(pid) if ObjectId.is_valid(pid) else pid, 'role': 'member', 'online': False}
            for pid in data.get('participantIds', [])
        ],
        'avatar': data.get('avatar', ''),
        'pinned': False,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow(),
    }
    result = db.chats.insert_one(chat)
    chat['id'] = str(result.inserted_id)
    return jsonify(chat), 201

# ─── Messages ───
@chat_bp.route('/messages/<chat_id>', methods=['GET'])
def get_messages(chat_id):
    db = get_db()
    limit = int(request.args.get('limit', 50))
    before = request.args.get('before')

    query = {'chatId': ObjectId(chat_id) if ObjectId.is_valid(chat_id) else chat_id}
    if before:
        query['createdAt'] = {'$lt': datetime.fromisoformat(before)}

    msgs = list(db.messages.find(query).sort('createdAt', -1).limit(limit))
    msgs.reverse()
    return jsonify([serialize_msg(m) for m in msgs])

@chat_bp.route('/send', methods=['POST'])
def send_message():
    data = request.get_json()
    db = get_db()
    user_id = g.current_user.get('id') if hasattr(g, 'current_user') else data.get('senderId')

    msg = {
        'chatId': ObjectId(data['chatId']) if ObjectId.is_valid(data['chatId']) else data['chatId'],
        'senderId': ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        'type': data.get('type', 'text'),
        'content': data.get('content', ''),
        'mediaUrl': data.get('mediaUrl', ''),
        'thumbnailUrl': data.get('thumbnailUrl', ''),
        'duration': data.get('duration', 0),
        'caption': data.get('caption', ''),
        'lat': data.get('lat'),
        'lng': data.get('lng'),
        'locationName': data.get('locationName', ''),
        'trackId': data.get('trackId', ''),
        'trackTitle': data.get('trackTitle', ''),
        'artist': data.get('artist', ''),
        'coverUrl': data.get('coverUrl', ''),
        'gameId': data.get('gameId', ''),
        'gameName': data.get('gameName', ''),
        'replyToId': data.get('replyToId'),
        'readBy': [ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id],
        'reactions': [],
        'status': 'sent',
        'createdAt': datetime.utcnow(),
    }

    if msg['replyToId']:
        reply = db.messages.find_one({'_id': ObjectId(msg['replyToId'])})
        if reply:
            msg['replyTo'] = {
                'messageId': str(reply['_id']),
                'senderId': str(reply['senderId']),
                'senderName': '',  # populated from user lookup
                'content': reply.get('content', '')[:100],
            }

    result = db.messages.insert_one(msg)
    msg['_id'] = result.inserted_id

    # Update chat's last activity
    db.chats.update_one(
        {'_id': msg['chatId']},
        {'$set': {'updatedAt': datetime.utcnow()}}
    )

    return jsonify(serialize_msg(msg)), 201

# ─── Upload ───
@chat_bp.route('/upload', methods=['POST'])
def upload_media():
    db = get_db()
    file = request.files.get('file')
    chat_id = request.form.get('chatId')
    msg_type = request.form.get('type', 'image')

    if not file:
        return jsonify({'error': 'No file'}), 400

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    upload_dir = os.environ.get('UPLOAD_DIR', '/opt/wakhan/uploads')
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    base_url = os.environ.get('BASE_URL', 'https://music.kabulcafe.uk')
    media_url = f"{base_url}/uploads/{filename}"

    return jsonify({
        'mediaUrl': media_url,
        'thumbnailUrl': media_url if msg_type != 'video' else f"{media_url}.thumb.jpg",
    })

# ─── Read Receipts ───
@chat_bp.route('/read/<chat_id>', methods=['POST'])
def mark_read(chat_id):
    db = get_db()
    user_id = g.current_user.get('id') if hasattr(g, 'current_user') else request.json.get('userId')
    uid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

    db.messages.update_many(
        {
            'chatId': ObjectId(chat_id) if ObjectId.is_valid(chat_id) else chat_id,
            'readBy': {'$nin': [uid]},
        },
        {'$addToSet': {'readBy': uid}, '$set': {'status': 'read'}}
    )
    return jsonify({'ok': True})

# ─── Reactions ───
@chat_bp.route('/react', methods=['POST'])
def add_reaction():
    data = request.get_json()
    db = get_db()
    user_id = g.current_user.get('id') if hasattr(g, 'current_user') else data.get('userId')
    uid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id

    db.messages.update_one(
        {'_id': ObjectId(data['messageId'])},
        {'$addToSet': {'reactions': {'userId': uid, 'emoji': data['emoji']}}}
    )
    return jsonify({'ok': True})

# ─── Forward ───
@chat_bp.route('/forward', methods=['POST'])
def forward_message():
    data = request.get_json()
    db = get_db()
    original = db.messages.find_one({'_id': ObjectId(data['messageId'])})
    if not original:
        return jsonify({'error': 'Message not found'}), 404

    user_id = g.current_user.get('id') if hasattr(g, 'current_user') else data.get('userId')
    new_msg = {
        'chatId': ObjectId(data['targetChatId']) if ObjectId.is_valid(data['targetChatId']) else data['targetChatId'],
        'senderId': ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        'type': original['type'],
        'content': original.get('content', ''),
        'mediaUrl': original.get('mediaUrl', ''),
        'thumbnailUrl': original.get('thumbnailUrl', ''),
        'duration': original.get('duration', 0),
        'caption': original.get('caption', ''),
        'forwardedFrom': str(original['_id']),
        'readBy': [ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id],
        'reactions': [],
        'status': 'sent',
        'createdAt': datetime.utcnow(),
    }
    result = db.messages.insert_one(new_msg)
    new_msg['_id'] = result.inserted_id
    return jsonify(serialize_msg(new_msg)), 201

# ─── Pin ───
@chat_bp.route('/pin/<msg_id>', methods=['POST'])
def pin_message(msg_id):
    db = get_db()
    msg = db.messages.find_one({'_id': ObjectId(msg_id)})
    if not msg:
        return jsonify({'error': 'Not found'}), 404

    db.chats.update_one(
        {'_id': msg['chatId']},
        {'$set': {'pinnedMessageId': ObjectId(msg_id)}}
    )
    return jsonify({'ok': True})

# ─── Delete ───
@chat_bp.route('/delete/<msg_id>', methods=['POST'])
def delete_message(msg_id):
    db = get_db()
    db.messages.update_one(
        {'_id': ObjectId(msg_id)},
        {'$set': {'deleted': True, 'content': 'This message was deleted', 'mediaUrl': '', 'type': 'text'}}
    )
    return jsonify({'ok': True})

# ─── Lounge Rooms ───
@chat_bp.route('/lounge/rooms', methods=['GET'])
def get_lounge_rooms():
    db = get_db()
    rooms = list(db.lounge_rooms.find().sort('participants', -1))
    for r in rooms:
        r['id'] = str(r.pop('_id'))
    return jsonify(rooms)

@chat_bp.route('/lounge/<room_id>/messages', methods=['GET'])
def get_lounge_messages(room_id):
    db = get_db()
    msgs = list(db.lounge_messages.find({
        'roomId': ObjectId(room_id) if ObjectId.is_valid(room_id) else room_id
    }).sort('createdAt', -1).limit(100))
    msgs.reverse()
    return jsonify([serialize_msg(m) for m in msgs])

# ─── Status/Stories ───
@chat_bp.route('/status', methods=['POST'])
def create_status():
    db = get_db()
    user_id = g.current_user.get('id') if hasattr(g, 'current_user') else request.form.get('userId')
    file = request.files.get('file')

    media_url = ''
    if file:
        ext = os.path.splitext(file.filename)[1]
        filename = f"status_{uuid.uuid4()}{ext}"
        upload_dir = os.environ.get('UPLOAD_DIR', '/opt/wakhan/uploads')
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        base_url = os.environ.get('BASE_URL', 'https://music.kabulcafe.uk')
        media_url = f"{base_url}/uploads/{filename}"

    status = {
        'userId': ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        'mediaUrl': media_url,
        'caption': request.form.get('caption', ''),
        'views': [],
        'createdAt': datetime.utcnow(),
        'expiresAt': datetime.utcnow() + timedelta(hours=24),
    }
    db.statuses.insert_one(status)
    return jsonify({'ok': True}), 201

@chat_bp.route('/status/friends', methods=['GET'])
def get_friends_statuses():
    db = get_db()
    user_id = g.current_user.get('id') if hasattr(g, 'current_user') else request.args.get('userId')
    # Get statuses from friends that haven't expired
    statuses = list(db.statuses.find({
        'expiresAt': {'$gt': datetime.utcnow()},
        'userId': {'$ne': ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id}
    }).sort('createdAt', -1))
    for s in statuses:
        s['id'] = str(s.pop('_id'))
        s['userId'] = str(s['userId'])
    return jsonify(statuses)
