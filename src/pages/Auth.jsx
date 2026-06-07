import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomModal from '../components/CustomModal';
import { api } from '../utils/api';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Modal alert state
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const openModal = (title, message, type = 'info') => {
    setModalConfig({ isOpen: true, title, message, type });
  };
  const closeModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
    if (modalConfig.type === 'success') {
      navigate('/');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      openModal('Cảnh báo', 'Vui lòng điền đầy đủ email và mật khẩu!', 'warning');
      return;
    }

    try {
      const response = await api.auth.login(email.trim(), password.trim());
      
      // Save current session
      localStorage.setItem('token', response.token);
      localStorage.setItem('currentUser', JSON.stringify({
        email: response.email,
        fullName: response.fullName,
        role: response.role
      }));
      // Dispatch event to update Navbar session
      window.dispatchEvent(new Event('storage'));

      openModal('Đăng nhập thành công', `Chào mừng ${response.fullName} quay trở lại!`, 'success');
    } catch (error) {
      openModal('Lỗi đăng nhập', error.message || 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại!', 'warning');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      openModal('Cảnh báo', 'Vui lòng điền đầy đủ các thông tin bắt buộc!', 'warning');
      return;
    }

    try {
      await api.auth.register(email.trim(), password.trim(), fullName.trim(), phone.trim());

      // Auto login after successful signup
      const loginRes = await api.auth.login(email.trim(), password.trim());
      localStorage.setItem('token', loginRes.token);
      localStorage.setItem('currentUser', JSON.stringify({
        email: loginRes.email,
        fullName: loginRes.fullName,
        role: loginRes.role
      }));
      window.dispatchEvent(new Event('storage'));

      openModal('Tạo tài khoản thành công', `Chào mừng thành viên mới ${fullName}! Trải nghiệm Think Tank ngay nào.`, 'success');
    } catch (error) {
      openModal('Lỗi đăng ký', error.message || 'Không thể tạo tài khoản, vui lòng thử lại!', 'warning');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-40 pb-20 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button 
              className={`flex-1 py-5 font-semibold text-base transition-colors cursor-pointer ${isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-55'}`}
              onClick={() => setIsLogin(true)}
            >
              Đăng Nhập
            </button>
            <button 
              className={`flex-1 py-5 font-semibold text-base transition-colors cursor-pointer ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-55'}`}
              onClick={() => setIsLogin(false)}
            >
              Đăng Ký
            </button>
          </div>

          <div className="p-8">
            {/* Login Form */}
            {isLogin && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Chào mừng trở lại!</h2>
                  <p className="text-slate-500 text-sm">Vui lòng nhập thông tin của bạn để tiếp tục.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Email</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-800 text-sm" 
                      placeholder="example@email.com" 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-700">Mật Khẩu</label>
                      <a href="#" onClick={(e) => {e.preventDefault(); openModal('Khôi phục mật khẩu', 'Tính năng khôi phục mật khẩu sẽ gửi mã OTP về email của bạn. Vui lòng liên hệ hỗ trợ viên!', 'info')}} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Quên mật khẩu?</a>
                    </div>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-800 text-sm" 
                      placeholder="••••••••" 
                    />
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/20 mt-4 cursor-pointer">
                    Đăng Nhập
                  </button>
                </form>
              </div>
            )}

            {/* Signup Form */}
            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Tạo Tài Khoản Mới</h2>
                  <p className="text-slate-500 text-sm">Điền thông tin để bắt đầu trải nghiệm mua sắm.</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Họ và Tên</label>
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-800 text-sm" 
                      placeholder="Nhập tên của bạn" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Số Điện Thoại</label>
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-800 text-sm" 
                      placeholder="Nhập số điện thoại" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Email</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-800 text-sm" 
                      placeholder="example@email.com" 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Mật Khẩu</label>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-800 text-sm" 
                      placeholder="••••••••" 
                    />
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/20 mt-4 cursor-pointer">
                    Đăng Ký Tài Khoản
                  </button>
                </form>
              </div>
            )}
            
          </div>
        </div>

      </div>

      <CustomModal 
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default Auth;
