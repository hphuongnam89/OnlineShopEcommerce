import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  LogOut, 
  ArrowLeft,
  Bell,
  Menu,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../../utils/api';
import './admin-theme.css';

// Shared admin shell with sidebar navigation, topbar, notifications, and nested pages.
const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');
      if (!userStr || !token) return null;
      const user = JSON.parse(userStr);
      if (user.role !== 'ROLE_ADMIN' && user.role !== 'ADMIN') {
        return null;
      }
      return user;
    } catch {
      return null;
    }
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Topbar dropdown states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!adminUser || !token) {
      navigate('/admin/login');
      return;
    }
    
    // Fetch notifications (recent orders)
    api.admin.orders.getAll().then(data => {
      if (data && Array.isArray(data)) {
        const sorted = data.sort((a, b) => b.id - a.id).slice(0, 4);
        setRecentOrders(sorted);
      }
    }).catch(() => setRecentOrders([]));
  }, [navigate, adminUser]);

  // Handle clicking outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new Event('storage'));
    navigate('/admin/login');
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-semibold">Đang xác thực thông tin quản trị...</p>
        </div>
      </div>
    );
  }

  const mainMenuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Đơn hàng', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Sản phẩm', path: '/admin/products', icon: Package },
  ];

  const adminMenuItems = [
    { name: 'Khách hàng', path: '/admin/customers', icon: Users },
    { name: 'Đánh giá', path: '/admin/reviews', icon: MessageSquare },
  ];

  return (
    <div className="h-screen bg-[#f8f9fc] text-slate-800 flex overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside 
        className={`bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0 transition-all duration-300 z-20 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className={`h-16 px-6 border-b border-slate-100 flex items-center shrink-0 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed ? (
            <div className="flex flex-col">
              <span className="text-[15px] font-black text-blue-600 tracking-wider font-heading uppercase">THINKTANK</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Workspace</span>
            </div>
          ) : (
            <span className="text-lg font-black text-blue-600 tracking-wider font-heading uppercase">TT</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow px-3 py-6 space-y-1 overflow-y-auto admin-scrollbar">
          
          {!isSidebarCollapsed && (
            <small className="nav-text text-[10px] uppercase font-extrabold text-slate-400 px-4 mt-2 mb-2 block tracking-wider">Hoạt động chính</small>
          )}
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={isSidebarCollapsed ? item.name : ''}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {!isSidebarCollapsed ? (
            <small className="nav-text text-[10px] uppercase font-extrabold text-slate-400 px-4 mt-6 mb-2 block tracking-wider">Quản trị viên</small>
          ) : (
            <div className="h-6"></div> // spacer
          )}
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={isSidebarCollapsed ? item.name : ''}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Return to Store Link */}
        <div className="p-4 border-t border-slate-100 mt-auto shrink-0">
          <Link 
            to="/" 
            title={isSidebarCollapsed ? "Trở về Store" : ""}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <ArrowLeft size={16} />
            {!isSidebarCollapsed && <span>Quay lại trang Store</span>}
          </Link>
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 shadow-xs">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h2 className="hidden sm:block text-sm font-bold text-slate-700">Trang Quản Trị Hệ Thống</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <Bell size={20} />
                {recentOrders.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                )}
              </button>

              {/* Notification Popup */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông báo mới</h4>
                    <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">{recentOrders.length}</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto admin-scrollbar">
                    {recentOrders.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">Chưa có thông báo nào.</div>
                    ) : (
                      recentOrders.map(order => (
                        <div key={order.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ShoppingBag size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">Đơn hàng mới <span className="text-blue-600">#TT-{order.id}</span></p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{order.fullName} vừa đặt hàng {(order.totalAmount || order.finalAmount)?.toLocaleString('vi-VN')} đ</p>
                            <p className="text-[9px] text-slate-400 mt-1">{new Date(order.createdAt || order.updatedAt).toLocaleTimeString('vi-VN')} - {new Date(order.createdAt || order.updatedAt).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 text-center">
                    <Link to="/admin/orders" onClick={() => setIsNotificationsOpen(false)} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                      Xem tất cả đơn hàng
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-slate-200 hidden sm:block mx-1"></div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 p-1 pr-3 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-xs">
                  {adminUser.fullName.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[11px] font-bold text-slate-800 leading-tight">{adminUser.fullName}</p>
                  <p className="text-[9px] font-semibold text-slate-400 leading-tight mt-0.5">Administrator</p>
                </div>
              </button>

              {/* Profile Popup */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 mb-1">
                     <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 text-base flex-shrink-0">
                      {adminUser.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{adminUser.fullName}</p>
                      <p className="text-[10px] font-semibold text-slate-500 truncate">{adminUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="py-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      <UserIcon size={14} />
                      Tài khoản của tôi
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      <Settings size={14} />
                      Cài đặt hệ thống
                    </button>
                  </div>
                  
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-grow overflow-y-auto p-4 md:p-8 admin-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
