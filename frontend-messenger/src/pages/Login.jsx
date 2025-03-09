import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // для роутинга в React
import axios from 'axios';
import { toast, Toaster } from 'sonner'; // для уведомлений

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password,
      });

      // Save tokens to localStorage
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);

      // Redirect to the homepage
      navigate('/');
    } catch (error) {
      console.error('Ошибка при входе:', error);
      toast.error('Неверное имя пользователя или пароль');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#2d1d59] to-[#1a1a2e]">
      <Toaster richColors position="top-center" />
      <div className="flex flex-col items-center gap-6 w-full max-w-md p-8 bg-[#1f1835] bg-opacity-85 rounded-xl shadow-lg backdrop-blur-md text-white text-center">
        <h2 className="text-3xl font-extrabold text-[#e94560]">Добро пожаловать!</h2>
        <p className="text-sm text-gray-400 mb-6">Войдите в систему, чтобы продолжить</p>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Имя"
          className="w-full px-4 py-3 rounded-lg text-white text-lg bg-[#16213e] placeholder-gray-400 border-none focus:ring-2 focus:ring-[#e94560] outline-none transition-all duration-300"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full px-4 py-3 rounded-lg text-white text-lg bg-[#16213e] placeholder-gray-400 border-none focus:ring-2 focus:ring-[#e94560] outline-none transition-all duration-300"
        />

        <button
          onClick={handleLogin}
          className="w-full px-6 py-4 bg-[#e94560] rounded-lg text-white font-semibold text-lg cursor-pointer hover:bg-[#d12b4f] transition-all duration-300"
        >
          Войти
        </button>

        <p className="mt-4 text-sm text-gray-400">
          Нет аккаунта?{' '}
          <button  onClick={() => navigate("/register")} className="text-[#e94560] font-extrabold hover:underline">
            Регистрация
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
