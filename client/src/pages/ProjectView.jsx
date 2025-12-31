import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectAPI, taskAPI } from '../services';
import KanbanBoard from '../components/kanban/KanbanBoard';
import TaskListView from '../components/TaskListView';
import TaskModal from '../components/TaskModal';
import ActivityLog from '../components/ActivityLog';
import { Search, LayoutGrid, List, Activity } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import CreateTaskModal from '../components/CreateTaskModal';
import ProjectSettingsModal from '../components/ProjectSettingsModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Button from '../components/ui/Button';
import { Settings } from 'lucide-react';

const ProjectView = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [activeTab, setActiveTab] = useState('board');

    // Create Task Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createStage, setCreateStage] = useState('Backlog');

    // Settings Modal State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [assigneeFilter, setAssigneeFilter] = useState('All');

    const socket = useSocket();

    const { user } = useAuth();
    const isAdmin = project?.owner === user?._id ||
        project?.owner?._id === user?._id ||
        project?.members?.some(m => (m.user === user?._id || m.user?._id === user?._id) && m.role === 'Admin') ||
        user?.role === 'Admin';

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                const [projectRes, tasksRes] = await Promise.all([
                    projectAPI.getProjectById(id),
                    taskAPI.getProjectTasks(id)
                ]);

                setProject(projectRes.data.project);
                setTasks(tasksRes.data.tasks);
            } catch (error) {
                console.error('Error fetching project data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProjectData();
        }
    }, [id]);

    useEffect(() => {
        if (socket && id) {
            socket.emit('join_project', id);

            const handleUpdate = () => {
                const fetchProjectData = async () => {
                    try {
                        const [projectRes, tasksRes] = await Promise.all([
                            projectAPI.getProjectById(id),
                            taskAPI.getProjectTasks(id)
                        ]);
                        setProject(projectRes.data.project);
                        setTasks(tasksRes.data.tasks);
                    } catch (error) {
                        console.error('Error fetching project data:', error);
                    }
                };
                fetchProjectData();
            };

            socket.on('task_created', handleUpdate);
            socket.on('task_updated', handleUpdate);
            socket.on('task_deleted', handleUpdate);
            socket.on('project_updated', handleUpdate);

            return () => {
                socket.emit('leave_project', id);
                socket.off('task_created', handleUpdate);
                socket.off('task_updated', handleUpdate);
                socket.off('task_deleted', handleUpdate);
                socket.off('project_updated', handleUpdate);
            };
        }
    }, [socket, id]);

    const handleTaskMove = async (taskId, newStage) => {
        // Optimistic update
        const updatedTasks = tasks.map(t =>
            t._id === taskId ? { ...t, stage: newStage } : t
        );
        setTasks(updatedTasks);

        try {
            await taskAPI.updateTask(taskId, { stage: newStage });
        } catch (error) {
            console.error('Error updating task stage:', error);
            // Revert on error
            const originalTasks = await taskAPI.getProjectTasks(id);
            setTasks(originalTasks.data.tasks);
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
    };

    const openCreateModal = (stage) => {
        setCreateStage(stage || (project?.workflowStages?.[0] || 'Backlog'));
        setIsCreateModalOpen(true);
    };

    const handleTaskCreation = async (taskData) => {
        try {
            const payload = { ...taskData, projectId: id };
            const { data } = await taskAPI.createTask(payload);
            setTasks([...tasks, data.task]);
            return data.task;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    };

    const handleTaskUpdate = (updatedTask) => {
        setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = (task.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (task.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || task.stage === statusFilter;
        const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
        const matchesAssignee = assigneeFilter === 'All' ||
            (assigneeFilter === 'Unassigned' && (!task.assignedTo || task.assignedTo.length === 0)) ||
            task.assignedTo?.some(u => u._id === assigneeFilter);

        // Visibility restriction: Show if unassigned, OR if user is an assignee, OR if user is Admin
        const isVisible = isAdmin ||
            (!task.assignedTo || task.assignedTo.length === 0) ||
            task.assignedTo?.some(u => (u._id === user?._id || u === user?._id));

        return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && isVisible;
    });

    if (loading) {
        return <div className="flex h-full items-center justify-center"><div className="spinner"></div></div>;
    }

    if (!project) {
        return <div className="text-center py-12">Project not found</div>;
    }

    const uniqueAssignees = Array.from(new Set(tasks.flatMap(t => t.assignedTo || []).map(u => JSON.stringify({ id: u._id, name: u.name }))))
        .map(s => JSON.parse(s));

    return (
        <div className="min-h-full flex flex-col space-y-6 relative pb-10">
            {/* Header */}
            <div className="space-y-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                        <Link to="/" className="mt-1 text-muted-foreground hover:text-primary transition-colors">
                            <div className="flex items-center gap-1 text-sm font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                                Back
                            </div>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3.5 h-3.5 rounded-full shadow-sm ring-4 ring-primary/10"
                                    style={{ backgroundColor: project.color }}
                                />
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.title}</h1>
                            </div>
                            {project.description && (
                                <div className="text-muted-foreground mt-1.5 max-w-3xl text-[15px] leading-relaxed prose dark:prose-invert prose-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {project.description}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsSettingsOpen(true)}
                                className="h-9 px-3 gap-2 border-border/50 hover:bg-muted/50"
                            >
                                <Settings className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-semibold">Workflow</span>
                            </Button>
                        )}
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                        <TabsList className="bg-muted/50 p-1 h-auto gap-1 border border-border/50">
                            <TabsTrigger value="board" className="px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md text-sm font-semibold transition-all">
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                Board
                            </TabsTrigger>
                            <TabsTrigger value="list" className="px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md text-sm font-semibold transition-all">
                                <List className="w-4 h-4 mr-2" />
                                List
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="px-5 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md text-sm font-semibold transition-all">
                                <Activity className="w-4 h-4 mr-2" />
                                Activity Log
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="h-9 w-[140px] lg:w-[180px] rounded-lg border border-input bg-muted/20 pl-9 pr-3 text-xs transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <select
                                className="h-9 rounded-lg border border-input bg-muted/20 px-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-muted/30 transition-colors"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Stages</option>
                                {project.workflowStages.map(stage => (
                                    <option key={stage} value={stage}>{stage}</option>
                                ))}
                            </select>

                            <select
                                className="h-9 rounded-lg border border-input bg-muted/20 px-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-muted/30 transition-colors"
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                            >
                                <option value="All">All Priorities</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>

                            <select
                                className="h-9 rounded-lg border border-input bg-muted/20 px-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-muted/30 transition-colors"
                                value={assigneeFilter}
                                onChange={(e) => setAssigneeFilter(e.target.value)}
                            >
                                <option value="All">All Assignees</option>
                                <option value="Unassigned">Unassigned</option>
                                {uniqueAssignees.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <TabsContent value="board" className="flex-1 overflow-hidden mt-6 outline-none">
                        <KanbanBoard
                            tasks={filteredTasks}
                            stages={project.workflowStages}
                            onTaskMove={handleTaskMove}
                            onTaskClick={handleTaskClick}
                            onAddTask={openCreateModal}
                        />
                    </TabsContent>

                    <TabsContent value="list" className="flex-1 overflow-y-auto mt-6 outline-none">
                        <TaskListView
                            tasks={filteredTasks}
                            onTaskClick={handleTaskClick}
                        />
                    </TabsContent>

                    <TabsContent value="activity" className="flex-1 overflow-hidden mt-6 relative outline-none">
                        <div className="h-full border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm border-border/50">
                            <ActivityLog projectId={project._id} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleTaskUpdate}
                    project={project}
                />
            )}

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleTaskCreation}
                project={project}
                initialStage={createStage}
            />

            <ProjectSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                project={project}
                onUpdate={(updatedProject) => setProject(updatedProject)}
                isAdmin={isAdmin}
            />
        </div>
    );
};

export default ProjectView;
