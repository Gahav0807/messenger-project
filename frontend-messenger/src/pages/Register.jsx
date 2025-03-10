import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "sonner"; // для уведомлений

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate(); // Получаем хук для роутинга

  const handleRegister = async () => {
    try {
      // Отправляем username и пароль на сервер
      const response = await axios.post(`${API_BASE_URL}/register`, { username, password });

      // При успешной регистрации показываем информацию
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);

      toast.success("Регистрация прошла успешно!");
      navigate("/");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error("Пользователь с таким именем уже существует");
      } else {
        toast.error("Ошибка при регистрации");
      }

      console.error("Ошибка при регистрации:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <Toaster richColors position="top-center" />
      <div className="flex flex-col items-center gap-6 w-full max-w-md p-8 bg-black/50 rounded-xl shadow-lg backdrop-blur-md text-white text-center border border-purple-500">
        <h2 className="text-3xl font-extrabold text-purple-500">Добро пожаловать!</h2>
        <p className="text-sm text-gray-400 mb-6">Зарегистрируйтесь, чтобы продолжить</p>

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
          onClick={handleRegister}
          className="w-full px-6 py-4 bg-purple-600 rounded-lg text-white font-semibold text-lg cursor-pointer hover:bg-purple-700 transition-all duration-300"
        >
          Зарегистрироваться
        </button>

        <p className="mt-2 text-sm text-gray-400">
          Есть аккаунт?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-purple-500 font-bold hover:underline"
          >
            Войти
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;