import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Paperclip, Smile, Users, Bold, Italic, Code, List, Link, Quote, Strikethrough, Phone, Video } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ReactMarkdown from 'react-markdown';
import { MentionsInput, Mention } from 'react-mentions';
import axios from 'axios';
import { config } from '../../config';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useCall } from '../../contexts/CallContext';

const ChatWindow = () => {
    const { selectedChat, setSelectedChat, messages, sendMessage, fetchMessages, loadingMessages, onlineUsers } = useChat();
    const { user: currentUser } = useAuth();
    const socket = useSocket();
    const { callUser } = useCall();
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typing, setTyping] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [pastedAttachments, setPastedAttachments] = useState([]);
    const [markdownMode, setMarkdownMode] = useState(false);
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

    // Handle paste event for images and videos
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const isImage = items[i].type.indexOf('image') !== -1;
                const isVideo = items[i].type.indexOf('video') !== -1;

                if (isImage || isVideo) {
                    const blob = items[i].getAsFile();
                    const reader = new FileReader();

                    reader.onload = (event) => {
                        const extension = isImage ? 'png' : 'mp4';
                        const prefix = isImage ? 'pasted-image' : 'pasted-video';

                        setPastedAttachments(prev => [...prev, {
                            file: blob,
                            preview: event.target.result,
                            name: `${prefix}-${Date.now()}.${extension}`,
                            type: blob.type,
                            isVideo: isVideo
                        }]);
                    };

                    reader.readAsDataURL(blob);
                    e.preventDefault();
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

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

        // Upload pasted attachments first if any
        if (pastedAttachments.length > 0) {
            for (const attachment of pastedAttachments) {
                await uploadAttachment(attachment.file);
            }
            setPastedAttachments([]);
        }

        if (newMessage.trim()) {
            socket?.emit("stop_typing", selectedChat._id);
            const messageToSend = newMessage;
            setNewMessage("");
            await sendMessage(messageToSend, selectedChat._id);
        }
    };

    const uploadAttachment = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('chatId', selectedChat._id);

            const token = localStorage.getItem('token');
            const response = await axios.post(`${config.API_URL}/api/message/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Emit socket event for real-time update
            if (socket) {
                socket.emit('new_message', response.data);
            }

            // Refresh messages
            await fetchMessages(selectedChat._id);
        } catch (error) {
            console.error('Attachment upload error:', error);
            alert('Failed to upload attachment. Please try again.');
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

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('chatId', selectedChat._id);

            const token = localStorage.getItem('token');
            const response = await axios.post(`${config.API_URL}/api/message/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Emit socket event for real-time update
            if (socket) {
                socket.emit('new_message', response.data);
            }

            // Clear file input
            e.target.value = '';
            setSelectedFile(null);

            // Refresh messages
            await fetchMessages();
        } catch (error) {
            console.error('File upload error:', error);
            alert('Failed to upload file. Please try again.');
        }
    };

    const getSender = (users) => {
        return users[0]._id === currentUser._id ? users[1] : users[0];
    };

    // Markdown formatting helper
    const insertMarkdown = (syntax, wrap = true) => {
        const textarea = document.querySelector('.mentions-input textarea');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = newMessage.substring(start, end);

        let newText;
        let cursorPos;

        if (wrap && selectedText) {
            // Wrap selected text
            if (syntax === '`') {
                newText = newMessage.substring(0, start) + `\`${selectedText}\`` + newMessage.substring(end);
                cursorPos = end + 2;
            } else if (syntax === '```') {
                newText = newMessage.substring(0, start) + `\`\`\`\n${selectedText}\n\`\`\`` + newMessage.substring(end);
                cursorPos = end + 8;
            } else if (syntax === '>') {
                newText = newMessage.substring(0, start) + `> ${selectedText}` + newMessage.substring(end);
                cursorPos = end + 2;
            } else if (syntax === '-') {
                newText = newMessage.substring(0, start) + `- ${selectedText}` + newMessage.substring(end);
                cursorPos = end + 2;
            } else if (syntax === 'link') {
                newText = newMessage.substring(0, start) + `[${selectedText}](url)` + newMessage.substring(end);
                cursorPos = end + 7;
            } else {
                newText = newMessage.substring(0, start) + `${syntax}${selectedText}${syntax}` + newMessage.substring(end);
                cursorPos = end + syntax.length * 2;
            }
        } else {
            // Insert at cursor
            if (syntax === '`') {
                newText = newMessage.substring(0, start) + '``' + newMessage.substring(end);
                cursorPos = start + 1;
            } else if (syntax === '```') {
                newText = newMessage.substring(0, start) + '```\n\n```' + newMessage.substring(end);
                cursorPos = start + 4;
            } else if (syntax === '>') {
                newText = newMessage.substring(0, start) + '> ' + newMessage.substring(end);
                cursorPos = start + 2;
            } else if (syntax === '-') {
                newText = newMessage.substring(0, start) + '- ' + newMessage.substring(end);
                cursorPos = start + 2;
            } else if (syntax === 'link') {
                newText = newMessage.substring(0, start) + '[text](url)' + newMessage.substring(end);
                cursorPos = start + 1;
            } else {
                newText = newMessage.substring(0, start) + syntax + syntax + newMessage.substring(end);
                cursorPos = start + syntax.length;
            }
        }

        setNewMessage(newText);

        // Restore cursor position after state update
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPos, cursorPos);
        }, 0);
    };

    if (!selectedChat) return null;

    const chatPartner = !selectedChat.isGroupChat ? getSender(selectedChat.users) : null;

    // Detect self-chat (works for old chats without isSelfChat flag)
    const isSelfChat = selectedChat.isSelfChat || (!selectedChat.isGroupChat && selectedChat.users?.length === 1 && selectedChat.users[0]?._id === currentUser._id);

    const handleCall = (video = false) => {
        // Unified call logic for both Group and Direct
        // For direct, we treat it as a room with the Chat ID
        callUser(selectedChat._id, video);
    };

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
                            ) : isSelfChat ? (
                                currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : currentUser.name?.charAt(0) || 'U'
                            ) : chatPartner ? (
                                chatPartner.avatar ? <img src={chatPartner.avatar} className="w-full h-full object-cover" /> : chatPartner.name?.charAt(0) || 'U'
                            ) : (
                                'U'
                            )}
                        </div>
                        {!selectedChat.isGroupChat && !isSelfChat && chatPartner && onlineUsers.includes(chatPartner._id) && (
                            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-online border-[3.5px] border-background rounded-full shadow-lg" />
                        )}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <h3 className="font-bold text-xl tracking-tight truncate">
                            {isSelfChat
                                ? `${currentUser?.name} (You)`
                                : selectedChat.isGroupChat
                                    ? selectedChat.chatName
                                    : chatPartner?.name || 'Unknown User'}
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
                            ) : chatPartner ? (
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ring-2 ring-background ${onlineUsers.includes(chatPartner._id) ? 'bg-online' : 'bg-offline'}`} />
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${onlineUsers.includes(chatPartner._id) ? 'text-success' : 'text-muted-foreground/40'}`}>
                                        {onlineUsers.includes(chatPartner._id) ? "Online now" : "Offline"}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 relative">
                    <>
                        <button
                            onClick={() => handleCall(false)}
                            className="p-2.5 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-primary"
                            title="Voice Call"
                        >
                            <Phone size={20} />
                        </button>
                        <button
                            onClick={() => handleCall(true)}
                            className="p-2.5 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-primary mr-2"
                            title="Video Call"
                        >
                            <Video size={20} />
                        </button>
                    </>
                    <div ref={menuRef}>
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

                            if (m.type === 'call') {
                                return (
                                    <div key={m._id} className="flex justify-center my-4">
                                        <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full border border-border/50 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:bg-secondary/80 transition-colors">
                                            <div className="p-1 bg-primary/20 rounded-full text-primary">
                                                <Phone size={12} fill="currentColor" />
                                            </div>
                                            {m.content}
                                        </div>
                                    </div>
                                );
                            }

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
                                            {/* Render attachment if exists */}
                                            {m.attachment && m.attachment.fileUrl && (
                                                <div className="mb-2">
                                                    {m.attachment.fileType?.startsWith('image/') ? (
                                                        <img
                                                            src={`${config.API_URL}${m.attachment.fileUrl}`}
                                                            alt={m.attachment.fileName}
                                                            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => window.open(`${config.API_URL}${m.attachment.fileUrl}`, '_blank')}
                                                        />
                                                    ) : m.attachment.fileType?.startsWith('video/') ? (
                                                        <video
                                                            src={`${config.API_URL}${m.attachment.fileUrl}`}
                                                            controls
                                                            className="max-w-xs rounded-lg"
                                                        />
                                                    ) : (
                                                        <a
                                                            href={`${config.API_URL}${m.attachment.fileUrl}`}
                                                            download={m.attachment.fileName}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                                                        >
                                                            <Paperclip size={16} />
                                                            <span className="text-xs font-medium">{m.attachment.fileName}</span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                ({(m.attachment.fileSize / 1024).toFixed(1)}KB)
                                                            </span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            <ReactMarkdown>{m.content}</ReactMarkdown>
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
                {/* Attachments Preview */}
                {pastedAttachments.length > 0 && (
                    <div className="mb-4 p-4 bg-card border border-border/50 rounded-2xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <Paperclip size={16} className="text-primary" />
                                <span>ATTACHMENTS</span>
                                <span className="text-xs text-muted-foreground">({pastedAttachments.length})</span>
                            </div>
                            <button
                                onClick={() => setPastedAttachments([])}
                                className="text-xs text-destructive hover:underline"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {pastedAttachments.map((attachment, index) => (
                                <div key={index} className="relative group">
                                    {attachment.isVideo ? (
                                        <div className="relative">
                                            <video
                                                src={attachment.preview}
                                                className="w-full h-24 object-cover rounded-lg border border-border"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                                                <Video size={24} className="text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={attachment.preview}
                                            alt={attachment.name}
                                            className="w-full h-24 object-cover rounded-lg border border-border"
                                        />
                                    )}
                                    <button
                                        onClick={() => setPastedAttachments(prev => prev.filter((_, i) => i !== index))}
                                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <div className="mt-1 text-[10px] text-muted-foreground truncate">
                                        {attachment.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`w-full mx-auto glass-panel shadow-xl border-border/10 focus-within:border-primary/40 transition-all ${markdownMode ? 'rounded-2xl' : 'rounded-[2.5rem] p-1.5'}`}>
                    {/* Markdown Toolbar */}
                    {markdownMode && (
                        <div className="flex items-center gap-1 px-4 py-2 border-b border-border/20 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => insertMarkdown('**')}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="Bold"
                            >
                                <Bold size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdown('*')}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="Italic"
                            >
                                <Italic size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdown('~~')}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="Strikethrough"
                            >
                                <Strikethrough size={16} />
                            </button>
                            <div className="w-px h-5 bg-border/40 mx-1" />
                            <button
                                type="button"
                                onClick={() => insertMarkdown('`')}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="Inline Code"
                            >
                                <Code size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdown('```')}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all text-[10px] font-mono font-bold"
                                title="Code Block"
                            >
                                {'</>'}
                            </button>
                            <div className="w-px h-5 bg-border/40 mx-1" />
                            <button
                                type="button"
                                onClick={() => insertMarkdown('>')}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="Quote"
                            >
                                <Quote size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdown('-')}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="List"
                            >
                                <List size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdown('link')}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="Link"
                            >
                                <Link size={16} />
                            </button>
                        </div>
                    )}
                    <form
                        onSubmit={handleSendMessage}
                        className={`flex items-center gap-2 ${markdownMode ? 'p-1.5' : ''}`}
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
                        <MentionsInput
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                typingHandler(e);
                            }}
                            placeholder={markdownMode ? "Type markdown... (**bold** *italic* `code` @mention)" : "Type a message... (@mention)"}
                            className="mentions-input flex-1"
                            style={{
                                control: {
                                    backgroundColor: 'transparent',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                },
                                input: {
                                    margin: 0,
                                    padding: '12px 8px',
                                    border: 'none',
                                    outline: 'none',
                                },
                                highlighter: {
                                    padding: '12px 8px',
                                    border: 'none',
                                },
                                suggestions: {
                                    list: {
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    },
                                    item: {
                                        padding: '8px 12px',
                                        borderBottom: '1px solid hsl(var(--border))',
                                        '&focused': {
                                            backgroundColor: 'hsl(var(--primary) / 0.1)',
                                        },
                                    },
                                },
                            }}
                        >
                            <Mention
                                trigger="@"
                                markup="@[__display__](__id__)"
                                data={[
                                    ...(selectedChat?.isGroupChat ? [{ id: 'everyone', display: 'everyone' }] : []),
                                    ...(selectedChat?.users?.map(user => ({
                                        id: user._id,
                                        display: user.name,
                                    })) || [])
                                ]}
                                displayTransform={(id, display) => `@${display}`}
                                style={{
                                    backgroundColor: 'hsl(var(--primary) / 0.2)',
                                    color: 'hsl(var(--primary))',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                }}
                                appendSpaceOnAdd
                            />
                        </MentionsInput>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setMarkdownMode(!markdownMode)}
                                className={`p-3 rounded-2xl transition-all ${markdownMode
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                                    }`}
                                title={markdownMode ? "Markdown mode ON" : "Enable markdown"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 7V17H6L9 14 12 17 15 14 18 17H21V7H3Z" />
                                    <path d="M9 11L12 14 9 17" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-1 relative" ref={emojiRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all flex"
                                >
                                    <Smile size={20} />
                                </button>

                                {showEmojiPicker && (
                                    <div className="absolute bottom-14 right-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-2xl overflow-hidden shadow-2xl border border-border/40">
                                        <EmojiPicker
                                            onEmojiClick={(emojiObject) => {
                                                setNewMessage(prev => prev + emojiObject.emoji);
                                                setShowEmojiPicker(false);
                                            }}
                                            searchDisabled={false}
                                            skinTonesDisabled={false}
                                            width={350}
                                            height={450}
                                            theme="dark"
                                            previewConfig={{
                                                showPreview: false
                                            }}
                                            searchPlaceHolder="Search emojis..."
                                        />
                                    </div>
                                )}
                            </div>
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
