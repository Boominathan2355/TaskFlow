import React, { useState } from 'react';
import { X, Search, Check, UserPlus } from 'lucide-react';
import axios from 'axios';
import { config } from '../../config';
import { useChat } from '../../contexts/ChatContext';

const GroupChatModal = ({ isOpen, onClose }) => {
    const { fetchChats, setSelectedChat } = useChat();
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (query) => {
        setSearch(query);
        if (!query) {
            setSearchResult([]);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${config.API_URL}/api/users/search?search=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResult(data);
            setLoading(false);
        } catch (error) {
            console.error("Search error", error);
            setLoading(false);
        }
    };

    const handleGroup = (userToAdd) => {
        if (selectedUsers.includes(userToAdd)) {
            setSelectedUsers(selectedUsers.filter((sel) => sel._id !== userToAdd._id));
        } else {
            setSelectedUsers([...selectedUsers, userToAdd]);
        }
    };

    const handleDelete = (delUser) => {
        setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
    };

    const handleSubmit = async () => {
        if (!groupName || selectedUsers.length === 0) {
            alert("Please fill all the fields");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${config.API_URL}/api/chat/group`, {
                name: groupName,
                users: JSON.stringify(selectedUsers.map((u) => u._id)),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchChats();
            setSelectedChat(data);
            onClose();
        } catch (error) {
            console.error("Failed to create group", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card border shadow-2xl shadow-primary/10 rounded-[2rem] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b flex justify-between items-center bg-muted/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <UserPlus size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Create Group</h2>
                            <p className="text-xs text-muted-foreground font-medium">Add at least 2 teammates</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] px-1">Group Details</label>
                        <input
                            type="text"
                            placeholder="Describe your group..."
                            className="w-full px-5 py-4 bg-secondary/50 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-background transition-all outline-none font-medium text-sm focus:ring-4 focus:ring-primary/5"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] px-1">Find Teammates</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or email"
                                className="w-full pl-12 pr-5 py-4 bg-muted/30 rounded-2xl border border-transparent focus:border-primary/30 focus:bg-background transition-all outline-none font-medium text-sm focus:ring-4 focus:ring-primary/5"
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 py-1">
                            {selectedUsers.map((u) => (
                                <div key={u._id} className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-xl border border-primary/20 animate-in zoom-in-75 duration-300">
                                    <span className="text-primary">{u.name}</span>
                                    <button
                                        onClick={() => handleDelete(u)}
                                        className="p-1 hover:bg-primary/20 rounded-lg text-primary transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search Results */}
                    <div className="max-h-[160px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="spinner w-8 h-8 border-2 border-t-primary"></div>
                            </div>
                        ) : (
                            searchResult?.slice(0, 4).map((user) => (
                                <button
                                    key={user._id}
                                    onClick={() => handleGroup(user)}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all group ${selectedUsers.some(u => u._id === user._id)
                                        ? 'bg-primary/5 border border-primary/20'
                                        : 'hover:bg-secondary/80 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm">{user.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${selectedUsers.some(u => u._id === user._id)
                                        ? 'bg-primary text-white scale-100'
                                        : 'bg-secondary text-transparent scale-75'
                                        }`}>
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-8 bg-muted/5 border-t flex items-center justify-between gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-2xl font-bold text-sm text-muted-foreground hover:bg-secondary transition-all"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!groupName || selectedUsers.length < 2}
                        className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all text-sm tracking-wide"
                    >
                        Connect Workspace
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupChatModal;
