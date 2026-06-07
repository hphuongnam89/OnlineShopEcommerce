import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Plus, Trash2, Search, Eye, AlertCircle, ShoppingBag, Truck, CheckCircle, XCircle } from 'lucide-react';
import CustomModal from '../../components/CustomModal';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');

  // Form states (Add Order Modal)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // Custom manual checkout fields if needed
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Order Items
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [orderItems, setOrderItems] = useState([]); // Array of { product, quantity, price }

  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchProductsAndCustomers();
  }, [startDate, endDate, status]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (startDate) params.startDate = `${startDate}T00:00:00`;
      if (endDate) params.endDate = `${endDate}T23:59:59`;
      if (status) params.status = status;

      const data = await api.admin.orders.getAll(params);
      setOrders(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsAndCustomers = async () => {
    try {
      const prodData = await api.products.getAll();
      setProducts(prodData || []);
      const custData = await api.admin.customers.getAll();
      setCustomers(custData || []);
    } catch (err) {
      console.error('Error fetching dependency lists:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleOpenCreate = () => {
    setSelectedCustomerId('');
    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setOrderItems([]);
    setSelectedProductId(products[0]?.id || '');
    setSelectedQty(1);
    setIsFormOpen(true);
  };

  // Populate fields if a customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => String(c.id) === String(selectedCustomerId));
      if (customer && customer.user) {
        setFullName(customer.user.fullName || '');
        setPhone(customer.user.phone || '');
        setEmail(customer.user.email || '');
      }
    }
  }, [selectedCustomerId, customers]);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = products.find(p => String(p.id) === String(selectedProductId));
    if (!product) return;

    // Check if already in list
    const existingIndex = orderItems.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += parseInt(selectedQty);
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, {
        product,
        quantity: parseInt(selectedQty),
        price: product.price
      }]);
    }
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      setModalConfig({
        isOpen: true,
        title: 'Cảnh báo',
        message: 'Vui lòng thêm ít nhất một sản phẩm vào đơn hàng!',
        type: 'warning'
      });
      return;
    }

    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setModalConfig({
        isOpen: true,
        title: 'Cảnh báo',
        message: 'Vui lòng nhập đầy đủ tên người nhận, SĐT và địa chỉ giao hàng!',
        type: 'warning'
      });
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
      items: orderItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    try {
      await api.admin.orders.create(payload);
      setModalConfig({
        isOpen: true,
        title: 'Thành công',
        message: 'Đã tạo đơn hàng mới thành công!',
        type: 'success'
      });
      setIsFormOpen(false);
      fetchOrders();
      fetchProductsAndCustomers(); // Reload customspent/tiers
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Tạo đơn hàng thất bại',
        message: err.message || 'Không thể tạo đơn hàng.',
        type: 'warning'
      });
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.admin.orders.updateStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      setModalConfig({
        isOpen: true,
        title: 'Thành công',
        message: `Đã cập nhật trạng thái đơn hàng sang ${newStatus}!`,
        type: 'success'
      });
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Thất bại',
        message: err.message || 'Không thể cập nhật trạng thái đơn.',
        type: 'warning'
      });
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy/xóa đơn hàng này? Việc này sẽ khôi phục lại tồn kho sản phẩm.')) {
      return;
    }

    try {
      await api.admin.orders.delete(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      setIsDetailsOpen(false);
      setModalConfig({
        isOpen: true,
        title: 'Thành công',
        message: 'Đã hủy và xóa đơn hàng thành công!',
        type: 'success'
      });
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Thất bại',
        message: err.message || 'Có lỗi xảy ra khi xóa đơn.',
        type: 'warning'
      });
    }
  };

  const getStatusClass = (statusStr) => {
    switch (statusStr) {
      case 'DELIVERED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'SHIPPING': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  // Helper to render Order Progress Timeline
  const renderTimeline = (currentStatus) => {
    const steps = [
      { key: 'PENDING', label: 'Chờ xử lý', icon: ShoppingBag, color: 'text-amber-400', bg: 'bg-amber-500/20' },
      { key: 'SHIPPING', label: 'Đang vận chuyển', icon: Truck, color: 'text-sky-400', bg: 'bg-sky-500/20' },
      { key: 'DELIVERED', label: 'Đã giao hàng', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    ];

    const isCancelled = currentStatus === 'CANCELLED';
    if (isCancelled) {
      return (
        <div className="bg-rose-950/20 border border-rose-500/15 p-4 rounded-2xl flex items-center gap-3">
          <XCircle className="text-rose-400" size={24} />
          <div>
            <p className="font-bold text-white text-sm">Đơn hàng đã bị hủy (CANCELLED)</p>
            <p className="text-[10px] text-slate-500">Tồn kho đã được khôi phục. Đơn hàng không còn hoạt động.</p>
          </div>
        </div>
      );
    }

    const currentIdx = steps.findIndex(s => s.key === currentStatus);

    return (
      <div className="grid grid-cols-3 gap-2 relative py-3 bg-slate-950/30 border border-slate-800/40 p-4 rounded-2xl">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = idx <= currentIdx;
          const isActive = step.key === currentStatus;
          
          return (
            <div key={step.key} className="flex flex-col items-center text-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                isActive 
                  ? `${step.bg} ${step.color} border-indigo-500 shadow-md shadow-indigo-500/20 scale-110` 
                  : isDone
                    ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30'
                    : 'bg-slate-900 text-slate-600 border-slate-800'
              }`}>
                <StepIcon size={16} />
              </div>
              <p className={`text-[10px] font-black uppercase mt-2 ${
                isActive ? step.color : isDone ? 'text-slate-350' : 'text-slate-500'
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Quản Lý Đơn Hàng</h1>
          <p className="text-slate-400 text-sm mt-1">Cập nhật lộ trình giao hàng, quản trị vận đơn và xuất hóa đơn.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto admin-glow-btn text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all duration-200 cursor-pointer"
        >
          <Plus size={14} />
          <span>Tạo Đơn Hàng</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Filter and Search */}
      <div className="admin-glass-card p-5 rounded-3xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên người nhận, SĐT hoặc mã đơn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-700 font-medium"
            />
          </div>
          <button 
            type="submit"
            className="bg-slate-900 hover:bg-slate-850 text-white font-semibold py-2.5 px-6 rounded-xl border border-slate-800 text-xs transition-colors cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Trạng thái đơn</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý (PENDING)</option>
              <option value="SHIPPING">Đang giao (SHIPPING)</option>
              <option value="DELIVERED">Đã giao (DELIVERED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="admin-glass-card rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Đang tải danh sách đơn hàng...</div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-slate-500">Không tìm thấy đơn hàng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/85 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-900/40">
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4">Khách nhận</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-350 text-xs font-semibold">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white text-sm">
                      TT-{o.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-200 text-sm">
                      {o.fullName}
                    </td>
                    <td className="px-6 py-4">
                      {o.phone}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(o.createdAt || o.updatedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusClass(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-emerald-450 text-right text-sm">
                      {o.finalAmount?.toLocaleString('vi-VN') || o.totalAmount?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setIsDetailsOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {isDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto pt-24 pb-12">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-base font-bold text-white">Chi Tiết Đơn Hàng TT-{selectedOrder.id}</h3>
              <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">Đóng</button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto admin-scrollbar">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Người nhận</p>
                  <p className="font-bold text-white mt-0.5 text-sm">{selectedOrder.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Số điện thoại</p>
                  <p className="font-semibold text-white mt-0.5 text-sm">{selectedOrder.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Địa chỉ nhận</p>
                  <p className="text-slate-300 mt-0.5 font-semibold">{selectedOrder.address}</p>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Ghi chú</p>
                    <p className="text-slate-450 mt-0.5">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Status Update Control with Timeline */}
              <div className="space-y-3">
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Hành trình đơn hàng</p>
                {renderTimeline(selectedOrder.status)}
              </div>

              {/* Status update buttons */}
              {selectedOrder.status !== 'CANCELLED' && (
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Cập nhật lộ trình</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Chọn mốc để thay đổi vị trí vận đơn</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED'].map((st) => (
                      <button
                        key={st}
                        disabled={selectedOrder.status === st}
                        onClick={() => handleStatusChange(selectedOrder.id, st)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
                          selectedOrder.status === st
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                            : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Danh sách sản phẩm</p>
                <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden divide-y divide-slate-850">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{item.product?.name || `Product ID: ${item.productId}`}</p>
                        <p className="text-[10px] text-slate-550 mt-0.5">Số lượng: {item.quantity} x {item.price?.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <p className="font-mono font-bold text-slate-300">
                        {((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-rose-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy/Xóa Đơn Hàng
                </button>
                <div className="text-right">
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Tổng số tiền thanh toán</p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">
                    {selectedOrder.finalAmount?.toLocaleString('vi-VN') || selectedOrder.totalAmount?.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Create Order Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto pt-24 pb-12">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-base font-bold text-white">Tạo Đơn Hàng Mới</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">Đóng</button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto admin-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Liên kết Khách hàng thành viên</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option value="">-- Mua nhanh (Khách vãng lai) --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.user?.fullName} ({c.user?.phone || 'N/A'}) - Tích lũy: {c.totalSpent?.toLocaleString('vi-VN')}đ
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tên người nhận *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Email người nhận</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Địa chỉ giao hàng *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Ghi chú</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Add Items Section */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Thêm sản phẩm vào đơn</p>
                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-grow bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.price?.toLocaleString('vi-VN')} đ)</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-800 text-white rounded-xl px-2 py-2 text-xs focus:outline-none text-center font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-slate-800 hover:bg-slate-750 border border-slate-750 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Sản phẩm đã chọn</p>
                <div className="border border-slate-805 rounded-2xl overflow-hidden divide-y divide-slate-805 text-xs">
                  {orderItems.length === 0 ? (
                    <div className="p-4 text-center text-slate-600 bg-slate-950/20 font-bold">Chưa có sản phẩm nào được chọn</div>
                  ) : (
                    orderItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/40 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{item.product.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Số lượng: {item.quantity} x {item.price?.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-mono font-bold text-emerald-400">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-455 hover:text-rose-400 cursor-pointer font-bold"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-850 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  Tạo đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default AdminOrders;
