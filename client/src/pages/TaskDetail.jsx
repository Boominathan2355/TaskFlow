import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { taskAPI, uploadAPI, userAPI, projectAPI } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { format } from 'date-fns';
import {
    Calendar,
    Trash2,
    Send,
    AlertCircle,
    Edit2,
    Check,
    X,
    Paperclip,
    MessageSquare,
    Clock,
    ArrowLeft,
    Tag,
    Flag,
    User,
    Layers,
    Smile,
    ChevronDown,
    ChevronRight,
    ThumbsUp,
    Eye,
    Info,
    Share2,
    Download
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { config as appConfig } from '../config';
import MarkdownToolbar from '../components/MarkdownToolbar';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

const PRIORITY_VARIANTS = {
    Low: 'priority-low',
    Medium: 'priority-medium',
    High: 'priority-high',
    Urgent: 'priority-urgent',
};

const highlightMentions = (text) => {
    if (typeof text !== 'string') return text;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) =>
        part.startsWith('@') ? (
            <span key={i} className="text-primary font-bold bg-primary/10 px-1 rounded mx-0.5">
                {part}
            </span>
        ) : (
            part
        )
    );
};

const TaskDetail = () => {
    const { id: projectId, taskId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const socket = useSocket();

    const [project, setProject] = useState(null);
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Edit States
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editedDesc, setEditedDesc] = useState('');
    const [descTab, setDescTab] = useState('write');

    // Comment States
    const [comment, setComment] = useState('');
    const [commentTab, setCommentTab] = useState('write');
    const [users, setUsers] = useState([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionStartPos, setMentionStartPos] = useState(null);
    const commentTextareaRef = useRef(null);
    const descriptionTextareaRef = useRef(null);

    // Collapsible sections
    const [sections, setSections] = useState({
        people: true,
        dates: true,
        workflow: true
    });

    const [actionNotification, setActionNotification] = useState(null);

    const toggleSection = (section) => {
        setSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const API_URL = appConfig.API_URL;

    // Markdown components config
    const markdownComponents = {
        img: ({ node, ...props }) => <img {...props} className="max-w-full rounded-md shadow-sm my-2" />,
        p: ({ node, children, ...props }) => (
            <p {...props} className="mb-2 last:mb-0">
                {React.Children.map(children, child =>
                    typeof child === 'string' ? highlightMentions(child) : child
                )}
            </p>
        ),
        li: ({ node, children, ...props }) => (
            <li {...props}>
                {React.Children.map(children, child =>
                    typeof child === 'string' ? highlightMentions(child) : child
                )}
            </li>
        ),
        ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-4 mb-2" />,
        ol: ({ node, ...props }) => <ol {...props} className="list-decimal ml-4 mb-2" />,
        a: ({ node, ...props }) => <a {...props} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" />,
        h1: ({ node, ...props }) => <h1 {...props} className="text-xl font-bold mt-4 mb-2" />,
        h2: ({ node, ...props }) => <h2 {...props} className="text-lg font-bold mt-3 mb-2" />,
        h3: ({ node, ...props }) => <h3 {...props} className="text-md font-bold mt-2 mb-1" />,
        blockquote: ({ node, ...props }) => <blockquote {...props} className="border-l-4 border-muted pl-4 italic my-2" />,
        code: ({ node, inline, ...props }) =>
            inline
                ? <code {...props} className="bg-muted px-1 py-0.5 rounded text-sm font-mono" />
                : <code {...props} className="block bg-muted/50 p-3 rounded-md text-sm font-mono my-2 overflow-x-auto" />
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [projectRes, taskRes, usersRes] = await Promise.all([
                    projectAPI.getProjectById(projectId),
                    taskAPI.getTaskById(taskId),
                    userAPI.getAllUsers()
                ]);
                setProject(projectRes.data.project);
                setTask(taskRes.data.task);
                setEditedTitle(taskRes.data.task.title);
                setEditedDesc(taskRes.data.task.description || '');
                setUsers(usersRes.data.users || []);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Failed to load task details');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [projectId, taskId]);

    useEffect(() => {
        if (socket && projectId) {
            socket.emit('join_project', projectId);

            const handleTaskUpdate = (data) => {
                if (data.task && (data.task._id === task?._id || data.task._id === taskId)) {
                    setTask(data.task);
                }
            };

            socket.on('task_updated', handleTaskUpdate);

            socket.on('task_action_received', (data) => {
                console.log('Received task action:', data);
                if (data.action && (data.taskId === task?._id || data.taskId === taskId)) {
                    setActionNotification(`${data.user.name} just ${data.action} this task`);
                    setTimeout(() => setActionNotification(null), 5000);
                }
            });

            return () => {
                socket.off('task_updated', handleTaskUpdate);
                socket.off('task_action_received');
            };
        }
    }, [socket, projectId, taskId]);

    const handleUpdateTask = async (updates) => {
        try {
            const { data } = await taskAPI.updateTask(taskId, updates);
            setTask(data.task);
            return data.task;
        } catch (err) {
            console.error('Failed to update task', err);
            setError('Failed to update task');
        }
    };

    const handleShare = () => {
        const ticketId = task._id;
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/projects/${projectId}/tasks/${ticketId}`;

        navigator.clipboard.writeText(shareUrl);
        setActionNotification(`${ticketId} Link copied!`);
        setTimeout(() => setActionNotification(null), 3000);

        if (socket && projectId) {
            socket.emit('task_action', {
                action: 'shared',
                taskId: ticketId,
                projectId,
                userName: user.name
            });
        }
    };

    const handleExport = () => {
        const taskData = {
            title: task.title,
            description: task.description,
            type: task.type,
            priority: task.priority,
            stage: task.stage,
            assignedTo: task.assignedTo?.map(u => u.name),
            createdBy: task.createdBy?.name,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            url: window.location.href
        };

        const blob = new Blob([JSON.stringify(taskData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `task-${task.key || taskId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setActionNotification('Task exported successfully!');
        setTimeout(() => setActionNotification(null), 3000);

        if (socket && projectId) {
            socket.emit('task_action', {
                action: 'exported',
                taskId,
                projectId,
                userName: user.name
            });
        }
    };

    const handleVote = async () => {
        try {
            const { data } = await taskAPI.toggleVote(taskId);
            setTask(data.task);
        } catch (err) {
            console.error('Failed to toggle vote', err);
        }
    };

    const handleWatch = async () => {
        try {
            const { data } = await taskAPI.toggleWatch(taskId);
            setTask(data.task);
        } catch (err) {
            console.error('Failed to toggle watch', err);
        }
    };

    const handleSaveTitle = async () => {
        if (editedTitle.trim() && editedTitle !== task.title) {
            await handleUpdateTask({ title: editedTitle });
        }
        setIsEditingTitle(false);
    };

    const handleSaveDesc = async () => {
        if (editedDesc !== task.description) {
            await handleUpdateTask({ description: editedDesc });
        }
        setIsEditingDesc(false);
        setDescTab('write');
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            const { data } = await taskAPI.addComment(taskId, comment);
            setTask(data.task);
            setComment('');
            setShowMentionDropdown(false);
        } catch (err) {
            console.error('Failed to add comment', err);
        }
    };

    const handleCommentChange = (e) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        setComment(value);

        const textBeforeCursor = value.substring(0, cursorPos);
        const atMatch = textBeforeCursor.match(/@(\w*)$/);

        if (atMatch) {
            setMentionQuery(atMatch[1].toLowerCase());
            setMentionStartPos(cursorPos - atMatch[0].length);
            setShowMentionDropdown(true);
        } else {
            setShowMentionDropdown(false);
            setMentionQuery('');
        }
    };

    const insertMention = (userName) => {
        if (mentionStartPos === null) return;
        const beforeMention = comment.substring(0, mentionStartPos);
        const afterCursor = comment.substring(mentionStartPos + mentionQuery.length + 1);
        const newComment = `${beforeMention}@${userName} ${afterCursor}`;
        setComment(newComment);
        setShowMentionDropdown(false);
        setMentionQuery('');
        if (commentTextareaRef.current) {
            commentTextareaRef.current.focus();
        }
    };

    const filteredMentionUsers = users.filter(u =>
        u.name.toLowerCase().includes(mentionQuery) && u._id !== user?._id
    ).slice(0, 5);

    const handleDeleteTask = async () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await taskAPI.deleteTask(taskId);
                navigate(`/projects/${projectId}`);
            } catch (err) {
                console.error('Failed to delete task', err);
            }
        }
    };

    const handlePaste = async (e, setter, currentText) => {
        const items = e.clipboardData?.items;
        const clipboardData = e.clipboardData;

        if (!items) return;

        // specific handling for HTML content (rich text)
        if (clipboardData.types.includes('text/html')) {
            e.preventDefault();
            const html = clipboardData.getData('text/html');
            const markdown = turndownService.turndown(html);

            const textarea = e.target;
            const startPos = textarea.selectionStart;
            const endPos = textarea.selectionEnd;
            const textBefore = currentText.substring(0, startPos);
            const textAfter = currentText.substring(endPos);

            setter(`${textBefore}${markdown}${textAfter}`);

            // Restore cursor position (adjusting for length)
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = startPos + markdown.length;
            }, 0);
            return;
        }

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (!file) continue;

                const textarea = e.target;
                const startPos = textarea.selectionStart;
                const endPos = textarea.selectionEnd;
                const textBefore = currentText.substring(0, startPos);
                const textAfter = currentText.substring(endPos);

                const placeholder = `![Uploading ${file.name}...]`;
                setter(`${textBefore}${placeholder}${textAfter}`);

                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const { data } = await uploadAPI.uploadFile(formData);
                    const imageUrl = `${API_URL}${data.url}`;
                    setter(prev => prev.replace(placeholder, `![Image](${imageUrl})`));
                } catch (error) {
                    console.error('Upload failed:', error);
                    setter(prev => prev.replace(placeholder, `[Upload Failed]`));
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h2 className="text-2xl font-bold">Task not found</h2>
                <Button onClick={() => navigate(`/projects/${projectId}`)}>Back to Project</Button>
            </div>
        );
    }

    const isProjectOwner = project?.owner === user?._id || project?.owner?._id === user?._id;
    const isProjectAdmin = project?.members?.some(m =>
        (m.user === user?._id || m.user?._id === user?._id) && m.role === 'Admin'
    );
    const canDelete = isProjectOwner || isProjectAdmin || user?.role === 'Admin';
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.stage !== 'Done';

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
                <div className="max-w-[1600px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/projects/${projectId}`)}
                                className="h-9 w-9"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="flex-1 min-w-0">
                                {isEditingTitle ? (
                                    <div className="flex items-center gap-2 max-w-2xl">
                                        <Input
                                            value={editedTitle}
                                            onChange={(e) => setEditedTitle(e.target.value)}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveTitle();
                                                if (e.key === 'Escape') setIsEditingTitle(false);
                                            }}
                                            className="text-lg font-bold h-10 border-0 border-b rounded-none px-0 focus-visible:ring-0"
                                        />
                                        <Button size="sm" onClick={handleSaveTitle}><Check className="w-4 h-4" /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}><X className="w-4 h-4" /></Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                                        <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{task.title}</h1>
                                        <Edit2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span className="font-bold bg-muted px-1.5 py-0.5 rounded border border-border/50 uppercase">
                                        {task._id}
                                    </span>
                                    <span>•</span>
                                    <Link to={`/projects/${projectId}`} className="hover:text-primary transition-colors">
                                        {project?.title}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
                                <Share2 className="w-4 h-4" />
                            </Button>
                            <div className="relative group">
                                <Button variant="outline" className="gap-2 h-9" onClick={handleExport}>
                                    <Download className="w-4 h-4" />
                                    Export
                                    <ChevronDown className="w-3 h-3" />
                                </Button>
                            </div>
                            {canDelete && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={handleDeleteTask}
                                    className="h-9 w-9"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/projects/${projectId}`)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Action Notification (Top-Pop Message) */}
                {actionNotification && (
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-8 duration-500 ease-out">
                        <div className="bg-primary/90 backdrop-blur-xl text-primary-foreground text-[11px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-full border border-primary/20 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] flex items-center gap-3">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground"></span>
                            </span>
                            {actionNotification}
                        </div>
                    </div>
                )}
                {error && (
                    <div className="mb-6 bg-destructive/10 text-destructive text-sm p-4 rounded-lg flex items-center gap-2 border border-destructive/20">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                        <button onClick={() => setError('')} className="ml-auto hover:opacity-70"><X className="w-4 h-4" /></button>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Left Column: Details, Description and Comments */}
                    <div className="flex-1 space-y-6 order-1">
                        {/* Details Grid (Horizontal) */}
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</label>
                                    <select
                                        className="w-full h-9 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                        value={task.type || 'Task'}
                                        onChange={(e) => handleUpdateTask({ type: e.target.value })}
                                    >
                                        {['Task', 'Story', 'Bug', 'Change Request', 'Epic', 'Hotfix', 'Maintenance', 'Improvement'].map(t => (
                                            <option key={t} value={t} className="bg-card text-foreground">{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Priority</label>
                                    <select
                                        className="w-full h-9 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                        value={task.priority}
                                        onChange={(e) => handleUpdateTask({ priority: e.target.value })}
                                    >
                                        {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                            <option key={p} value={p} className="bg-card text-foreground">{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
                                    <select
                                        className="w-full h-9 rounded-lg bg-card border border-border/50 px-3 text-[11px] font-bold uppercase tracking-widest text-primary outline-none hover:bg-primary/10 transition-all focus:ring-4 focus:ring-primary/5 cursor-pointer"
                                        value={task.stage}
                                        onChange={(e) => handleUpdateTask({ stage: e.target.value })}
                                    >
                                        {project?.workflowStages?.map((s) => (
                                            <option key={s} value={s} className="bg-card text-foreground">{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                                    <h3 className="text-sm font-semibold uppercase tracking-wider">Description</h3>
                                </div>
                                {!isEditingDesc && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setEditedDesc(task.description || ''); setIsEditingDesc(true); }}
                                        className="h-8 text-xs font-bold uppercase tracking-widest text-primary"
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>

                            {isEditingDesc ? (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
                                        <div className="flex items-center gap-1 border-b border-border bg-muted/40 p-1">
                                            <button
                                                onClick={() => setDescTab('write')}
                                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${descTab === 'write' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Write
                                            </button>
                                            <button
                                                onClick={() => setDescTab('preview')}
                                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${descTab === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Preview
                                            </button>
                                        </div>

                                        {descTab === 'write' ? (
                                            <div className="flex flex-col">
                                                <MarkdownToolbar
                                                    textareaRef={descriptionTextareaRef}
                                                    value={editedDesc}
                                                    onChange={setEditedDesc}
                                                />
                                                <textarea
                                                    ref={descriptionTextareaRef}
                                                    className="flex min-h-[300px] w-full bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none resize-none font-sans leading-relaxed"
                                                    value={editedDesc}
                                                    onChange={(e) => setEditedDesc(e.target.value)}
                                                    onPaste={(e) => handlePaste(e, setEditedDesc, editedDesc)}
                                                    placeholder="Describe the task details... (Markdown supported)"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <div className="min-h-[300px] p-4 text-sm text-foreground prose dark:prose-invert prose-sm max-w-none overflow-y-auto bg-background/50">
                                                {editedDesc ? (
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                        {editedDesc}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <em className="text-muted-foreground">No description provided.</em>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-end gap-2 p-2 bg-muted/10 rounded-lg">
                                        <Button variant="ghost" size="sm" onClick={() => { setIsEditingDesc(false); setDescTab('write'); }}>Cancel</Button>
                                        <Button size="sm" onClick={handleSaveDesc} className="px-6 font-bold uppercase tracking-widest text-xs">Save Description</Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => { setEditedDesc(task.description || ''); setIsEditingDesc(true); }}
                                    className="text-sm text-foreground/80 leading-relaxed bg-muted/10 p-5 rounded-xl border border-transparent hover:border-border hover:bg-muted/20 transition-all cursor-pointer min-h-[120px]"
                                >
                                    {task.description ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                            {task.description}
                                        </ReactMarkdown>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground/50">
                                            <Layers className="w-8 h-8 opacity-20" />
                                            <span className="italic text-xs">No description provided. Click to add one...</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Attachments Section */}
                            <div className="mt-8 pt-8 border-t border-border/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Paperclip className="w-4 h-4 text-primary" />
                                        <h3 className="text-sm font-semibold uppercase tracking-wider">Attachments</h3>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px]">{task.attachments?.length || 0}</Badge>
                                </div>
                                {task.attachments?.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {task.attachments.map((file, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-muted/10 border border-border rounded-lg group hover:bg-muted/20 transition-all cursor-pointer">
                                                <div className="w-10 h-10 rounded bg-background flex items-center justify-center border border-border">
                                                    <Paperclip className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold truncate uppercase tracking-tight">{file.name}</p>
                                                    <a href={`${API_URL}${file.url}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">Download</a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 border-2 border-dashed border-border rounded-xl text-center">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40 italic">No attachments</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                <h3 className="text-sm font-semibold uppercase tracking-wider">Discussion</h3>
                                <Badge variant="secondary" className="ml-1 text-[10px]">{task.comments?.length || 0}</Badge>
                            </div>

                            <div className="space-y-8 py-4">
                                {task.comments?.map((c, i) => (
                                    <div key={c._id || i} className="flex gap-4 group animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex flex-col items-center">
                                            <Avatar
                                                src={c.author?.avatar}
                                                fallback={c.author?.name?.charAt(0)}
                                                size="sm"
                                                className="ring-2 ring-background border-2 border-border shadow-sm"
                                            />
                                            <div className="w-0.5 flex-1 bg-border/30 mt-2 group-last:hidden"></div>
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2 pb-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer">{c.author?.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter bg-muted px-1.5 py-0.5 rounded">
                                                        {c.createdAt ? format(new Date(c.createdAt), 'MMM d, p') : 'Just now'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-foreground/80 leading-relaxed prose dark:prose-invert prose-sm max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                    {c.text}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!task.comments || task.comments.length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground/40 border border-dashed border-border rounded-xl">
                                        <MessageSquare className="w-10 h-10 opacity-20" />
                                        <p className="text-xs font-semibold uppercase tracking-widest italic">No discussion yet</p>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Sticky Add Comment Section (Fixed to outer page of Discussion) */}
                        <div className="sticky bottom-0 z-20 bg-background/95 backdrop-blur-md pt-4 pb-6 mt-6 border-t border-border/50">
                            <div className="max-w-none px-1">
                                <div className="space-y-4">
                                    <div className="border border-border rounded-xl bg-muted/10 relative shadow-inner">
                                        <div className="flex items-center justify-between border-b border-border bg-muted/40 p-1.5">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setCommentTab('write')}
                                                    className={`px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${commentTab === 'write' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCommentTab('preview')}
                                                    className={`px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${commentTab === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Preview
                                                </button>
                                            </div>
                                        </div>

                                        {commentTab === 'write' ? (
                                            <div className="flex flex-col">
                                                <MarkdownToolbar
                                                    textareaRef={commentTextareaRef}
                                                    value={comment}
                                                    onChange={setComment}
                                                />
                                                <textarea
                                                    ref={commentTextareaRef}
                                                    value={comment}
                                                    onChange={handleCommentChange}
                                                    onPaste={(e) => handlePaste(e, setComment, comment)}
                                                    onBlur={() => setTimeout(() => setShowMentionDropdown(false), 200)}
                                                    placeholder="Join the discussion... (Use @ to mention teammates)"
                                                    className="flex min-h-[80px] w-full bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none resize-y font-sans leading-relaxed"
                                                />
                                            </div>
                                        ) : (
                                            <div className="min-h-[80px] p-4 text-sm text-foreground prose dark:prose-invert prose-sm max-w-none bg-background/50">
                                                {comment ? (
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                        {comment}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <span className="text-muted-foreground/50 italic text-xs">Nothing to preview...</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Mention Dropdown */}
                                        {showMentionDropdown && filteredMentionUsers.length > 0 && (
                                            <div className="absolute z-[100] left-2 right-2 top-0 -translate-y-full mb-1 bg-card border border-border rounded-xl shadow-2xl py-2 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">
                                                    Mention Teammate
                                                </div>
                                                {filteredMentionUsers.map((u) => (
                                                    <button
                                                        key={u._id}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            insertMention(u.name);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/5 text-left transition-colors cursor-pointer group"
                                                    >
                                                        <Avatar
                                                            src={u.avatar}
                                                            fallback={u.name?.charAt(0)}
                                                            size="sm"
                                                            className="w-8 h-8 group-hover:ring-2 group-hover:ring-primary/20 transition-all"
                                                        />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">{u.name}</span>
                                                            <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-1">
                                            Markdown & Mentions supported
                                        </p>
                                        <Button
                                            onClick={handleAddComment}
                                            disabled={!comment.trim()}
                                            className="gap-2 px-6 shadow-md shadow-primary/10"
                                        >
                                            <Send className="w-4 h-4" />
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Properties Sidebar */}
                    <div className="lg:w-72 space-y-4 order-2">
                        {/* People Section */}
                        <div className="border-b border-border/50 pb-4">
                            <button
                                onClick={() => toggleSection('people')}
                                className="flex items-center gap-2 w-full text-left mb-3 group"
                            >
                                {sections.people ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">People</h3>
                            </button>

                            {sections.people && (
                                <div className="space-y-4 px-1 animate-in slide-in-from-top-1 duration-200">
                                    <div className="flex items-start justify-between gap-4">
                                        <label className="text-xs font-medium text-muted-foreground w-16 pt-1">Assignee:</label>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 group/assignee">
                                                <Avatar
                                                    src={task.assignedTo?.[0]?.avatar}
                                                    fallback={task.assignedTo?.[0]?.name?.charAt(0)}
                                                    size="xs"
                                                    className="w-6 h-6"
                                                />
                                                <span className="text-xs font-semibold">{task.assignedTo?.[0]?.name || 'Unassigned'}</span>
                                                <Info className="w-3 h-3 text-primary opacity-0 group-hover/assignee:opacity-100 transition-opacity cursor-pointer" />
                                            </div>
                                            <select
                                                className="h-7 w-full rounded border border-border/50 bg-card hover:bg-muted/50 transition-colors px-2 text-[10px] font-medium outline-none text-foreground cursor-pointer"
                                                value={task.assignedTo?.[0]?._id || ''}
                                                onChange={(e) => handleUpdateTask({ assignedTo: e.target.value ? [e.target.value] : [] })}
                                            >
                                                <option value="" className="bg-card text-foreground">Reassign...</option>
                                                {users.map(u => (
                                                    <option key={u._id} value={u._id} className="bg-card text-foreground">
                                                        {u.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-xs font-medium text-muted-foreground w-16">Reporter:</label>
                                        <div className="flex-1 flex items-center gap-2 group/reporter">
                                            <Avatar
                                                src={task.createdBy?.avatar}
                                                fallback={task.createdBy?.name?.charAt(0)}
                                                size="xs"
                                                className="w-6 h-6"
                                            />
                                            <span className="text-xs font-semibold">{task.createdBy?.name}</span>
                                            <Info className="w-3 h-3 text-primary opacity-0 group-hover/reporter:opacity-100 transition-opacity cursor-pointer" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-xs font-medium text-muted-foreground w-16">Votes:</label>
                                        <div className="flex-1 flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${task.votes?.includes(user?._id) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                {task.votes?.length || 0}
                                            </span>
                                            <button
                                                onClick={handleVote}
                                                className="text-[10px] font-bold text-primary hover:underline"
                                            >
                                                {task.votes?.includes(user?._id) ? 'Remove vote' : 'Vote for this issue'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-xs font-medium text-muted-foreground w-16">Watchers:</label>
                                        <div className="flex-1 flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${task.watchers?.includes(user?._id) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                {task.watchers?.length || 0}
                                            </span>
                                            <button
                                                onClick={handleWatch}
                                                className="text-[10px] font-bold text-primary hover:underline"
                                            >
                                                {task.watchers?.includes(user?._id) ? 'Stop watching' : 'Start watching'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dates Section */}
                        <div className="border-b border-border/50 pb-4">
                            <button
                                onClick={() => toggleSection('dates')}
                                className="flex items-center gap-2 w-full text-left mb-3 group"
                            >
                                {sections.dates ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Dates</h3>
                            </button>

                            {sections.dates && (
                                <div className="space-y-4 px-1 animate-in slide-in-from-top-1 duration-200">
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-xs font-medium text-muted-foreground w-16">Created:</label>
                                        <span className="text-xs font-medium">{task.createdAt ? format(new Date(task.createdAt), 'dd/MMM/yy p') : '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-xs font-medium text-muted-foreground w-16">Updated:</label>
                                        <span className="text-xs font-medium">{task.updatedAt ? format(new Date(task.updatedAt), 'dd/MMM/yy p') : '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-xs font-medium text-muted-foreground w-16">Due Date:</label>
                                        <input
                                            type="date"
                                            className="flex-1 h-8 rounded border border-transparent hover:bg-muted/50 transition-colors bg-transparent px-2 text-xs font-semibold outline-none focus:bg-muted/50"
                                            value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => handleUpdateTask({ dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetail;
