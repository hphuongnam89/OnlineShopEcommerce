import { useEffect, lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import { CartProvider } from './context/CartContext';
import ScrollToTop from './components/ScrollToTop';

import { getValidToken, restoreAuthSession } from './utils/api';

const Products = lazy(() => import('./pages/Products'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Auth = lazy(() => import('./pages/Auth'));
const Cart = lazy(() => import('./pages/Cart'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));

// Customer shell keeps public pages wrapped with shared navbar/footer.
const CustomerLayout = () => {
  return (
    <div className="storefront min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const AdminRedirect = () => {
  // Send authenticated admins directly to dashboard; otherwise require admin login.
  const userStr = localStorage.getItem('currentUser');
  const token = getValidToken();
  if (userStr && token) {
    const user = JSON.parse(userStr);
    if (user.role === 'ROLE_ADMIN' || user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }
  return <Navigate to="/admin/login" replace />;
};

function App() {
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    void restoreAuthSession().finally(() => setSessionReady(true));
  }, []);

  if (!sessionReady) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm font-semibold">Đang xác thực phiên đăng nhập...</div>;
  }

  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 text-sm font-semibold">Đang tải giao diện...</div>}>
          <Routes>

            {/* Customer Routes (With Navbar & Footer) */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/track-order" element={<TrackOrder />} />
            </Route>

            {/* Admin Routes (Separated completely - No Navbar & Footer) */}
            <Route path="/admin" element={<AdminRedirect />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="reviews" element={<AdminReviews />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </CartProvider>
  );
}

export default App;
