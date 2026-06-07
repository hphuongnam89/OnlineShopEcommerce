import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Trash2, Star, AlertCircle, Info } from 'lucide-react';
import CustomModal from '../../components/CustomModal';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Star Rating Filter
  const [starFilter, setStarFilter] = useState(''); // '', '5', '4', '3', '2', '1'

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.reviews.getAll();
      setReviews(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này sẽ cập nhật lại điểm đánh giá trung bình của sản phẩm.')) {
      return;
    }

    try {
      await api.admin.reviews.delete(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      setModalConfig({
        isOpen: true,
        title: 'Thành công',
        message: 'Đã xóa đánh giá thành công khỏi hệ thống!',
        type: 'success'
      });
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Thất bại',
        message: err.message || 'Có lỗi xảy ra khi xóa đánh giá.',
        type: 'warning'
      });
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5 text-amber-400">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={13} 
            fill={i < rating ? "currentColor" : "none"} 
            className={i < rating ? "drop-shadow-[0_0_4px_rgba(245,158,11,0.2)]" : "text-slate-700"}
          />
        ))}
      </div>
    );
  };

  // Filter reviews based on star selection
  const filteredReviews = reviews.filter(rev => {
    if (!starFilter) return true;
    return String(rev.rating) === String(starFilter);
  });

  // Calculate statistics
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Quản Lý Đánh Giá</h1>
          <p className="text-slate-400 text-sm mt-1">Kiểm duyệt các phản hồi, bình luận và đánh giá chất lượng sản phẩm.</p>
        </div>
        <button 
          onClick={fetchReviews} 
          className="bg-slate-900 hover:bg-slate-850 text-white font-semibold py-2 px-4 rounded-xl border border-slate-800 text-xs transition-colors cursor-pointer"
        >
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Review Summary Stats & Filter row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stats card */}
        <div className="admin-glass-card rounded-2xl p-4 flex items-center gap-4">
          <div className="bg-amber-500/10 text-amber-450 p-3 rounded-xl border border-amber-500/15">
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Điểm đánh giá trung bình</p>
            <p className="text-lg font-black text-white mt-0.5">{avgRating} / 5.0 ({reviews.length} đánh giá)</p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="sm:col-span-2 admin-glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-indigo-400" />
            <p className="text-xs text-slate-400 font-semibold">Bộ lọc theo số điểm đánh giá sản phẩm</p>
          </div>
          <select
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold min-w-[150px]"
          >
            <option value="">Tất cả đánh giá</option>
            <option value="5">5 Sao ⭐⭐⭐⭐⭐</option>
            <option value="4">4 Sao ⭐⭐⭐⭐</option>
            <option value="3">3 Sao ⭐⭐⭐</option>
            <option value="2">2 Sao ⭐⭐</option>
            <option value="1">1 Sao ⭐</option>
          </select>
        </div>
      </div>

      {/* List / Table */}
      <div className="admin-glass-card rounded-3xl overflow-hidden animate-in fade-in duration-200">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Đang tải danh sách đánh giá...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-20 text-center text-slate-500">Không tìm thấy đánh giá nào phù hợp với bộ lọc.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-900/40">
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Điểm</th>
                  <th className="px-6 py-4">Nội dung bình luận</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-350 text-xs font-semibold">
                {filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate">
                      {rev.product?.name || `ID: ${rev.productId}`}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-200">{rev.customer?.user?.fullName || 'Khách vãng lai'}</p>
                        <p className="text-[10px] text-slate-550 mt-0.5">{rev.customer?.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderStars(rev.rating)}
                    </td>
                    <td className="px-6 py-4 max-w-[280px] whitespace-normal break-all text-slate-400 font-medium">
                      {rev.comment || <em className="text-slate-700">Không có bình luận chữ</em>}
                    </td>
                    <td className="px-6 py-4 text-slate-550">
                      {new Date(rev.createdAt || rev.updatedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-2 text-rose-450 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        title="Xóa đánh giá"
                      >
                        <Trash2 size={14} />
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

export default AdminReviews;
