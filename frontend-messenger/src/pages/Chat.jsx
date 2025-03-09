import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const socket = io(API_BASE_URL);

export default function MessengerHome() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  const navigate = useNavigate();

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
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setUserId(res.data.userId);
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
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
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
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setUsers(res.data.users);
      } catch (err) {
        console.error("Ошибка загрузки пользователей", err);
      }
    };
    fetchUsers();
  }, []);

  const createChat = async () => {
    if (!selectedUser) return;
    try {
        const res = await axios.post(
            `${API_BASE_URL}/chats`,
            { participantId: selectedUser }, 
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        setChats([...chats, res.data.chat]);
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
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
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
    <div className="flex h-screen bg-gray-100">
      <aside className="w-1/3 bg-white shadow-md p-4 border-r border-gray-300">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Чаты</h2>
        <ul className="space-y-2">
          {chats.map((chat) => (
            <li
              key={chat._id}
              className={`p-3 rounded-lg cursor-pointer transition ${
                currentChat?._id === chat._id ? "bg-blue-500 text-white" : "hover:bg-gray-200"
              }`}
              onClick={() => setCurrentChat(chat)}
            >
              {chat.participants.map((p) => p.username).join(", ")}
            </li>
          ))}
        </ul>

        <select
          className="mt-4 p-2 border rounded w-full"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Выберите пользователя</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.username}
            </option>
          ))}
        </select>
        <button
          onClick={createChat}
          className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition w-full"
        >
          Создать чат
        </button>

        <button
          onClick={logout}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition w-full"
        >
          Выйти
        </button>
      </aside>

      <main className="w-2/3 p-6 flex flex-col bg-white">
        {currentChat ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentChat.participants.map((p) => p.username).join(", ")}
            </h2>
            <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-gray-50 shadow-inner">
              {messages.map((msg) => (
                <div key={msg._id} className="p-2 my-1 border-b border-gray-300">
                  <strong>{msg.sender.username}: </strong>
                  {msg.content}
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
  );
}
