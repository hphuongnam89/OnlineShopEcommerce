import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, ChevronDown, ChevronUp, ShoppingBag, Lock } from 'lucide-react';
import { api } from '../utils/api';

// Customer order history page for logged-in users.
const MyOrders = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  });
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const handleStorageUpdate = () => {
      const user = localStorage.getItem('currentUser');
      setCurrentUser(user ? JSON.parse(user) : null);
      if (!user) {
        setOrders([]);
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await api.orders.getMyOrders();
        setOrders([...data].sort((a, b) => b.id - a.id));
      } catch {
        setOrders([]);
      }
    };

    fetchOrders();
  }, [currentUser]);

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId((current) => (current === orderId ? null : orderId));
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'Đã giao';
      case 'SHIPPED':
        return 'Đang giao';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'PROCESSING':
        return 'Đang xử lý';
      default:
        return 'Chờ duyệt';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-50 text-green-600 border-green-200/50';
      case 'SHIPPED':
      case 'PROCESSING':
        return 'bg-blue-50 text-blue-600 border-blue-200/50';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-600 border-rose-200/50';
      default:
        return 'bg-amber-50 text-amber-600 border-amber-200/50';
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-slate-50 min-h-screen pt-40 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs border border-slate-200">
            <Lock size={36} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Truy cập bị giới hạn</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Vui lòng đăng nhập tài khoản của bạn để tra cứu lịch sử mua hàng và quản lý các đơn hàng của mình.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            Đăng Nhập Ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-[136px] pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 leading-tight">Đơn hàng của tôi</h1>
            <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi tiến độ các đơn hàng phụ kiện Think Tank của bạn.</p>
          </div>
          <Link
            to="/products"
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-lg border border-slate-200 hover:border-slate-350 transition-colors text-sm flex items-center gap-1.5 justify-center"
          >
            <ShoppingBag size={16} />
            Tiếp tục mua sắm
          </Link>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const formattedDate = new Date(order.createdAt || order.date).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={order.id} className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300">
                  <div
                    onClick={() => toggleExpandOrder(order.id)}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                  >
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-4 gap-y-2">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block">Mã đơn hàng</span>
                        <span className="font-semibold text-sm text-blue-600">TT-{order.id}</span>
                      </div>
                      <div className="sm:border-l border-slate-100 sm:pl-4">
                        <span className="text-[11px] font-semibold text-slate-400 block">Ngày đặt</span>
                        <span className="text-xs font-semibold text-slate-700">{formattedDate}</span>
                      </div>
                      <div className="sm:border-l border-slate-100 sm:pl-4">
                        <span className="text-[11px] font-semibold text-slate-400 block">Tổng tiền</span>
                        <span className="text-xs font-semibold text-slate-900">{(order.finalAmount || order.total || 0).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-50 bg-slate-50/30 p-5 sm:p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-xs mb-3.5 flex items-center gap-1.5">
                          <Package size={14} className="text-blue-600" />
                          Sản phẩm đã mua ({order.items.reduce((acc, item) => acc + item.quantity, 0)})
                        </h4>
                        <div className="space-y-3">
                          {order.items.map((item, index) => {
                            const title = item.product ? item.product.name : 'Sản phẩm';
                            const image = item.product ? (item.product.imageUrl || item.product.image) : '';
                            return (
                              <div key={index} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 p-1 flex-shrink-0 flex items-center justify-center">
                                  <img src={image} alt={title} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-grow min-w-0">
                                  <h5 className="font-bold text-slate-800 text-xs sm:text-sm truncate">{title}</h5>
                                  {item.variant && (
                                    <p className="text-[10px] text-[#2f5f88] font-bold mt-0.5">
                                      Phân loại: {item.variant.name || `${item.variant.color || ''}${item.variant.color && item.variant.size ? ' / ' : ''}${item.variant.size || ''}`}
                                    </p>
                                  )}
                                  <div className="text-[10px] sm:text-xs text-slate-450 mt-0.5">
                                    Đơn giá: {item.price.toLocaleString('vi-VN')}đ | Số lượng: {item.quantity}
                                  </div>
                                </div>
                                <div className="text-xs sm:text-sm font-semibold text-slate-900 whitespace-nowrap">
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div>
                          <h4 className="font-semibold text-slate-800 text-xs mb-2.5 flex items-center gap-1.5">
                            <MapPin size={14} className="text-blue-600" />
                            Địa chỉ nhận hàng
                          </h4>
                          <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                            <div><strong>Người nhận:</strong> {order.fullName || order.customerName} - {order.phone || order.customerPhone}</div>
                            {(order.email || order.customerEmail) && <div><strong>Email:</strong> {order.email || order.customerEmail}</div>}
                            <div><strong>Địa chỉ:</strong> {order.address}</div>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                            <h4 className="font-semibold text-slate-700 text-xs mb-2.5 flex items-center gap-1.5">
                              <Package size={14} />
                              Ghi chú & Hóa đơn
                            </h4>
                            <div className="text-xs text-slate-600 leading-relaxed">
                              {order.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Không tìm thấy đơn hàng nào</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
              Bạn chưa thực hiện bất kỳ giao dịch nào hoặc các đơn hàng không được liên kết với số điện thoại/email này.
            </p>
            <Link
              to="/products"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-blue-600/20"
            >
              Mua sắm ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
