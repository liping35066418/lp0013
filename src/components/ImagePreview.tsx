import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  images: string[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}

export default function ImagePreview({ images, index, onClose, onChange }: Props) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, index, images.length]);

  const prev = () => {
    setZoom(1);
    onChange((index - 1 + images.length) % images.length);
  };
  const next = () => {
    setZoom(1);
    onChange((index + 1) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fadeIn" onClick={onClose}>
      <div className="flex items-center justify-between px-6 py-4 text-white/80">
        <div className="text-sm">
          <span className="font-semibold text-white">{index + 1}</span>
          <span className="mx-1">/</span>
          <span>{images.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => (z >= 2.5 ? 1 : z + 0.5));
            }}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="放大"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <span className="text-xs px-2 py-1 bg-white/10 rounded">×{zoom.toFixed(1)}</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors ml-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative p-4">
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </>
        )}
        <img
          src={images[index]}
          alt=""
          onClick={(e) => e.stopPropagation()}
          style={{ transform: `scale(${zoom})` }}
          className="max-w-full max-h-[80vh] object-contain transition-transform duration-300 rounded-lg shadow-2xl"
        />
      </div>
      <div className="px-6 pb-6 flex justify-center gap-2 overflow-x-auto scrollbar-none">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setZoom(1);
              onChange(i);
            }}
            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              i === index ? 'border-white scale-105' : 'border-white/20 opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
