import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const CustomModal = ({ isOpen, onClose, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={28} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={28} className="text-orange-500" />;
      default:
        return <Info size={28} className="text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex justify-between items-start">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 text-right">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm cursor-pointer transition-colors shadow-lg shadow-blue-600/20"
          >
            Xác nhận
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomModal;
