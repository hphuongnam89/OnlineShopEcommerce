import { Link, useNavigate } from 'react-router-dom';

const modules = [
  {
    title: 'Sản phẩm',
    desc: 'Quản lý danh mục, SKU, tồn kho, giá bán và ảnh sản phẩm.',
    href: '/admin/products',
  },
  {
    title: 'Đơn hàng',
    desc: 'Theo dõi trạng thái, xử lý đơn, hoàn tiền và xuất báo cáo.',
    href: '/admin/orders',
  },
  {
    title: 'Khách hàng',
    desc: 'Xem hồ sơ, phân nhóm, theo dõi lịch sử mua hàng.',
    href: '/admin/customers',
  },
  {
    title: 'Đánh giá',
    desc: 'Kiểm duyệt review và phản hồi từ khách hàng.',
    href: '/admin/reviews',
  },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user'));
    } catch {
      return null;
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-800">
      <header className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-700">
              Think Tank Admin
            </p>
            <h1 className="mt-1 text-xl font-black text-[#1f2e45]">Bảng điều khiển</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cửa hàng
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-[#1f2e45] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#182739]"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-16">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-[#1f2e45] p-8 text-white shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f6c453]">
              Tổng quan nhanh
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-black uppercase leading-none sm:text-5xl">
              Chọn module để bắt đầu
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Admin React mới sẽ thay thế hoàn toàn bộ AdminLTE cũ, nhưng vẫn dùng chung backend API
              và dữ liệu hiện có.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Trạng thái</p>
                <p className="mt-2 text-2xl font-black">Online</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Quyền</p>
                <p className="mt-2 text-2xl font-black">{adminUser?.role || 'ADMIN'}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Tài khoản</p>
                <p className="mt-2 truncate text-lg font-semibold">{adminUser?.email || 'admin'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-700">Lộ trình</p>
            <ol className="mt-5 space-y-4">
              {[
                'Login React đã xong',
                'Dashboard React đã xong',
                'Tiếp theo: Products, Orders, Customers, Reviews, Reports',
              ].map((item) => (
                <li key={item} className="rounded-2xl border border-slate-200 px-4 py-3 text-slate-700">
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-700">Modules</p>
              <h3 className="mt-2 text-2xl font-black text-[#1f2e45]">Các khu vực quản trị</h3>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((mod) => (
              <Link
                key={mod.title}
                to={mod.href}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-lg font-black text-[#1f2e45]">{mod.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{mod.desc}</p>
                <div className="mt-5 text-sm font-semibold text-sky-700">Mở module →</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
