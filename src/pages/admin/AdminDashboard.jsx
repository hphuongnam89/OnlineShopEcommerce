import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Download, 
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';
import CustomModal from '../../components/CustomModal';

const AdminDashboard = () => {
  const [revenueReport, setRevenueReport] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive chart hover states
  const [hoveredPoint, setHoveredPoint] = useState(null);

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
      const revData = await api.admin.reports.getRevenue();
      setRevenueReport(revData || []);
      const prodData = await api.products.getAll();
      setProducts(prodData || []);
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

  // Calculations
  const totalRevenue = revenueReport.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const totalOrdersCount = revenueReport.reduce((acc, curr) => acc + (curr.orderCount || 0), 0);
  
  // Products out of stock / low stock alerts
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
  const lowStockProducts = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 3);

  // SVG Chart Dimensions
  const height = 240;
  const width = 680;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 40;

  // Render SVG Revenue Chart with Hover Tooltip
  const renderRevenueChart = () => {
    if (revenueReport.length === 0) {
      return (
        <div className="h-48 flex flex-col items-center justify-center text-slate-500">
          <Info size={28} className="mb-2 text-slate-600" />
          <p className="text-sm font-semibold">Chưa có dữ liệu thống kê doanh số</p>
        </div>
      );
    }

    const maxVal = Math.max(...revenueReport.map(r => r.totalRevenue || 1), 1000000);
    
    // Grid coordinates mapping
    const points = revenueReport.map((r, i) => {
      const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / (revenueReport.length - 1 || 1);
      const y = height - paddingBottom - ((r.totalRevenue || 0) * (height - paddingTop - paddingBottom)) / maxVal;
      return { x, y, ...r };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPathData = points.length > 0 
      ? `${pathData} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
      : '';

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#334155" strokeWidth="0.5" strokeDasharray="3" />
          <line x1={paddingLeft} y1={(height - paddingBottom - paddingTop) / 2 + paddingTop} x2={width - paddingRight} y2={(height - paddingBottom - paddingTop) / 2 + paddingTop} stroke="#334155" strokeWidth="0.5" strokeDasharray="3" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#475569" strokeWidth="1" />

          {/* Left Y-axis labels */}
          <text x={paddingLeft - 10} y={paddingTop + 4} fill="#64748b" fontSize="9" textAnchor="end" fontWeight="bold">
            {(maxVal / 1000000).toFixed(1)}M
          </text>
          <text x={paddingLeft - 10} y={(height - paddingBottom - paddingTop) / 2 + paddingTop + 4} fill="#64748b" fontSize="9" textAnchor="end" fontWeight="bold">
            {(maxVal / 2000000).toFixed(1)}M
          </text>
          <text x={paddingLeft - 10} y={height - paddingBottom + 4} fill="#64748b" fontSize="9" textAnchor="end" fontWeight="bold">
            0 đ
          </text>

          {/* Area Fill */}
          <path d={fillPathData} fill="url(#chartGrad)" />

          {/* Line Chart */}
          <path d={pathData} fill="none" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* interactive Hover Line */}
          {hoveredPoint && (
            <line 
              x1={hoveredPoint.x} 
              y1={paddingTop} 
              x2={hoveredPoint.x} 
              y2={height - paddingBottom} 
              stroke="#4f46e5" 
              strokeWidth="1.5" 
              strokeDasharray="4"
            />
          )}

          {/* Circles / Interactive Nodes */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={hoveredPoint && hoveredPoint.date === p.date ? "7" : "4.5"} 
                fill={hoveredPoint && hoveredPoint.date === p.date ? "#818cf8" : "#6366f1"} 
                stroke="#030712" 
                strokeWidth="2.5" 
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <text 
                x={p.x} 
                y={height - paddingBottom + 18} 
                fill="#64748b" 
                fontSize="9" 
                fontWeight="bold"
                textAnchor="middle"
              >
                {new Date(p.date).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })}
              </text>
            </g>
          ))}
        </svg>

        {/* Floating HTML Tooltip overlay */}
        {hoveredPoint && (
          <div 
            className="absolute bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 shadow-2xl text-xs space-y-1.5 z-40 transition-all pointer-events-none"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 30}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="font-semibold text-slate-400">{new Date(hoveredPoint.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <p className="font-bold text-white">Doanh thu: <span className="text-emerald-400 font-extrabold">{hoveredPoint.totalRevenue?.toLocaleString('vi-VN')} đ</span></p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p className="font-semibold text-slate-300">Đơn hàng: <span className="text-white font-bold">{hoveredPoint.orderCount} đơn</span></p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Báo Cáo Hoạt Động</h1>
          <p className="text-slate-400 text-sm mt-1">Tổng quan doanh thu bán lẻ, biến động kho hàng và xuất báo cáo.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 px-4 rounded-xl border border-slate-800 text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-md"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="admin-glass-card rounded-3xl p-6 flex items-center gap-5">
          <div className="bg-indigo-600/10 text-indigo-400 p-4 rounded-2xl border border-indigo-500/20">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Doanh thu thống kê</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {loading ? '---' : totalRevenue.toLocaleString('vi-VN')} đ
            </h3>
          </div>
        </div>

        <div className="admin-glass-card rounded-3xl p-6 flex items-center gap-5">
          <div className="bg-emerald-600/10 text-emerald-400 p-4 rounded-2xl border border-emerald-500/20">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Tổng đơn hàng</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {loading ? '---' : totalOrdersCount} đơn
            </h3>
          </div>
        </div>

        {/* Stock Alert Summary Card */}
        <div className={`admin-glass-card rounded-3xl p-6 flex items-center gap-5 border ${
          outOfStockProducts.length > 0 ? 'border-rose-500/20 shadow-rose-950/10' : 'border-slate-800/80'
        }`}>
          <div className={`p-4 rounded-2xl border ${
            outOfStockProducts.length > 0 
              ? 'bg-rose-600/10 text-rose-400 border-rose-500/20' 
              : 'bg-amber-600/10 text-amber-400 border-amber-500/20'
          }`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Cảnh báo tồn kho</p>
            <h3 className="text-base font-bold text-white mt-1">
              {outOfStockProducts.length} hết hàng | {lowStockProducts.length} sắp hết
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Card */}
        <div className="lg:col-span-2 admin-glass-card rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-white tracking-tight uppercase">Xu hướng doanh thu hàng ngày</h2>
            <span className="text-[10px] text-slate-500 font-bold">Di chuột vào chấm tròn để xem số liệu</span>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-500">Đang dựng biểu đồ thống kê...</div>
          ) : (
            renderRevenueChart()
          )}
        </div>

        {/* Order Reports Exporter Panel */}
        <div className="admin-glass-card rounded-3xl p-6 space-y-5">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Xuất Báo Cáo Đơn Hàng</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Tìm kiếm (Tên/SĐT)</label>
              <input
                type="text"
                placeholder="Tìm khách nhận..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-700 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Từ ngày</label>
                <input
                  type="date"
                  value={orderStart}
                  onChange={(e) => setOrderStart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Đến ngày</label>
                <input
                  type="date"
                  value={orderEnd}
                  onChange={(e) => setOrderEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Trạng thái đơn</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
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
              className="w-full admin-glow-btn text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2 mt-2 text-xs"
            >
              <Download size={14} />
              <span>Tải file Excel báo cáo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stock warning list panel */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="admin-glass-card rounded-3xl p-6">
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={16} />
            <span>Sản phẩm cần bổ sung hàng</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outOfStockProducts.map(p => (
              <div key={p.id} className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-4 flex justify-between items-center">
                <div className="min-w-0">
                  <p className="font-bold text-white text-xs truncate max-w-[180px]">{p.name || p.title}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.sku}</p>
                </div>
                <span className="bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-rose-500/10">
                  Hết hàng
                </span>
              </div>
            ))}
            {lowStockProducts.map(p => (
              <div key={p.id} className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 flex justify-between items-center">
                <div className="min-w-0">
                  <p className="font-bold text-white text-xs truncate max-w-[180px]">{p.name || p.title}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.sku}</p>
                </div>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-500/10">
                  Còn {p.stock} sp
                </span>
              </div>
            ))}
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

export default AdminDashboard;
