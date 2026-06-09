import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Camera, MessageCircle, Mail, Phone, MapPin, Send } from 'lucide-react';
import CustomModal from './CustomModal';

// Shared storefront footer with brand, quick links, categories, and contact details.
const Footer = () => {
  const [email, setEmail] = useState('');
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setModalConfig({
        isOpen: true,
        title: 'Đăng ký nhận tin thành công',
        message: `Cảm ơn bạn! Thông tin ưu đãi của Think Tank sẽ được gửi tới email ${email} của bạn.`,
        type: 'success'
      });
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#23323f] text-slate-300 pt-16 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-white tracking-wider uppercase font-heading">
              THINK TANK
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Chúng tôi là một nhóm các nhà thiết kế sản phẩm và nhiếp ảnh gia chuyên nghiệp với sứ mệnh thiết kế và tạo ra các thiết bị hành lý du lịch chất lượng cao nhất cho các nhiếp ảnh gia trên toàn thế giới.
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center hover:bg-[#2f5f88] text-white transition-colors">
                <Globe size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center hover:bg-[#2f5f88] text-white transition-colors">
                <Camera size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center hover:bg-[#2f5f88] text-white transition-colors">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-widest font-heading mb-6 border-l-2 border-[#2f5f88] pl-3">
              LIÊN KẾT NHANH
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-white hover:underline transition-all">Trang Chủ</Link></li>
              <li><Link to="/products" className="hover:text-white hover:underline transition-all">Sản Phẩm</Link></li>
              <li><Link to="/about" className="hover:text-white hover:underline transition-all">Giới Thiệu</Link></li>
              <li><Link to="/contact" className="hover:text-white hover:underline transition-all">Liên Hệ</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-widest font-heading mb-6 border-l-2 border-[#2f5f88] pl-3">
              DANH MỤC SẢN PHẨM
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/products?category=Balo%20M%C3%A1y%20%E1%BA%A3nh" className="hover:text-white hover:underline transition-all">Balo Máy Ảnh</Link></li>
              <li><Link to="/products?category=T%C3%BAi%20M%C3%A1y%20%E1%BA%A3nh" className="hover:text-white hover:underline transition-all">Túi Máy Ảnh & Dây Đeo</Link></li>
              <li><Link to="/products?category=Vali%20M%C3%A1y%20%E1%BA%A3nh" className="hover:text-white hover:underline transition-all">Vali Kéo Máy Ảnh</Link></li>
              <li><Link to="/products" className="hover:text-white hover:underline transition-all">Phụ Kiện Máy Ảnh</Link></li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-widest font-heading mb-6 border-l-2 border-[#2f5f88] pl-3">
              ĐĂNG KÝ BẢN TIN
            </h4>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Nhận thông tin cập nhật về các sản phẩm mới nhất, ưu đãi đặc biệt và mẹo chụp ảnh chuyên nghiệp.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <div className="relative">
                <label htmlFor="newsletter-email" className="sr-only">Email nhận bản tin</label>
                <input
                  id="newsletter-email"
                  name="newsletterEmail"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Địa chỉ email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#2f5f88] focus:bg-slate-900/90 transition-all placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#2f5f88] hover:bg-[#1b2630] text-white p-2 rounded-lg transition-colors cursor-pointer"
                  aria-label="Subscribe"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Chúng tôi cam kết không spam email của bạn.</p>
            </form>
          </div>
        </div>

        {/* Contact Info (Row layout below columns for cleaner structure) */}
        <div className="border-t border-slate-800/80 mt-12 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <MapPin className="text-[#2f5f88] shrink-0" size={18} />
            <span>Showroom: 123 Đường Nguyễn Huệ, Quận 1, TP.HCM / Cầu Giấy, Hà Nội</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="text-[#2f5f88] shrink-0" size={18} />
            <span>Hotline miễn phí: 1800.6026 (8:00 - 21:00)</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="text-[#2f5f88] shrink-0" size={18} />
            <span>Hỗ trợ kỹ thuật: support@thinktankphoto.vn</span>
          </div>
        </div>
      </div>

      {/* Copyright/Bottom Bar */}
      <div className="bg-[#1a252f] py-6 border-t border-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Think Tank Photo Vietnam. Tất cả các quyền được bảo hộ.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Quy chế hoạt động</a>
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
    </footer>
  );
};

export default Footer;
