import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Plus, Edit3, Trash2, Search, Download, Filter, UserCheck, AlertCircle } from 'lucide-react';
import CustomModal from '../../components/CustomModal';

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

  // Form states (Add/Edit Modal)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [editingId, setEditingId] = useState(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totalSpent, setTotalSpent] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [selectedTier, minSpent, maxSpent]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedTier) params.tierId = selectedTier;
      if (minSpent) params.minSpent = minSpent;
      if (maxSpent) params.maxSpent = maxSpent;

      const data = await api.admin.customers.getAll(params);
      setCustomers(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  };

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
      case 'PLATINUM': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'GOLD': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'SILVER': return 'bg-slate-300/10 text-slate-300 border border-slate-300/20';
      case 'VIP': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Quản Lý Khách Hàng</h1>
          <p className="text-slate-400 mt-1">Danh sách khách hàng, phân hạng Bạch kim/Vàng/Bạc và lịch sử chi tiêu.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCustomers}
            className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
          >
            <Download size={16} />
            <span>Xuất Excel Nhóm</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>Thêm Khách Hàng</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Filter Options */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
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
            <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase">Hạng thành viên</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase">Chi tiêu tối thiểu (đ)</label>
            <input
              type="number"
              placeholder="Ví dụ: 5000000"
              value={minSpent}
              onChange={(e) => setMinSpent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-700"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase">Chi tiêu tối đa (đ)</label>
            <input
              type="number"
              placeholder="Ví dụ: 20000000"
              value={maxSpent}
              onChange={(e) => setMaxSpent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Đang tải danh sách khách hàng...</div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-slate-500">Không tìm thấy khách hàng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-900/50">
                  <th className="px-6 py-4">Họ và tên</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Hạng thành viên</th>
                  <th className="px-6 py-4 font-semibold text-right">Tổng chi tiêu</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {c.user?.fullName || 'Khách vãng lai'}
                    </td>
                    <td className="px-6 py-4">
                      {c.user?.phone || 'Chưa cập nhật'}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {c.user?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getTierClass(c.tier?.name)}`}>
                        {c.tier?.name || 'BRONZE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400 text-right">
                      {c.totalSpent?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer"
                          title="Sửa khách hàng"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Xóa khách hàng"
                        >
                          <Trash2 size={15} />
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

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto pt-24 pb-12">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-bold text-white">
                {formMode === 'create' ? 'Thêm Khách Hàng Mới' : 'Sửa Khách Hàng'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Mật khẩu {formMode === 'edit' && '(Chỉ điền nếu muốn đổi mới)'}
                </label>
                <input
                  type="password"
                  required={formMode === 'create'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Tổng chi tiêu (đ)</label>
                <input
                  type="number"
                  min="0"
                  value={totalSpent}
                  onChange={(e) => setTotalSpent(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
                  Lưu thay đổi
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

export default AdminCustomers;
