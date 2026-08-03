import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 border border-indigo-500/40 text-white font-medium text-xs sm:text-sm shadow-2xl animate-slide-up backdrop-blur-xl">
      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      <span>{message}</span>
      <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
