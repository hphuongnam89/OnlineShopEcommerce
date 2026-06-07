import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  LogOut, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './admin-theme.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminUser, setAdminUser] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      navigate('/admin/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'ROLE_ADMIN' && user.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    setAdminUser(user);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new Event('storage'));
    navigate('/admin/login');
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm font-semibold">Đang xác thực thông tin quản trị...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Sản phẩm', path: '/admin/products', icon: Package },
    { name: 'Đơn hàng', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Khách hàng', path: '/admin/customers', icon: Users },
    { name: 'Đánh giá', path: '/admin/reviews', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside 
        className={`bg-slate-900/90 border-r border-slate-800/80 flex flex-col flex-shrink-0 pt-20 transition-all duration-300 relative ${
          isSidebarCollapsed ? 'w-full md:w-20' : 'w-full md:w-64'
        }`}
      >
        {/* Toggle Collapse Button for desktop */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex absolute -right-3 top-24 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white cursor-pointer z-50 hover:bg-slate-750"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand Header */}
        <div className={`px-6 py-4 border-b border-slate-800/50 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed ? (
            <>
              <span className="text-base font-black text-white tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">THINKTANK ADMIN</span>
              <Link to="/" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors">
                <ArrowLeft size={12} />
                <span>Store</span>
              </Link>
            </>
          ) : (
            <Link to="/" title="Quay lại Store" className="text-blue-400 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow px-3 py-6 space-y-1.5 overflow-y-auto admin-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={isSidebarCollapsed ? item.name : ''}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-450'} />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800/50 mt-auto bg-slate-950/20">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/10">
                {adminUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">{adminUser.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate font-semibold">{adminUser.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4" title={`${adminUser.fullName} (${adminUser.email})`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/10">
                {adminUser.fullName.charAt(0)}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? 'Đăng xuất' : ''}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:text-white hover:bg-rose-500/10 transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={16} />
            {!isSidebarCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto p-4 md:p-8 pt-24 md:pt-28 admin-scrollbar">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
