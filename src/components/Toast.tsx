import { useToastStore } from '@/store';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

export default function Toast() {
  const { show, message, type } = useToastStore();
  if (!show) return null;
  const styles = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-rose-500 text-white',
    info: 'bg-slate-800 text-white',
  }[type];
  const Icon = { success: CheckCircle2, error: XCircle, info: Info }[type];
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fadeInDown">
      <div className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl ${styles}`}>
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium max-w-sm break-words">{message}</span>
      </div>
    </div>
  );
}
