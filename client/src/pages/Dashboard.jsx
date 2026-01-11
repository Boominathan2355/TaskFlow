import React, { useState, useEffect } from 'react';
import { projectAPI, taskAPI } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import Badge from '../components/atoms/Badge';
import { Plus, Search, CheckCircle2, Clock, AlertCircle, User, Layout, ListTodo, Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import WelcomeBanner from '../components/molecules/WelcomeBanner';
import ProjectCard from '../components/molecules/ProjectCard';
import CreateProjectModal from '../components/organisms/CreateProjectModal';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const socket = useSocket();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('dashboard_update', () => {
                fetchData();
            });

            return () => {
                socket.off('dashboard_update');
            };
        }
    }, [socket]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsRes, tasksRes] = await Promise.all([
                projectAPI.getAllProjects(),
                taskAPI.getMyTasks()
            ]);
            setProjects(projectsRes.data.projects);
            setMyTasks(tasksRes.data.tasks);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (projectData) => {
        try {
            const { data } = await projectAPI.createProject(projectData);
            setProjects([...projects, data.project]);
        } catch (error) {
            console.error('Failed to create project:', error);
            throw error; // Re-throw to be handled by modal
        }
    };

    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'low': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default: return 'bg-muted text-muted-foreground border-border/40';
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-primary/20 rounded-full animate-pulse"></div>
                        <div className="absolute top-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-muted-foreground font-medium">Assembing your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 w-full pb-12">
            <WelcomeBanner />

            {/* My Tasks Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <ListTodo className="w-6 h-6 text-primary" />
                            Assigned to Me
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Your active tickets across all projects
                        </p>
                    </div>
                </div>

                {myTasks.length === 0 ? (
                    <div className="bg-card border border-border/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-bold">All caught up!</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                            You don't have any tasks assigned to you at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/30 border-b border-border/60">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Task Details</th>
                                        <th className="px-6 py-4 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Project</th>
                                        <th className="px-6 py-4 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Priority</th>
                                        <th className="px-6 py-4 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Due Date</th>
                                        <th className="px-6 py-4 font-bold text-foreground/70 uppercase tracking-widest text-[10px] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {myTasks.slice(0, 5).map((task) => {
                                        const ticketId = task._id;
                                        return (
                                            <tr
                                                key={task._id}
                                                className="group hover:bg-muted/20 transition-all cursor-pointer"
                                                onClick={() => navigate(`/projects/${task.project?._id}/tasks/${ticketId}`)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${task.stage === 'Done' ? 'bg-emerald-500' :
                                                            task.stage === 'In Progress' ? 'bg-blue-500' : 'bg-muted-foreground/30'
                                                            }`} />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-foreground truncate max-w-[300px]">{task.title}</span>
                                                            <span className="text-[10px] text-muted-foreground font-black uppercase opacity-60 tracking-wider">
                                                                {task.key} • {task.stage}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Layout className="w-3.5 h-3.5 opacity-50" />
                                                        <span className="font-medium">{task.project?.title || 'Unknown Project'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`border px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${getPriorityColor(task.priority)}`}>
                                                        {task.priority || 'Medium'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                                                        <span className="font-medium whitespace-nowrap">
                                                            {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No date'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {myTasks.length > 5 && (
                            <div className="p-3 bg-muted/10 border-t border-border/60 text-center">
                                <p className="text-xs text-muted-foreground font-medium">
                                    And {myTasks.length - 5} more active tasks...
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Projects Section */}
            <div className="space-y-6 pt-6 border-t border-border/40">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Your Projects</h2>
                        <p className="text-muted-foreground mt-1">
                            Manage and track your team's projects
                        </p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </Button>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-muted/50 border-border/50 rounded-xl shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-background focus-visible:border-primary placeholder:text-muted-foreground/50"
                    />
                </div>

                {filteredProjects.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                        <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                            <Search className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">No projects found</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            {searchQuery ? `We couldn't find any projects matching "${searchQuery}"` : 'Get started by creating your first project for your team.'}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setIsModalOpen(true)}>Create Project</Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <ProjectCard key={project._id} project={project} />
                        ))}
                    </div>
                )}
            </div>


            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateProject}
            />
        </div>
    );
};

// Chat Search Section Component
const ChatSearchSection = ({ chatSearchQuery, setChatSearchQuery, navigate }) => {
    const { chats, setSelectedChat } = useChat();
    const { user: currentUser } = useAuth();

    const getSender = (users) => {
        return users[0]._id === currentUser._id ? users[1] : users[0];
    };

    const filteredChats = chats.filter(chat => {
        if (!chatSearchQuery.trim()) return true;

        const searchLower = chatSearchQuery.toLowerCase();

        if (chat.isGroupChat) {
            return chat.chatName?.toLowerCase().includes(searchLower);
        } else {
            const sender = getSender(chat.users);
            return sender?.name?.toLowerCase().includes(searchLower);
        }
    });

    const handleChatClick = (chat) => {
        setSelectedChat(chat);
        navigate('/chat');
    };

    return (
        <div className="space-y-6 pt-6 border-t border-border/40">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-primary" />
                        Your Chats
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Search for conversations and group chats
                    </p>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search chats and groups..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/50 border-border/50 rounded-xl shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-background focus-visible:border-primary placeholder:text-muted-foreground/50"
                />
            </div>

            {filteredChats.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                    <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">No chats found</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        {chatSearchQuery ? `We couldn't find any chats matching "${chatSearchQuery}"` : 'Start a conversation to see your chats here.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredChats.map((chat) => {
                        const sender = !chat.isGroupChat ? getSender(chat.users) : null;

                        return (
                            <button
                                key={chat._id}
                                onClick={() => handleChatClick(chat)}
                                className="p-4 bg-card border border-border/60 rounded-xl hover:border-primary/40 hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        {chat.isGroupChat ? (
                                            <Users size={24} />
                                        ) : (
                                            sender?.avatar ? <img src={sender.avatar} className="w-full h-full rounded-xl object-cover" alt={sender.name} /> : sender?.name?.charAt(0)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold truncate group-hover:text-primary transition-colors">
                                            {chat.isGroupChat ? chat.chatName : sender?.name}
                                        </h3>
                                        {chat.isGroupChat && (
                                            <p className="text-xs text-muted-foreground">
                                                {chat.users.length} members
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {chat.latestMessage && (
                                    <p className="text-sm text-muted-foreground truncate">
                                        <span className="font-semibold">{chat.latestMessage.sender.name.split(' ')[0]}:</span> {chat.latestMessage.content}
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Dashboard;

