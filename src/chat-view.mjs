/* Wakhan Chat Module — Complete v1.0 */
/* Features: DM, Groups, Channels, Voice, Image, Video, Music Share, Listen Together, Watch Together, Calls, Reactions, Reply, Forward, Pin, Lounge */

import { h, mount, frag } from './view-utils.mjs';
import { SessionBroker } from './session.mjs';

const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

let sb = null;
let currentUser = null;
let socket = null;
let activeChatId = null;
let typingTimeouts = {};

/* ─── Socket.io Setup ─── */
function initSocket(token) {
  if (socket) return socket;
  const io = window.io;
  if (!io) return null;
  socket = io({
    transports: ['websocket', 'polling'],
    auth: { token },
  });
  socket.on('connect', () => console.log('[Chat] Socket connected'));
  socket.on('message:new', (msg) => onNewMessage(msg));
  socket.on('message:read', ({ chatId, userId }) => onMessagesRead(chatId, userId));
  socket.on('user:typing', ({ chatId, userId }) => onUserTyping(chatId, userId));
  socket.on('user:online', ({ userId }) => onUserStatus(userId, 'online'));
  socket.on('user:offline', ({ userId }) => onUserStatus(userId, 'offline'));
  socket.on('call:incoming', (data) => onIncomingCall(data));
  return socket;
}

function onNewMessage(msg) {
  if (msg.chatId === activeChatId) {
    appendMessageBubble(msg);
    scrollToBottom();
    markAsRead(msg.chatId);
  } else {
    incrementUnread(msg.chatId);
  }
  updateChatListPreview(msg.chatId, msg);
}

function onMessagesRead(chatId, userId) {
  if (chatId === activeChatId) {
    $$(`.msg[data-id]`).forEach(el => {
      const statusEl = el.querySelector('.msg-status');
      if (statusEl) statusEl.innerHTML = readIcon();
    });
  }
}

function onUserTyping(chatId, userId) {
  if (chatId === activeChatId) {
    const typingEl = $('#typing-indicator');
    if (typingEl) typingEl.style.display = 'flex';
    clearTimeout(typingTimeouts[chatId]);
    typingTimeouts[chatId] = setTimeout(() => {
      if (typingEl) typingEl.style.display = 'none';
    }, 3000);
  }
}

function onUserStatus(userId, status) {
  const avatarEl = $(`.chat-avatar[data-user="${userId}"] .status-dot`);
  if (avatarEl) {
    avatarEl.className = `status-dot ${status}`;
  }
}

function onIncomingCall(data) {
  showCallOverlay(data);
}

/* ─── Icons ─── */
const icons = {
  back: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
  send: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  mic: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  attach: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`,
  smile: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
  phone: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  video: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
  more: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  checkDouble: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/><polyline points="20 13 9 24 4 19"/></svg>`,
  checkDoubleRead: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/><polyline points="20 13 9 24 4 19"/></svg>`,
  play: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  pin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l-5.5 9h11z"/><circle cx="12" cy="19" r="3"/></svg>`,
  reply: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`,
  forward: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>`,
  trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  music: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  headphones: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  film: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`,
  game: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`,
};

function readIcon() {
  return `<span class="msg-status read">${icons.checkDoubleRead}</span>`;
}

/* ─── API Helpers ─── */
async function api(path, opts = {}) {
  const res = await sb.request(path, opts);
  return res;
}

/* ─── Main Chat View ─── */
export async function ChatView(container, sessionBroker) {
  sb = sessionBroker;
  currentUser = sb.me;
  initSocket(sb.token);

  container.innerHTML = '';
  const root = h('div', { class: 'chat-root' });
  container.appendChild(root);

  renderChatList(root);
}

