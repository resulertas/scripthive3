import { ScreenplayElement, ScreenplayFormat, CoverPageData, Collaborator, ElementType } from '../types';

export type CollabMessage =
  | { type: 'ROOM_JOIN_REQUEST'; roomId: string; user: Collaborator; _msgId?: string }
  | { type: 'ROOM_JOIN_ACCEPTED'; roomId: string; targetUserId: string; elements: ScreenplayElement[]; format: ScreenplayFormat; coverPage?: CoverPageData | null; collaborators: Collaborator[]; _msgId?: string }
  | { type: 'ROOM_JOIN_REJECTED'; roomId: string; targetUserId: string; _msgId?: string }
  | { type: 'ROOM_LEAVE'; roomId: string; userId: string; _msgId?: string }
  | { type: 'SYNC_ELEMENT_CHANGE'; roomId: string; senderId: string; senderName: string; senderColor: string; elementId: string; content: string; elementType?: ElementType; revisionColor?: string; dualPosition?: 'left' | 'right'; _msgId?: string }
  | { type: 'SYNC_ELEMENT_ADD'; roomId: string; senderId: string; afterId: string; newElement: ScreenplayElement; _msgId?: string }
  | { type: 'SYNC_ELEMENT_REMOVE'; roomId: string; senderId: string; elementId: string; focusId?: string; _msgId?: string }
  | { type: 'SYNC_ELEMENT_REMOVE_MULTIPLE'; roomId: string; senderId: string; elementIds: string[]; focusId?: string; _msgId?: string }
  | { type: 'SYNC_ELEMENT_TYPE'; roomId: string; senderId: string; elementId: string; newType: ElementType; _msgId?: string }
  | { type: 'SYNC_FULL_STATE'; roomId: string; senderId: string; elements: ScreenplayElement[]; format?: ScreenplayFormat; _msgId?: string }
  | { type: 'CURSOR_PRESENCE'; roomId: string; senderId: string; senderName: string; senderColor: string; elementId: string | null; status: 'typing' | 'idle'; _msgId?: string };

const CHANNEL_NAME = 'scripthive_collab_bus';

let broadcastChannel: BroadcastChannel | null = null;
const listeners: ((msg: CollabMessage) => void)[] = [];
const processedMsgIds = new Set<string>();

let activeEventSource: EventSource | null = null;
let currentActiveRoomId = '';
let currentActiveUserId = '';

function dispatchMessage(msg: CollabMessage) {
  if (!msg || !msg.type) return;
  if (msg._msgId) {
    if (processedMsgIds.has(msg._msgId)) return;
    processedMsgIds.add(msg._msgId);
    if (processedMsgIds.size > 500) {
      const first = processedMsgIds.values().next().value;
      if (first) processedMsgIds.delete(first);
    }
  }
  listeners.forEach(fn => {
    try {
      fn(msg);
    } catch (e) {
      console.error('Collab listener error:', e);
    }
  });
}

// 1. BroadcastChannel Listener (Instant same-browser tab communication)
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data && typeof event.data === 'object' && event.data.type) {
        dispatchMessage(event.data);
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }
}

// 2. Storage Event Listener (Fallback across same-origin tabs)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'scripthive_collab_msg_event' && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        if (data && data.type) {
          dispatchMessage(data);
        }
      } catch (err) {}
    }
  });
}

// 3. SSE Connect for Cross-Browser / Network / Private Window Real-time Sync
export function connectCollabStream(roomId: string, userId: string) {
  if (!roomId) return;
  const cleanRoom = roomId.toUpperCase();
  if (activeEventSource && currentActiveRoomId === cleanRoom && currentActiveUserId === userId) {
    return;
  }

  if (activeEventSource) {
    try { activeEventSource.close(); } catch (e) {}
    activeEventSource = null;
  }

  currentActiveRoomId = cleanRoom;
  currentActiveUserId = userId;

  if (typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      const url = `/api/collab/events?roomId=${encodeURIComponent(cleanRoom)}&userId=${encodeURIComponent(userId || 'user')}`;
      const es = new EventSource(url);
      es.onmessage = (event) => {
        try {
          if (!event.data) return;
          const msg = JSON.parse(event.data);
          if (msg && msg.type && msg.type !== 'CONNECTED') {
            dispatchMessage(msg);
          }
        } catch (e) {}
      };
      es.onerror = () => {
        // SSE browser automatically attempts reconnection
      };
      activeEventSource = es;
    } catch (err) {
      console.warn('SSE connection error:', err);
    }
  }
}

export function disconnectCollabStream() {
  if (activeEventSource) {
    try { activeEventSource.close(); } catch (e) {}
    activeEventSource = null;
  }
  currentActiveRoomId = '';
  currentActiveUserId = '';
}

export function sendCollabMessage(msg: CollabMessage) {
  const msgWithId: CollabMessage = {
    ...msg,
    _msgId: (msg as any)._msgId || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  };

  // Mark locally processed to avoid echo
  if (msgWithId._msgId) {
    processedMsgIds.add(msgWithId._msgId);
  }

  // A. BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(msgWithId);
    } catch (e) {}
  }

  // B. Storage Event Fallback
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('scripthive_collab_msg_event', JSON.stringify(msgWithId));
    } catch (e) {}
  }

  // C. Server Relay via HTTP POST (Broadcasts to other browsers, private tabs, network tablets)
  if (typeof window !== 'undefined') {
    fetch('/api/collab/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: msgWithId.roomId, msg: msgWithId })
    }).catch(() => {});
  }
}

export function subscribeCollabMessages(callback: (msg: CollabMessage) => void): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}
