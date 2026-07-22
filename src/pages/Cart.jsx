import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, ChevronLeft, MapPin, ShieldCheck, QrCode, CreditCard, LoaderCircle, CircleCheckBig } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import { api, getValidToken } from '../utils/api';

// Cart and checkout page, including quantity edits, address selection, and order creation.
const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Cart list, 2: Info form, 3: Success
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showPaymentDemoModal, setShowPaymentDemoModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [paymentDemoProcessing, setPaymentDemoProcessing] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  // Dynamic location state
  const [locationData, setLocationData] = useState({});
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await fetch('https://provinces.open-api.vn/api/?depth=3');
        if (!response.ok) throw new Error('Province service unavailable');
        const data = await response.json();
        const mappedData = {};
        data.forEach(p => {
          mappedData[p.name] = {
            districts: p.districts.map(d => d.name),
            wards: {}
          };
          p.districts.forEach(d => {
            mappedData[p.name].wards[d.name] = d.wards.map(w => w.name);
          });
        });
        setLocationData(mappedData);
      } catch {
        const response = await fetch('/data/locations.json');
        setLocationData(response.ok ? await response.json() : {});
      }
    };
    void loadLocations();
  }, []);

  // Custom alert modal state
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const openModal = (title, message, type = 'info') => {
    setModalConfig({ isOpen: true, title, message, type });
  };
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  // Form state
  const [formData, setFormData] = useState(() => {
    const base = {
      gender: 'Anh',
      name: '',
      phone: '',
      email: '',
      province: '',
      district: '',
      ward: '',
      street: '',
      requestInvoice: false,
      companyName: '',
      companyAddress: '',
      taxCode: '',
      notes: '',
      saveInfo: false
    };
    try {
      const userStr = localStorage.getItem('currentUser');
      const userObj = userStr ? JSON.parse(userStr) : null;

      const savedInfoStr = localStorage.getItem('savedCheckoutInfo');
      if (savedInfoStr) {
        const savedInfo = JSON.parse(savedInfoStr);
        if (!userObj || savedInfo.email === userObj.email) {
          return { ...base, ...savedInfo };
        }
      }

      if (userObj) {
        return {
          ...base,
          name: userObj.fullName || '',
          phone: userObj.phone || '',
          email: userObj.email || ''
        };
      }
    } catch (err) {
      console.warn("Error restoring checkout info from storage", err);
    }
    return base;
  });

  // Success screen state
  const [orderId, setOrderId] = useState('');
  const [orderedItems, setOrderedItems] = useState([]);
  const [orderedTotal, setOrderedTotal] = useState(0);
  const [orderedDiscount, setOrderedDiscount] = useState(0);

  // Customer Loyalty Tier Discount
  const [userTier, setUserTier] = useState(null);
  const [tierDiscount, setTierDiscount] = useState(0);

  useEffect(() => {
    const token = getValidToken();
    const userStr = localStorage.getItem('currentUser');
    if (token && userStr) {
      api.profile.get()
        .then(profile => {
          if (profile) {
            setUserTier(profile.tierName || 'BRONZE');
            setTierDiscount(profile.discountPercent || 0);
          }
        })
        .catch(err => {
          console.warn("Failed to fetch user profile for discount", err);
        });
    }
  }, []);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const tierDiscountAmount = Math.round(cartTotal * (tierDiscount / 100));
  const finalTotal = cartTotal - tierDiscountAmount;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProvinceChange = (e) => {
    const p = e.target.value;
    setFormData(prev => ({
      ...prev,
      province: p,
      district: '',
      ward: ''
    }));
  };

  const handleDistrictChange = (e) => {
    const d = e.target.value;
    setFormData(prev => ({
      ...prev,
      district: d,
      ward: ''
    }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      openModal('Cảnh báo', 'Vui lòng nhập họ và tên!', 'warning');
      return;
    }
    const phone = formData.phone.trim();
    if (!phone || phone.length < 10) {
      openModal('Cảnh báo', 'Vui lòng nhập số điện thoại hợp lệ (tối thiểu 10 chữ số)!', 'warning');
      return;
    }
    if (!formData.province || !formData.district || !formData.ward || !formData.street.trim()) {
      openModal('Cảnh báo', 'Vui lòng nhập đầy đủ địa chỉ giao hàng (Tỉnh/Thành, Quận/Huyện, Phường/Xã, Số nhà)!', 'warning');
      return;
    }
    if (formData.requestInvoice) {
      if (!formData.companyName.trim() || !formData.companyAddress.trim() || !formData.taxCode.trim()) {
        openModal('Cảnh báo', 'Vui lòng nhập đầy đủ thông tin xuất hóa đơn đỏ (VAT)!', 'warning');
        return;
      }
    }

    const addressStr = `${formData.street.trim()}, ${formData.ward}, ${formData.district}, ${formData.province}`;

    const orderPayload = {
      idempotencyKey,
      fullName: formData.name.trim(),
      phone: phone,
      address: addressStr,
      email: formData.email.trim(),
      notes: formData.requestInvoice 
        ? `${formData.notes.trim()} | Xuất VAT: ${formData.companyName.trim()} - MST: ${formData.taxCode.trim()} - ĐC: ${formData.companyAddress.trim()}`
        : formData.notes.trim(),
      items: cartItems.map(item => ({
        productId: item.productId ? Number(item.productId) : Number(item.id),
        variantId: item.variantId ? Number(item.variantId) : null,
        quantity: Number(item.quantity)
      }))
    };

    try {
      const createdOrder = await api.orders.create(orderPayload);
      
      // Save checkout info if checked
      if (formData.saveInfo && localStorage.getItem('currentUser')) {
        const infoToSave = { ...formData };
        delete infoToSave.notes;
        delete infoToSave.saveInfo;
        localStorage.setItem('savedCheckoutInfo', JSON.stringify(infoToSave));
      } else {
        localStorage.removeItem('savedCheckoutInfo');
      }

      // Update local ordered details for confirmation screen
      setOrderId(createdOrder.trackingToken);
      setOrderedItems([...cartItems]);
      setOrderedTotal(Number(createdOrder.finalAmount ?? finalTotal));
      setOrderedDiscount(Number(createdOrder.discountAmount ?? tierDiscountAmount));
      setCheckoutStep(3);

      // Clear actual cart state
      clearCart();
      window.scrollTo(0, 0);
    } catch (err) {
      openModal('Lỗi đặt hàng', err.message || 'Không thể tạo đơn hàng, vui lòng thử lại!', 'warning');
    }
  };

  const handleOpenPaymentDemo = () => {
    setPaymentMethod('ONLINE_DEMO');
    setShowPaymentDemoModal(true);
  };

  const handleConfirmDemoPayment = () => {
    setPaymentDemoProcessing(true);
    window.setTimeout(() => {
      setShowPaymentDemoModal(false);
      setPaymentDemoProcessing(false);
      document.getElementById('submitOrderBtn')?.click();
    }, 900);
  };

  // ---------------- STEP 3: SUCCESS RENDER ----------------
  if (checkoutStep === 3) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-36 pb-24 text-center animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Đặt hàng thành công!</h2>
              <p className="text-slate-500 text-sm mb-8">
          Cảm ơn {formData.gender} <strong className="text-slate-800 font-bold">{formData.name}</strong> đã tin tưởng mua sắm phụ kiện nhiếp ảnh chuyên nghiệp tại Balomayanh.
              </p>
              <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                <CircleCheckBig size={14} className={paymentMethod === 'ONLINE_DEMO' ? 'text-blue-600' : 'text-green-600'} />
                {paymentMethod === 'ONLINE_DEMO' ? 'Thanh toán online (demo)' : 'COD'}
              </div>
        
        {!localStorage.getItem('currentUser') && (
          <div className="max-w-md mx-auto mb-8 bg-blue-50 border border-blue-100 p-4 rounded-2xl text-blue-800 text-xs text-left">
            <strong className="block mb-1">📌 Tài khoản tự động được tạo:</strong> 
            Hệ thống đã tự động thiết lập tài khoản theo dõi đơn hàng cho bạn. 
            Bạn có thể đăng nhập bằng <strong>SĐT của bạn</strong> (Mật khẩu mặc định cũng là SĐT của bạn).
          </div>
        )}

        {/* Order Details Receipt Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden text-left mb-10">
          <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Mã đơn hàng</span>
              <div className="font-extrabold text-base tracking-wider text-blue-400">{orderId}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Trạng thái</span>
              <div className="text-xs font-bold text-green-400 flex items-center gap-1 justify-end">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                Đang chờ xử lý
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Delivery address info */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-600" />
                Thông tin nhận hàng
              </h4>
              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>Người nhận: <strong className="text-slate-800 font-semibold">{formData.name} - {formData.phone}</strong></div>
                {formData.email && <div>Email: {formData.email}</div>}
                <div>Hình thức: Giao hàng tận nơi</div>
                <div>Địa chỉ: {formData.street}, {formData.ward}, {formData.district}, {formData.province}</div>
                {formData.requestInvoice && (
                  <div className="pt-2 mt-2 border-t border-slate-200/50">
                    <div className="font-semibold text-slate-700">Yêu cầu xuất hoá đơn VAT:</div>
                    <div>Cty: {formData.companyName}</div>
                    <div>MST: {formData.taxCode}</div>
                    <div>Địa chỉ: {formData.companyAddress}</div>
                  </div>
                )}
                {formData.notes && <div className="text-slate-500 italic mt-2">Ghi chú: "{formData.notes}"</div>}
              </div>
            </div>

            {/* Product summary list */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5">Sản phẩm đã mua</h4>
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {orderedItems.map((item) => (
                  <li key={item.id} className="p-4 flex items-center gap-4 bg-white text-xs">
                    <div className="w-12 h-12 bg-slate-50 p-1 rounded-lg border border-slate-100 flex-shrink-0 flex items-center justify-center">
                      <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h5 className="font-bold text-slate-800 truncate">{item.title}</h5>
                      <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                        <span>Số lượng: {item.quantity}</span>
                        {item.variantName && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-[#2f5f88] font-semibold">Phân loại: {item.variantName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Total Billing */}
            <div className="border-t border-slate-100 pt-4 text-xs space-y-2">
              {orderedDiscount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Khuyến mãi giảm giá:</span>
                  <span className="font-medium text-rose-500">-{orderedDiscount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold">
                <span className="text-slate-800">Tổng tiền thanh toán (COD):</span>
                <span className="text-blue-600 text-base">{orderedTotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <p className="text-[10px] text-slate-400 italic text-center pt-2">Nhân viên tổng đài sẽ liên hệ xác nhận đơn hàng với Anh/Chị trong vòng 10 phút.</p>
            </div>
          </div>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-bold transition-all shadow-md"
        >
          Tiếp tục mua sắm
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  // ---------------- STEP 1 & 2: EMPTY STATE ----------------
  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-36 pb-24 text-center">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Giỏ hàng của bạn đang trống</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Hãy duyệt qua các sản phẩm cao cấp tại Balomayanh và chọn cho mình chiếc balo ưng ý nhé.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          Khám phá sản phẩm
          <ArrowRight size={20} />
        </Link>
      </div>
    );
  }

  // ---------------- STEP 1 & 2: FILLED RENDER ----------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24">


      <h1 className="text-3xl font-extrabold text-slate-900 mb-8 border-l-4 border-blue-600 pl-4">
        {checkoutStep === 1 ? 'Giỏ hàng của bạn' : 'Thông tin đặt hàng'}
      </h1>

      <div className="grid min-w-0 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Switch depending on current step */}
        <div className="min-w-0 lg:col-span-2 space-y-6">
          
          {checkoutStep === 1 ? (
            // --- STEP 1: CART LIST ---
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <ul className="divide-y divide-slate-100">
                  {cartItems.map((item) => (
                    <li key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                      {/* Image */}
                      <Link 
                        to={`/product/${item.productId || item.id}`}
                        className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center p-2 border border-slate-100 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                      </Link>
                      
                      {/* Info */}
                      <div className="w-full min-w-0 flex-grow">
                        <h3 className="min-w-0 text-base font-bold text-slate-900 hover:text-[#2f5f88] transition-colors">
                          <Link to={`/product/${item.productId || item.id}`} className="block truncate">
                            {item.title}
                          </Link>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{item.category}</span>
                          {item.variantName && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="bg-[#2f5f88]/5 text-[#2f5f88] px-2 py-0.5 rounded text-[10px] font-bold">
                                Phân loại: {item.variantName}
                              </span>
                            </>
                          )}
                        </p>
                        <div className="text-blue-600 font-bold mt-2">
                          {item.price.toLocaleString('vi-VN')}đ
                        </div>
                      </div>

                      {/* Quantity Actions */}
                      <div className="flex items-center gap-3 border border-slate-200 rounded-lg p-1 bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
                          aria-label={`Giảm số lượng ${item.title}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
                          aria-label={`Tăng số lượng ${item.title}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                        aria-label={`Xóa ${item.title} khỏi giỏ hàng`}
                      >
                        <Trash2 size={20} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center px-2">
                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Xóa sạch giỏ hàng
                </button>
                <Link to="/products" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                  Tiếp tục mua sắm
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            // --- STEP 2: SHIPPING / CUSTOMER INFO FORM ---
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-in fade-in duration-300">
              <button 
                onClick={() => setCheckoutStep(1)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer mb-2"
              >
                <ChevronLeft size={16} />
                Quay lại Giỏ hàng
              </button>

              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">Thông tin nhận hàng</h2>
              
              <form onSubmit={handlePlaceOrder} className="space-y-6 text-slate-700 text-xs">
                {/* Salutation / Gender */}
                <div className="flex items-center gap-6">
                  <span className="font-semibold text-slate-600 w-24">Danh xưng:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="gender" 
                        value="Anh" 
                        checked={formData.gender === 'Anh'} 
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Anh</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="gender" 
                        value="Chị" 
                        checked={formData.gender === 'Chị'} 
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Chị</span>
                    </label>
                  </div>
                </div>

                {/* Name and Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="checkout-name" className="font-semibold text-slate-600">Họ và tên *</label>
                    <input 
                      id="checkout-name"
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange}
                      placeholder="Nhập đầy đủ họ và tên" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="checkout-phone" className="font-semibold text-slate-600">Số điện thoại *</label>
                    <input 
                      id="checkout-phone"
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange}
                      placeholder="Số điện thoại nhận hàng" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="checkout-email" className="font-semibold text-slate-600">Email (Để nhận hóa đơn điện tử)</label>
                  <input 
                    id="checkout-email"
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange}
                    placeholder="example@domain.com" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700"
                  />
                </div>

                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="grid sm:grid-cols-3 gap-4">
                      {/* Province */}
                      <div className="space-y-1.5">
                        <label htmlFor="checkout-province" className="font-semibold text-slate-500">Tỉnh / Thành phố *</label>
                        <select 
                          id="checkout-province"
                          name="province" 
                          value={formData.province} 
                          onChange={handleProvinceChange}
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        >
                          <option value="">-- Chọn Tỉnh/Thành --</option>
                          {Object.keys(locationData).map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      {/* District */}
                      <div className="space-y-1.5">
                        <label htmlFor="checkout-district" className="font-semibold text-slate-500">Quận / Huyện *</label>
                        <select 
                          id="checkout-district"
                          name="district" 
                          value={formData.district} 
                          onChange={handleDistrictChange}
                          disabled={!formData.province}
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 disabled:opacity-50"
                        >
                          <option value="">-- Chọn Quận/Huyện --</option>
                          {formData.province && locationData[formData.province]?.districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* Ward */}
                      <div className="space-y-1.5">
                        <label htmlFor="checkout-ward" className="font-semibold text-slate-500">Phường / Xã *</label>
                        <select 
                          id="checkout-ward"
                          name="ward" 
                          value={formData.ward} 
                          onChange={handleInputChange}
                          disabled={!formData.district}
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 disabled:opacity-50"
                        >
                          <option value="">-- Chọn Phường/Xã --</option>
                          {formData.province && formData.district && locationData[formData.province]?.wards[formData.district]?.map(w => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Street details */}
                    <div className="space-y-1.5">
                      <label htmlFor="checkout-street" className="font-semibold text-slate-500">Số nhà, tên đường *</label>
                      <input 
                        id="checkout-street"
                        type="text" 
                        name="street" 
                        value={formData.street} 
                        onChange={handleInputChange}
                        placeholder="Số nhà, ngõ, tên đường" 
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                      />
                    </div>
                  </div>

                {/* Company invoice toggle (VAT) */}
                <div className="border-t border-slate-100 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input 
                      type="checkbox" 
                      name="requestInvoice" 
                      checked={formData.requestInvoice} 
                      onChange={handleInputChange}
                      className="w-4.5 h-4.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300 cursor-pointer"
                    />
                    <span>Yêu cầu xuất hoá đơn giá trị gia tăng (VAT) cho doanh nghiệp</span>
                  </label>

                  {formData.requestInvoice && (
                    <div className="mt-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1.5">
                        <label htmlFor="invoice-company-name" className="font-semibold text-slate-500">Tên công ty *</label>
                        <input 
                          id="invoice-company-name"
                          type="text" 
                          name="companyName" 
                          value={formData.companyName} 
                          onChange={handleInputChange}
                          placeholder="Ví dụ: Công ty TNHH Giải Pháp Nhiếp Ảnh" 
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="invoice-tax-code" className="font-semibold text-slate-500">Mã số thuế *</label>
                          <input 
                            id="invoice-tax-code"
                            type="text" 
                            name="taxCode" 
                            value={formData.taxCode} 
                            onChange={handleInputChange}
                            placeholder="Mã số thuế doanh nghiệp" 
                            required
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="invoice-company-address" className="font-semibold text-slate-500">Địa chỉ công ty *</label>
                          <input 
                            id="invoice-company-address"
                            type="text" 
                            name="companyAddress" 
                            value={formData.companyAddress} 
                            onChange={handleInputChange}
                            placeholder="Địa chỉ đăng ký kinh doanh" 
                            required
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Info toggle */}
                <div className="border-t border-slate-100 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input 
                      type="checkbox" 
                      name="saveInfo" 
                      checked={formData.saveInfo} 
                      onChange={handleInputChange}
                      className="w-4.5 h-4.5 text-blue-600 focus:ring-blue-500 rounded border-slate-300 cursor-pointer"
                    />
                    <span>Lưu thông tin giao hàng cho lần thanh toán sau</span>
                  </label>
                </div>

                {/* Customer notes */}
                <div className="space-y-1.5 pt-6">
                  <label htmlFor="checkout-notes" className="font-semibold text-slate-600">Ghi chú giao nhận / thời gian liên hệ</label>
                  <textarea 
                    id="checkout-notes"
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleInputChange}
                    rows="3" 
                    placeholder="Ví dụ: Giao hàng vào giờ hành chính, gọi trước khi đến 15 phút..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700"
                  />
                </div>

                {/* Submit button hidden in form, triggered by checkout summary block */}
                <input type="submit" id="submitOrderBtn" className="hidden" />
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Order Summary Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Tóm tắt đơn hàng</h2>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính ({totalItems} sản phẩm)</span>
              <span className="font-semibold text-slate-900">{cartTotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển</span>
              <span className="font-semibold text-green-600">Miễn phí</span>
            </div>
            
            {tierDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Ưu đãi hạng {userTier === 'SILVER' ? 'Bạc' : userTier === 'GOLD' ? 'Vàng' : userTier === 'PLATINUM' ? 'Bạch kim' : userTier === 'VIP' ? 'VIP' : 'Đồng'} ({tierDiscount}%)</span>
                <span className="font-semibold">-{tierDiscountAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            
            <div className="border-t border-slate-100 pt-4 flex justify-between text-base font-bold text-slate-900">
              <span>Tổng tiền</span>
              <span className="text-blue-600 text-lg">{finalTotal.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>


          {/* Checkout triggers */}
          <div className="pt-2">
            {checkoutStep === 1 ? (
              <button
                onClick={() => {
                  if (!localStorage.getItem('currentUser')) {
                    setShowGuestModal(true);
                  } else {
                    setCheckoutStep(2);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 text-center cursor-pointer block"
              >
                Tiến hành thanh toán
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setPaymentMethod('COD');
                    document.getElementById('submitOrderBtn').click();
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/30 text-center cursor-pointer block text-xs"
                >
                  XÁC NHẬN ĐẶT HÀNG (COD)
                </button>
                <button
                  onClick={handleOpenPaymentDemo}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/15 text-center cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  <CreditCard size={14} />
                  THANH TOÁN ONLINE (DEMO)
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400 text-center mt-2.5">(Giá đã bao gồm VAT và đầy đủ hóa đơn chứng từ)</p>
          </div>

          {/* Security & Payment Badges */}
          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} className="text-blue-500" />
              Thanh toán an toàn bảo mật
            </span>
            <div className="flex flex-wrap justify-center gap-2 text-[9px] font-extrabold text-slate-400">
              <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">COD</span>
              <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">MOMO</span>
              <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">BANK TRANSFER</span>
              <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">VISA/MASTER</span>
            </div>
          </div>

        </div>

      </div>
      {/* Custom Alert Modal */}
      <CustomModal 
        isOpen={modalConfig.isOpen} 
        onClose={closeModal} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        type={modalConfig.type} 
      />

      {/* Guest Checkout Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <h3 className="font-extrabold text-slate-900 text-xl leading-tight mb-3">Mua Hàng Nhanh Chóng</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-8">
                Bạn có muốn đăng nhập để được <strong>tích lũy điểm thưởng</strong>, <strong>thăng hạng thành viên</strong> và dễ dàng quản lý đơn hàng không?
              </p>
              <div className="space-y-3">
                <Link
                  to="/auth?redirect=/cart"
                  className="w-full block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm"
                >
                  Đăng nhập để nhận ưu đãi
                </Link>
                <button
                  onClick={() => {
                    setShowGuestModal(false);
                    setCheckoutStep(2);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Tiếp tục mua hàng nhanh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <QrCode size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xl leading-tight">Thanh toán online</h3>
                  <p className="text-slate-500 text-sm">Mô phỏng cho demo, không trừ tiền thật.</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-6 text-center mb-6">
                <div className="w-40 h-40 mx-auto bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
                  <div className="grid grid-cols-6 gap-1 p-4">
                    {Array.from({ length: 36 }).map((_, index) => (
                      <span
                        key={index}
                        className={`block w-3 h-3 rounded-[2px] ${
                          index % 3 === 0 || index % 7 === 0 || index % 11 === 0 ? 'bg-slate-900' : 'bg-slate-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Quét mã giả lập hoặc bấm xác nhận để hoàn tất demo.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConfirmDemoPayment}
                  disabled={paymentDemoProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {paymentDemoProcessing ? <LoaderCircle size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  {paymentDemoProcessing ? 'Đang xác nhận...' : 'Xác nhận đã thanh toán (demo)'}
                </button>
                <button
                  onClick={() => setShowPaymentDemoModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