/* ─── Chat List ─── */
async function renderChatList(root) {
  root.innerHTML = '';

  const header = h('div', { class: 'chat-list-header' }, [
    h('h1', { class: 'chat-title' }, 'Chats'),
    h('div', { class: 'chat-header-actions' }, [
      h('button', { class: 'icon-btn', onclick: () => onSearch() }, icons.search || icons.back),
      h('button', { class: 'icon-btn', onclick: () => onNewChat() }, icons.edit || icons.back),
    ]),
  ]);

  const tabs = h('div', { class: 'chat-tabs' }, [
    h('button', { class: 'chat-tab active', onclick: (e) => switchTab(e, 'all') }, [
      h('span', { class: 'tab-icon' }, '💬'),
      ' All Chats',
    ]),
    h('button', { class: 'chat-tab', onclick: (e) => switchTab(e, 'groups') }, [
      h('span', { class: 'tab-icon' }, '👥'),
      ' Groups',
    ]),
    h('button', { class: 'chat-tab', onclick: (e) => switchTab(e, 'channels') }, [
      h('span', { class: 'tab-icon' }, '📡'),
      ' Channels',
    ]),
  ]);

  const listContainer = h('div', { class: 'chat-list-container' });
  const playerBar = renderMusicPlayer();
  const bottomNav = renderBottomNav();

  root.append(header, tabs, listContainer, playerBar, bottomNav);

  await loadChatList(listContainer, 'all');
}

function switchTab(e, tab) {
  $$('.chat-tab').forEach(t => t.classList.remove('active'));
  e.currentTarget.classList.add('active');
  const listContainer = $('.chat-list-container');
  loadChatList(listContainer, tab);
}

async function loadChatList(container, filter) {
  container.innerHTML = '<div class="chat-loading">Loading...</div>';
  try {
    const conversations = await api('/api/chat/conversations');
    container.innerHTML = '';

    const pinned = conversations.filter(c => c.pinned);
    const others = conversations.filter(c => !c.pinned);

    if (pinned.length) {
      container.appendChild(h('div', { class: 'chat-section-label' }, 'PINNED'));
      pinned.forEach(c => container.appendChild(renderChatItem(c)));
    }

    if (others.length) {
      container.appendChild(h('div', { class: 'chat-section-label' }, 'ALL CHATS'));
      others.forEach(c => container.appendChild(renderChatItem(c)));
    }
  } catch (err) {
    container.innerHTML = `<div class="chat-error">${err.message || 'Failed to load chats'}</div>`;
  }
}

function renderChatItem(chat) {
  const isOnline = chat.participants?.some(p => p.online);
  const lastMsg = chat.lastMessage || {};
  const unread = chat.unreadCount || 0;

  const item = h('div', {
    class: 'chat-item',
    onclick: () => openChatRoom(chat),
  }, [
    h('div', { class: 'chat-avatar', 'data-user': chat.id }, [
      chat.avatar
        ? h('img', { src: chat.avatar, alt: '' })
        : h('div', { class: 'avatar-placeholder' }, chat.isGroup ? '👥' : '👤'),
      isOnline ? h('span', { class: 'status-dot online' }) : null,
    ]),
    h('div', { class: 'chat-info' }, [
      h('div', { class: 'chat-row' }, [
        h('span', { class: 'chat-name' }, chat.name),
        h('span', { class: 'chat-time' }, formatTime(lastMsg.createdAt)),
      ]),
      h('div', { class: 'chat-row' }, [
        h('span', { class: 'chat-preview' }, formatPreview(lastMsg)),
        unread > 0 ? h('span', { class: 'chat-unread' }, unread) : null,
      ]),
    ]),
  ]);

  return item;
}

