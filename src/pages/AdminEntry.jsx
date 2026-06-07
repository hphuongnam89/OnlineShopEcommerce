import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const BASE_URL = import.meta.env.DEV ? 'http://localhost:8080' : '';
const ADMIN_DASHBOARD_ROUTE = '/admin/dashboard';

function AdminEntry() {
  const [email, setEmail] = useState('admin@thinktank.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('admin_token')) {
      window.location.href = ADMIN_DASHBOARD_ROUTE;
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        let message = 'Tài khoản hoặc mật khẩu không chính xác.';
        try {
          const err = await response.json();
          message = err.message || message;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      const data = await response.json();

      if (data.role !== 'ROLE_ADMIN') {
        throw new Error('Tài khoản này không có quyền truy cập quản trị.');
      }

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem(
        'admin_user',
        JSON.stringify({
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        }),
      );

      window.location.href = ADMIN_DASHBOARD_ROUTE;
    } catch (err) {
      setError(err.message || 'Không thể đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ee] px-6 py-10 text-slate-800 sm:px-10 lg:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <section className="bg-[#1f2e45] p-8 text-white sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f6c453]">
                Think Tank Admin
              </p>
              <h1 className="mt-4 max-w-md text-4xl font-black uppercase leading-none sm:text-5xl">
                Đăng nhập quản trị
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-200">
                Nhập thông tin ngay tại đây để vào khu vực quản trị. Không dẫn sang trang khác,
                không thêm bước phụ.
              </p>
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5 text-sm leading-7 text-slate-200">
                <p className="font-semibold text-white">Lối vào nhanh</p>
                <p className="mt-2">URL: localhost:5174/admin</p>
                <p className="mt-1">Dashboard: {ADMIN_DASHBOARD_ROUTE}</p>
              </div>
              <div className="mt-8">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Quay lại cửa hàng
                </Link>
              </div>
            </section>

            <section className="bg-white p-8 sm:p-10">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-700">
                  Đăng nhập ngay
                </p>
                <h2 className="mt-3 text-2xl font-black text-[#1f2e45]">
                  Vào dashboard admin
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div>
                  <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                    placeholder="admin@thinktank.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-700">
                    Mật khẩu
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400"
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#1f2e45] px-4 py-3 font-semibold text-white transition hover:bg-[#182739] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </form>

              <p className="mt-6 text-sm leading-6 text-slate-500">
                Nếu bạn đã đăng nhập trước đó, trang này sẽ tự chuyển sang dashboard admin.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminEntry;
