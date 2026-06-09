import { useCallback, useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Trash2, Star, AlertCircle, Info, RefreshCw } from 'lucide-react';
import CustomModal from '../../components/CustomModal';

// Admin review moderation page with rating filters and review soft-delete action.
const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Star Rating Filter
  const [starFilter, setStarFilter] = useState(''); // '', '5', '4', '3', '2', '1'

  const fetchReviews = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchReviews();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

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
      <div className="flex gap-0.5 text-amber-500">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={12} 
            fill={i < rating ? "currentColor" : "none"} 
            className={i < rating ? "" : "text-slate-200"}
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading uppercase">Quản Lý Đánh Giá</h1>
          <p className="text-slate-500 text-xs mt-1">Kiểm duyệt phản hồi từ khách hàng và quản lý điểm số đánh giá sản phẩm.</p>
        </div>
        <button 
          onClick={fetchReviews} 
          className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-705 border border-slate-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Review Summary Stats & Filter row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Stats card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl border border-amber-100 flex-shrink-0">
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Điểm trung bình</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{avgRating} / 5.0</p>
            <p className="text-[10px] text-slate-450 font-bold">{reviews.length} đánh giá tích lũy</p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="sm:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Info size={16} className="text-blue-600 flex-shrink-0" />
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Bộ lọc theo điểm số đánh giá để kiểm duyệt các bình luận tiêu cực hoặc tích cực.
            </p>
          </div>
          <select
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-100 font-bold min-w-[150px] shadow-sm"
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
      <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden animate-in fade-in duration-200">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Đang tải danh sách đánh giá...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">Không tìm thấy đánh giá nào phù hợp với bộ lọc.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Điểm</th>
                  <th className="px-6 py-4">Nội dung bình luận</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-655 text-xs font-semibold">
                {filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 max-w-[220px]">
                      <div className="flex items-center gap-3">
                        <img 
                          src={rev.product?.image || rev.product?.imageUrl || '/images/thinktanklogo.png'} 
                          alt={rev.product?.name}
                          className="w-10 h-10 object-cover bg-slate-50 border border-slate-200 rounded-xl flex-shrink-0"
                          onError={(e) => { e.target.src = '/images/thinktanklogo.png'; }}
                        />
                        <span className="truncate text-slate-850 font-bold block text-xs" title={rev.product?.name}>
                          {rev.product?.name || `ID: ${rev.productId}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-850 text-xs">{rev.customer?.user?.fullName || 'Khách vãng lai'}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">{rev.customer?.user?.email || 'N/A'}</p>
                        {rev.customer?.user && (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-750 border border-emerald-150 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1.5">
                            ✓ Đã mua hàng
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderStars(rev.rating)}
                    </td>
                    <td className="px-6 py-4 max-w-[300px] whitespace-normal break-words text-slate-600 font-semibold leading-relaxed">
                      {rev.comment ? (
                        <p>"{rev.comment}"</p>
                      ) : (
                        <em className="text-slate-400 font-medium">Không có bình luận văn bản</em>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium text-[11px]">
                      {new Date(rev.createdAt || rev.updatedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-2 text-rose-600 hover:text-rose-705 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