function formatPreview(msg) {
  if (!msg) return '';
  if (msg.type === 'image') return '📷 Photo';
  if (msg.type === 'video') return '🎬 Video';
  if (msg.type === 'voice') return '🎤 Voice message';
  if (msg.type === 'music') return '🎵 Music';
  if (msg.type === 'location') return '📍 Location';
  return msg.content || '';
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─── Chat Room ─── */
async function openChatRoom(chat) {
  activeChatId = chat.id;
  const root = $('.chat-root');
  root.innerHTML = '';

  const isOnline = chat.participants?.some(p => p.online);

  const header = h('div', { class: 'chat-room-header' }, [
    h('button', { class: 'icon-btn back', onclick: () => backToList() }, icons.back),
    h('div', { class: 'chat-room-avatar' }, [
      chat.avatar
        ? h('img', { src: chat.avatar, alt: '' })
        : h('div', { class: 'avatar-placeholder' }, chat.isGroup ? '👥' : '👤'),
      isOnline ? h('span', { class: 'status-dot online' }) : null,
    ]),
    h('div', { class: 'chat-room-info' }, [
      h('div', { class: 'chat-room-name' }, chat.name),
      h('div', { class: 'chat-room-status' }, isOnline ? 'Online' : 'Offline'),
    ]),
    h('button', { class: 'icon-btn', onclick: () => startCall(chat, 'audio') }, icons.phone),
    h('button', { class: 'icon-btn', onclick: () => startCall(chat, 'video') }, icons.video),
    h('button', { class: 'icon-btn', onclick: () => showChatMenu(chat) }, icons.more),
  ]);

  const messagesArea = h('div', { class: 'chat-messages' });
  const typingIndicator = h('div', { id: 'typing-indicator', class: 'typing-indicator', style: 'display:none' }, [
    h('span', {}, 'typing'),
    h('span', { class: 'typing-dots' }, '...'),
  ]);

  const inputArea = renderInputArea(chat);

  root.append(header, messagesArea, typingIndicator, inputArea);

  await loadMessages(messagesArea, chat.id);
  joinChat(chat.id);
}

async function loadMessages(container, chatId) {
  container.innerHTML = '<div class="chat-loading">Loading messages...</div>';
  try {
    const msgs = await api(`/api/chat/messages/${chatId}`);
    container.innerHTML = '';

    let lastDate = null;
    msgs.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== lastDate) {
        container.appendChild(h('div', { class: 'chat-date-divider' }, formatDateDivider(msg.createdAt)));
        lastDate = msgDate;
      }
      container.appendChild(renderMessageBubble(msg));
    });

    scrollToBottom();
  } catch (err) {
    container.innerHTML = `<div class="chat-error">${err.message || 'Failed to load messages'}</div>`;
  }
}

