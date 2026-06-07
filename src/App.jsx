import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import About from './pages/About';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import MyOrders from './pages/MyOrders';
import TrackOrder from './pages/TrackOrder';
import AdminEntry from './pages/AdminEntry';
import AdminDashboard from './pages/AdminDashboard';
import AdminModulePage from './pages/AdminModulePage';
import { CartProvider } from './context/CartContext';
import ScrollToTop from './components/ScrollToTop';
import { PRODUCTS } from './data/products';

function App() {
  useEffect(() => {
    // Initialize products or update if size is different (meaning catalog updated)
    const saved = localStorage.getItem('products');
    if (!saved || JSON.parse(saved).length !== PRODUCTS.length) {
      localStorage.setItem('products', JSON.stringify(PRODUCTS));
    }
  }, []);

  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col font-sans">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/admin" element={<AdminEntry />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route
                path="/admin/products"
                element={
                  <AdminModulePage
                    title="Quản lý sản phẩm"
                    description="Tạo, sửa, xoá sản phẩm, quản lý tồn kho, giá bán, SKU và ảnh."
                    comingSoon
                  />
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <AdminModulePage
                    title="Quản lý đơn hàng"
                    description="Xem danh sách đơn, cập nhật trạng thái và theo dõi xử lý."
                    comingSoon
                  />
                }
              />
              <Route
                path="/admin/customers"
                element={
                  <AdminModulePage
                    title="Quản lý khách hàng"
                    description="Xem hồ sơ khách, phân nhóm và theo dõi lịch sử mua hàng."
                    comingSoon
                  />
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <AdminModulePage
                    title="Quản lý đánh giá"
                    description="Duyệt, ẩn hoặc phản hồi các review của khách hàng."
                    comingSoon
                  />
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
