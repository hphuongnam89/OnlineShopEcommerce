import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, BadgeCheck, ChevronRight, Mail, MapPin, Phone, Save, ShoppingBag, TrendingUp, UserRound } from 'lucide-react';
import CustomModal from '../components/CustomModal';
import { api, clearAuthSession, getValidToken } from '../utils/api';

// Customer profile page for viewing account email and editing personal information.
const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [tierName, setTierName] = useState('BRONZE');
  const [totalSpent, setTotalSpent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [nextTierName, setNextTierName] = useState('');
  const [amountToNextTier, setAmountToNextTier] = useState(0);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString('vi-VN') + 'đ';
  };

  const formatTierName = (name) => {
    const normalized = (name || 'BRONZE').replace('ROLE_', '').toUpperCase();
    const labels = {
      BRONZE: 'Đồng',
      VIP: 'VIP',
      SILVER: 'Bạc',
      GOLD: 'Vàng',
      PLATINUM: 'Bạch kim',
      CUSTOMER: 'Thành viên'
    };
    return labels[normalized] || normalized;
  };

  useEffect(() => {
    const token = getValidToken();
    if (!token) {
      clearAuthSession();
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await api.profile.get();
        setFullName(profile.fullName || '');
        setPhone(profile.phone || '');
        setEmail(profile.email || '');
        setAddress(profile.address || '');
        setTierName(profile.tierName || 'BRONZE');
        setTotalSpent(profile.totalSpent || 0);
        setDiscountPercent(profile.discountPercent || 0);
        setNextTierName(profile.nextTierName || '');
        setAmountToNextTier(profile.amountToNextTier || 0);
      } catch (error) {
        setModalConfig({
          isOpen: true,
          title: 'Không thể tải thông tin',
          message: error.message || 'Vui lòng đăng nhập lại để xem thông tin tài khoản.',
          type: 'warning'
        });
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setModalConfig({
        isOpen: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập đầy đủ họ tên và số điện thoại.',
        type: 'warning'
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await api.profile.update({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim()
      });

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({
        ...currentUser,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role
      }));
      window.dispatchEvent(new Event('storage'));

      setFullName(updated.fullName || '');
      setPhone(updated.phone || '');
      setEmail(updated.email || '');
      setAddress(updated.address || '');
      setTierName(updated.tierName || 'BRONZE');
      setTotalSpent(updated.totalSpent || 0);
      setDiscountPercent(updated.discountPercent || 0);
      setNextTierName(updated.nextTierName || '');
      setAmountToNextTier(updated.amountToNextTier || 0);
      setModalConfig({
        isOpen: true,
        title: 'Đã cập nhật',
        message: 'Thông tin tài khoản của bạn đã được lưu thành công.',
        type: 'success'
      });
    } catch (error) {
      setModalConfig({
        isOpen: true,
        title: 'Cập nhật thất bại',
        message: error.message || 'Không thể lưu thông tin tài khoản.',
        type: 'warning'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-40 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600 mb-2">Tài khoản</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-950">Thông tin của tôi</h1>
          <p className="text-slate-500 mt-3 max-w-2xl">Quản lý thông tin cá nhân dùng cho đặt hàng, giao hàng và nhận hỗ trợ từ Balomayanh.</p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          <aside className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5">
                <UserRound size={30} />
              </div>
              <h2 className="font-semibold text-slate-900 text-lg">{fullName || 'Khách hàng'}</h2>
              <p className="text-sm text-slate-500 break-all mt-1">{email}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-400">Trạng thái</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">Đang hoạt động</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-400">Hạng thành viên</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{formatTierName(tierName)}</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Award size={18} />
                    <span className="text-sm font-semibold">Ưu đãi hạng {formatTierName(tierName)}</span>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {discountPercent || 0}%
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Đã chi tiêu {formatCurrency(totalSpent)}. {nextTierName
                    ? `Cần thêm ${formatCurrency(amountToNextTier)} để lên hạng ${formatTierName(nextTierName)}.`
                    : 'Bạn đang ở hạng cao nhất.'}
                </p>
              </div>

              <div className="mt-5 flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <BadgeCheck size={16} className="mt-0.5 flex-shrink-0" />
                <span>Hạng thành viên được cập nhật theo tổng giá trị đơn hàng đã giao.</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="px-2 pb-2 text-xs font-semibold text-slate-400">Lối tắt</p>
              <Link
                to="/my-orders"
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag size={18} />
                  Đơn hàng của tôi
                </span>
                <ChevronRight size={18} />
              </Link>
              <div className="mt-2 rounded-xl px-3 py-3 text-sm text-slate-500">
                <div className="flex items-start gap-2">
                  <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{address || 'Chưa có địa chỉ giao hàng mặc định'}</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-xl">Hồ sơ cá nhân</h2>
              <p className="text-sm text-slate-500 mt-1">Email dùng để đăng nhập nên tạm thời chỉ hiển thị, chưa cho sửa trực tiếp.</p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500 text-sm font-semibold">Đang tải thông tin tài khoản...</div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="profile-full-name" className="text-xs font-semibold text-slate-500">Họ và tên</label>
                  <div className="relative">
                    <UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="profile-full-name"
                      name="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="profile-email" className="text-xs font-semibold text-slate-500">Email đăng nhập</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      value={email}
                      disabled
                      autoComplete="email"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="profile-phone" className="text-xs font-semibold text-slate-500">Số điện thoại</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="profile-phone"
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="profile-address" className="text-xs font-semibold text-slate-500">Địa chỉ giao hàng mặc định</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-4 text-slate-400" />
                    <textarea
                      id="profile-address"
                      name="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      autoComplete="street-address"
                      rows={3}
                      className="w-full resize-none bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      placeholder="Nhập địa chỉ nhận hàng"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <TrendingUp size={18} className="mt-0.5 flex-shrink-0" />
                    <p>
                      {nextTierName
                        ? `Mua thêm ${formatCurrency(amountToNextTier)} để lên hạng ${formatTierName(nextTierName)} và nhận ưu đãi tốt hơn.`
                        : 'Bạn đang ở hạng thành viên cao nhất, các ưu đãi hiện tại sẽ tự áp dụng khi đặt hàng.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl shadow-sm transition-colors"
                  >
                    <Save size={18} />
                    {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                </div>
              </form>
            )}
          </section>
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
};

export default Profile;
