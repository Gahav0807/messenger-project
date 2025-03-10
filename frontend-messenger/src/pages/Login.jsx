import { useState } from "react";
import { useNavigate } from "react-router-dom"; // для роутинга в React
import axios from "axios";
import { toast, Toaster } from "sonner"; // для уведомлений

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password,
      });

      // Сохраняем токены в localStorage
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);

      // Перенаправляем на главную страницу
      toast.success("Вход выполнен успешно!");
      navigate("/");
    } catch (error) {
      console.error("Ошибка при входе:", error);
      toast.error("Неверное имя пользователя или пароль");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <Toaster richColors position="top-center" />
      <div className="flex flex-col items-center gap-6 w-full max-w-md p-8 bg-black/50 rounded-xl shadow-lg backdrop-blur-md text-white text-center border border-purple-500">
        <h2 className="text-3xl font-extrabold text-purple-500">Добро пожаловать!</h2>
        <p className="text-sm text-gray-400 mb-6">Войдите в систему, чтобы продолжить</p>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Имя"
          className="w-full px-4 py-3 rounded-lg text-white text-lg bg-black/30 placeholder-gray-400 border border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all duration-300"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full px-4 py-3 rounded-lg text-white text-lg bg-black/30 placeholder-gray-400 border border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all duration-300"
        />

        <button
          onClick={handleLogin}
          className="w-full px-6 py-4 bg-purple-600 rounded-lg text-white font-semibold text-lg cursor-pointer hover:bg-purple-700 transition-all duration-300"
        >
          Войти
        </button>

        <p className="mt-4 text-sm text-gray-400">
          Нет аккаунта?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-purple-500 font-bold hover:underline"
          >
            Регистрация
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;