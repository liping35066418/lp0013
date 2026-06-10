import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, PackageOpen, ArrowRight, ShoppingBag } from 'lucide-react';
import type { Favorite } from '../../shared/types';
import { favoritesApi } from '@/lib/api';
import { useToastStore, useUserStore } from '@/store';
import ProductCard from '@/components/ProductCard';

export default function Favorites() {
  const navigate = useNavigate();
  const { userId, nickname, init } = useUserStore();
  const { push } = useToastStore();

  const [list, setList] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => { init(); }, [init]);

  const fetchList = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const res = await favoritesApi.list(userId);
    setLoading(false);
    if (res.success) {
      setList(res.data || []);
    } else {
      push(res.message || '加载失败', 'error');
    }
  }, [userId, push]);

  useEffect(() => {
    if (userId) fetchList();
  }, [userId, fetchList]);

  const toggleFav = useCallback(async (productId: number) => {
    if (!userId) return;
    const res = await favoritesApi.toggle({ productId, userId });
    if (res.success) {
      const d = res.data as { favorited: boolean };
      if (!d.favorited) {
        setList((prev) => prev.filter((f) => f.productId !== productId));
        push('已取消收藏', 'success');
      }
    }
  }, [userId, push]);

  const clearAll = async () => {
    if (!confirm('确定清空全部收藏吗？')) return;
    setClearing(true);
    const ids = list.map((f) => f.productId).filter(Boolean);
    const tasks = ids.map((id) => favoritesApi.remove(userId, id));
    await Promise.all(tasks);
    setClearing(false);
    setList([]);
    push('收藏已清空', 'success');
  };

  const validList = list.filter((f) => f.product && f.product.status === 'on');
  const invalidList = list.filter((f) => !f.product || f.product.status !== 'on');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-pink-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-3xl p-8 text-white shadow-xl shadow-rose-200 relative overflow-hidden mb-8">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-xs font-medium mb-3">
                <Heart className="w-3.5 h-3.5 fill-current" />
                我的收藏夹
              </div>
              <h1 className="text-3xl font-bold mb-1">收藏的好物</h1>
              <p className="text-white/80 text-sm">共 {list.length} 件，有效商品 {validList.length} 件</p>
            </div>
            <div className="flex items-center gap-3">
              {list.length > 0 && (
                <button onClick={clearAll} disabled={clearing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium backdrop-blur transition-colors disabled:opacity-60">
                  <Trash2 className="w-4 h-4" /> {clearing ? '清空中...' : '清空收藏'}
                </button>
              )}
              <button onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-rose-600 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95">
                <ShoppingBag className="w-4 h-4" /> 逛逛广场
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-4/5" />
                  <div className="h-5 bg-slate-200 rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : validList.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {validList.map((f) => (
                <ProductCard key={f.id} product={f.product!} favorited={true}
                  onToggleFavorite={() => toggleFav(f.productId)} />
              ))}
            </div>
          </>
        ) : list.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-28 h-28 mx-auto mb-5 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
              <PackageOpen className="w-14 h-14 text-rose-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">还没有收藏商品</h3>
            <p className="text-slate-500 mb-6">去商品广场看看，遇到喜欢的点个红心收藏吧～</p>
            <button onClick={() => navigate('/')}
              className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-200 hover:shadow-xl transition-all active:scale-95 inline-flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> 去逛逛
            </button>
          </div>
        ) : null}

        {invalidList.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-1 bg-slate-300 rounded-full" />
              <h3 className="font-semibold text-slate-700">已失效收藏 <span className="text-xs text-slate-400 font-normal">（{invalidList.length} 件已下架）</span></h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {invalidList.map((f) => f.product && (
                <div key={f.id} className="relative opacity-75">
                  <ProductCard product={f.product!} favorited={true} showStatus={true}
                    onToggleFavorite={() => toggleFav(f.productId)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
