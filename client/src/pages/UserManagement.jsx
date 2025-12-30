import React, { useState, useEffect } from 'react';
import { userAPI } from '../services';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import CreateUserModal from '../components/CreateUserModal';
import {
    Trash2,
    Shield,
    Users,
    UserPlus,
    Search,
    Filter,
    MoreHorizontal,
    Mail,
    Calendar,
    CheckCircle2,
    ShieldAlert,
    ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeRoleMenu, setActiveRoleMenu] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        admins: 0,
        members: 0,
        viewers: 0
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (users.length > 0) {
            setStats({
                total: users.length,
                admins: users.filter(u => u.role === 'Admin').length,
                members: users.filter(u => u.role === 'Member').length,
                viewers: users.filter(u => u.role === 'Viewer').length
            });
        }
    }, [users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data } = await userAPI.getAllUsers();
            setUsers(data.users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (userData) => {
        try {
            const { data } = await userAPI.createUser(userData);
            setUsers([data.user, ...users]);
            return data.user;
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const { data } = await userAPI.updateUserRole(userId, newRole);
            setUsers(users.map(u => u._id === userId ? { ...u, role: data.user.role } : u));
        } catch (error) {
            console.error('Failed to update role:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await userAPI.deleteUser(userId);
            setUsers(users.filter(u => u._id !== userId));
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'All' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Admin': return <ShieldCheck className="w-4 h-4 text-primary" />;
            case 'Member': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
            case 'Viewer': return <Users className="w-4 h-4 text-muted-foreground" />;
            default: return null;
        }
    };

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'Admin': return 'default';
            case 'Member': return 'secondary';
            case 'Viewer': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with Stats */}
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground">User Management</h2>
                    <p className="text-muted-foreground mt-1.5 text-lg">Oversee system participants and define their access levels.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="font-bold uppercase tracking-widest text-xs h-10 px-6 shadow-lg shadow-primary/20"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Users"
                    value={stats.total}
                    icon={<Users className="w-5 h-5" />}
                    color="bg-primary/10 text-primary"
                />
                <StatCard
                    label="Administrators"
                    value={stats.admins}
                    icon={<ShieldCheck className="w-5 h-5" />}
                    color="bg-amber-500/10 text-amber-600"
                />
                <StatCard
                    label="Team Members"
                    value={stats.members}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="bg-blue-500/10 text-blue-600"
                />
                <StatCard
                    label="Viewers"
                    value={stats.viewers}
                    icon={<Users className="w-5 h-5" />}
                    color="bg-slate-500/10 text-slate-600"
                />
            </div>

            {/* toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-10 h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                        <select
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none cursor-pointer"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="All">All Roles</option>
                            <option value="Admin">Admin</option>
                            <option value="Member">Member</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* User Table */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden border-border/60">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border">
                                <th className="px-6 py-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">User Profile</th>
                                <th className="px-6 py-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Contact Information</th>
                                <th className="px-6 py-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">System Access</th>
                                <th className="px-6 py-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Membership Date</th>
                                <th className="px-6 py-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                            <p className="text-muted-foreground font-medium">Synching user database...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="w-10 h-10 text-muted-foreground/30" />
                                            <p className="text-muted-foreground font-medium text-lg">No matching users found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user._id} className="group hover:bg-muted/20 transition-all">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <Avatar
                                                src={user.avatar}
                                                fallback={user.name?.charAt(0)}
                                                alt={user.name}
                                                className="w-11 h-11 border-2 border-background ring-2 ring-muted/50 transition-transform group-hover:scale-110"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground group-hover:text-primary transition-colors text-base leading-tight">
                                                    {user.name}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-tighter mt-0.5">
                                                    UID: {user._id.substring(0, 8)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                            <Mail className="w-4 h-4 opacity-50" />
                                            <span className="font-medium">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2.5">
                                            {getRoleIcon(user.role)}
                                            <Badge
                                                variant={getRoleBadgeVariant(user.role)}
                                                className="rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                                            >
                                                {user.role}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="w-4 h-4 opacity-50" />
                                            <span className="font-medium">{format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity relative">
                                            <div className="relative">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setActiveRoleMenu(activeRoleMenu === user._id ? null : user._id)}
                                                    className="h-9 px-3 gap-2 border-border/50 hover:bg-muted/50 text-[11px] font-bold uppercase tracking-wider"
                                                >
                                                    <Shield className="w-3.5 h-3.5" />
                                                    Role
                                                </Button>

                                                {activeRoleMenu === user._id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setActiveRoleMenu(null)}
                                                        />
                                                        <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-xl z-20 p-1 animate-in fade-in zoom-in-95 duration-100">
                                                            {['Admin', 'Member', 'Viewer'].map((r) => (
                                                                <button
                                                                    key={r}
                                                                    onClick={() => {
                                                                        handleRoleChange(user._id, r);
                                                                        setActiveRoleMenu(null);
                                                                    }}
                                                                    className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-bold uppercase tracking-tighter rounded-lg transition-colors ${user.role === r
                                                                        ? 'bg-primary/10 text-primary'
                                                                        : 'hover:bg-muted text-muted-foreground'
                                                                        }`}
                                                                >
                                                                    {getRoleIcon(r)}
                                                                    {r}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {user.role !== 'Admin' && (
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="h-9 w-9 bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-all shadow-none"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateUser}
            />
        </div>
    );
};

const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className={`p-3 rounded-xl ${color} absolute right-4 top-4 transform group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
            <div className="text-3xl font-black text-foreground">{value}</div>
        </div>
        <div className="h-1 w-full bg-muted absolute bottom-0 left-0">
            <div className={`h-full bg-current ${color.split(' ')[1]} opacity-40 transition-all duration-1000`} style={{ width: '60%' }} />
        </div>
    </div>
);

export default UserManagement;
