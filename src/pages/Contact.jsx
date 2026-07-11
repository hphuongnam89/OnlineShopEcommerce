import { Link } from 'react-router-dom';
import { Mail, PackageSearch, ShoppingBag, UserRound } from 'lucide-react';

// Self-service support page; direct email is shown only when configured for the deployment.
const Contact = () => {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim();
  const supportCards = [
    { title: 'Tra cứu đơn hàng', description: 'Kiểm tra trạng thái bằng mã tra cứu nhận được sau khi đặt hàng.', to: '/track-order', icon: PackageSearch },
    { title: 'Danh mục sản phẩm', description: 'Tìm sản phẩm, mức giá và biến thể phù hợp với bộ thiết bị của bạn.', to: '/products', icon: ShoppingBag },
    { title: 'Tài khoản của tôi', description: 'Xem thông tin cá nhân và lịch sử đơn hàng sau khi đăng nhập.', to: '/profile', icon: UserRound },
  ];

  return (
    <main className="bg-slate-50 min-h-screen pt-[140px] pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[#2f5f88] text-sm font-semibold">Hỗ trợ Balomayanh</span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-4">Chúng tôi có thể giúp gì?</h1>
          <p className="text-slate-600">Chọn đúng khu vực hỗ trợ để giải quyết yêu cầu nhanh nhất.</p>
        </header>

        <section className="grid md:grid-cols-3 gap-6" aria-label="Các hình thức hỗ trợ">
          {supportCards.map(({ title, description, to, icon: Icon }) => (
            <Link key={to} to={to} className="group bg-white border border-slate-200 rounded-2xl p-7 hover:border-[#2f5f88] hover:shadow-md transition-all">
              <span className="w-12 h-12 rounded-xl bg-slate-100 text-[#2f5f88] flex items-center justify-center mb-5 group-hover:bg-[#2f5f88] group-hover:text-white transition-colors">
                <Icon size={24} />
              </span>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
            </Link>
          ))}
        </section>

        {supportEmail && (
          <section className="mt-10 bg-[#23323f] text-white rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h2 className="text-xl font-bold mb-1">Cần hỗ trợ thêm?</h2>
              <p className="text-slate-300 text-sm">Gửi email kèm mã đơn hàng hoặc mã tra cứu để được hỗ trợ nhanh hơn.</p>
            </div>
            <a href={`mailto:${supportEmail}`} className="inline-flex items-center justify-center gap-2 bg-white text-[#23323f] rounded-lg px-5 py-3 font-semibold text-sm hover:bg-slate-100">
              <Mail size={18} />
              {supportEmail}
            </a>
          </section>
        )}
      </div>
    </main>
  );
};

export default Contact;
