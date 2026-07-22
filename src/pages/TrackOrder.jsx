import { useState } from 'react';
import { Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

// Guest order tracking page using an unguessable tracking token.
const TrackOrder = () => {
  const [trackingToken, setTrackingToken] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingToken.trim()) {
      setError('Vui lòng nhập mã tra cứu đơn hàng.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setOrder(null);
      
      const foundOrder = await api.orders.track(trackingToken.trim());
      setOrder(foundOrder);
    } catch (err) {
      setError(err.message || 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'PROCESSING': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'SHIPPING': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'DELIVERED': return 'text-green-600 bg-green-50 border-green-200';
      case 'CANCELLED': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Đang chờ xử lý';
      case 'PROCESSING': return 'Đang chuẩn bị hàng';
      case 'SHIPPING': return 'Đang giao hàng';
      case 'DELIVERED': return 'Đã giao thành công';
      case 'CANCELLED': return 'Đã huỷ';
      default: return status;
    }
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen pt-36 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight uppercase font-heading">Tra Cứu Đơn Hàng</h1>
          <p className="text-slate-500 text-sm max-w-lg mx-auto font-sans">
            Kiểm tra trạng thái đơn hàng của bạn nhanh chóng mà không cần đăng nhập. 
            Nhập mã tra cứu được cung cấp sau khi đặt hàng.
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-10">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider font-heading">Mã tra cứu</label>
              <input
                type="text"
                value={trackingToken}
                onChange={(e) => setTrackingToken(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2f5f88] hover:bg-[#23323f] text-white font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Search size={18} />
                    Tra cứu ngay
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}
        </div>

        {order && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-slate-900 text-white px-6 py-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Đơn hàng</span>
                <div className="font-black text-lg tracking-wider text-blue-400 font-mono">TT-{order.id}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Trạng thái</span>
                <div className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                  {order.status === 'DELIVERED' ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>}
                  {getStatusText(order.status)}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 font-heading">Sản phẩm đã mua</h4>
                <ul className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {order.items?.map((item) => (
                    <li key={item.id} className="p-4 flex items-center gap-4 bg-white text-sm font-sans">
                      <div className="flex-grow min-w-0">
                        <h5 className="font-bold text-slate-800 truncate">{item.name}</h5>
                        {item.variantName && <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{item.variantName}</p>}
                        <span className="text-slate-500 text-xs">Số lượng: {item.quantity}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-200 pt-5 space-y-2 text-sm font-sans">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Thanh toán</span>
                  <span className={order.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}>
                    {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Thanh toán khi nhận hàng (COD)'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black mt-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-800 uppercase tracking-wide text-xs self-center">Tổng thanh toán:</span>
                  <span className="text-[#2f5f88] text-xl font-mono">{order.finalAmount?.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TrackOrder;
