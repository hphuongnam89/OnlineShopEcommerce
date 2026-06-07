import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Trash2, Star, CheckCircle, AlertCircle } from 'lucide-react';
import CustomModal from '../../components/CustomModal';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

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
            size={14} 
            fill={i < rating ? "currentColor" : "none"} 
            className={i < rating ? "" : "text-slate-600"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Quản Lý Đánh Giá</h1>
          <p className="text-slate-400 mt-1">Kiểm duyệt các phản hồi và đánh giá từ khách hàng.</p>
        </div>
        <button 
          onClick={fetchReviews} 
          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-xl border border-slate-700 text-sm transition-colors cursor-pointer"
        >
          Tải lại
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* List / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center text-slate-500">Không tìm thấy đánh giá nào trên hệ thống.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-900/50">
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Điểm</th>
                  <th className="px-6 py-4">Nội dung bình luận</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white max-w-[200px] truncate">
                      {rev.product?.name || `ID: ${rev.productId}`}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-200">{rev.customer?.user?.fullName || 'Khách vãng lai'}</p>
                        <p className="text-xs text-slate-500">{rev.customer?.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderStars(rev.rating)}
                    </td>
                    <td className="px-6 py-4 max-w-[300px] whitespace-normal break-words text-slate-400">
                      {rev.comment || <em className="text-slate-600">Không có nội dung</em>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(rev.createdAt || rev.updatedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        title="Xóa đánh giá"
                      >
                        <Trash2 size={16} />
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
