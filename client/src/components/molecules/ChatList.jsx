import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, MessageSquare, Trash2, Pin } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { config } from '../../config';
import GroupChatModal from './GroupChatModal';

const ChatList = () => {
    const { chats, selectedChat, setSelectedChat, loading, fetchChats, onlineUsers, notification, deleteChat, togglePinChat } = useChat();
    const { user: currentUser } = useAuth();
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [searching, setSearching] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSearch = async (query) => {
        setSearch(query);
        if (!query) {
            setSearchResult([]);
            return;
        }

        try {
            setSearching(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${config.API_URL}/api/users/search?search=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResult(data);
            setSearching(false);
        } catch (error) {
            console.error("Error searching users", error);
            setSearching(false);
        }
    };

    const accessChat = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${config.API_URL}/api/chat`, { userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedChat(data);
            fetchChats(); // Update list
        } catch (error) {
            console.error("Error accessing chat", error);
        }
    };

    const getSender = (users) => {
        if (!users || users.length === 0) return null;
        if (users.length === 1) return users[0];
        return users[0]?._id === currentUser._id ? users[1] : users[0];
    };

    return (
        <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-4 glass-panel border-b border-border/20 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">Messages</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-2.5 bg-secondary/80 hover:bg-primary hover:text-primary-foreground rounded-2xl transition-all duration-300 group"
                        title="New Group Chat"
                    >
                        <UserPlus size={20} className="transition-transform group-hover:scale-110" />
                    </button>
                </div>
                <GroupChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search workspace..."
                        className="w-full pl-11 pr-4 py-3 bg-secondary/50 hover:bg-secondary/80 focus:bg-background border border-transparent focus:border-primary/20 rounded-2xl text-sm transition-all focus:ring-4 focus:ring-primary/5 outline-none"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
                {search ? (
                    <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-300">
                        <h3 className="px-4 py-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Search Results</h3>
                        {searching ? (
                            <div className="flex justify-center p-8">
                                <div className="spinner w-6 h-6 border-2 border-t-primary"></div>
                            </div>
                        ) : searchResult.length > 0 ? (
                            searchResult.map((u) => (
                                <button
                                    key={u._id}
                                    onClick={() => accessChat(u._id)}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-secondary/50 rounded-2xl transition-all duration-200 text-left group"
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary group-hover:scale-105 transition-transform duration-300">
                                            {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full rounded-2xl object-cover" /> : u.name.charAt(0)}
                                        </div>
                                        {onlineUsers.includes(u._id) && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-online border-4 border-background rounded-full shadow-sm" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{u.name}</p>
                                        <p className="text-xs text-muted-foreground/70 truncate">{u.email}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="p-4 text-center text-sm text-muted-foreground/50 italic">No users found</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-right-4 duration-500">
                        {loading ? (
                            <div className="flex justify-center p-12">
                                <div className="spinner w-8 h-8 border-2 border-t-primary"></div>
                            </div>
                        ) : chats.length > 0 ? (
                            [...chats].sort((a, b) => {
                                // Helper to detect self-chat (works for old chats without isSelfChat flag)
                                const isSelfChat = (chat) => chat.isSelfChat || (!chat.isGroupChat && chat.users?.length === 1 && chat.users[0]?._id === currentUser._id);
                                // Self-chat always first
                                if (isSelfChat(a) && !isSelfChat(b)) return -1;
                                if (!isSelfChat(a) && isSelfChat(b)) return 1;
                                // Then pinned chats
                                const aIsPinned = a.pinnedBy?.includes(currentUser._id);
                                const bIsPinned = b.pinnedBy?.includes(currentUser._id);
                                if (aIsPinned && !bIsPinned) return -1;
                                if (!aIsPinned && bIsPinned) return 1;
                                return 0;
                            }).map((chat) => {
                                const sender = !chat.isGroupChat && chat.users && chat.users.length > 0 ? getSender(chat.users) : null;
                                const isSelected = selectedChat?._id === chat._id;
                                const isPinned = chat.pinnedBy?.includes(currentUser._id);
                                // Detect self-chat
                                const isSelfChat = chat.isSelfChat || (!chat.isGroupChat && chat.users?.length === 1 && chat.users[0]?._id === currentUser._id);

                                return (
                                    <div
                                        key={chat._id}
                                        onClick={() => setSelectedChat(chat)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 text-left relative group cursor-pointer ${isSelected
                                            ? 'bg-primary shadow-xl shadow-primary/20 scale-[1.02] text-primary-foreground'
                                            : 'hover:bg-accent/10 active:scale-[0.98]'
                                            }`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold overflow-hidden transition-transform group-hover:scale-105 ${isSelected ? 'bg-white/20 text-white' : 'bg-secondary text-secondary-foreground'
                                                }`}>
                                                {chat.isGroupChat ? (
                                                    <Users size={24} className={isSelected ? 'text-primary' : ''} />
                                                ) : sender ? (
                                                    sender.avatar ? <img src={sender.avatar} alt={sender.name} className="w-full h-full object-cover" /> : sender.name?.charAt(0) || 'U'
                                                ) : (
                                                    'U'
                                                )}
                                            </div>
                                            {!chat.isGroupChat && sender && onlineUsers.includes(sender._id) && (
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-online border-2 rounded-full shadow-sm ${isSelected ? 'border-primary' : 'border-background'}`} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <p className={`font-bold text-sm truncate ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                                    {isSelfChat
                                                        ? `${currentUser?.name} (You)`
                                                        : chat.isGroupChat
                                                            ? chat.chatName
                                                            : sender?.name || 'Unknown User'}
                                                </p>
                                                {chat.latestMessage && (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`text-[10px] tabular-nums ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                            {new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {notification.some(n => n.chat._id === chat._id) && (
                                                            <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-sm animate-in zoom-in-50 duration-300">
                                                                {notification.filter(n => n.chat._id === chat._id).length}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className={`text-xs truncate flex-1 ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                                                    {chat.latestMessage ? (
                                                        <>
                                                            <span className={`font-semibold ${isSelected ? 'text-primary-foreground' : ''}`}>{chat.latestMessage.sender._id === currentUser._id ? "You: " : `${chat.latestMessage.sender.name.split(' ')[0]}: `}</span>
                                                            {chat.latestMessage.content}
                                                        </>
                                                    ) : (
                                                        "Start a conversation"
                                                    )}
                                                </p>
                                                {!isSelected && notification.some(n => n.chat._id === chat._id) && (
                                                    <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-sm shadow-primary/50 animate-pulse ml-2 shrink-0"></div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            {/* Pin Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePinChat(chat._id);
                                                }}
                                                className={`p-2 rounded-xl transition-all ${isPinned
                                                    ? (isSelected ? 'text-primary-foreground bg-white/20' : 'text-primary bg-primary/10')
                                                    : (isSelected ? 'text-primary-foreground hover:bg-white/10' : 'text-muted-foreground hover:bg-secondary')
                                                    }`}
                                                title={isPinned ? "Unpin chat" : "Pin chat"}
                                            >
                                                <Pin size={16} className={isPinned ? 'fill-current' : ''} />
                                            </button>
                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Are you sure you want to delete this chat? All messages will be lost.')) {
                                                        deleteChat(chat._id);
                                                    }
                                                }}
                                                className={`p-2 rounded-xl transition-all hover:bg-destructive/20 ${isSelected ? 'text-primary-foreground hover:text-primary-foreground' : 'text-muted-foreground hover:text-destructive'}`}
                                                title="Delete chat"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        {/* Pin Indicator */}
                                        {isPinned && (
                                            <div className={`absolute top-2 left-2 p-1 rounded-lg ${isSelected ? 'bg-white/20 text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                                <Pin size={10} className="fill-current" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground/30 mb-4 animate-bounce duration-1000">
                                    <MessageSquare size={32} />
                                </div>
                                <h4 className="font-bold text-foreground/80 mb-1">No messages yet</h4>
                                <p className="text-xs text-muted-foreground/60 leading-relaxed">Search for a teammate or start a new group to begin.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatList;
