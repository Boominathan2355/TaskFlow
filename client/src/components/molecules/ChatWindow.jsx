import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Paperclip, Smile, Users } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const ChatWindow = () => {
    const { selectedChat, setSelectedChat, messages, sendMessage, fetchMessages, loadingMessages, onlineUsers } = useChat();
    const { user: currentUser } = useAuth();
    const socket = useSocket();
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typing, setTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat._id);
        }
    }, [selectedChat, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (socket && selectedChat) {
            socket.on("typing", (room) => {
                if (room === selectedChat._id) setIsTyping(true);
            });
            socket.on("stop_typing", (room) => {
                if (room === selectedChat._id) setIsTyping(false);
            });

            return () => {
                socket.off("typing");
                socket.off("stop_typing");
            };
        }
    }, [socket, selectedChat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            socket?.emit("stop_typing", selectedChat._id);
            const messageToSend = newMessage;
            setNewMessage("");
            await sendMessage(messageToSend, selectedChat._id);
        }
    };

    const typingHandler = (e) => {
        setNewMessage(e.target.value);

        if (!socket) return;

        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }

        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit("stop_typing", selectedChat._id);
                setTyping(false);
            }
        }, timerLength);
    };

    const getSender = (users) => {
        return users[0]._id === currentUser._id ? users[1] : users[0];
    };

    if (!selectedChat) return null;

    const chatPartner = !selectedChat.isGroupChat ? getSender(selectedChat.users) : null;

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-transparent">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 glass-panel border-b border-border/20 z-20 backdrop-blur-2xl">
                <div className="flex items-center gap-5 min-w-0">
                    <button
                        onClick={() => setSelectedChat(null)}
                        className="p-2.5 hover:bg-secondary rounded-xl md:hidden transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center font-bold overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                            {selectedChat.isGroupChat ? (
                                <Users size={28} className="text-primary/70" />
                            ) : (
                                chatPartner.avatar ? <img src={chatPartner.avatar} className="w-full h-full object-cover" /> : chatPartner.name.charAt(0)
                            )}
                        </div>
                        {!selectedChat.isGroupChat && onlineUsers.includes(chatPartner._id) && (
                            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-online border-[3.5px] border-background rounded-full shadow-lg" />
                        )}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <h3 className="font-bold text-xl tracking-tight truncate">
                            {selectedChat.isGroupChat ? selectedChat.chatName : chatPartner.name}
                        </h3>
                        <div className="flex items-center gap-2">
                            {isTyping ? (
                                <div className="flex items-center gap-1.5">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                    </div>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">Typing</p>
                                </div>
                            ) : selectedChat.isGroupChat ? (
                                <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-[0.2em]">{selectedChat.users.length} Active Members</p>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ring-2 ring-background ${onlineUsers.includes(chatPartner._id) ? 'bg-online' : 'bg-offline'}`} />
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${onlineUsers.includes(chatPartner._id) ? 'text-success' : 'text-muted-foreground/40'}`}>
                                        {onlineUsers.includes(chatPartner._id) ? "Online now" : "Offline"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2.5 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative z-10 scroll-smooth">
                {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-4">
                            <div className="spinner w-10 h-10 border-2 border-t-primary"></div>
                            <p className="text-xs text-muted-foreground animate-pulse uppercase tracking-[0.2em] font-bold">Encrypting...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 w-full mx-auto">
                        {messages.map((m, i) => {
                            const isMe = m.sender._id === currentUser._id;
                            const showAvatar = i === 0 || messages[i - 1].sender._id !== m.sender._id;

                            return (
                                <div
                                    key={m._id}
                                    className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                >
                                    <div className="shrink-0 mb-1">
                                        {showAvatar ? (
                                            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm">
                                                {m.sender.avatar ? (
                                                    <img src={m.sender.avatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    m.sender.name.charAt(0)
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-8" />
                                        )}
                                    </div>
                                    <div className={`flex flex-col max-w-[75%] gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                        {showAvatar && !isMe && (
                                            <span className="text-[10px] font-bold text-muted-foreground/60 px-1 uppercase tracking-wider">
                                                {m.sender.name.split(' ')[0]}
                                            </span>
                                        )}
                                        <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm relative group transition-all ${isMe
                                            ? 'chat-bubble-me text-primary-foreground shadow-primary/20 rounded-br-none'
                                            : 'bg-card border border-border/50 text-foreground rounded-bl-none hover:border-primary/20'
                                            }`}>
                                            {m.content}
                                            <span className={`text-[9px] block mt-1 opacity-0 group-hover:opacity-60 transition-opacity absolute top-[-18px] ${isMe ? 'right-0' : 'left-0'} text-muted-foreground font-medium`}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 relative z-20">
                <div className="w-full mx-auto p-1.5 glass-panel rounded-[2.5rem] shadow-xl border-border/10 focus-within:border-primary/40 transition-all">
                    <form
                        onSubmit={handleSendMessage}
                        className="flex items-center gap-2"
                    >
                        <div className="flex items-center">
                            <button
                                type="button"
                                className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                            >
                                <Paperclip size={20} />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none outline-none text-sm px-2 py-3 placeholder:text-muted-foreground/40 font-medium"
                            value={newMessage}
                            onChange={typingHandler}
                        />
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all hidden sm:flex"
                            >
                                <Smile size={20} />
                            </button>
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all font-bold group"
                            >
                                <Send size={20} className="transition-transform group-hover:rotate-12" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
