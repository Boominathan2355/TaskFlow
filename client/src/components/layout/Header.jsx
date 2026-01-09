
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { taskAPI } from '../../services';
import { Search, Loader2, FileText, ChevronRight } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
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
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8 flex-1">
                    <NavLink to="/" className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight hidden lg:block">TaskFlow</h1>
                    </NavLink>

                    {/* Global Search Bar */}
                    <div className="max-w-md w-full relative" ref={searchRef}>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {isSearching ? (
                                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                )}
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 bg-muted/50 border border-border/50 rounded-xl leading-5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background focus:border-primary transition-all duration-200"
                                placeholder="Search tickets by title or key..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => searchQuery && setShowSearchResults(true)}
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {showSearchResults && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 border-b border-border bg-muted/30">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Ticket Results</p>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto">
                                    {searchResults.length > 0 ? (
                                        searchResults.map((task) => (
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
                                                        <span className="text-[10px] font-bold text-primary truncate max-w-[100px] uppercase tracking-widest flex items-center gap-1">
                                                            <ChevronRight className="h-2 w-2" />
                                                            {task.project?.title}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                        {task.title}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    ) : !isSearching ? (
                                        <div className="p-8 text-center">
                                            <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                            <p className="text-sm text-muted-foreground font-medium italic">No tickets found for "{searchQuery}"</p>
                                        </div>
                                    ) : (
                                        <div className="p-12 flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Searching...</p>
                                        </div>
                                    )}
                                </div>
                                {searchResults.length > 0 && (
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

