import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate, Routes, Route, Link } from "react-router-dom";
import { toast, Toaster } from "sonner";
import SearchPage from "./SearchPage";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function MessengerHome() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Получаем токены из localStorage
  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken"));
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Создаем экземпляр axios с интерцепторами
  const axiosWithAuth = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-refresh-token": refreshToken,
    },
  });

  // Добавляем интерцептор для обработки обновления токенов
  axiosWithAuth.interceptors.response.use(
    (response) => {
      // Проверяем наличие новых токенов в заголовках
      const newAccessToken = response.headers["x-access-token"];
      const newRefreshToken = response.headers["x-refresh-token"];
      
      if (newAccessToken && newRefreshToken) {
        // Обновляем токены в состоянии и localStorage
        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        
        // Обновляем заголовки для будущих запросов
        axiosWithAuth.defaults.headers["Authorization"] = `Bearer ${newAccessToken}`;
        axiosWithAuth.defaults.headers["x-refresh-token"] = newRefreshToken;
      }
      return response;
    },
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Если ошибка авторизации, выполняем выход
        logout();
      }
      return Promise.reject(error);
    }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      transports: ["websocket"],
      auth: {
        token: accessToken,
        refreshToken: refreshToken
      }
    });

    newSocket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      scrollToBottom();
    });

    // Обработка обновления токенов от сервера
    newSocket.on("tokenRefresh", ({ accessToken: newAccessToken, refreshToken: newRefreshToken }) => {
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [accessToken, refreshToken]);

  const fetchUser = async () => {
    try {
      const res = await axiosWithAuth.post("/auth/check", { refreshToken });
      setUserId(res.data.userId);
      setUsername(res.data.username);
      localStorage.setItem("userId", res.data.userId);
    } catch (err) {
      console.error("Ошибка получения пользователя", err);
    }
  };

  const fetchChats = async () => {
    try {
      const res = await axiosWithAuth.get("/chats");
      setChats(res.data.chats);
    } catch (err) {
      console.error("Ошибка загрузки чатов", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchChats();
  }, []);

  useEffect(() => {
    if (currentChat && socket) {
      setMessages([]);
      setIsSidebarOpen(false);
      socket.emit("joinChat", currentChat._id);

      const fetchMessages = async () => {
        setIsLoading(true);
        try {
          const res = await axiosWithAuth.get(`/chats/${currentChat._id}`);
          setMessages(res.data.messages);
          scrollToBottom();
        } catch (err) {
          console.error("Ошибка загрузки сообщений", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMessages();
    }
  }, [currentChat, socket]);

  const sendMessage = () => {
    if (!newMessage.trim() || !currentChat || !socket) return;
    socket.emit("sendMessage", {
      chatId: currentChat._id,
      sender: userId,
      content: newMessage,
    });
    setNewMessage("");
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    socket?.disconnect();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      <Toaster richColors position="top-center" />
      <header className="w-full bg-black/60 backdrop-blur-sm shadow-lg p-4 flex justify-between items-center border-b border-purple-500/50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className=" p-2 rounded-lg hover:bg-purple-500/20 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
          Привет, {username}!
        </h2>
        <button
          onClick={logout}
          className="bg-red-500/80 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
        >
          Выйти
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${
            isSidebarOpen ? "w-full md:w-72" : "w-0"
          } bg-black/40 backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out overflow-hidden border-r border-purple-500/30`}
        >
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
              Чаты
            </h3>
            <ul className="space-y-2">
              {chats.map((chat) => (
                <li
                  key={chat._id}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                    currentChat?._id === chat._id
                      ? "bg-purple-500/50 backdrop-blur-sm shadow-lg shadow-purple-500/20"
                      : "hover:bg-purple-500/20"
                  }`}
                  onClick={() => setCurrentChat(chat)}
                >
                  {chat.participants
                    .filter((p) => p._id !== userId)
                    .map((p) => p.username)
                    .join(", ")}
                </li>
              ))}
            </ul>
            <Link
              to="/search"
              className="mt-6 block bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold px-4 py-2 rounded-lg text-center transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
            >
              Найти пользователя
            </Link>
          </div>
        </aside>

        <main className="flex-1 p-4 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                currentChat ? (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                      {currentChat.participants
                        .filter((p) => p._id !== userId)
                        .map((p) => p.username)
                        .join(", ")}
                    </h2>
                    <div className="flex-1 overflow-y-auto border border-purple-500/30 rounded-lg p-3 bg-black/30 backdrop-blur-sm shadow-lg h-[calc(100vh-200px)]">
                      {isLoading ? ( // Условный рендеринг спиннера
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                      ) : (
                        <>
                          {messages.map((msg) => {
                            const isCurrentUser =
                              (typeof msg.sender === "string" && msg.sender === userId) ||
                              (typeof msg.sender === "object" && msg.sender._id === userId);
                            return (
                              <div
                                key={msg._id}
                                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-3`}
                              >
                                <div
                                  className={`max-w-[70%] p-3 rounded-lg shadow-lg ${
                                    isCurrentUser
                                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                      : "bg-gray-800/80 backdrop-blur-sm text-gray-100"
                                  }`}
                                >
                                  {msg.content}
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        className="flex-1 border border-purple-500/30 rounded-lg p-3 bg-black/30 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Введите сообщение..."
                      />
                      <button
                        onClick={sendMessage}
                        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
                      >
                        Отправить
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="text-xl">Выберите чат для общения</p>
                    </div>
                  </div>
                )
              }
            />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}