import { Link } from 'react-router-dom';

// Shared storefront footer with only routes and information supported by the application.
const Footer = () => (
  <footer className="bg-[#1a1a1a] text-slate-300 pt-14 mt-16 border-t-4 border-[#cc0000]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white tracking-wider uppercase font-heading">BALOMAYANH</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Balo, vali và phụ kiện bảo vệ thiết bị dành cho nhiếp ảnh gia thường xuyên di chuyển và tác nghiệp.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest font-heading mb-6 border-l-2 border-[#2f5f88] pl-3">Liên kết nhanh</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="hover:text-white hover:underline">Trang chủ</Link></li>
            <li><Link to="/products" className="hover:text-white hover:underline">Sản phẩm</Link></li>
            <li><Link to="/about" className="hover:text-white hover:underline">Giới thiệu</Link></li>
            <li><Link to="/contact" className="hover:text-white hover:underline">Liên hệ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest font-heading mb-6 border-l-2 border-[#2f5f88] pl-3">Danh mục</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/products?category=Balo%20M%C3%A1y%20%E1%BA%A3nh" className="hover:text-white hover:underline">Balo máy ảnh</Link></li>
            <li><Link to="/products?category=T%C3%BAi%20M%C3%A1y%20%E1%BA%A3nh" className="hover:text-white hover:underline">Túi máy ảnh</Link></li>
            <li><Link to="/products?category=Vali%20M%C3%A1y%20%E1%BA%A3nh" className="hover:text-white hover:underline">Vali máy ảnh</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest font-heading mb-6 border-l-2 border-[#2f5f88] pl-3">Hỗ trợ</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/track-order" className="hover:text-white hover:underline">Tra cứu đơn hàng</Link></li>
            <li><Link to="/my-orders" className="hover:text-white hover:underline">Đơn hàng của tôi</Link></li>
            <li><Link to="/cart" className="hover:text-white hover:underline">Giỏ hàng</Link></li>
          </ul>
        </div>
      </div>
    </div>

    <div className="bg-[#1a252f] py-6 border-t border-slate-900/60">
      <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Balomayanh Vietnam. Tất cả các quyền được bảo hộ.
      </p>
    </div>
  </footer>
);

export default Footer;