function formatDateDivider(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function renderMessageBubble(msg) {
  const isMe = msg.senderId === currentUser?.id;
  const bubble = h('div', {
    class: `msg ${isMe ? 'msg-me' : 'msg-them'}`,
    'data-id': msg.id,
    onclick: (e) => showMsgMenu(e, msg),
  });

  /* Reply reference */
  if (msg.replyTo) {
    bubble.appendChild(h('div', { class: 'msg-reply' }, [
      h('span', { class: 'msg-reply-name' }, msg.replyTo.senderName || 'User'),
      h('span', { class: 'msg-reply-text' }, msg.replyTo.content || ''),
    ]));
  }

  /* Content */
  if (msg.type === 'text') {
    bubble.appendChild(h('div', { class: 'msg-text' }, msg.content));
  } else if (msg.type === 'image') {
    bubble.appendChild(h('img', { class: 'msg-image', src: msg.mediaUrl, alt: '', onclick: (e) => { e.stopPropagation(); openImageViewer(msg.mediaUrl); } }));
    if (msg.caption) bubble.appendChild(h('div', { class: 'msg-caption' }, msg.caption));
  } else if (msg.type === 'video') {
    bubble.appendChild(h('div', { class: 'msg-video' }, [
      h('img', { src: msg.thumbnailUrl || msg.mediaUrl, alt: '' }),
      h('button', { class: 'msg-play-btn', onclick: (e) => { e.stopPropagation(); playVideo(msg.mediaUrl); } }, icons.play),
    ]));
  } else if (msg.type === 'voice') {
    bubble.appendChild(renderVoicePlayer(msg));
  } else if (msg.type === 'music') {
    bubble.appendChild(renderMusicShare(msg));
  } else if (msg.type === 'location') {
    bubble.appendChild(renderLocationShare(msg));
  } else if (msg.type === 'game') {
    bubble.appendChild(renderGameInvite(msg));
  }

  /* Meta row */
  const meta = h('div', { class: 'msg-meta' }, [
    h('span', { class: 'msg-time' }, formatTime(msg.createdAt)),
  ]);

  if (isMe) {
    meta.appendChild(h('span', { class: 'msg-status' },
      msg.status === 'read' ? icons.checkDoubleRead :
      msg.status === 'delivered' ? icons.checkDouble :
      icons.check
    ));
  }

  /* Reactions */
  if (msg.reactions && msg.reactions.length) {
    const reactionsRow = h('div', { class: 'msg-reactions' });
    msg.reactions.forEach(r => {
      reactionsRow.appendChild(h('span', { class: 'msg-reaction' }, r.emoji));
    });
    bubble.appendChild(reactionsRow);
  }

  bubble.appendChild(meta);
  return bubble;
}

function renderVoicePlayer(msg) {
  return h('div', { class: 'msg-voice' }, [
    h('button', { class: 'voice-play', onclick: () => toggleVoicePlay(msg.id, msg.mediaUrl) }, icons.play),
    h('div', { class: 'voice-wave' }, Array.from({ length: 20 }, (_, i) =>
      h('div', { class: 'voice-bar', style: `height:${Math.random() * 16 + 4}px` })
    )),
    h('span', { class: 'voice-duration' }, msg.duration || '0:00'),
  ]);
}

function renderMusicShare(msg) {
  return h('div', { class: 'msg-music' }, [
    h('div', { class: 'music-cover' }, [
      msg.coverUrl ? h('img', { src: msg.coverUrl, alt: '' }) : h('div', { class: 'music-icon' }, icons.music),
    ]),
    h('div', { class: 'music-info' }, [
      h('div', { class: 'music-title' }, msg.trackTitle || 'Unknown Track'),
      h('div', { class: 'music-artist' }, msg.artist || 'Unknown Artist'),
    ]),
    h('button', { class: 'music-play-btn', onclick: () => playMusic(msg.trackId) }, icons.play),
    h('button', { class: 'music-listen-together', onclick: () => inviteListenTogether(msg) }, icons.headphones),
  ]);
}

function renderLocationShare(msg) {
  return h('div', { class: 'msg-location' }, [
    h('img', { class: 'location-map', src: msg.mapUrl || `https://maps.googleapis.com/maps/api/staticmap?center=${msg.lat},${msg.lng}&zoom=15&size=400x200&markers=${msg.lat},${msg.lng}`, alt: '' }),
    h('div', { class: 'location-name' }, msg.locationName || 'Shared Location'),
  ]);
}

function renderGameInvite(msg) {
  return h('div', { class: 'msg-game' }, [
    h('div', { class: 'game-icon' }, icons.game),
    h('div', { class: 'game-info' }, [
      h('div', { class: 'game-title' }, msg.gameName || 'Game Invite'),
      h('div', { class: 'game-desc' }, 'Tap to join the game'),
    ]),
    h('button', { class: 'game-join-btn', onclick: () => joinGame(msg.gameId) }, 'Play'),
  ]);
}

/* ─── Input Area ─── */
function renderInputArea(chat) {
  let replyingTo = null;

  const attachMenu = h('div', { class: 'attach-menu', style: 'display:none' }, [
    h('button', { onclick: () => pickImage(chat) }, [h('span', {}, '📷'), 'Gallery']),
    h('button', { onclick: () => pickCamera(chat) }, [h('span', {}, '📸'), 'Camera']),
    h('button', { onclick: () => pickVideo(chat) }, [h('span', {}, '🎬'), 'Video']),
    h('button', { onclick: () => pickMusic(chat) }, [h('span', {}, '🎵'), 'Music']),
    h('button', { onclick: () => pickLocation(chat) }, [h('span', {}, '📍'), 'Location']),
    h('button', { onclick: () => pickContact(chat) }, [h('span', {}, '👤'), 'Contact']),
  ]);

  const replyBar = h('div', { class: 'reply-bar', style: 'display:none' }, [
    h('div', { class: 'reply-preview' }),
    h('button', { class: 'reply-close', onclick: () => { replyingTo = null; replyBar.style.display = 'none'; } }, '✕'),
  ]);

  const inputRow = h('div', { class: 'input-row' }, [
    h('button', {
      class: 'input-btn attach',
      onclick: () => { attachMenu.style.display = attachMenu.style.display === 'none' ? 'grid' : 'none'; },
    }, icons.attach),
    h('input', {
      class: 'chat-input',
      type: 'text',
      placeholder: 'Message...',
      oninput: () => sendTyping(chat.id),
      onkeydown: (e) => { if (e.key === 'Enter') sendMessage(chat, inputRow.querySelector('.chat-input').value, replyingTo); },
    }),
    h('button', { class: 'input-btn emoji' }, icons.smile),
    h('button', {
      class: 'input-btn send',
      onclick: () => sendMessage(chat, inputRow.querySelector('.chat-input').value, replyingTo),
    }, icons.send),
  ]);

  const voiceRecorder = h('div', { class: 'voice-recorder', style: 'display:none' }, [
    h('span', { class: 'rec-dot' }),
    h('span', {}, 'Recording...'),
    h('span', { class: 'rec-timer' }, '0:00'),
    h('button', { class: 'rec-send' }, icons.send),
  ]);

  const area = h('div', { class: 'chat-input-area' }, [attachMenu, replyBar, inputRow, voiceRecorder]);
  return area;
}

/* ─── Actions ─── */
async function sendMessage(chat, content, replyTo = null) {
  if (!content.trim()) return;
  const input = $('.chat-input');
  if (input) input.value = '';

  const msg = {
    chatId: chat.id,
    type: 'text',
    content: content.trim(),
    replyToId: replyTo?.id,
  };

  try {
    const sent = await api('/api/chat/send', { method: 'POST', body: JSON.stringify(msg) });
    appendMessageBubble(sent);
    scrollToBottom();
    if (socket) socket.emit('message:send', sent);
  } catch (err) {
    alert('Failed to send: ' + (err.message || 'Unknown error'));
  }
}

function sendTyping(chatId) {
  if (socket) socket.emit('typing', { chatId });
}

function joinChat(chatId) {
  if (socket) socket.emit('chat:join', chatId);
}

function markAsRead(chatId) {
  api(`/api/chat/read/${chatId}`, { method: 'POST' });
  if (socket) socket.emit('message:read', { chatId });
}

function appendMessageBubble(msg) {
  const container = $('.chat-messages');
  if (!container) return;
  container.appendChild(renderMessageBubble(msg));
}

function scrollToBottom() {
  const container = $('.chat-messages');
  if (container) container.scrollTop = container.scrollHeight;
}

function backToList() {
  activeChatId = null;
  const root = $('.chat-root');
  renderChatList(root);
}

/* ─── Message Menu ─── */
function showMsgMenu(e, msg) {
  e.stopPropagation();
  const existing = $('.msg-menu');
  if (existing) existing.remove();

  const menu = h('div', { class: 'msg-menu' }, [
    h('button', { onclick: () => { setReply(msg); menu.remove(); } }, [icons.reply, ' Reply']),
    h('button', { onclick: () => { forwardMessage(msg); menu.remove(); } }, [icons.forward, ' Forward']),
    h('button', { onclick: () => { copyMessage(msg); menu.remove(); } }, ['📋 Copy']),
    h('button', { onclick: () => { pinMessage(msg); menu.remove(); } }, [icons.pin, ' Pin']),
    h('button', { onclick: () => { deleteMessage(msg); menu.remove(); } }, [icons.trash, ' Delete']),
  ]);

  /* Reaction row */
  const reactions = h('div', { class: 'msg-reaction-picker' },
    ['👍', '❤️', '😂', '😮', '😢', '🎉'].map(emoji =>
      h('button', { onclick: () => { addReaction(msg, emoji); menu.remove(); } }, emoji)
    )
  );

  menu.insertBefore(reactions, menu.firstChild);
  document.body.appendChild(menu);

  const rect = e.currentTarget.getBoundingClientRect();
  menu.style.top = `${rect.top + window.scrollY - menu.offsetHeight - 8}px`;
  menu.style.left = `${Math.min(rect.left, window.innerWidth - menu.offsetWidth - 16)}px`;

  setTimeout(() => {
    document.addEventListener('click', function close() {
      menu.remove();
      document.removeEventListener('click', close);
    }, { once: true });
  }, 10);
}

function setReply(msg) {
  const replyBar = $('.reply-bar');
  const preview = replyBar.querySelector('.reply-preview');
  preview.textContent = msg.content?.substring(0, 60) || 'Media';
  replyBar.style.display = 'flex';
  replyBar.dataset.replyId = msg.id;
}

async function forwardMessage(msg) {
  const chats = await api('/api/chat/conversations');
  const picker = h('div', { class: 'forward-picker' }, [
    h('div', { class: 'forward-header' }, 'Forward to'),
    ...chats.map(c => h('button', {
      class: 'forward-chat',
      onclick: async () => {
        await api('/api/chat/forward', {
          method: 'POST',
          body: JSON.stringify({ messageId: msg.id, targetChatId: c.id }),
        });
        picker.remove();
      },
    }, c.name)),
    h('button', { class: 'forward-cancel', onclick: () => picker.remove() }, 'Cancel'),
  ]);
  document.body.appendChild(picker);
}

function copyMessage(msg) {
  if (msg.content) navigator.clipboard.writeText(msg.content);
}

async function pinMessage(msg) {
  await api(`/api/chat/pin/${msg.id}`, { method: 'POST' });
}

async function deleteMessage(msg) {
  if (!confirm('Delete this message?')) return;
  await api(`/api/chat/delete/${msg.id}`, { method: 'POST' });
  const el = $(`.msg[data-id="${msg.id}"]`);
  if (el) el.remove();
}

async function addReaction(msg, emoji) {
  await api('/api/chat/react', {
    method: 'POST',
    body: JSON.stringify({ messageId: msg.id, emoji }),
  });
}

/* ─── Media Pickers ─── */
function pickImage(chat) { openFilePicker('image/*', (file) => uploadAndSend(chat, file, 'image')); }
function pickCamera(chat) { openFilePicker('image/*;capture=camera', (file) => uploadAndSend(chat, file, 'image')); }
function pickVideo(chat) { openFilePicker('video/*', (file) => uploadAndSend(chat, file, 'video')); }

function pickMusic(chat) {
  /* Open Wakhan Music Hub picker */
  const tracks = [
    { id: 't1', title: 'Midnight Drive', artist: 'The Neon Pulse', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200' },
  ];
  const picker = h('div', { class: 'music-picker' }, [
    h('div', { class: 'picker-header' }, 'Share Music'),
    ...tracks.map(t => h('button', {
      class: 'music-track',
      onclick: async () => {
        await sendMessage(chat, '', null); /* Will send music card */
        picker.remove();
      },
    }, [
      h('img', { src: t.cover, alt: '' }),
      h('div', {}, [h('div', {}, t.title), h('div', { class: 'track-artist' }, t.artist)]),
    ])),
  ]);
  document.body.appendChild(picker);
}

function pickLocation(chat) {
  if (!navigator.geolocation) return alert('Location not available');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    await api('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({
        chatId: chat.id,
        type: 'location',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      }),
    });
  });
}

