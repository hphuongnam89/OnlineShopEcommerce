import { useCallback, useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  Download, 
  AlertTriangle,
  RefreshCw,
  Info,
  XCircle
} from 'lucide-react';
import CustomModal from '../../components/CustomModal';

// Admin dashboard for revenue chart, customer chart, low-stock alerts, and Excel export.
const AdminDashboard = () => {
  const [revenueReport, setRevenueReport] = useState([]);
  const [customerReport, setCustomerReport] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderCounts, setOrderCounts] = useState({ total: 0, pending: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive chart hover states
  const [hoveredPoint, setHoveredPoint] = useState(null);
 
  // Export parameters
  const [orderStart, setOrderStart] = useState('');
  const [orderEnd, setOrderEnd] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [reportPeriod, setReportPeriod] = useState('DAILY');
 
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
 
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const revData = await api.admin.reports.getRevenue({ period: reportPeriod });
      setRevenueReport(revData || []);
      const customerData = await api.admin.reports.getCustomerReport();
      setCustomerReport(customerData || []);
      const prodData = await api.products.getAll();
      setProducts(prodData || []);
      const [ordData, pendingData, cancelledData] = await Promise.all([
        api.admin.orders.getAll({ page: 0, size: 5 }),
        api.admin.orders.getAll({ page: 0, size: 1, status: 'PENDING' }),
        api.admin.orders.getAll({ page: 0, size: 1, status: 'CANCELLED' }),
      ]);
      setOrders(ordData?.content || []);
      setOrderCounts({
        total: ordData?.totalElements || 0,
        pending: pendingData?.totalElements || 0,
        cancelled: cancelledData?.totalElements || 0,
      });
    } catch (err) {
      setError(err.message || 'Không thể tải báo cáo doanh thu.');
    } finally {
      setLoading(false);
    }
  }, [reportPeriod]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);
 
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
  const totalRevenue = revenueReport.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalOrdersCount = orderCounts.total;
  const pendingOrdersCount = orderCounts.pending;
  const cancelledOrdersCount = orderCounts.cancelled;
  
  // Products out of stock / low stock alerts
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
  const lowStockProducts = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 3);
 
  // Recent 5 orders
  const recentOrders = [...orders]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);
 
  // SVG Chart Dimensions
  const height = 240;
  const width = 680;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 40;
 
  const getStatusClass = (statusStr) => {
    switch (statusStr) {
      case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
      case 'SHIPPING': return 'bg-blue-50 text-blue-700 border border-blue-200/50';
      case 'CANCELLED': return 'bg-rose-50 text-rose-700 border border-rose-200/50';
      default: return 'bg-amber-50 text-amber-700 border border-amber-200/50';
    }
  };
 
  // Render SVG Revenue Chart with Hover Tooltip
  const renderRevenueChart = () => {
    if (revenueReport.length === 0) {
      return (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400">
          <Info size={28} className="mb-2 text-slate-300" />
          <p className="text-xs font-semibold">Chưa có dữ liệu thống kê doanh số</p>
        </div>
      );
    }
 
    const maxVal = Math.max(...revenueReport.map(r => r.revenue || 1), 1000000);
    
    // Grid coordinates mapping
    const points = revenueReport.map((r, i) => {
      const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / (revenueReport.length - 1 || 1);
      const y = height - paddingBottom - ((r.revenue || 0) * (height - paddingTop - paddingBottom)) / maxVal;
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
              <stop offset="0%" stopColor="#cc0000" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#cc0000" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="3" />
          <line x1={paddingLeft} y1={(height - paddingBottom - paddingTop) / 2 + paddingTop} x2={width - paddingRight} y2={(height - paddingBottom - paddingTop) / 2 + paddingTop} stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="3" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#cbd5e1" strokeWidth="1" />
 
          {/* Left Y-axis labels */}
          <text x={paddingLeft - 10} y={paddingTop + 4} fill="#94a3b8" fontSize="9" textAnchor="end" fontWeight="bold">
            {(maxVal / 1000000).toFixed(1)}M
          </text>
          <text x={paddingLeft - 10} y={(height - paddingBottom - paddingTop) / 2 + paddingTop + 4} fill="#94a3b8" fontSize="9" textAnchor="end" fontWeight="bold">
            {(maxVal / 2000000).toFixed(1)}M
          </text>
          <text x={paddingLeft - 10} y={height - paddingBottom + 4} fill="#94a3b8" fontSize="9" textAnchor="end" fontWeight="bold">
            0 đ
          </text>
 
          {/* Area Fill */}
          <path d={fillPathData} fill="url(#chartGrad)" />
 
          {/* Line Chart */}
          <path d={pathData} fill="none" stroke="#cc0000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
 
          {/* interactive Hover Line */}
          {hoveredPoint && (
            <line 
              x1={hoveredPoint.x} 
              y1={paddingTop} 
              x2={hoveredPoint.x} 
              y2={height - paddingBottom} 
              stroke="#3b82f6" 
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
                r={hoveredPoint && hoveredPoint.date === p.date ? "6.5" : "4"} 
                fill={hoveredPoint && hoveredPoint.date === p.date ? "#d13205" : "#cc0000"} 
                stroke="#ffffff" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <text 
                x={p.x} 
                y={height - paddingBottom + 18} 
                fill="#94a3b8" 
                fontSize="9" 
                fontWeight="bold"
                textAnchor="middle"
              >
                {p.date}
              </text>
            </g>
          ))}
        </svg>
 
        {/* Floating HTML Tooltip overlay */}
        {hoveredPoint && (
          <div 
            className="absolute bg-white border border-slate-200/80 rounded-xl p-3 shadow-lg text-xs space-y-1 z-40 transition-all pointer-events-none"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 30}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="font-bold text-slate-400">{hoveredPoint.date}</p>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <p className="font-bold text-slate-800">Doanh thu: <span className="text-emerald-600 font-extrabold">{hoveredPoint.revenue?.toLocaleString('vi-VN')} đ</span></p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p className="font-semibold text-slate-600">Đơn hàng: <span className="text-slate-800 font-bold">{hoveredPoint.orderCount} đơn</span></p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCustomerChart = () => {
    if (customerReport.length === 0) {
      return (
        <div className="h-40 flex flex-col items-center justify-center text-slate-400">
          <Info size={24} className="mb-2 text-slate-300" />
          <p className="text-xs font-semibold">Chưa có dữ liệu khách hàng</p>
        </div>
      );
    }

    const maxSpent = Math.max(...customerReport.map(c => Number(c.totalSpent) || 0), 1);
    return (
      <div className="space-y-3">
        {customerReport.map((customer) => {
          const spent = Number(customer.totalSpent) || 0;
          const width = Math.max((spent / maxSpent) * 100, spent > 0 ? 5 : 0);
          return (
            <div key={customer.customerId} className="space-y-1">
              <div className="flex justify-between items-center gap-2 text-[11px]">
                <span className="font-bold text-slate-700 truncate">{customer.fullName || `Khách hàng #${customer.customerId}`}</span>
                <span className="font-mono font-bold text-slate-500 shrink-0">{spent.toLocaleString('vi-VN')} đ | {customer.orderCount || 0} đơn</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };
 
  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <nav className="mb-2" aria-label="breadcrumb">
            <ol className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <li><a href="#!" className="hover:text-slate-600 transition-colors">Admin</a></li>
              <li>/</li>
              <li className="text-slate-600">Dashboard</li>
            </ol>
          </nav>
          <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading uppercase">Báo Cáo Hoạt Động</h1>
          <p className="text-slate-500 text-xs mt-1">Tổng quan doanh thu bán lẻ, biến động kho hàng và hoạt động vận hành cửa hàng.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          disabled={loading}
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 text-xs transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>
 
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100/50">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Doanh thu tổng</p>
            <h3 className="text-base font-black text-slate-900 mt-1">
              {loading ? '---' : totalRevenue.toLocaleString('vi-VN')} đ
            </h3>
          </div>
        </div>
 
        <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl border border-emerald-100/50">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Tổng đơn hàng</p>
            <h3 className="text-base font-black text-slate-900 mt-1">
              {loading ? '---' : totalOrdersCount} đơn
            </h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl border border-amber-100/50">
            <RefreshCw size={20} className={`text-amber-600 ${pendingOrdersCount > 0 ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Đơn hàng chờ duyệt</p>
            <h3 className="text-base font-black text-slate-900 mt-1 text-amber-600">
              {loading ? '---' : pendingOrdersCount} đơn
            </h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100/50">
            <XCircle size={20} className="text-rose-600" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Đơn hàng đã hủy</p>
            <h3 className="text-base font-black text-slate-900 mt-1">
              {loading ? '---' : cancelledOrdersCount} đơn
            </h3>
          </div>
        </div>
 
        <div className={`bg-white shadow-xs rounded-2xl p-5 flex items-center gap-4 border ${
          outOfStockProducts.length > 0 ? 'border-rose-200/60 shadow-rose-100/10' : 'border-slate-200/80'
        }`}>
          <div className={`p-3 rounded-xl border ${
            outOfStockProducts.length > 0 
              ? 'bg-rose-50 text-rose-600 border-rose-100/50' 
              : 'bg-amber-50 text-amber-600 border-amber-100/50'
          }`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Báo động kho</p>
            <h3 className="text-xs font-black text-slate-800 mt-1.5">
              {outOfStockProducts.length} hết | {lowStockProducts.length} sắp hết
            </h3>
          </div>
        </div>
      </div>
 
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (Main - 2/3) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase font-heading">
                  Xu hướng doanh thu {reportPeriod === 'DAILY' ? 'hàng ngày' : reportPeriod === 'WEEKLY' ? 'theo tuần' : 'theo tháng'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Di chuột để xem số liệu</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                {['DAILY', 'WEEKLY', 'MONTHLY'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setReportPeriod(period)}
                    className={`px-3 py-1.5 rounded-full border transition-colors ${
                      reportPeriod === period
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {period === 'DAILY' ? 'Ngày' : period === 'WEEKLY' ? 'Tuần' : 'Tháng'}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">Đang dựng biểu đồ thống kê...</div>
            ) : (
              renderRevenueChart()
            )}
          </div>

          {/* Recent Orders List */}
          <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase font-heading">Đơn hàng gần đây</h2>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase">Mới nhất</span>
            </div>
            {loading ? (
              <div className="p-10 text-center text-slate-400 text-xs">Đang tải danh sách đơn hàng...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">Chưa có đơn hàng nào phát sinh.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50/30">
                      <th className="px-6 py-3.5">Mã đơn</th>
                      <th className="px-6 py-3.5">Người nhận</th>
                      <th className="px-6 py-3.5">Ngày tạo</th>
                      <th className="px-6 py-3.5">Trạng thái</th>
                      <th className="px-6 py-3.5 text-right">Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 text-xs font-semibold">
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-slate-900 font-bold">TT-{o.id}</td>
                        <td className="px-6 py-3.5 text-slate-800">{o.fullName}</td>
                        <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                          {new Date(o.createdAt || o.updatedAt).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusClass(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-800">
                          {(o.finalAmount || o.totalAmount)?.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Sidebar - 1/3) */}
        <div className="space-y-6">
          {/* Order Reports Exporter Panel */}
          <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading border-b border-slate-100 pb-3">Xuất Báo Cáo Đơn Hàng</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Tìm kiếm nhanh</label>
                <input
                  type="text"
                  placeholder="Họ tên / SĐT..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Từ ngày</label>
                  <input
                    type="date"
                    value={orderStart}
                    onChange={(e) => setOrderStart(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Đến ngày</label>
                  <input
                    type="date"
                    value={orderEnd}
                    onChange={(e) => setOrderEnd(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">Trạng thái đơn</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-semibold"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="SHIPPING">Đang giao</option>
                  <option value="DELIVERED">Đã giao</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              <button
                onClick={handleExportOrders}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2 mt-2 text-xs shadow-sm"
              >
                <Download size={14} />
                <span>Xuất file Excel báo cáo</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center gap-2 border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">Báo Cáo Khách Hàng</h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase">Bar chart</span>
            </div>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-xs">Đang tải dữ liệu khách hàng...</div>
            ) : (
              renderCustomerChart()
            )}
          </div>

          {/* Stock warning list panel */}
          {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
            <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading border-b border-slate-100 pb-3 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={16} />
                <span>Bổ sung kho hàng</span>
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 admin-scrollbar">
                {outOfStockProducts.map(p => (
                  <div key={p.id} className="bg-rose-50/20 border border-rose-100/60 rounded-xl p-3 flex justify-between items-center gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate max-w-[140px]">{p.name || p.title}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{p.sku}</p>
                    </div>
                    <span className="bg-rose-50 text-rose-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-rose-200/50 flex-shrink-0">
                      Hết hàng
                    </span>
                  </div>
                ))}
                {lowStockProducts.map(p => (
                  <div key={p.id} className="bg-amber-50/20 border border-amber-100/60 rounded-xl p-3 flex justify-between items-center gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate max-w-[140px]">{p.name || p.title}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{p.sku}</p>
                    </div>
                    <span className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-200/50 flex-shrink-0">
                      Còn {p.stock}
                    </span>
                  </div>
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
};
 
export default AdminDashboard;
