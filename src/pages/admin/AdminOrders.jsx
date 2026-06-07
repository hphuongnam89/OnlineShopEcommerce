import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Plus, Edit3, Trash2, Search, ShoppingBag, Eye, AlertCircle } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Quản Lý Đơn Hàng</h1>
          <p className="text-slate-400 mt-1">Quản lý trạng thái vận chuyển, tạo đơn bán hàng trực tiếp.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={16} />
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
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên người nhận, SĐT hoặc mã đơn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase">Trạng thái đơn</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Đang tải danh sách đơn hàng...</div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-slate-500">Không tìm thấy đơn hàng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-900/50">
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4">Khách nhận</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      TT-{o.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {o.fullName}
                    </td>
                    <td className="px-6 py-4">
                      {o.phone}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(o.createdAt || o.updatedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusClass(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400 text-right">
                      {o.finalAmount?.toLocaleString('vi-VN') || o.totalAmount?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setIsDetailsOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-bold text-white">Chi Tiết Đơn Hàng TT-{selectedOrder.id}</h3>
              <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">Đóng</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 font-bold text-xs uppercase">Người nhận</p>
                  <p className="font-semibold text-white mt-0.5">{selectedOrder.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-xs uppercase">Số điện thoại</p>
                  <p className="font-semibold text-white mt-0.5">{selectedOrder.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 font-bold text-xs uppercase">Địa chỉ nhận</p>
                  <p className="text-slate-300 mt-0.5">{selectedOrder.address}</p>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-slate-500 font-bold text-xs uppercase">Ghi chú</p>
                    <p className="text-slate-400 mt-0.5">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Status Update Control */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-slate-500 font-bold text-xs uppercase">Cập nhật trạng thái đơn</p>
                  <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusClass(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {['PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      disabled={selectedOrder.status === st}
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        selectedOrder.status === st
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Danh sách sản phẩm</p>
                <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden divide-y divide-slate-850">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-semibold text-white">{item.product?.name || `Product ID: ${item.productId}`}</p>
                        <p className="text-xs text-slate-500">Số lượng: {item.quantity} x {item.price?.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <p className="font-mono font-semibold text-slate-350">
                        {((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy/Xóa Đơn Hàng
                </button>
                <div className="text-right">
                  <p className="text-slate-500 text-xs uppercase font-bold">Tổng số tiền thanh toán</p>
                  <p className="text-xl font-black text-emerald-400 mt-0.5">
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
              <h3 className="text-lg font-bold text-white">Tạo Đơn Hàng Mới</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">Đóng</button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Liên kết Khách hàng thành viên</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none"
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
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Tên người nhận *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Email người nhận</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Địa chỉ giao hàng *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Ghi chú</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Add Items Section */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Thêm sản phẩm vào giỏ</p>
                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-grow bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
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
                    className="w-20 bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none text-center"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Mặt hàng đã chọn</p>
                <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80 text-sm">
                  {orderItems.length === 0 ? (
                    <div className="p-4 text-center text-slate-600 bg-slate-950/20">Chưa có sản phẩm nào</div>
                  ) : (
                    orderItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/40 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">{item.product.name}</p>
                          <p className="text-xs text-slate-500">Số lượng: {item.quantity} x {item.price?.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-mono font-semibold text-emerald-400">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors cursor-pointer"
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
