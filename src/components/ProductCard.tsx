import { Heart, Eye, Tag, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../../../shared/types';
import { formatPrice, formatDate } from '@/lib/utils';

interface Props {
  product: Product;
  favorited?: boolean;
  onToggleFavorite?: () => void;
  showStatus?: boolean;
}

export default function ProductCard({ product, favorited, onToggleFavorite, showStatus }: Props) {
  const firstImg = product.images?.[0] || 'https://images.unsplash.com/photo-1560472355-536de3962603?w=600';
  const statusBadge = {
    on: null,
    off: { text: '已下架', cls: 'bg-slate-700 text-white' },
    violation: { text: '违规下架', cls: 'bg-rose-600 text-white' },
  }[product.status];

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={firstImg}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-3 left-3 flex gap-2">
          {product.categoryName && (
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-medium rounded-full shadow-sm">
              <Tag className="w-3 h-3 inline -mt-0.5 mr-1" />
              {product.categoryName}
            </span>
          )}
        </div>
        {(showStatus || statusBadge) && statusBadge && (
          <div className="absolute top-3 right-3">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${statusBadge.cls}`}>
              {statusBadge.text}
            </span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite?.();
          }}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-sm shadow-md ${
            favorited
              ? 'bg-rose-500 text-white scale-100'
              : 'bg-white/90 text-slate-500 hover:bg-white hover:text-rose-500 scale-90 group-hover:scale-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>
      </Link>

      <div className="flex flex-col flex-1 p-4">
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="font-semibold text-slate-800 line-clamp-2 leading-snug mb-2 group-hover:text-indigo-600 transition-colors min-h-[3rem]">
            {product.title}
          </h3>
        </Link>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-xs text-rose-500">¥</span>
          <span className="text-2xl font-bold text-rose-600 tracking-tight">{formatPrice(product.price)}</span>
        </div>
        <div className="mt-auto flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1 truncate max-w-[45%]">
            <User className="w-3 h-3 shrink-0" />
            <span className="truncate">{product.seller || '匿名'}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {formatDate(product.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
