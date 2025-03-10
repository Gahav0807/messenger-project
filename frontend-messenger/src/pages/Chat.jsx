import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const socket = io(API_BASE_URL);

export default function MessengerHome() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [username, setUsername] = useState("");

  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  const navigate = useNavigate();

  const toggleChat = (chat) => {
    setCurrentChat((prevChat) => (prevChat?._id === chat._id ? null : chat));
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    socket.disconnect();
    navigate("/login");
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
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users`, {
          params: { username: searchQuery },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const filteredUsers = res.data.users.filter(user => user._id !== userId);
        
        setUsers(filteredUsers);
        setShowUserList(filteredUsers.length > 0);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          toast.error("Пользователь не найден");
        } else {
          console.error("Ошибка загрузки пользователей", err);
        }
        setUsers([]);
        setShowUserList(false);
      }
    };

    if (searchQuery) {
      fetchUsers();
    } else {
      setShowUserList(false);
    }
  }, [searchQuery, userId]);

  const chatExists = (selectedUserId) => {
    return chats.some((chat) =>
      chat.participants.some((participant) => participant._id === selectedUserId)
    );
  };

  const createChat = async (userId) => {
    if (chatExists(userId)) {
      toast.error("Чат с этим пользователем уже существует!");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/chats`,
        { participantId: userId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setChats([...chats, res.data.chat]);
      setShowUserList(false);
      setSearchQuery("");
      toast.success("Чат успешно создан!");
    } catch (err) {
      console.error("Ошибка создания чата", err);
    }
  };

  useEffect(() => {
    if (currentChat) {
      socket.emit("joinChat", currentChat._id);

      const fetchMessages = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/chats/${currentChat._id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setMessages(res.data.messages);
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
    <div className="flex flex-col h-screen bg-gray-100">
      <Toaster richColors position="top-center" />
      <header className="w-full bg-white shadow-md p-4 flex justify-between items-center border-b border-gray-300 relative">
        <h2 className="text-xl font-bold text-gray-800">Привет, {username}!</h2>
        
        <div className="relative w-1/3">
          <input
            type="text"
            placeholder="Поиск пользователя"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded w-full"
          />
          {showUserList && (
            <div className="absolute w-full bg-white shadow-lg rounded border mt-1 max-h-48 overflow-y-auto z-10">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="p-2 cursor-pointer hover:bg-gray-100 rounded"
                  onClick={() => createChat(user._id)}
                >
                  {user.username}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          Выйти
        </button>
      </header>

      <div className="flex flex-1">
        <aside className="w-1/3 bg-white shadow-lg p-4 border-r border-gray-300">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Чаты</h3>
          <ul className="space-y-2">
            {chats.map((chat) => (
              <li
                key={chat._id}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  currentChat?._id === chat._id ? "bg-blue-500 text-white" : "hover:bg-gray-200"
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
        </aside>

        <main className="w-2/3 p-6 flex flex-col bg-white shadow-lg rounded-lg">
          {currentChat ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentChat.participants
                  .filter((p) => p._id !== userId)
                  .map((p) => p.username)
                  .join(", ")}
              </h2>
              <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-gray-50 shadow-inner">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.sender._id === userId ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender._id === userId
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-black"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex">
                <input
                  type="text"
                  className="flex-1 border rounded-lg p-3"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button onClick={sendMessage} className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
                  Отправить
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">Выберите чат для общения</div>
          )}
        </main>
      </div>
    </div>
  );
}