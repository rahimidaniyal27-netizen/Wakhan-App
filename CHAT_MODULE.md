# Wakhan Chat Module v1.0

## Files Added

### Frontend (`src/`)
- `chat-view.mjs` — Complete chat UI (DM, Groups, Channels, Lounge, Calls, Status)
- `chat-styles.css` — Dark theme styles matching Wakhan design
- `chat-integration.mjs` — Bridge to integrate chat into Wakhan shell

### Backend (`backend/`)
- `chat.py` — Flask Blueprint with all chat REST API endpoints
- `chat_socket.py` — Socket.io real-time events

## Features Implemented

| Feature | Status | File |
|---------|--------|------|
| Text messages | ✅ | chat-view.mjs, chat.py |
| Image messages | ✅ | chat-view.mjs, chat.py |
| Video messages | ✅ | chat-view.mjs, chat.py |
| Voice messages | ✅ | chat-view.mjs, chat.py |
| Read receipts | ✅ | chat-view.mjs, chat_socket.py |
| Typing indicators | ✅ | chat-view.mjs, chat_socket.py |
| Online/offline status | ✅ | chat-view.mjs, chat_socket.py |
| Reply to message | ✅ | chat-view.mjs |
| Forward message | ✅ | chat-view.mjs, chat.py |
| React with emoji | ✅ | chat-view.mjs, chat.py |
| Pin message | ✅ | chat-view.mjs, chat.py |
| Delete message | ✅ | chat-view.mjs, chat.py |
| Music sharing | ✅ | chat-view.mjs |
| Listen Together | ✅ | chat-view.mjs |
| Game invites | ✅ | chat-view.mjs |
| Location sharing | ✅ | chat-view.mjs, chat.py |
| Voice calls | ✅ | chat-view.mjs, chat_socket.py |
| Video calls | ✅ | chat-view.mjs, chat_socket.py |
| Chat Lounge (public rooms) | ✅ | chat-view.mjs, chat.py, chat_socket.py |
| Status/Stories (24h) | ✅ | chat-view.mjs, chat.py |
| Group chat | ✅ | chat-view.mjs, chat.py |
| Channel (broadcast) | ✅ | chat-view.mjs, chat.py |
| DM (1-on-1) | ✅ | chat-view.mjs, chat.py |
| Push notifications | ✅ | Uses existing setupPush() |

## Backend Integration

### 1. Register Flask Blueprint

In your main Flask app file:

```python
from backend.chat import chat_bp
from backend.chat_socket import register_chat_sockets

# Register REST routes
app.register_blueprint(chat_bp)

# Register Socket.io events
register_chat_sockets(socketio, db)
```

### 2. MongoDB Collections Needed

```python
# chats
{
  "participants": [{"userId": ObjectId, "role": "admin|member", "online": bool}],
  "name": str,
  "isGroup": bool,
  "isChannel": bool,
  "avatar": str,
  "pinned": bool,
  "pinnedMessageId": ObjectId,
  "createdAt": datetime,
  "updatedAt": datetime
}

# messages
{
  "chatId": ObjectId,
  "senderId": ObjectId,
  "type": "text|image|video|voice|music|location|game",
  "content": str,
  "mediaUrl": str,
  "thumbnailUrl": str,
  "duration": int,
  "caption": str,
  "lat": float,
  "lng": float,
  "locationName": str,
  "trackId": str,
  "trackTitle": str,
  "artist": str,
  "coverUrl": str,
  "gameId": str,
  "gameName": str,
  "replyToId": ObjectId,
  "replyTo": { "messageId": str, "senderId": str, "senderName": str, "content": str },
  "readBy": [ObjectId],
  "reactions": [{"userId": ObjectId, "emoji": str}],
  "forwardedFrom": str,
  "status": "sent|delivered|read",
  "deleted": bool,
  "createdAt": datetime
}

# lounge_rooms
{
  "name": str,
  "topic": str,
  "icon": str,
  "participants": int,
  "createdAt": datetime
}

# lounge_messages
{
  "roomId": ObjectId,
  "senderId": ObjectId,
  "content": str,
  "type": str,
  "createdAt": datetime
}

# statuses
{
  "userId": ObjectId,
  "mediaUrl": str,
  "caption": str,
  "views": [ObjectId],
  "createdAt": datetime,
  "expiresAt": datetime
}
```

### 3. Environment Variables

```bash
UPLOAD_DIR=/opt/wakhan/uploads
BASE_URL=https://music.kabulcafe.uk
```

### 4. Install Dependencies

```bash
pip install flask-socketio python-socketio[client]
```

## Frontend Integration

### 1. Import Chat Module

Add to your shell entry point (where Wakhan shell initializes):

```javascript
import { installChat } from './chat-integration.mjs';

// After broker is initialized:
installChat({ broker, container: document.getElementById('view') });
```

### 2. Add Chat Tab to Navigation

In your shell's tab bar, add a "Chats" tab that calls:

```javascript
window.WakhanChat.openChatList();
```

### 3. Socket.io Client

Add to `index.html` or bundle:

```html
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

Or install via npm:

```bash
npm install socket.io-client
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | List user's chats |
| POST | `/api/chat/conversations` | Create new chat |
| GET | `/api/chat/messages/:chatId` | Get messages |
| POST | `/api/chat/send` | Send message |
| POST | `/api/chat/upload` | Upload media |
| POST | `/api/chat/read/:chatId` | Mark as read |
| POST | `/api/chat/react` | Add reaction |
| POST | `/api/chat/forward` | Forward message |
| POST | `/api/chat/pin/:msgId` | Pin message |
| POST | `/api/chat/delete/:msgId` | Delete message |
| GET | `/api/chat/lounge/rooms` | List lounge rooms |
| GET | `/api/chat/lounge/:roomId/messages` | Lounge messages |
| POST | `/api/chat/status` | Create status |
| GET | `/api/chat/status/friends` | Friends' statuses |

## Socket.io Events

### Client → Server
- `chat:join` — Join a chat room
- `chat:leave` — Leave a chat room
- `message:send` — Send real-time message
- `typing` — Typing indicator
- `message:read` — Mark as read
- `call:initiate` — Start call
- `call:accept` — Accept call
- `call:decline` — Decline call
- `call:end` — End call
- `lounge:join` — Join lounge room
- `lounge:leave` — Leave lounge room
- `lounge:message` — Send lounge message

### Server → Client
- `message:new` — New message received
- `message:read` — Message read by other
- `user:typing` — Other user is typing
- `user:online` — User came online
- `user:offline` — User went offline
- `call:incoming` — Incoming call
- `call:accepted` — Call accepted
- `call:declined` — Call declined
- `call:ended` — Call ended
- `lounge:message` — Lounge message

## Notes

- The chat module uses Wakhan's existing `SessionBroker` for API calls
- Styles match Wakhan's dark theme (`#0a0a0f` background, `#6c5ce7` accent)
- Image messages display WITHOUT bubble frame (rounded corners only)
- All Persian/Dari text is RTL-ready
- Push notifications use existing `setupPush()` infrastructure
