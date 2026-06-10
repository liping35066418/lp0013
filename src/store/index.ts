import { create } from 'zustand';

const USER_KEY = 'market_user';
const DEFAULT_USER = '访客用户';

function randomNick(): string {
  const adj = ['快乐的', '认真的', '可爱的', '机智的', '热情的', '靠谱的', '神秘的', '阳光的'];
  const noun = ['小明', '小红', '买家', '卖家', '闲鱼', '转转', '淘淘', '好物'];
  const a = adj[Math.floor(Math.random() * adj.length)];
  const n = noun[Math.floor(Math.random() * noun.length)];
  const num = Math.floor(Math.random() * 10000);
  return `${a}${n}${num}`;
}

interface UserState {
  userId: string;
  nickname: string;
  init: () => void;
  setNickname: (name: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: '',
  nickname: DEFAULT_USER,
  init: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ userId: parsed.userId, nickname: parsed.nickname || DEFAULT_USER });
        return;
      }
    } catch {}
    const userId = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const nickname = randomNick();
    localStorage.setItem(USER_KEY, JSON.stringify({ userId, nickname }));
    set({ userId, nickname });
  },
  setNickname: (name: string) => {
    set((s) => {
      const newState = { nickname: name || DEFAULT_USER };
      try {
        const raw = localStorage.getItem(USER_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          localStorage.setItem(USER_KEY, JSON.stringify({ ...parsed, nickname: newState.nickname }));
        }
      } catch {}
      return newState;
    });
  },
}));

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
  push: (msg: string, type?: 'success' | 'error' | 'info') => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => {
  let timer: number | null = null;
  return {
    message: '',
    type: 'info',
    show: false,
    push: (msg, type = 'info') => {
      if (timer) window.clearTimeout(timer);
      set({ message: msg, type, show: true });
      timer = window.setTimeout(() => set({ show: false }), 2800);
    },
    hide: () => set({ show: false }),
  };
});