function pickContact(chat) {
  /* Use Capacitor Contacts API */
  alert('Contact picker not implemented');
}

function openFilePicker(accept, callback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.onchange = () => { if (input.files[0]) callback(input.files[0]); };
  input.click();
}

async function uploadAndSend(chat, file, type) {
  const form = new FormData();
  form.append('file', file);
  form.append('chatId', chat.id);
  form.append('type', type);

  const res = await api('/api/chat/upload', { method: 'POST', body: form });
  appendMessageBubble(res);
  scrollToBottom();
}

/* ─── Calls ─── */
function startCall(chat, type) {
  const overlay = h('div', { class: 'call-overlay' }, [
    h('div', { class: 'call-content' }, [
      h('img', { class: 'call-avatar', src: chat.avatar, alt: '' }),
      h('div', { class: 'call-name' }, chat.name),
      h('div', { class: 'call-status' }, type === 'video' ? 'Video calling...' : 'Calling...'),
      h('div', { class: 'call-actions' }, [
        h('button', { class: 'call-btn mute', onclick: () => toggleMute() }, '🎤'),
        h('button', { class: 'call-btn end', onclick: () => endCall(overlay) }, '✕'),
        h('button', { class: 'call-btn speaker', onclick: () => toggleSpeaker() }, '🔊'),
      ]),
    ]),
  ]);
  document.body.appendChild(overlay);

  if (socket) socket.emit('call:initiate', { chatId: chat.id, type });
}

