import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Heart, Share2, ArrowLeft, Tag, User, Phone, Clock, ChevronLeft, ChevronRight,
  Send, MessageSquare, AlertTriangle, Trash2, Eye, EyeOff, Shield, RefreshCw,
} from 'lucide-react';
import type { Message, Product } from '../../shared/types';
import { favoritesApi, messagesApi, productsApi } from '@/lib/api';
import { useToastStore, useUserStore } from '@/store';
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils';
import ImagePreview from '@/components/ImagePreview';

const POLL_INTERVAL = 2500;

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId, nickname, init } = useUserStore();
  const { push } = useToastStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [msgDraft, setMsgDraft] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [polling, setPolling] = useState(true);
  const lastMsgTimeRef = useRef<string>('');
  const msgListRef = useRef<HTMLDivElement>(null);

  const [statusLoading, setStatusLoading] = useState(false);

  const productId = id ? Number(id) : 0;

  useEffect(() => { init(); }, [init]);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    const res = await productsApi.detail(productId);
    setLoading(false);
    if (res.success && res.data) {
      setProduct(res.data);
    } else {
      push(res.message || '商品不存在', 'error');
      setTimeout(() => navigate('/'), 1200);
    }
  }, [productId, push, navigate]);

  const fetchFavorite = useCallback(async () => {
    if (!userId || !productId) return;
    const res = await favoritesApi.check(userId, productId);
    if (res.success) setFavorited(!!res.data);
  }, [userId, productId]);

  const fetchMessages = useCallback(async (full = true) => {
    if (!productId) return;
    const since = full ? undefined : lastMsgTimeRef.current;
    const res = await messagesApi.list(productId, userId, since);
    if (res.success && res.data) {
      if (full || !lastMsgTimeRef.current) {
        setMessages(res.data);
      } else if (res.data.length > 0) {
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id));
          const add = res.data!.filter((m) => !existing.has(m.id));
          return [...prev, ...add];
        });
      }
      if (res.data.length > 0) {
        const last = res.data[res.data.length - 1];
        lastMsgTimeRef.current = last.createdAt;
      }
    }
  }, [productId, userId]);

  useEffect(() => {
    fetchProduct();
    fetchFavorite();
    lastMsgTimeRef.current = '';
    fetchMessages(true);
  }, [fetchProduct, fetchFavorite, fetchMessages]);

  useEffect(() => {
    if (!polling) return;
    const t = window.setInterval(() => {
      fetchMessages(false);
    }, POLL_INTERVAL);
    return () => window.clearInterval(t);
  }, [polling, fetchMessages]);

  useEffect(() => {
    if (msgListRef.current) {
      msgListRef.current.scrollTop = msgListRef.current.scrollHeight;
    }
  }, [messages.length]);

  const toggleFavorite = async () => {
    if (!userId) { push('请先设置昵称', 'info'); return; }
    setFavLoading(true);
    const res = await favoritesApi.toggle({ productId, userId });
    setFavLoading(false);
    if (res.success) {
      const d = res.data as { favorited: boolean };
      setFavorited(d.favorited);
      push(d.favorited ? '已加入收藏' : '已取消收藏', 'success');
    } else {
      push(res.message || '操作失败', 'error');
    }
  };

  const sendMessage = async () => {
    const text = msgDraft.trim();
    if (!text) return;
    if (!nickname || !userId) { push('请先设置昵称', 'info'); return; }
    setSendingMsg(true);
    const res = await messagesApi.send({ productId, sender: nickname, content: text });
    setSendingMsg(false);
    if (res.success) {
      setMsgDraft('');
      fetchMessages(false);
    } else {
      push(res.message || '发送失败', 'error');
    }
  };

  const changeStatus = async (status: 'on' | 'off') => {
    setStatusLoading(true);
    const res = await productsApi.updateStatus(productId, status);
    setStatusLoading(false);
    if (res.success) {
      push(res.message || '操作成功', 'success');
      fetchProduct();
    } else {
      push(res.message || '操作失败', 'error');
    }
  };

  const shareItem = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      push('链接已复制，快分享给好友吧', 'success');
    } catch {
      push('复制链接失败', 'error');
    }
  };

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const statusInfo = {
    on: null,
    off: { text: '商品已下架', cls: 'bg-slate-100 text-slate-700 border-slate-300', icon: EyeOff },
    violation: { text: '商品因违规被下架', cls: 'bg-rose-100 text-rose-700 border-rose-200', icon: Shield },
  }[product.status];

  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1560472355-536de3962603?w=1200'];
  const isOwner = nickname && product.seller === nickname;
  const canMsg = product.status === 'on';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 pb-12">
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div className="flex items-center gap-2">
            <button onClick={shareItem} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors" title="复制链接">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={toggleFavorite} disabled={favLoading}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${favorited ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600'} disabled:opacity-60`}>
              <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
              {favorited ? '已收藏' : '收藏'}
            </button>
          </div>
        </div>
      </div>

      {statusInfo && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className={`p-3 rounded-xl border text-sm flex items-center gap-2 ${statusInfo.cls}`}>
            <statusInfo.icon className="w-4 h-4 shrink-0" />
            {statusInfo.text}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
              <div className="relative aspect-[4/3] bg-slate-100 cursor-zoom-in" onClick={() => setShowPreview(true)}>
                <img src={images[imgIdx]} alt={product.title} className="w-full h-full object-cover" />
                {images.length > 1 && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + images.length) % images.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-md hover:bg-white text-slate-700 flex items-center justify-center transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % images.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-md hover:bg-white text-slate-700 flex items-center justify-center transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/50 text-white text-xs rounded-lg backdrop-blur">
                  {imgIdx + 1} / {images.length}
                </div>
              </div>
              {images.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto scrollbar-none">
                  {images.map((url, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${imgIdx === i ? 'border-indigo-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileTextIcon /> 商品详情
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {product.description || '卖家未填写商品描述'}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              {product.categoryName && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium mb-3">
                  <Tag className="w-3 h-3" /> {product.categoryName}
                </div>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug mb-4">{product.title}</h1>
              <div className="flex items-baseline gap-2 mb-5 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl">
                <span className="text-lg text-rose-500 font-bold">¥</span>
                <span className="text-4xl font-extrabold text-rose-600 tracking-tight">{formatPrice(product.price)}</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-16">卖家：</span>
                  <span className="font-medium text-slate-800">{product.seller}</span>
                </div>
                {product.contact && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-500 w-16">联系：</span>
                    <span className="font-medium text-slate-800 break-all">{product.contact}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-16">发布：</span>
                  <span>{formatDateTime(product.createdAt)}</span>
                </div>
              </div>
              {isOwner && (
                <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">我发布的商品</span>
                  {product.status === 'on' ? (
                    <button onClick={() => changeStatus('off')} disabled={statusLoading}
                      className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                      {statusLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />} 下架商品
                    </button>
                  ) : product.status === 'off' ? (
                    <button onClick={() => changeStatus('on')} disabled={statusLoading}
                      className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-md disabled:opacity-60">
                      {statusLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} 重新上架
                    </button>
                  ) : (
                    <div className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm">
                      <AlertTriangle className="w-4 h-4" /> 违规状态
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-slate-800">在线留言</span>
                  <span className="text-xs px-2 py-0.5 bg-white text-indigo-600 rounded-full border border-indigo-100">{messages.length}</span>
                </div>
                <button onClick={() => setPolling((p) => !p)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${polling ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {polling ? '实时同步中' : '同步已暂停'}
                </button>
              </div>
              <div ref={msgListRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <MessageSquare className="w-10 h-10 opacity-30" />
                    <p className="text-sm">暂无留言，来打个招呼吧～</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender === nickname;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-fadeInUp`}>
                        <div className={`max-w-[80%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div className={`text-xs text-slate-500 px-1 flex items-center gap-1.5 ${mine ? 'justify-end' : 'justify-start'} w-full`}>
                            <span className="font-medium text-slate-600">{m.sender}</span>
                            <span className="text-[10px] text-slate-400">{formatDate(m.createdAt)}</span>
                          </div>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${mine ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-sm' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'}`}>
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-3 border-t border-slate-100 bg-white">
                {canMsg ? (
                  <div className="flex items-end gap-2">
                    <textarea
                      rows={1}
                      value={msgDraft}
                      onChange={(e) => setMsgDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                      }}
                      placeholder={`以「${nickname || '访客'}」身份留言，回车发送`}
                      className="flex-1 resize-none px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                      style={{ maxHeight: 100 }}
                    />
                    <button onClick={sendMessage} disabled={sendingMsg || !msgDraft.trim()}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 active:scale-95">
                      {sendingMsg ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                ) : (
                  <div className="py-3 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    商品已下架，留言功能已关闭
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <ImagePreview images={images} index={imgIdx} onClose={() => setShowPreview(false)} onChange={setImgIdx} />
      )}
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
