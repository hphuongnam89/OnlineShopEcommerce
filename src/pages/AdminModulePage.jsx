import { Link, useNavigate } from 'react-router-dom';

function AdminModulePage({ title, description, comingSoon = false }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-800">
      <header className="border-b border-slate-200 bg-white px-6 py-4 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-700">
              Think Tank Admin
            </p>
            <h1 className="mt-1 text-xl font-black text-[#1f2e45]">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/dashboard"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
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

      <main className="mx-auto flex max-w-7xl items-center px-6 py-16 sm:px-10 lg:px-16">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-700">
            {comingSoon ? 'Đang làm tiếp' : 'Module'}
          </p>
          <h2 className="mt-3 text-3xl font-black text-[#1f2e45]">{title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-slate-600">
            Đây là khung React mới để mình port chức năng admin từ backend API sang UI hiện đại.
            Phần nghiệp vụ thật sẽ được nối dần vào các module này.
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminModulePage;
