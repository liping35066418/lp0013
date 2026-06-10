import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Tag, CalendarRange, DollarSign, RefreshCw, Package, ArrowUpDown } from 'lucide-react';
import type { Category, Product, ProductListQuery, SortBy } from '../../shared/types';
import { categoriesApi, productsApi, favoritesApi } from '@/lib/api';
import { useToastStore, useUserStore } from '@/store';
import { daysAgoStr, todayStr } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';

const TIME_OPTIONS = [
  { label: '全部时间', value: 'all' },
  { label: '今天', value: todayStr() },
  { label: '近3天', value: daysAgoStr(3) },
  { label: '近7天', value: daysAgoStr(7) },
  { label: '近30天', value: daysAgoStr(30) },
];

const SORT_OPTIONS: Array<{ label: string; value: SortBy }> = [
  { label: '最新发布', value: 'latest' },
  { label: '价格从低到高', value: 'price_asc' },
  { label: '价格从高到低', value: 'price_desc' },
];

export default function Home() {
  const { userId, nickname, init } = useUserStore();
  const { push } = useToastStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [favMap, setFavMap] = useState<Record<number, boolean>>({});
  const [showFilter, setShowFilter] = useState(false);

  // 已应用状态（真正传给 API 的）
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [appliedMinPrice, setAppliedMinPrice] = useState<string>('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');
  const [appliedTimeRange, setAppliedTimeRange] = useState<string>('all');
  const [appliedSortBy, setAppliedSortBy] = useState<SortBy>('latest');

  // 草稿状态（筛选面板内调整，暂不生效）
  const [keywordInput, setKeywordInput] = useState('');
  const [draftMinPrice, setDraftMinPrice] = useState<string>('');
  const [draftMaxPrice, setDraftMaxPrice] = useState<string>('');
  const [draftStartDate, setDraftStartDate] = useState<string>('');
  const [draftEndDate, setDraftEndDate] = useState<string>('');
  const [draftTimeRange, setDraftTimeRange] = useState<string>('all');
  const [draftSortBy, setDraftSortBy] = useState<SortBy>('latest');

  useEffect(() => { init(); }, [init]);

  // 打开筛选面板时，把已应用状态同步到草稿状态
  useEffect(() => {
    if (showFilter) {
      setDraftMinPrice(appliedMinPrice);
      setDraftMaxPrice(appliedMaxPrice);
      setDraftStartDate(appliedStartDate);
      setDraftEndDate(appliedEndDate);
      setDraftTimeRange(appliedTimeRange);
      setDraftSortBy(appliedSortBy);
    }
  }, [showFilter, appliedMinPrice, appliedMaxPrice, appliedStartDate, appliedEndDate, appliedTimeRange, appliedSortBy]);

  const fetchCategories = useCallback(async () => {
    const res = await categoriesApi.list();
    if (res.success && res.data) setCategories(res.data);
  }, []);

  const buildQuery = useCallback((): ProductListQuery => {
    const q: ProductListQuery = {
      keyword: keyword || undefined,
      categoryId,
      pageSize: 50,
      sortBy: appliedSortBy,
    };
    if (appliedMinPrice !== '') q.minPrice = Number(appliedMinPrice);
    if (appliedMaxPrice !== '') q.maxPrice = Number(appliedMaxPrice);
    if (appliedStartDate || appliedEndDate) {
      if (appliedStartDate) q.startDate = appliedStartDate;
      if (appliedEndDate) q.endDate = appliedEndDate;
    } else if (appliedTimeRange && appliedTimeRange !== 'all') {
      q.startDate = appliedTimeRange;
      q.endDate = todayStr();
    }
    return q;
  }, [keyword, categoryId, appliedMinPrice, appliedMaxPrice, appliedStartDate, appliedEndDate, appliedTimeRange, appliedSortBy]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await productsApi.list(buildQuery());
    setLoading(false);
    if (res.success) {
      setProducts(res.data || []);
    } else {
      push(res.message || '加载失败', 'error');
    }
  }, [buildQuery, push]);

  const checkFavorites = useCallback(async () => {
    if (!userId) return;
    const res = await favoritesApi.list(userId);
    if (res.success && res.data) {
      const map: Record<number, boolean> = {};
      res.data.forEach((f) => { if (f.productId) map[f.productId] = true; });
      setFavMap(map);
    }
  }, [userId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (userId) checkFavorites();
  }, [userId, checkFavorites, products.length]);

  const handleSearch = () => {
    setKeyword(keywordInput.trim());
  };

  const handleApplyFilter = () => {
    setAppliedMinPrice(draftMinPrice);
    setAppliedMaxPrice(draftMaxPrice);
    setAppliedStartDate(draftStartDate);
    setAppliedEndDate(draftEndDate);
    setAppliedTimeRange(draftTimeRange);
    setAppliedSortBy(draftSortBy);
  };

  const handleReset = () => {
    setKeyword('');
    setKeywordInput('');
    setCategoryId(undefined);
    const empty = { minPrice: '', maxPrice: '', startDate: '', endDate: '', timeRange: 'all', sortBy: 'latest' as SortBy };
    setAppliedMinPrice(empty.minPrice);
    setAppliedMaxPrice(empty.maxPrice);
    setAppliedStartDate(empty.startDate);
    setAppliedEndDate(empty.endDate);
    setAppliedTimeRange(empty.timeRange);
    setAppliedSortBy(empty.sortBy);
    setDraftMinPrice(empty.minPrice);
    setDraftMaxPrice(empty.maxPrice);
    setDraftStartDate(empty.startDate);
    setDraftEndDate(empty.endDate);
    setDraftTimeRange(empty.timeRange);
    setDraftSortBy(empty.sortBy);
  };

  const handleTimeRange = (val: string) => {
    setDraftTimeRange(val);
    setDraftStartDate('');
    setDraftEndDate('');
  };

  const toggleFavorite = useCallback(async (productId: number) => {
    if (!userId) {
      push('请先设置昵称后操作', 'info');
      return;
    }
    const res = await favoritesApi.toggle({ productId, userId });
    if (res.success) {
      const d = res.data as { favorited: boolean };
      setFavMap((m) => ({ ...m, [productId]: d.favorited }));
      push(d.favorited ? '已收藏' : '已取消收藏', 'success');
    } else {
      push(res.message || '操作失败', 'error');
    }
  }, [userId, push]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (categoryId) c++;
    if (appliedMinPrice !== '' || appliedMaxPrice !== '') c++;
    if (appliedStartDate || appliedEndDate || (appliedTimeRange && appliedTimeRange !== 'all')) c++;
    if (appliedSortBy !== 'latest') c++;
    if (keyword) c++;
    return c;
  }, [categoryId, appliedMinPrice, appliedMaxPrice, appliedStartDate, appliedEndDate, appliedTimeRange, appliedSortBy, keyword]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">发现好物，物尽其用</h1>
          <p className="text-white/80 mb-6">闲置流转，让每一件物品找到新主人</p>
          <div className="relative max-w-2xl">
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索商品名称、描述关键词..."
              className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-white text-slate-800 placeholder-slate-400 shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-95 transition-opacity shadow-md"
            >
              搜索
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all ${!categoryId ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'}`}
              onClick={() => setCategoryId(undefined)}>
              <Tag className="w-3.5 h-3.5" />
              全部
            </span>
            {categories.map((c) => (
              <span
                key={c.id}
                onClick={() => setCategoryId(categoryId === c.id ? undefined : c.id)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all ${categoryId === c.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'}`}
              >
                {c.name}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">共 <b className="text-indigo-600">{products.length}</b> 件</span>
            <button
              onClick={() => setShowFilter((s) => !s)}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              筛选
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>
              )}
            </button>
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {showFilter && (
          <div className="mb-5 p-5 bg-white rounded-2xl shadow-sm border border-slate-100 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                  <DollarSign className="w-4 h-4 text-indigo-500" />
                  价格区间 (元)
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" value={draftMinPrice} onChange={(e) => setDraftMinPrice(e.target.value)}
                    placeholder="最低" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <span className="text-slate-400">—</span>
                  <input type="number" min="0" value={draftMaxPrice} onChange={(e) => setDraftMaxPrice(e.target.value)}
                    placeholder="最高" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                  <CalendarRange className="w-4 h-4 text-indigo-500" />
                  发布时间
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_OPTIONS.map((o) => (
                    <button key={o.label} onClick={() => handleTimeRange(o.value)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${draftTimeRange === o.value ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                  自定义日期区间
                </label>
                <div className="flex items-center gap-2">
                  <input type="date" value={draftStartDate} max={draftEndDate || undefined}
                    onChange={(e) => { setDraftStartDate(e.target.value); setDraftTimeRange('all'); }}
                    className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <span className="text-slate-400">—</span>
                  <input type="date" value={draftEndDate} min={draftStartDate || undefined}
                    onChange={(e) => { setDraftEndDate(e.target.value); setDraftTimeRange('all'); }}
                    className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                  <ArrowUpDown className="w-4 h-4 text-indigo-500" />
                  排序
                </label>
                <select
                  value={draftSortBy}
                  onChange={(e) => setDraftSortBy(e.target.value as SortBy)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
              <button onClick={handleReset} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1">
                <X className="w-4 h-4" /> 重置
              </button>
              <button onClick={handleApplyFilter} className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-shadow">
                应用筛选
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-4/5" />
                  <div className="h-5 bg-slate-200 rounded w-2/5" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} favorited={!!favMap[p.id]}
                onToggleFavorite={() => toggleFavorite(p.id)} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Package className="w-16 h-16 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-1">暂无符合条件的商品</p>
            <p className="text-sm text-slate-400">试试调整筛选条件，或发布你的第一件闲置吧～</p>
          </div>
        )}
      </div>
    </div>
  );
}
