import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate, Routes, Route, Link } from "react-router-dom";
import { toast, Toaster } from "sonner";
import SearchPage from "./SearchPage";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const socket = io(API_BASE_URL);

export default function MessengerHome() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  const navigate = useNavigate();
  const messagesEndRef = useRef(null); // Реф для скролла к последнему сообщению

  const toggleChat = (chat) => {
    setCurrentChat((prevChat) => (prevChat?._id === chat._id ? null : chat));
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId"); // Очищаем userId при выходе
    socket.disconnect();
    navigate("/login");
  };

  // Скролл к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/check`,
          { refreshToken },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setUserId(res.data.userId);
        setUsername(res.data.username);
        localStorage.setItem("userId", res.data.userId); // Сохраняем userId в localStorage
      } catch (err) {
        console.error("Ошибка получения пользователя", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/chats`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setChats(res.data.chats);
      } catch (err) {
        console.error("Ошибка загрузки чатов", err);
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    if (currentChat) {
      socket.emit("joinChat", currentChat._id);

      const fetchMessages = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/chats/${currentChat._id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setMessages(res.data.messages);
          scrollToBottom(); // Скролл к последнему сообщению после загрузки
        } catch (err) {
          console.error("Ошибка загрузки сообщений", err);
        }
      };
      fetchMessages();
    }
  }, [currentChat]);

  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      scrollToBottom(); // Скролл к последнему сообщению при получении нового
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socket.emit("sendMessage", {
      chatId: currentChat._id,
      sender: userId,
      content: newMessage,
    });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      <Toaster richColors position="top-center" />
      <header className="w-full bg-black/50 shadow-md p-4 flex justify-between items-center border-b border-purple-500">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden p-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
        >
          ☰
        </button>
        <h2 className="text-xl font-bold">Привет, {username}!</h2>
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Выйти
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Сайдбар */}
        <aside
          className={`${
            isSidebarOpen ? "w-64" : "w-0"
          } bg-black/50 shadow-lg transition-all duration-300 ease-in-out overflow-hidden md:w-64`}
        >
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-4">Чаты</h3>
            <ul className="space-y-2">
              {chats.map((chat) => (
                <li
                  key={chat._id}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    currentChat?._id === chat._id
                      ? "bg-purple-500 text-white"
                      : "hover:bg-purple-500/20"
                  }`}
                  onClick={() => toggleChat(chat)}
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
              className="mt-4 block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg text-center"
            >
              Найти пользователя
            </Link>
          </div>
        </aside>

        {/* Основное содержимое */}
        <main className="flex-1 p-4 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                currentChat ? (
                  <>
                    <h2 className="text-2xl font-bold mb-4">
                      {currentChat.participants
                        .filter((p) => p._id !== userId)
                        .map((p) => p.username)
                        .join(", ")}
                    </h2>
                    <div className="flex-1 overflow-y-auto border border-purple-500 rounded-lg p-3 bg-black/20 shadow-inner h-[calc(100vh-200px)]">
                      {messages.map((msg) => {
                        const isCurrentUser =
                          (typeof msg.sender === "string" && msg.sender === userId) ||
                          (typeof msg.sender === "object" && msg.sender._id === userId);

                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                isCurrentUser
                                  ? "bg-purple-500 text-white"
                                  : "bg-gray-700 text-white"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} /> {/* Реф для скролла */}
                    </div>
                    <div className="mt-4 flex">
                      <input
                        type="text"
                        className="flex-1 border border-purple-500 rounded-lg p-3 bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      />
                      <button
                        onClick={sendMessage}
                        className="ml-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                      >
                        Отправить
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Выберите чат для общения
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