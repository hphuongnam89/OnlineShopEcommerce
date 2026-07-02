import { useCallback, useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Plus, Edit3, Trash2, Search, Download, AlertCircle } from 'lucide-react';
import CustomModal from '../../components/CustomModal';

// Admin customer management page for CRUD, spending filters, tier display, and export.
const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Filter and Search states
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [minSpent, setMinSpent] = useState('');
  const [maxSpent, setMaxSpent] = useState('');
  const [minOrders, setMinOrders] = useState('');
  const [maxOrders, setMaxOrders] = useState('');

  // Form states (In-place Editor)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [editingId, setEditingId] = useState(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totalSpent, setTotalSpent] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedTier) params.tierId = selectedTier;
      if (minSpent) params.minSpent = minSpent;
      if (maxSpent) params.maxSpent = maxSpent;
      if (minOrders) params.minOrders = minOrders;
      if (maxOrders) params.maxOrders = maxOrders;

      const data = await api.admin.customers.getAll(params);
      setCustomers(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedTier, minSpent, maxSpent, minOrders, maxOrders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCustomers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setTotalSpent('0');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c) => {
    setFormMode('edit');
    setEditingId(c.id);
    setFullName(c.user?.fullName || '');
    setPhone(c.user?.phone || '');
    setEmail(c.user?.email || '');
    setPassword('');
    setTotalSpent(c.totalSpent || '0');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setModalConfig({
        isOpen: true,
        title: 'Cảnh báo',
        message: 'Vui lòng điền các thông tin bắt buộc (Họ tên, SĐT, Email)!',
        type: 'warning'
      });
      return;
    }

    if (formMode === 'create' && !password.trim()) {
      setModalConfig({
        isOpen: true,
        title: 'Cảnh báo',
        message: 'Mật khẩu là bắt buộc khi tạo tài khoản mới!',
        type: 'warning'
      });
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password: password.trim() || null,
      totalSpent: parseFloat(totalSpent || 0)
    };

    try {
      if (formMode === 'create') {
        await api.admin.customers.create(payload);
        setModalConfig({
          isOpen: true,
          title: 'Thành công',
          message: 'Đã thêm khách hàng mới thành công!',
          type: 'success'
        });
      } else {
        await api.admin.customers.update(editingId, payload);
        setModalConfig({
          isOpen: true,
          title: 'Thành công',
          message: 'Đã cập nhật thông tin khách hàng thành công!',
          type: 'success'
        });
      }
      setIsFormOpen(false);
      fetchCustomers();
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Thất bại',
        message: err.message || 'Có lỗi xảy ra khi lưu khách hàng.',
        type: 'warning'
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      return;
    }

    try {
      await api.admin.customers.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      setModalConfig({
        isOpen: true,
        title: 'Thành công',
        message: 'Đã xóa khách hàng thành công khỏi hệ thống!',
        type: 'success'
      });
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Thất bại',
        message: err.message || 'Không thể xóa khách hàng.',
        type: 'warning'
      });
    }
  };

  const handleExportCustomers = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedTier) params.tierId = selectedTier;
      if (minSpent) params.minSpent = minSpent;
      if (maxSpent) params.maxSpent = maxSpent;
      if (minOrders) params.minOrders = minOrders;
      if (maxOrders) params.maxOrders = maxOrders;

      await api.admin.reports.downloadCustomers(params);
      setModalConfig({
        isOpen: true,
        title: 'Thành công',
        message: 'Tải báo cáo Excel thành công!',
        type: 'success'
      });
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Thất bại',
        message: err.message || 'Không thể xuất Excel.',
        type: 'warning'
      });
    }
  };

  const getTierClass = (tierName) => {
    switch (tierName) {
      case 'PLATINUM': return 'badge-metallic-platinum';
      case 'GOLD': return 'badge-metallic-gold';
      case 'SILVER': return 'badge-metallic-silver';
      case 'VIP': return 'badge-metallic-vip';
      default: return 'bg-slate-100 text-slate-655 border border-slate-200';
    }
  };

  const topCustomersBySpent = [...customers]
    .sort((a, b) => (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0))
    .slice(0, 8);
  const maxSpentValue = Math.max(...topCustomersBySpent.map(c => Number(c.totalSpent) || 0), 1);

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
                <li><a href="#!" onClick={() => setIsFormOpen(false)} className="hover:text-slate-600 transition-colors">Khách hàng</a></li>
                <li>/</li>
                <li className="text-slate-600">{formMode === 'create' ? 'Thêm khách hàng' : 'Cập nhật thông tin'}</li>
              </ol>
            </nav>
            <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading uppercase">
              {formMode === 'create' ? 'Thêm Khách Hàng Mới' : `Cập nhật: ${fullName}`}
            </h1>
            <p className="text-slate-500 text-xs mt-1">Cung cấp hồ sơ cá nhân và quản lý hạn VIP tích lũy.</p>
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
              onClick={handleSubmit}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Lưu thông tin
            </button>
          </div>
        </div>

        {/* 2-Column Editor Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Info Column (Left - 2/3 width) */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Hồ Sơ Cá Nhân</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Họ và tên *</label>
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
                    placeholder="0901234567"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    Mật khẩu {formMode === 'edit' && '(Chỉ điền nếu muốn đổi mới)'}
                  </label>
                  <input
                    type="password"
                    required={formMode === 'create'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={formMode === 'create' ? "Nhập mật khẩu tài khoản" : "••••••••"}
                    className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings / VIP Tier Info Column (Right - 1/3 width) */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Chi Tiêu Tích Lũy</h3>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tổng chi tiêu (đ)</label>
                <input
                  type="number"
                  min="0"
                  value={totalSpent}
                  onChange={(e) => setTotalSpent(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Hệ thống sẽ tự động đối chiếu doanh số này để nâng cấp thứ hạng thành viên tương ứng.</p>
              </div>
            </div>

            {/* VIP Tiers Policy Card */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 font-heading">Chính Sách VIP Tiers</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="badge-metallic-platinum px-2 py-0.5 rounded text-[9px] font-bold">PLATINUM</span>
                  <span className="font-semibold text-slate-700">&gt; 50.000.000 đ</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="badge-metallic-gold px-2 py-0.5 rounded text-[9px] font-bold">GOLD</span>
                  <span className="font-semibold text-slate-700">&gt; 20.000.000 đ</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="badge-metallic-silver px-2 py-0.5 rounded text-[9px] font-bold">SILVER</span>
                  <span className="font-semibold text-slate-700">&gt; 10.000.000 đ</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="badge-metallic-vip px-2 py-0.5 rounded text-[9px] font-bold">VIP</span>
                  <span className="font-semibold text-slate-700">&gt; 5.000.000 đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="bg-slate-100 text-slate-655 px-2 py-0.5 border border-slate-250 rounded text-[9px] font-bold">BRONZE</span>
                  <span className="font-semibold text-slate-500">Khác</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/60 mt-8">
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Lưu thông tin
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
          <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading uppercase">Quản Lý Khách Hàng</h1>
          <p className="text-slate-500 text-xs mt-1">Quản lý hồ sơ, chi tiêu tích lũy và cập nhật thứ hạng tự động.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCustomers}
            className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-705 font-bold py-2.5 px-4 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer shadow-sm"
          >
            <Download size={14} />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            <span>Thêm Khách Hàng</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Filter Options */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-200">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 font-medium"
            />
          </div>
          <button 
            type="submit"
            className="bg-white hover:bg-slate-50 text-slate-750 font-bold py-2.5 px-6 rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100/80">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Hạng thành viên</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
            >
              <option value="">Tất cả hạng</option>
              <option value="5">Bạch kim (PLATINUM - Chi tiêu &gt; 50M)</option>
              <option value="4">Vàng (GOLD - Chi tiêu &gt; 20M)</option>
              <option value="3">Bạc (SILVER - Chi tiêu &gt; 10M)</option>
              <option value="2">VIP (Chi tiêu &gt; 5M)</option>
              <option value="1">Đồng (BRONZE)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Chi tiêu tối thiểu (đ)</label>
            <input
              type="number"
              placeholder="Ví dụ: 5000000"
              value={minSpent}
              onChange={(e) => setMinSpent(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Chi tiêu tối đa (đ)</label>
            <input
              type="number"
              placeholder="Ví dụ: 20000000"
              value={maxSpent}
              onChange={(e) => setMaxSpent(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Số đơn tối thiểu</label>
            <input
              type="number"
              min="0"
              placeholder="Ví dụ: 2"
              value={minOrders}
              onChange={(e) => setMinOrders(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Số đơn tối đa</label>
            <input
              type="number"
              min="0"
              placeholder="Ví dụ: 10"
              value={maxOrders}
              onChange={(e) => setMaxOrders(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">Biểu đồ khách hàng theo tổng chi tiêu</h2>
            <p className="text-[10px] text-slate-400 mt-1">Top khách hàng đang dẫn đầu về doanh số tích lũy</p>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase">Top 8</span>
        </div>
        {topCustomersBySpent.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-xs">Chưa có dữ liệu khách hàng.</div>
        ) : (
          <div className="space-y-3">
            {topCustomersBySpent.map((customer) => {
              const spent = Number(customer.totalSpent) || 0;
              const width = Math.max((spent / maxSpentValue) * 100, spent > 0 ? 6 : 0);
              return (
                <div key={customer.id} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] gap-2">
                    <span className="font-bold text-slate-700 truncate pr-2">{customer.user?.fullName || customer.user?.email || `Khách hàng #${customer.id}`}</span>
                    <span className="font-mono font-bold text-slate-500 shrink-0">{spent.toLocaleString('vi-VN')} đ | {customer.orderCount || 0} đơn</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customers List Table */}
      <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden animate-in fade-in duration-200">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Đang tải danh sách khách hàng...</div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">Không tìm thấy khách hàng nào trên hệ thống.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Hạng thành viên</th>
                  <th className="px-6 py-4 text-center">Số đơn</th>
                  <th className="px-6 py-4 font-bold text-right">Tổng chi tiêu</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-655 text-xs font-semibold">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                      {c.user?.fullName || 'Khách vãng lai'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {c.user?.phone || 'Chưa cập nhật'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono">
                      {c.user?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getTierClass(c.tier?.name)}`}>
                        {c.tier?.name || 'BRONZE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-slate-700">
                      {c.orderCount || 0}
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-slate-900 text-right text-sm">
                      {c.totalSpent?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 text-blue-600 hover:text-blue-705 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Sửa khách hàng"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa khách hàng"
                        >
                          <Trash2 size={14} />
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

export default AdminCustomers;
