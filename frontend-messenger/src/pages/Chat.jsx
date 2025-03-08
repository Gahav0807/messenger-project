import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const socket = io(API_BASE_URL); // Подключаемся к WebSocket

export default function MessengerHome() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");

  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-refresh-token": refreshToken,
          },
        });
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
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-refresh-token": refreshToken,
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
    if (currentChat) {
      socket.emit("joinChat", currentChat._id);

      const fetchMessages = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/chats/${currentChat._id}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "x-refresh-token": refreshToken,
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
      sender: username,
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
              {chat.groupName || chat.participants.map((p) => p.username).join(", ")}
            </li>
          ))}
        </ul>
      </aside>

      <main className="w-2/3 p-6 flex flex-col bg-white">
        {currentChat ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentChat.groupName || currentChat.participants.map((p) => p.username).join(", ")}
            </h2>

            <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-gray-50 shadow-inner">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`p-2 my-1 border-b border-gray-300 ${
                    msg.sender.username === username ? "text-right" : "text-left"
                  }`}
                >
                  <strong className={msg.sender.username === username ? "text-blue-600" : "text-gray-800"}>
                    {msg.sender.username}: 
                  </strong>
                  <span className="text-gray-800">{msg.content}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex">
              <input
                type="text"
                className="flex-1 border rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
              />
              <button
                onClick={sendMessage}
                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                Отправить
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Выберите чат для общения
          </div>
        )}
      </main>
    </div>
  );
}
