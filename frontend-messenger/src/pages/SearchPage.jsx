import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const accessToken = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/users`, {
          params: { username: searchQuery },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const filteredUsers = res.data.users.filter((user) => user._id !== userId);
        setUsers(filteredUsers);

        if (filteredUsers.length === 0) {
          toast.info("Пользователи не найдены");
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          toast.error("Пользователь не найден");
        } else {
          console.error("Ошибка загрузки пользователей", err);
          toast.error("Произошла ошибка при поиске пользователей");
        }
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Добавляем задержку для уменьшения количества запросов
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300); // Задержка 300 мс

    return () => clearTimeout(delayDebounceFn); // Очищаем таймер при каждом изменении searchQuery
  }, [searchQuery, accessToken, userId]);

  const createChat = async (participantId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/chats`,
        { participantId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Чат успешно создан!");
      navigate("/"); // Возвращаемся на главную страницу после создания чата
    } catch (err) {
      if (err.response) {
        switch (err.response.status) {
          case 400:
            toast.error("Нельзя создать чат с самим собой!");
            break;
          case 404:
            toast.error("Участник не найден");
            break;
          case 500:
            toast.error("Ошибка при создании приватного чата");
            break;
          default:
            toast.error("Произошла ошибка при создании чата");
        }
      } else {
        toast.error("Ошибка сети. Проверьте подключение к интернету");
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      <header className="w-full bg-black/50 shadow-md p-4 flex justify-between items-center border-b border-purple-500">
        <h2 className="text-xl font-bold">Поиск пользователей</h2>
        <Link
          to="/"
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Назад
        </Link>
      </header>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Введите имя пользователя"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 p-2 border border-purple-500 rounded-lg bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center text-gray-400">Загрузка...</div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user._id}
                  className="p-2 cursor-pointer hover:bg-purple-500/20 rounded-lg flex items-center justify-between"
                  onClick={() => createChat(user._id)}
                >
                  <span>{user.username}</span>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1 rounded-lg transition">
                    Создать чат
                  </button>
                </div>
              ))
            ) : (
              searchQuery.trim() && <div className="text-center text-gray-400">Пользователи не найдены</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}