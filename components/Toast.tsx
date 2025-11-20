
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-0 left-0 right-0 z-[150] flex flex-col items-center pointer-events-none p-4 gap-3 pt-[max(env(safe-area-inset-top),1rem)]">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle2 size={20} className="text-green-500 dark:text-green-400" />;
      case 'error': return <XCircle size={20} className="text-red-500 dark:text-red-400" />;
      default: return <Info size={20} className="text-blue-500 dark:text-blue-400" />;
    }
  };

  return (
    <div className="pointer-events-auto min-w-[320px] max-w-sm p-4 rounded-2xl flex items-center gap-3 animate-slide-up bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transform transition-all hover:scale-[1.02] cursor-pointer" onClick={onClose}>
      <div className="shrink-0 p-2 bg-gray-50 dark:bg-white/5 rounded-full">{getIcon()}</div>
      <p className="text-sm font-medium flex-1 leading-snug font-body">{toast.message}</p>
      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0 p-1">
        <X size={16} />
      </button>
    </div>
  );
};
