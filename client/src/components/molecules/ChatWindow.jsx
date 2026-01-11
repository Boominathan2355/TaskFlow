import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Paperclip, Smile, Users } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
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
    const [showMenu, setShowMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const messagesEndRef = useRef(null);
    const menuRef = useRef(null);
    const emojiRef = useRef(null);
    const fileInputRef = useRef(null);

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

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // For now, just show an alert. In production, you'd upload the file
            alert(`File selected: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)} KB\nType: ${file.type}\n\nNote: File upload feature coming soon!`);
        }
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
                <div className="flex items-center gap-1 relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2.5 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground"
                    >
                        <MoreVertical size={20} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-12 w-56 glass-panel border border-border/40 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="py-2">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        // Add view profile functionality here
                                        console.log('View profile clicked');
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary/50 transition-colors flex items-center gap-3"
                                >
                                    <Users size={16} className="text-muted-foreground" />
                                    <span>View {selectedChat.isGroupChat ? 'Group' : 'Profile'}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        // Add mute functionality here
                                        console.log('Mute chat clicked');
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary/50 transition-colors flex items-center gap-3"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><line x1="22" x2="16" y1="9" y2="15" /><line x1="16" x2="22" y1="9" y2="15" /></svg>
                                    <span>Mute Chat</span>
                                </button>
                                <div className="h-px bg-border/40 my-2" />
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        if (confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
                                            // Add clear messages functionality here
                                            console.log('Clear messages clicked');
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-3"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    <span>Clear Messages</span>
                                </button>
                            </div>
                        </div>
                    )}
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
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileSelect}
                                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
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
                        <div className="flex items-center gap-1 relative" ref={emojiRef}>
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all hidden sm:flex"
                            >
                                <Smile size={20} />
                            </button>

                            {showEmojiPicker && (
                                <div className="absolute bottom-14 right-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <EmojiPicker
                                        onEmojiClick={(emojiObject) => {
                                            setNewMessage(prev => prev + emojiObject.emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                        searchDisabled={false}
                                        skinTonesDisabled={false}
                                        width={350}
                                        height={450}
                                    />
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all font-bold group"
                        >
                            <Send size={20} className="transition-transform group-hover:rotate-12" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
