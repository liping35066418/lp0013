import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, ImagePlus, Send, AlertTriangle, Tag, FileText, User, Phone, Info } from 'lucide-react';
import type { Category } from '../../shared/types';
import { categoriesApi, productsApi, uploadApi } from '@/lib/api';
import { useToastStore, useUserStore } from '@/store';

const MAX_IMAGES = 9;
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800';

export default function Publish() {
  const navigate = useNavigate();
  const { userId, nickname, init } = useUserStore();
  const { push } = useToastStore();
  const fileInput = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [contact, setContact] = useState('');
  const [seller, setSeller] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [warnMsg, setWarnMsg] = useState('');

  useEffect(() => { init(); }, [init]);
  useEffect(() => { setSeller(nickname); }, [nickname]);

  useEffect(() => {
    categoriesApi.list().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  const onSelectFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remain = MAX_IMAGES - images.length;
    if (remain <= 0) {
      push(`最多上传 ${MAX_IMAGES} 张图片`, 'error');
      return;
    }
    const arr = Array.from(files).slice(0, remain);
    setUploading(true);
    const res = await uploadApi.images(arr);
    setUploading(false);
    if (res.success && res.data) {
      setImages((prev) => [...prev, ...res.data!.map((d) => d.url)]);
      push(`成功上传 ${res.data.length} 张`, 'success');
    } else {
      push(res.message || '上传失败', 'error');
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const reset = () => {
    setImages([]); setTitle(''); setDescription(''); setPrice('');
    setCategoryId(undefined); setContact(''); setWarnMsg('');
  };

  const submit = async () => {
    setWarnMsg('');
    if (!title.trim()) { push('请填写商品标题', 'error'); return; }
    if (title.trim().length < 5) { push('标题至少5个字符', 'error'); return; }
    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      push('请填写有效的价格', 'error'); return;
    }
    if (!categoryId) { push('请选择商品分类', 'error'); return; }
    if (!seller.trim()) { push('请填写卖家昵称', 'error'); return; }

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      categoryId,
      contact: contact.trim(),
      seller: seller.trim(),
      images: images.length ? images : [PLACEHOLDER_IMG],
    };

    setSubmitting(true);
    const res = await productsApi.create(payload);
    setSubmitting(false);

    if (res.success) {
      const autoOff = (res as any).autoOff;
      if (autoOff) {
        setWarnMsg(res.message || '内容检测异常');
        push('发布成功，但内容涉及敏感词已自动下架', 'error');
      } else {
        push(res.message || '发布成功！', 'success');
        setTimeout(() => {
          if (res.data && (res.data as any).id) navigate(`/product/${(res.data as any).id}`);
          else navigate('/');
        }, 600);
      }
    } else {
      push(res.message || '发布失败', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">发布闲置商品</h1>
          <p className="text-sm text-slate-500">填写商品信息，让更多人发现你的好物</p>
        </div>

        {warnMsg && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-800">内容安全提醒</div>
              <div className="text-sm text-amber-700 mt-1">{warnMsg}</div>
              <button onClick={reset} className="mt-2 text-xs px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-md transition-colors">
                重新编辑
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-indigo-500" /> 商品图片
              <span className="text-xs text-slate-400 font-normal">（最多 {MAX_IMAGES} 张，首图为封面）</span>
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group border border-slate-200">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <div className="absolute top-1 left-1 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-md">封面</div>
                  )}
                  <button onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className={`aspect-square rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all ${uploading ? 'border-indigo-300 bg-indigo-50 text-indigo-500' : 'border-slate-300 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-500'}`}>
                  {uploading ? (
                    <>
                      <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-1" />
                      <span className="text-xs">上传中...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 mb-1" />
                      <span className="text-xs font-medium">上传图片</span>
                    </>
                  )}
                  <input ref={fileInput} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { onSelectFiles(e.target.files); e.target.value = ''; }} />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
              <Info className="w-3 h-3" /> 支持 JPG、PNG、GIF、WEBP，单张不超过 8MB
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> 基本信息
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                商品标题 <span className="text-rose-500">*</span>
              </label>
              <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)}
                placeholder="简洁描述商品名称和核心卖点，如：iPhone 13 Pro 256G 9成新"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all" />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-slate-400">建议 10-40 字，吸引更多买家</p>
                <p className="text-xs text-slate-400">{title.length}/80</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  出售价格 (元) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-semibold">¥</span>
                  <input type="number" min="0" step="0.01" value={price}
                    onChange={(e) => setPrice(e.target.value)} placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-lg font-semibold text-rose-600" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> 商品分类 <span className="text-rose-500">*</span></span>
                </label>
                <select value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all">
                  <option value="">请选择分类</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">商品描述</label>
              <textarea value={description} rows={5} maxLength={2000}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="详细描述商品成色、使用情况、入手渠道、瑕疵说明等，信息越详细越容易卖出哦～"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all" />
              <div className="text-right text-xs text-slate-400 mt-1">{description.length}/2000</div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" /> 联系方式
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  卖家昵称 <span className="text-rose-500">*</span>
                </label>
                <input value={seller} onChange={(e) => setSeller(e.target.value)}
                  placeholder="显示在商品页的昵称"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> 联系方式</span>
                </label>
                <input value={contact} onChange={(e) => setContact(e.target.value)}
                  placeholder="手机号/微信/邮箱（建议，方便意向沟通）"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all" />
              </div>
            </div>
            <p className="text-xs text-slate-400 flex items-start gap-1 pt-1 border-t border-slate-100">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              系统会自动检测内容合规性，涉及违规关键词的商品将自动标记下架。发布后可在商品详情页与买家留言互动。
            </p>
          </section>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-6">
            <button onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
              取消
            </button>
            <button onClick={reset}
              className="px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
              重置表单
            </button>
            <button onClick={submit} disabled={submitting}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all disabled:opacity-60 active:scale-[0.98] inline-flex items-center justify-center gap-2">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 提交中...</>
              ) : (
                <><Send className="w-4 h-4" /> 立即发布</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
