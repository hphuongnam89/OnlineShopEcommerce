import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import CustomModal from '../../components/CustomModal';

// Admin login page that routes authenticated admins into the dashboard.
const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    if (userStr && token) {
      const user = JSON.parse(userStr);
      if (user.role === 'ROLE_ADMIN' || user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setModalConfig({
        isOpen: true,
        title: 'Cảnh báo',
        message: 'Vui lòng nhập đầy đủ thông tin đăng nhập!',
        type: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.login(email.trim(), password.trim());
      
      // Verify role
      if (response.role !== 'ROLE_ADMIN' && response.role !== 'ADMIN') {
        throw new Error('Tài khoản của bạn không có quyền truy cập trang quản trị!');
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('currentUser', JSON.stringify({
        email: response.email,
        fullName: response.fullName,
        role: response.role
      }));
      
      window.dispatchEvent(new Event('storage'));
      navigate('/admin/dashboard');
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: 'Đăng nhập thất bại',
        message: err.message || 'Email hoặc mật khẩu không đúng.',
        type: 'warning'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 pt-24 pb-12 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-md p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-50 text-blue-600 p-4 rounded-2xl mb-4 border border-blue-100">
            <span className="text-2xl font-extrabold tracking-wider uppercase font-heading">THINKTANK</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-heading">Quản Trị Hệ Thống</h2>
          <p className="text-slate-500 text-xs mt-1">Đăng nhập để tiếp tục quản lý cửa hàng</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wider">Email Quản Trị</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@thinktank.com"
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wider">Mật Khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-750 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 mt-4 text-xs"
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>

      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default AdminLogin;