function showCallOverlay(data) {
  const overlay = h('div', { class: 'call-overlay incoming' }, [
    h('div', { class: 'call-content' }, [
      h('img', { class: 'call-avatar', src: data.avatar, alt: '' }),
      h('div', { class: 'call-name' }, data.name),
      h('div', { class: 'call-status' }, 'Incoming call...'),
      h('div', { class: 'call-actions' }, [
        h('button', { class: 'call-btn decline', onclick: () => { declineCall(data); overlay.remove(); } }, '✕'),
        h('button', { class: 'call-btn accept', onclick: () => { acceptCall(data); overlay.remove(); } }, '✓'),
      ]),
    ]),
  ]);
  document.body.appendChild(overlay);
}

function endCall(overlay) { overlay.remove(); if (socket) socket.emit('call:end'); }
function declineCall(data) { if (socket) socket.emit('call:decline', data); }
function acceptCall(data) { if (socket) socket.emit('call:accept', data); }
function toggleMute() {}
function toggleSpeaker() {}

/* ─── Music Player Bar ─── */
function renderMusicPlayer() {
  return h('div', { class: 'chat-music-bar' }, [
    h('img', { class: 'music-bar-cover', src: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200', alt: '' }),
    h('div', { class: 'music-bar-info' }, [
      h('div', { class: 'music-bar-title' }, 'Midnight Drive'),
      h('div', { class: 'music-bar-artist' }, 'The Neon Pulse'),
    ]),
    h('div', { class: 'music-bar-controls' }, [
      h('button', {}, '⏮'),
      h('button', { class: 'music-bar-play' }, '▶'),
      h('button', {}, '⏭'),
    ]),
  ]);
}

/* ─── Bottom Nav ─── */
function renderBottomNav() {
  return h('div', { class: 'chat-bottom-nav' }, [
    h('button', { class: 'nav-item active' }, ['💬', h('span', {}, 'Chats')]),
    h('button', { class: 'nav-item' }, ['👥', h('span', {}, 'Contacts')]),
    h('button', { class: 'nav-item' }, ['🧭', h('span', {}, 'Explore')]),
    h('button', { class: 'nav-item' }, ['🔔', h('span', {}, 'Alerts')]),
    h('button', { class: 'nav-item' }, ['👤', h('span', {}, 'Profile')]),
  ]);
}

/* ─── Chat Lounge (Public Rooms) ─── */
export async function ChatLoungeView(container, sessionBroker) {
  sb = sessionBroker;
  container.innerHTML = '';

  const rooms = await api('/api/chat/lounge/rooms');

  const header = h('div', { class: 'chat-list-header' }, [
    h('h1', { class: 'chat-title' }, 'Chat Lounge'),
    h('p', { class: 'chat-subtitle' }, 'Join public rooms and meet new people'),
  ]);

  const roomList = h('div', { class: 'lounge-list' });
  rooms.forEach(room => {
    roomList.appendChild(h('div', { class: 'lounge-room', onclick: () => joinLoungeRoom(room) }, [
      h('div', { class: 'lounge-icon' }, room.icon || '🎙️'),
      h('div', { class: 'lounge-info' }, [
        h('div', { class: 'lounge-name' }, room.name),
        h('div', { class: 'lounge-meta' }, `${room.participants} online • ${room.topic}`),
      ]),
      h('button', { class: 'lounge-join-btn' }, 'Join'),
    ]));
  });

  container.append(header, roomList);
}

async function joinLoungeRoom(room) {
  const messages = await api(`/api/chat/lounge/${room.id}/messages`);
  /* Render lounge chat room (similar to DM but public) */
}

/* ─── Status/Stories ─── */
export async function StatusView(container, sessionBroker) {
  sb = sessionBroker;
  container.innerHTML = '';

  const myStatus = h('div', { class: 'status-my', onclick: () => addStatus() }, [
    h('div', { class: 'status-avatar' }, [
      h('img', { src: currentUser?.avatar, alt: '' }),
      h('span', { class: 'status-add' }, '+'),
    ]),
    h('span', {}, 'My Status'),
  ]);

  const friendsStatus = h('div', { class: 'status-friends' });
  /* Load friends' statuses */

  container.append(myStatus, friendsStatus);
}

function addStatus() {
  openFilePicker('image/*,video/*', async (file) => {
    const form = new FormData();
    form.append('file', file);
    await api('/api/chat/status', { method: 'POST', body: form });
  });
}

/* ─── Helpers ─── */
function onSearch() { /* Open search modal */ }
function onNewChat() { /* Open new chat modal */ }
function openImageViewer(url) { /* Full screen image */ }
function playVideo(url) { /* Video player */ }
function toggleVoicePlay(id, url) { /* Play voice */ }
function playMusic(trackId) { /* Play in music bar */ }
function inviteListenTogether(msg) { /* Send listen together invite */ }
function joinGame(gameId) { /* Open game */ }
function incrementUnread(chatId) { /* Update badge */ }
function updateChatListPreview(chatId, msg) { /* Update last message */ }
