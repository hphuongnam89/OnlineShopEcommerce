import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { clearAuthSession } from '../utils/api';

// Storefront navigation with search, account session, mobile menu, and cart badge.
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const dropdownRef = useRef(null);

  const loadUserSession = () => {
    const saved = localStorage.getItem('currentUser');
    setCurrentUser(saved ? JSON.parse(saved) : null);
  };

  // Close mobile menu and search on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsSearchOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Load and listen to localStorage user session change
  useEffect(() => {
    window.addEventListener('storage', loadUserSession);
    return () => window.removeEventListener('storage', loadUserSession);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setIsMobileMenuOpen(false);
    setIsAccountDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Sản phẩm', path: '/products' },
    { name: 'Giới thiệu', path: '/about' },
    { name: 'Liên hệ', path: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-[#e5e7eb]">
      {/* Top Bar */}
      <div className="bg-black text-white text-[10px] sm:text-[11px] py-2 border-b border-[#262626] uppercase tracking-wider">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center sm:justify-between items-center">
          <span className="font-bold">Miễn phí vận chuyển đơn từ 1.000.000đ <span className="hidden sm:inline"><span className="mx-2 text-[#737373]">|</span> Bảo hành chính hãng</span></span>
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/contact" className="hover:text-white transition-colors">Liên hệ</Link>
            <Link to={currentUser ? "/my-orders" : "/track-order"} className="hover:text-white transition-colors">Tra cứu đơn hàng</Link>
          </div>
        </div>
      </div>
      
      {/* Main Nav Wrapper */}
      <div className="py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/images/balomayanh-logo.png" 
              alt="Balomayanh Logo" 
              width="859"
              height="238"
              decoding="async"
              className="h-[40px] w-auto object-contain" 
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8 flex-grow justify-end">
            {!isSearchOpen ? (
              <>
                <ul className="flex space-x-7">
                  {navLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.path}
                        className={`text-sm font-medium transition-colors duration-200 ${
                          location.pathname === link.path
                            ? 'text-blue-600'
                            : 'text-gray-700 hover:text-blue-600'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center space-x-5">
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    aria-label="Mở tìm kiếm"
                    className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <Search size={20} />
                  </button>
                  
                  {/* Account Section */}
                  {currentUser ? (
                    <div className="relative" ref={dropdownRef}>
                      <button 
                        data-account-menu-button
                        onClick={() => setIsAccountDropdownOpen((open) => !open)}
                        aria-expanded={isAccountDropdownOpen}
                        aria-controls="account-navigation"
                        className="text-sm font-medium text-slate-800 hover:text-blue-600 flex items-center gap-1 cursor-pointer py-1.5 focus:outline-none"
                      >
                        Chào, {(currentUser.fullName || currentUser.email || 'Khách').split(' ').pop()} ▾
                      </button>
                      <div
                        id="account-navigation"
                        data-account-menu
                        className={`absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-md py-2 z-50 animate-in fade-in duration-200 ${
                          isAccountDropdownOpen ? 'block' : 'hidden'
                        }`}
                      >
                        <Link
                          to="/profile"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors"
                        >
                          Thông tin của tôi
                        </Link>
                        <Link 
                          to="/my-orders" 
                          onClick={() => setIsAccountDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors"
                        >
                          Đơn hàng của tôi
                        </Link>
                        <button 
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left block px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 font-medium transition-colors cursor-pointer border-t border-slate-50 mt-1 pt-2"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to="/auth"
                      className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      Đăng Nhập
                    </Link>
                  )}

                  <Link
                    to="/cart"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm active:translate-y-0 relative"
                  >
                    <ShoppingCart size={18} />
                    <span>Giỏ hàng</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (navSearchQuery.trim()) {
                    navigate(`/products?search=${encodeURIComponent(navSearchQuery.trim())}`);
                    setNavSearchQuery('');
                    setIsSearchOpen(false);
                  }
                }}
                className="flex items-center gap-3 w-full max-w-md transition-all duration-300"
              >
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={navSearchQuery}
                    onChange={(e) => setNavSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                  />
                  <button type="submit" aria-label="Tìm kiếm" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer">
                    <Search size={18} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setNavSearchQuery('');
                  }}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer px-2"
                >
                  Đóng
                </button>
              </form>
            )}
          </div>

          {/* Mobile menu and cart controls */}
          <div className="md:hidden flex items-center gap-4">
            <Link
              to="/cart"
              className="relative text-gray-700 hover:text-blue-600 transition-colors p-2.5 cursor-pointer"
              aria-label="Xem giỏ hàng"
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none cursor-pointer p-2"
              aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>
      </div> {/* Closing Main Nav Wrapper */}

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div id="mobile-navigation" className="md:hidden bg-white shadow-xl absolute w-full left-0 top-full border-t border-gray-100 animate-in slide-in-from-top-5 duration-200">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block px-3 py-3 rounded-md text-base font-medium ${
                  location.pathname === link.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  className={`block px-3 py-3 rounded-md text-base font-medium ${
                    location.pathname === '/profile'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  Thông tin của tôi
                </Link>
                <Link
                  to="/my-orders"
                  className={`block px-3 py-3 rounded-md text-base font-medium ${
                    location.pathname === '/my-orders'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  Đơn hàng của tôi
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-rose-500 hover:bg-rose-50 cursor-pointer"
                >
                  Đăng xuất ({(currentUser.fullName || currentUser.email || 'Khách').split(' ').pop()})
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className={`block px-3 py-3 rounded-md text-base font-medium ${
                  location.pathname === '/auth'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                Đăng Nhập
              </Link>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (navSearchQuery.trim()) {
                    navigate(`/products?search=${encodeURIComponent(navSearchQuery.trim())}`);
                    setNavSearchQuery('');
                    setIsMobileMenuOpen(false);
                  }
                }}
                className="relative w-full"
              >
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={navSearchQuery}
                  onChange={(e) => setNavSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 text-slate-700 pl-11 pr-4 py-3 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                />
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </form>
              <Link
                to="/cart"
                className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-3 rounded-md font-medium relative"
              >
                <ShoppingCart size={20} />
                Giỏ hàng
                {cartCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white ml-1">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
