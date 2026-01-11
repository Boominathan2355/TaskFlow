
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { taskAPI } from '../../services';
import { Search, Loader2, FileText, ChevronRight, MessageSquare, Users } from 'lucide-react';
import NotificationDropdown from '../molecules/NotificationDropdown';
import { useChat } from '../../contexts/ChatContext';

const Header = () => {
    const { notification, chats, setSelectedChat } = useChat();
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [chatResults, setChatResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef(null);
    const searchTimeout = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!val.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        setShowSearchResults(true);

        searchTimeout.current = setTimeout(async () => {
            try {
                const { data } = await taskAPI.searchTasks(val);
                setSearchResults(data.tasks || []);

                // Search chats
                const searchLower = val.toLowerCase();
                const filtered = chats?.filter(chat => {
                    if (chat.isGroupChat) {
                        return chat.chatName?.toLowerCase().includes(searchLower);
                    } else {
                        const sender = chat.users?.find(u => u._id !== user._id);
                        return sender?.name?.toLowerCase().includes(searchLower);
                    }
                }) || [];
                setChatResults(filtered);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleResultClick = (task) => {
        navigate(`/projects/${task.project._id}/tasks/${task._id}`);
        setShowSearchResults(false);
        setSearchQuery('');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8 flex-1">
                    <NavLink to="/" className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight hidden lg:block">TaskFlow</h1>
                    </NavLink>

                    <nav className="hidden md:flex items-center gap-4 border-l pl-8 ml-2 h-8 border-border">
                        <NavLink to="/" className={({ isActive }) => `text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                            Dashboard
                        </NavLink>
                        <NavLink to="/chat" className={({ isActive }) => `relative flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                            <MessageSquare size={16} />
                            <span className="flex items-center gap-1.5">
                                Chat
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border bg-warning/10 text-warning border-warning/20">
                                    BETA
                                </span>
                            </span>
                            {notification.length > 0 && (
                                <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm animate-pulse">
                                    {notification.length}
                                </span>
                            )}
                        </NavLink>
                    </nav>

                    {/* Global Search Bar - Hidden on Mobile */}
                    <div className="hidden md:block max-w-[300px] lg:max-w-md w-full relative" ref={searchRef}>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className={`h-4 w-4 transition-colors ${isSearching ? 'text-primary' : 'text-muted-foreground group-focus-within:text-primary'}`} />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-10 py-2 bg-muted/50 border border-border/50 rounded-xl leading-5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background focus:border-primary transition-all duration-200"
                                placeholder="Search tickets by title or key..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => searchQuery && setShowSearchResults(true)}
                            />
                            {isSearching && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showSearchResults && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="max-h-[60vh] overflow-y-auto">
                                    {isSearching ? (
                                        <div className="p-12 flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Searching...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Task Results Section */}
                                            {searchResults.length > 0 && (
                                                <div>
                                                    <div className="p-2 border-b border-border bg-muted/30">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Tickets</p>
                                                    </div>
                                                    {searchResults.map((task) => (
                                                        <button
                                                            key={task._id}
                                                            onClick={() => handleResultClick(task)}
                                                            className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left group border-b border-border/50 last:border-0"
                                                        >
                                                            <div className="mt-1 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                                <FileText className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="text-[10px] font-black uppercase tracking-tighter bg-muted px-1.5 py-0.5 rounded text-muted-foreground group-hover:text-foreground transition-colors">
                                                                        {task.key}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-info truncate max-w-[100px] uppercase tracking-widest flex items-center gap-1">
                                                                        <ChevronRight className="h-2 w-2" />
                                                                        {task.project?.title}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                                    {task.title}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Chat Results Section */}
                                            {chatResults.length > 0 && (
                                                <div>
                                                    <div className="p-2 border-b border-border bg-muted/30">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Chats</p>
                                                    </div>
                                                    {chatResults.map((chat) => {
                                                        const sender = !chat.isGroupChat ? chat.users?.find(u => u._id !== user._id) : null;
                                                        return (
                                                            <button
                                                                key={chat._id}
                                                                onClick={() => {
                                                                    setSelectedChat(chat);
                                                                    navigate('/chat');
                                                                    setShowSearchResults(false);
                                                                    setSearchQuery('');
                                                                }}
                                                                className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left group border-b border-border/50 last:border-0"
                                                            >
                                                                <div className="mt-1 h-8 w-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2 border-border group-hover:border-primary transition-all">
                                                                    {chat.isGroupChat ? (
                                                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                                            <Users className="h-4 w-4" />
                                                                        </div>
                                                                    ) : sender?.avatar ? (
                                                                        <img
                                                                            src={sender.avatar}
                                                                            alt={sender.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                                            {sender?.name?.charAt(0)?.toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                                        {chat.isGroupChat ? chat.chatName : sender?.name}
                                                                    </p>
                                                                    {chat.isGroupChat && (
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            {chat.users?.length} members
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* No Results */}
                                            {searchResults.length === 0 && chatResults.length === 0 && (
                                                <div className="p-8 text-center">
                                                    <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                                    <p className="text-sm text-muted-foreground font-medium italic">No results found for "{searchQuery}"</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                {(searchResults.length > 0 || chatResults.length > 0) && !isSearching && (
                                    <div className="p-2 border-t border-border bg-muted/20">
                                        <p className="text-[10px] text-center text-muted-foreground font-medium italic">Showing top results</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {isDark ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                        )}
                    </button>

                    <NotificationDropdown />

                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                            className="flex items-center gap-2 btn btn-ghost px-2"
                        >
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-medium">{user?.name?.charAt(0)}</span>
                                )}
                            </div>
                            <span className="hidden sm:inline-block text-sm font-medium">{user?.name}</span>
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 p-1">
                                <div className="px-2 py-1.5 text-sm font-semibold border-b border-border mb-1">
                                    {user?.name}
                                    <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
                                </div>

                                {user?.role === 'Admin' && (
                                    <>
                                        <NavLink to="/users" className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-foreground">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                            User Management
                                        </NavLink>
                                        <NavLink to="/storage" className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-foreground">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="4" rx="2" ry="2" /><line x1="3" x2="21" y1="10" y2="10" /><line x1="7" x2="7" y1="10" y2="16" /><line x1="17" x2="17" y1="10" y2="16" /></svg>
                                            Storage Management
                                        </NavLink>
                                    </>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-destructive rounded-md hover:bg-destructive/10"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

