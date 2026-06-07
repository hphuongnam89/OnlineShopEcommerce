import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import CustomModal from '../../components/CustomModal';

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 pt-24 pb-12">
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-600/10 text-blue-400 p-4 rounded-2xl mb-4 border border-blue-500/20">
            <span className="text-2xl font-extrabold tracking-wider">THINKTANK</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Quản Trị Hệ Thống</h2>
          <p className="text-slate-400 text-sm mt-1">Đăng nhập để tiếp tục quản lý cửa hàng</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">Email Quản Trị</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@thinktank.com"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">Mật Khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 mt-4"
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
