import { useCallback, useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Plus, Search, Eye, AlertCircle, ShoppingBag, Truck, CheckCircle, XCircle } from 'lucide-react';
import CustomModal from '../../components/CustomModal';

// Admin order management page for filtering, editing, status workflow, and soft delete.
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

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [orderItems, setOrderItems] = useState([]); // Array of { product, variant, displayName, quantity, price }

  const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));
  const selectedProductVariants = selectedProduct?.variants || [];

  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
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
  }, [search, startDate, endDate, status]);

  const fetchProductsAndCustomers = useCallback(async () => {
    try {
      const prodData = await api.products.getAll();
      setProducts(prodData || []);
      const custData = await api.admin.customers.getAll();
      setCustomers(custData || []);
    } catch {
      setProducts([]);
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOrders();
      void fetchProductsAndCustomers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrders, fetchProductsAndCustomers]);

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
    setSelectedVariantId('');
    setSelectedQty(1);
    setIsFormOpen(true);
  };

  // Populate fields if a customer is selected
  useEffect(() => {
    const timer = setTimeout(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => String(c.id) === String(selectedCustomerId));
      if (customer && customer.user) {
        setFullName(customer.user.fullName || '');
        setPhone(customer.user.phone || '');
        setEmail(customer.user.email || '');
      }
    }
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedCustomerId, customers]);

  // Handle auto-selected variant when product changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const p = products.find(prod => String(prod.id) === String(selectedProductId));
      if (p && p.variants && p.variants.length > 0) {
        setSelectedVariantId(p.variants[0].id || '');
      } else {
        setSelectedVariantId('');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedProductId, products]);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = products.find(p => String(p.id) === String(selectedProductId));
    if (!product) return;

    let variant = null;
    let priceVal = product.price;
    let displayName = product.name;

    if (selectedVariantId) {
      variant = product.variants?.find(v => String(v.id) === String(selectedVariantId));
      if (variant) {
        priceVal = variant.price;
        displayName = `${product.name} (${variant.name || `${variant.color || ''} / ${variant.size || ''}`})`;
      }
    }

    // Check if already in list comparing both product ID and variant ID
    const existingIndex = orderItems.findIndex(item => 
      item.product.id === product.id && 
      (item.variant ? item.variant.id : null) === (variant ? variant.id : null)
    );

    if (existingIndex > -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += parseInt(selectedQty);
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, {
        product,
        variant,
        displayName,
        quantity: parseInt(selectedQty),
        price: priceVal
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
        variantId: item.variant ? item.variant.id : null,
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
      case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'SHIPPING': return 'bg-sky-50 text-sky-700 border border-sky-200';
      case 'CANCELLED': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  // Helper to render Order Progress Timeline
  const renderTimeline = (currentStatus) => {
    const steps = [
      { key: 'PENDING', label: 'Chờ xử lý', icon: ShoppingBag, color: 'text-amber-705', bg: 'bg-amber-50 border-amber-200' },
      { key: 'SHIPPING', label: 'Đang vận chuyển', icon: Truck, color: 'text-sky-705', bg: 'bg-sky-50 border-sky-200' },
      { key: 'DELIVERED', label: 'Đã giao hàng', icon: CheckCircle, color: 'text-emerald-750', bg: 'bg-emerald-50 border-emerald-200' },
    ];

    const isCancelled = currentStatus === 'CANCELLED';
    if (isCancelled) {
      return (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3">
          <XCircle className="text-rose-600" size={24} />
          <div>
            <p className="font-bold text-rose-800 text-sm">Đơn hàng đã bị hủy (CANCELLED)</p>
            <p className="text-[10px] text-rose-500">Tồn kho đã được khôi phục. Đơn hàng không còn hoạt động.</p>
          </div>
        </div>
      );
    }

    const currentIdx = steps.findIndex(s => s.key === currentStatus);

    return (
      <div className="grid grid-cols-3 gap-2 relative py-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = idx <= currentIdx;
          const isActive = step.key === currentStatus;
          
          return (
            <div key={step.key} className="flex flex-col items-center text-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                isActive 
                  ? `${step.bg} ${step.color} border-blue-500 shadow-sm scale-110` 
                  : isDone
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white text-slate-400 border-slate-200'
              }`}>
                <StepIcon size={16} />
              </div>
              <p className={`text-[10px] font-black uppercase mt-2 ${
                isActive ? step.color : isDone ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  if (isDetailsOpen && selectedOrder) {
    return (
      <div className="space-y-6 font-sans pb-10 animate-in fade-in duration-200">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
          <div>
            <nav className="mb-2" aria-label="breadcrumb">
              <ol className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <li><a href="#!" className="hover:text-slate-600 transition-colors">Admin</a></li>
                <li>/</li>
                <li><a href="#!" onClick={() => setIsDetailsOpen(false)} className="hover:text-slate-600 transition-colors">Đơn hàng</a></li>
                <li>/</li>
                <li className="text-slate-600">Đơn hàng TT-{selectedOrder.id}</li>
              </ol>
            </nav>
            <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading uppercase">
              Chi Tiết Đơn Hàng TT-{selectedOrder.id}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Ngày tạo: {new Date(selectedOrder.createdAt || selectedOrder.updatedAt).toLocaleString('vi-VN')}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsDetailsOpen(false)}
              className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Quay lại danh sách
            </button>
            {selectedOrder.status !== 'CANCELLED' && (
              <button
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                className="flex-1 sm:flex-none bg-rose-55 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                Hủy / Xóa đơn hàng
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Detail Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content (Left - 2/3 width) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Timeline Progress */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Trạng Thái Giao Hàng</h3>
              {renderTimeline(selectedOrder.status)}
            </div>

            {/* Purchased Items List */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">Danh Sách Sản Phẩm</h3>
              </div>
              <div className="divide-y divide-slate-150">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-center text-xs gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.product?.image || item.product?.imageUrl || '/images/thinktanklogo.png'} 
                        alt={item.product?.name}
                        className="w-12 h-12 object-cover bg-slate-50 border border-slate-200 rounded-xl flex-shrink-0"
                        onError={(e) => { e.target.src = '/images/thinktanklogo.png'; }}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-850 text-sm truncate max-w-[280px]">
                          {item.product?.name || `Product ID: ${item.productId}`}
                        </p>
                        {item.variant && (
                          <p className="text-[10px] text-blue-600 font-bold mt-0.5 uppercase tracking-wide">
                            Biến thể: {item.variant.name || `${item.variant.color || ''} / ${item.variant.size || ''}`}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Đơn giá: {item.price?.toLocaleString('vi-VN')} đ</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-slate-800 text-xs">Số lượng: {item.quantity}</p>
                      <p className="font-mono font-black text-slate-850 text-sm mt-1">
                        {((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Chi Tiết Thanh Toán</h3>
              <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Tiền hàng thực tế</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {selectedOrder.totalAmount?.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span className="text-slate-850 font-bold">0 đ (Freeship)</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-black text-slate-900">
                  <span>Tổng tiền thanh toán</span>
                  <span className="font-mono text-blue-600 text-base">
                    {selectedOrder.finalAmount?.toLocaleString('vi-VN') || selectedOrder.totalAmount?.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column (Right - 1/3 width) */}
          <div className="space-y-6">
            {/* Recipient Profile */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Hồ Sơ Nhận Hàng</h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Người nhận</p>
                  <p className="font-bold text-slate-800 mt-1 text-sm">{selectedOrder.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Số điện thoại</p>
                  <p className="font-bold text-slate-800 mt-1">{selectedOrder.phone}</p>
                </div>
                {selectedOrder.email && (
                  <div>
                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Địa chỉ Email</p>
                    <p className="font-semibold text-slate-700 mt-1 font-mono">{selectedOrder.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Địa chỉ giao hàng</p>
                  <p className="font-semibold text-slate-700 mt-1 leading-relaxed">{selectedOrder.address}</p>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Ghi chú giao hàng</p>
                    <p className="text-slate-600 mt-1 italic font-medium">"{selectedOrder.notes}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Status Updater */}
            {selectedOrder.status !== 'CANCELLED' && (
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Cập Nhật Trạng Thái</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'PENDING', label: 'Chờ xử lý (PENDING)' },
                    { key: 'SHIPPING', label: 'Đang giao (SHIPPING)' },
                    { key: 'DELIVERED', label: 'Đã giao (DELIVERED)' },
                    { key: 'CANCELLED', label: 'Hủy đơn hàng (CANCELLED)' }
                  ].map((st) => (
                    <button
                      key={st.key}
                      disabled={selectedOrder.status === st.key}
                      onClick={() => handleStatusChange(selectedOrder.id, st.key)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border flex items-center justify-center ${
                        selectedOrder.status === st.key
                          ? 'bg-blue-600 text-white border-blue-650 font-black shadow-sm'
                          : st.key === 'CANCELLED'
                            ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <CustomModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <div className="space-y-6 font-sans pb-10 animate-in fade-in duration-200">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
          <div>
            <nav className="mb-2" aria-label="breadcrumb">
              <ol className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <li><a href="#!" className="hover:text-slate-600 transition-colors">Admin</a></li>
                <li>/</li>
                <li><a href="#!" onClick={() => setIsFormOpen(false)} className="hover:text-slate-600 transition-colors">Đơn hàng</a></li>
                <li>/</li>
                <li className="text-slate-600">Tạo đơn hàng</li>
              </ol>
            </nav>
            <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading uppercase">
              Tạo Đơn Hàng Mới
            </h1>
            <p className="text-slate-500 text-xs mt-1">Nhập thông tin người nhận, liên kết tài khoản thành viên và chọn danh sách sản phẩm.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmitOrder}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Tạo đơn hàng
            </button>
          </div>
        </div>

        {/* 2-Column Creator Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Column (Left - 2/3 width) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Receiver Profile Card */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Thông Tin Giao Hàng</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tên người nhận *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xxxxxxx"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Địa chỉ giao hàng *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Email người nhận</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Ghi chú vận chuyển</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                    className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Chosen items list */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">Sản phẩm đã chọn</h3>
              </div>
              <div className="divide-y divide-slate-150">
                {orderItems.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs font-bold">Chưa có sản phẩm nào được thêm vào đơn hàng.</div>
                ) : (
                  orderItems.map((item, idx) => (
                    <div key={idx} className="p-4 flex justify-between items-center text-xs gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.product?.image || item.product?.imageUrl || '/images/thinktanklogo.png'} 
                          alt={item.product?.name}
                          className="w-10 h-10 object-cover bg-slate-50 border border-slate-200 rounded-xl flex-shrink-0"
                          onError={(e) => { e.target.src = '/images/thinktanklogo.png'; }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-850 text-xs truncate max-w-[280px]">{item.displayName}</p>
                          <p className="text-[10px] text-slate-450 mt-0.5">Đơn giá: {item.price?.toLocaleString('vi-VN')} đ</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-slate-800 text-[10px]">Số lượng: {item.quantity}</p>
                          <p className="font-mono font-bold text-blue-600 mt-0.5">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-600 hover:text-rose-700 font-bold p-1 cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {orderItems.length > 0 && (
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-550 uppercase">Tổng chi phí tạm tính:</span>
                  <span className="font-mono font-black text-blue-600 text-sm">
                    {orderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column (Right - 1/3 width) */}
          <div className="space-y-6">
            {/* Customer Association */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Tài Khoản Thành Viên</h3>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Liên kết khách hàng</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-3 py-2.5 text-xs focus:outline-none font-bold focus:ring-1 focus:ring-blue-100"
                >
                  <option value="">-- Mua nhanh (Khách vãng lai) --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.user?.fullName} ({c.user?.phone || 'N/A'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Liên kết thành viên giúp tự động đồng bộ doanh số và cập nhật cấp độ VIP cho khách.</p>
              </div>
            </div>

            {/* Add products dropdown selector card */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Thêm Sản Phẩm</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Chọn mặt hàng</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-3 py-2.5 text-xs focus:outline-none font-bold focus:ring-1 focus:ring-blue-100"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {selectedProductVariants.length > 0 && (
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Chọn biến thể</label>
                    <select
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-3 py-2.5 text-xs focus:outline-none font-bold focus:ring-1 focus:ring-blue-100"
                    >
                      {selectedProductVariants.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name || `${v.color || ''} / ${v.size || ''}`} (Còn {v.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-2">
                    <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2 py-2.5 text-xs focus:outline-none font-bold text-center focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Foot Control Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/60 mt-8">
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmitOrder}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Tạo đơn hàng
          </button>
        </div>

        <CustomModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading uppercase">Quản Lý Đơn Hàng</h1>
          <p className="text-slate-500 text-xs mt-1">Cập nhật lộ trình giao hàng, quản trị vận đơn và xuất hóa đơn.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all duration-200 cursor-pointer shadow-sm"
        >
          <Plus size={14} />
          <span>Tạo Đơn Hàng</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-200">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm theo tên người nhận, SĐT hoặc mã đơn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 font-medium"
            />
          </div>
          <button 
            type="submit"
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-6 rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Tìm kiếm
          </button>
        </form>
 
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100/80">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Trạng thái đơn</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="SHIPPING">Đang giao</option>
              <option value="DELIVERED">Đã giao</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>
 
      {/* Orders List Table */}
      <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden animate-in fade-in duration-200">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Đang tải danh sách đơn hàng...</div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">Không tìm thấy đơn hàng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4">Khách nhận</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650 text-xs font-semibold">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 text-sm">
                      TT-{o.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                      {o.fullName}
                    </td>
                    <td className="px-6 py-4">
                      {o.phone}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium text-[11px]">
                      {new Date(o.createdAt || o.updatedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusClass(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-slate-900 text-right text-sm">
                      {(o.finalAmount || o.totalAmount)?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setIsDetailsOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-705 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
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
