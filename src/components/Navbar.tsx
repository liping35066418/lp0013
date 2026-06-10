import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Store, Plus, Heart, ShoppingBag, User, Settings } from 'lucide-react';
import { useUserStore } from '@/store';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const { userId, nickname, init, setNickname } = useUserStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    setDraft(nickname);
  }, [nickname]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
        : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
    }`;

  const saveNick = () => {
    if (draft.trim()) {
      setNickname(draft.trim());
    }
    setEditing(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-bold text-slate-800 leading-tight">易物集市</div>
            <div className="text-xs text-slate-500 leading-tight">二手交易 · 物尽其用</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <NavLink to="/" end className={linkCls}>
            <Store className="w-4 h-4" />
            <span className="whitespace-nowrap">商品广场</span>
          </NavLink>
          <NavLink to="/publish" className={linkCls}>
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">发布闲置</span>
          </NavLink>
          <NavLink to="/favorites" className={linkCls}>
            <Heart className="w-4 h-4" />
            <span className="whitespace-nowrap">我的收藏</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-sm">
            {editing ? (
              <>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveNick()}
                  className="w-28 px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  maxLength={16}
                  placeholder="输入昵称"
                />
                <button
                  onClick={saveNick}
                  className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  保存
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="点击修改昵称"
              >
                <User className="w-3.5 h-3.5" />
                <span className="max-w-24 truncate">{nickname}</span>
                <Settings className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => navigate('/publish')}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all active:scale-95"
          >
            <span className="hidden sm:inline">快速发布</span>
            <Plus className="w-4 h-4 sm:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
}
