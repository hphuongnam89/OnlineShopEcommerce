import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Download, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import CustomModal from '../../components/CustomModal';

const AdminDashboard = () => {
  const [revenueReport, setRevenueReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Export parameters
  const [orderStart, setOrderStart] = useState('');
  const [orderEnd, setOrderEnd] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.reports.getRevenue();
      setRevenueReport(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải báo cáo doanh thu.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportOrders = async () => {
    try {
      const params = {};
      if (orderStart) params.startDate = `${orderStart}T00:00:00`;
      if (orderEnd) params.endDate = `${orderEnd}T23:59:59`;
      if (orderStatus) params.status = orderStatus;
      if (orderSearch) params.search = orderSearch;

      await api.admin.reports.downloadOrders(params);
      setModalConfig({
        isOpen: true,
        title: 'Thành công',
        message: 'Báo cáo đơn hàng đã được tải xuống dưới dạng file Excel (.xlsx)!',
        type: 'success'
      });
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Lỗi xuất Excel',
        message: err.message || 'Có lỗi xảy ra khi tải xuống báo cáo.',
        type: 'warning'
      });
    }
  };

  // Helper values
  const totalRevenue = revenueReport.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const totalOrdersCount = revenueReport.reduce((acc, curr) => acc + (curr.orderCount || 0), 0);

  // SVG Chart Calculation (Daily Revenue)
  const renderRevenueChart = () => {
    if (revenueReport.length === 0) return <p className="text-slate-400 text-center py-10">Không có dữ liệu doanh số</p>;

    const maxVal = Math.max(...revenueReport.map(r => r.totalRevenue || 1), 1000000);
    const height = 180;
    const width = 600;
    const padding = 40;

    const points = revenueReport.map((r, i) => {
      const x = padding + (i * (width - 2 * padding)) / (revenueReport.length - 1 || 1);
      const y = height - padding - ((r.totalRevenue || 0) * (height - 2 * padding)) / maxVal;
      return { x, y, ...r };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPathData = points.length > 0 
      ? `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#475569" />

          {/* Area Fill */}
          <path d={fillPathData} fill="url(#chartGrad)" />

          {/* Line Chart */}
          <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="3" />

          {/* Circles */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
              <text 
                x={p.x} 
                y={height - 15} 
                fill="#94a3b8" 
                fontSize="8" 
                textAnchor="middle"
              >
                {new Date(p.date).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard Quản Trị</h1>
          <p className="text-slate-400 mt-1">Phân tích thống kê doanh thu và báo cáo hệ thống.</p>
        </div>
        <button 
          onClick={fetchDashboardData} 
          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl border border-slate-700 text-sm transition-colors cursor-pointer"
        >
          Tải lại dữ liệu
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-5">
          <div className="bg-blue-600/10 text-blue-400 p-4 rounded-2xl border border-blue-500/15">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Doanh Thu (Tháng/Tuần)</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {loading ? '---' : totalRevenue.toLocaleString('vi-VN')} đ
            </h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-5">
          <div className="bg-emerald-600/10 text-emerald-400 p-4 rounded-2xl border border-emerald-500/15">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Đơn Hàng Ghi Nhận</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {loading ? '---' : totalOrdersCount} đơn
            </h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-5">
          <div className="bg-violet-600/10 text-violet-400 p-4 rounded-2xl border border-violet-500/15">
            <Users size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Báo Cáo</p>
            <h3 className="text-sm font-semibold text-white mt-1">
              Hoạt động ổn định
            </h3>
          </div>
        </div>
      </div>

      {/* Charts & Exports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Biểu Đồ Doanh Thu Tổng Hợp Hàng Ngày</h2>
          {loading ? (
            <div className="h-44 flex items-center justify-center text-slate-500">Đang tạo biểu đồ...</div>
          ) : (
            renderRevenueChart()
          )}
        </div>

        {/* Exports Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white">Xuất Báo Cáo Đơn Hàng</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Tìm kiếm (Tên/SĐT)</label>
              <input
                type="text"
                placeholder="Nhập từ khóa tìm kiếm..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Từ ngày</label>
                <input
                  type="date"
                  value={orderStart}
                  onChange={(e) => setOrderStart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Đến ngày</label>
                <input
                  type="date"
                  value={orderEnd}
                  onChange={(e) => setOrderEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Trạng thái đơn</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý (PENDING)</option>
                <option value="SHIPPING">Đang giao (SHIPPING)</option>
                <option value="DELIVERED">Đã giao (DELIVERED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
            </div>

            <button
              onClick={handleExportOrders}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer flex justify-center items-center gap-2 mt-2"
            >
              <Download size={16} />
              <span>Xuất Excel Đơn Hàng</span>
            </button>
          </div>
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

export default AdminDashboard;
