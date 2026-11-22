/* Wakhan Chat Integration — bridges chat module into Wakhan shell */
/* Import this in your shell entry point to add chat navigation */

import { ChatView, ChatLoungeView, StatusView } from './chat-view.mjs';
import './chat-styles.css';

let chatContainer = null;
let currentSessionBroker = null;

export function installChat({ broker, container }) {
  currentSessionBroker = broker;
  chatContainer = container;

  /* Expose chat navigation to global scope for shell JSON to call */
  window.WakhanChat = {
    openDM: (userId) => openDMChat(userId),
    openGroup: (chatId) => openGroupChat(chatId),
    openLounge: () => openLounge(),
    openStatus: () => openStatus(),
    openChatList: () => openChatList(),
  };
}

async function openChatList() {
  if (!chatContainer || !currentSessionBroker) return;
  await ChatView(chatContainer, currentSessionBroker);
}

async function openDMChat(userId) {
  if (!chatContainer || !currentSessionBroker) return;
  /* Fetch or create DM chat with user, then open room */
  const res = await currentSessionBroker.request(`/api/chat/conversations`, {
    method: 'POST',
    body: JSON.stringify({
      isGroup: false,
      participantIds: [userId],
    }),
  });
  if (res && res.id) {
    await ChatView(chatContainer, currentSessionBroker);
    /* Trigger open of specific chat room */
    const event = new CustomEvent('wakhan-chat-open', { detail: { chatId: res.id } });
    window.dispatchEvent(event);
  }
}

async function openGroupChat(chatId) {
  if (!chatContainer || !currentSessionBroker) return;
  await ChatView(chatContainer, currentSessionBroker);
  const event = new CustomEvent('wakhan-chat-open', { detail: { chatId } });
  window.dispatchEvent(event);
}

async function openLounge() {
  if (!chatContainer || !currentSessionBroker) return;
  await ChatLoungeView(chatContainer, currentSessionBroker);
}

async function openStatus() {
  if (!chatContainer || !currentSessionBroker) return;
  await StatusView(chatContainer, currentSessionBroker);
}
