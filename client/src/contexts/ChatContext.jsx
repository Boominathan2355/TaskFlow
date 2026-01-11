import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import axios from 'axios';
import { config } from '../config';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [selectedChat, setSelectedChatRaw] = useState(null);

    const setSelectedChat = (chat) => {
        setSelectedChatRaw(chat);
        if (chat) {
            // Clear notifications for this chat
            setNotification(prev => prev.filter(n => n.chat._id !== chat._id));
        }
    };

    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [notification, setNotification] = useState([]);
    const [isChatHubOpen, setIsChatHubOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const { user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const fetchChats = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${config.API_URL}/api/chat`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove duplicates based on _id
            const uniqueChats = data.filter((chat, index, self) =>
                index === self.findIndex((c) => c._id === chat._id)
            );
            setChats(uniqueChats);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching chats", error);
            setLoading(false);
        }
    }, []);

    const fetchMessages = useCallback(async (chatId) => {
        if (!chatId) return;
        try {
            setLoadingMessages(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${config.API_URL}/api/message/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(data);
            setLoadingMessages(false);
            socket?.emit("join_chat", chatId);
        } catch (error) {
            console.error("Error fetching messages", error);
            setLoadingMessages(false);
        }
    }, [socket]);

    useEffect(() => {
        if (user) {
            fetchChats();
        }
    }, [user, fetchChats]);

    useEffect(() => {
        if (socket) {
            socket.on("message_received", (newMessageReceived) => {
                // If the message is for the currently selected chat, add it to the message state
                if (selectedChat && selectedChat._id === newMessageReceived.chat._id) {
                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.find(m => m._id === newMessageReceived._id)) return prev;
                        return [...prev, newMessageReceived];
                    });
                } else {
                    // Otherwise, add to notifications and refreshing chat list
                    setNotification(prev => {
                        if (prev.find(n => n._id === newMessageReceived._id)) return prev;
                        return [newMessageReceived, ...prev];
                    });
                    showNativeNotification(newMessageReceived);
                }
                fetchChats(); // Refresh chat list for latest message preview
            });

            socket.on("user_status", ({ userId, status }) => {
                setOnlineUsers(prev => {
                    if (status === 'online') {
                        return prev.includes(userId) ? prev : [...prev, userId];
                    } else {
                        return prev.filter(id => id !== userId);
                    }
                });
            });

            socket.on("get_online_users", (users) => {
                setOnlineUsers(users);
            });

            socket.on("new_chat_received", (newChat) => {
                setChats(prev => {
                    // Prevent duplicates
                    if (prev.find(c => c._id === newChat._id)) return prev;
                    return [newChat, ...prev];
                });
            });

            // Browser notification permission
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }

            return () => {
                socket.off("message_received");
                socket.off("typing");
                socket.off("user_status");
                socket.off("get_online_users");
                socket.off("new_chat_received");
            };
        }
    }, [socket, selectedChat, fetchChats]);

    const showNativeNotification = (message) => {
        if (Notification.permission === "granted") {
            const title = message.chat.isGroupChat ? message.chat.chatName : message.sender.name;
            const options = {
                body: message.content,
                icon: message.sender.avatar || '/chat-icon.png'
            };
            const n = new Notification(title, options);
            n.onclick = () => {
                window.focus();
                setSelectedChat(message.chat);
                navigate('/chat');
            };
        }
    };

    const sendMessage = async (content, chatId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${config.API_URL}/api/message`,
                { content, chatId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            socket?.emit("new_message", data);
            setMessages(prev => [...prev, data]);
            fetchChats(); // Refresh chat list for latest message
            return data;
        } catch (error) {
            console.error("Error sending message", error);
        }
    };

    const toggleChatHub = () => setIsChatHubOpen(!isChatHubOpen);

    return (
        <ChatContext.Provider value={{
            selectedChat,
            setSelectedChat,
            chats,
            setChats,
            messages,
            setMessages,
            notification,
            setNotification,
            isChatHubOpen,
            setIsChatHubOpen,
            toggleChatHub,
            fetchChats,
            fetchMessages,
            sendMessage,
            loading,
            loadingMessages,
            onlineUsers
        }}>
            {children}
        </ChatContext.Provider>
    );
};
