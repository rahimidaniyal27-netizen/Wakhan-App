"""Wakhan Chat Socket.io Events — Real-time"""

from flask_socketio import emit, join_room, leave_room
from bson import ObjectId
from datetime import datetime

def register_chat_sockets(socketio, db):

    @socketio.on('connect')
    def on_connect(auth):
        user_id = auth.get('token') if auth else None
        if user_id:
            # Mark user online
            db.users.update_one(
                {'_id': ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id},
                {'$set': {'online': True, 'lastSeen': datetime.utcnow()}}
            )
            emit('user:online', {'userId': user_id}, broadcast=True)

    @socketio.on('disconnect')
    def on_disconnect():
        # Note: Need user mapping from session
        pass

    @socketio.on('chat:join')
    def on_join_chat(chat_id):
        join_room(str(chat_id))

    @socketio.on('chat:leave')
    def on_leave_chat(chat_id):
        leave_room(str(chat_id))

    @socketio.on('message:send')
    def on_send_message(msg):
        chat_id = str(msg.get('chatId'))
        # Broadcast to all in room except sender
        emit('message:new', msg, room=chat_id, include_self=False)

    @socketio.on('typing')
    def on_typing(data):
        chat_id = str(data.get('chatId'))
        user_id = data.get('userId')
        emit('user:typing', {'chatId': chat_id, 'userId': user_id}, room=chat_id, include_self=False)

    @socketio.on('message:read')
    def on_read(data):
        chat_id = str(data.get('chatId'))
        user_id = data.get('userId')
        emit('message:read', {'chatId': chat_id, 'userId': user_id}, room=chat_id, include_self=False)

    @socketio.on('call:initiate')
    def on_call_initiate(data):
        chat_id = str(data.get('chatId'))
        emit('call:incoming', data, room=chat_id, include_self=False)

    @socketio.on('call:accept')
    def on_call_accept(data):
        chat_id = str(data.get('chatId'))
        emit('call:accepted', data, room=chat_id)

    @socketio.on('call:decline')
    def on_call_decline(data):
        chat_id = str(data.get('chatId'))
        emit('call:declined', data, room=chat_id)

    @socketio.on('call:end')
    def on_call_end(data):
        chat_id = str(data.get('chatId'))
        emit('call:ended', data, room=chat_id)

    @socketio.on('lounge:join')
    def on_lounge_join(room_id):
        join_room(f"lounge_{room_id}")
        db.lounge_rooms.update_one(
            {'_id': ObjectId(room_id) if ObjectId.is_valid(room_id) else room_id},
            {'$inc': {'participants': 1}}
        )

    @socketio.on('lounge:leave')
    def on_lounge_leave(room_id):
        leave_room(f"lounge_{room_id}")
        db.lounge_rooms.update_one(
            {'_id': ObjectId(room_id) if ObjectId.is_valid(room_id) else room_id},
            {'$inc': {'participants': -1}}
        )

    @socketio.on('lounge:message')
    def on_lounge_message(data):
        room_id = str(data.get('roomId'))
        msg = {
            'roomId': ObjectId(room_id) if ObjectId.is_valid(room_id) else room_id,
            'senderId': ObjectId(data['senderId']) if ObjectId.is_valid(data['senderId']) else data['senderId'],
            'content': data.get('content', ''),
            'type': data.get('type', 'text'),
            'createdAt': datetime.utcnow(),
        }
        db.lounge_messages.insert_one(msg)
        emit('lounge:message', msg, room=f"lounge_{room_id}")

    @socketio.on('status:view')
    def on_status_view(data):
        status_id = data.get('statusId')
        user_id = data.get('userId')
        db.statuses.update_one(
            {'_id': ObjectId(status_id) if ObjectId.is_valid(status_id) else status_id},
            {'$addToSet': {'views': ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id}}
        )
