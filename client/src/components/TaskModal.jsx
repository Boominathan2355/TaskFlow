import React, { useState, useEffect } from 'react';
import { taskAPI, uploadAPI, userAPI } from '../services';
import { useAuth } from '../contexts/AuthContext';
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
    Clock
} from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Avatar from './ui/Avatar';
import Input from './ui/Input';

const PRIORITY_VARIANTS = {
    Low: 'priority-low',
    Medium: 'priority-medium',
    High: 'priority-high',
    Urgent: 'priority-urgent',
};

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TaskModal = ({ task, onClose, onUpdate, project }) => {
    const [currentTask, setCurrentTask] = useState(task);
    const [comment, setComment] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editedDesc, setEditedDesc] = useState('');
    const [descTab, setDescTab] = useState('write'); // write | preview
    const [commentTab, setCommentTab] = useState('write'); // write | preview
    const [users, setUsers] = useState([]);
    const { user } = useAuth();
    // eslint-disable-next-line no-undef
    const API_URL = 'http://localhost:5000'; // Fallback

    useEffect(() => {
        setCurrentTask(task);
        fetchAllUsers();
    }, [task]);

    const fetchAllUsers = async () => {
        try {
            const { data } = await userAPI.getAllUsers();
            setUsers(data.users || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    if (!task) return null;

    const isProjectOwner = project?.owner === user?._id || project?.owner?._id === user?._id;
    const isProjectAdmin = project?.members?.some(m =>
        (m.user === user?._id || m.user?._id === user?._id) && m.role === 'Admin'
    );
    const canDelete = isProjectOwner || isProjectAdmin || user?.role === 'Admin';

    const isOverdue = currentTask.dueDate && new Date(currentTask.dueDate) < new Date() && currentTask.stage !== 'Done';

    // -- Handlers --

    const handleUpdateTask = async (updates) => {
        try {
            const { data } = await taskAPI.updateTask(task._id, updates);
            setCurrentTask(data.task);
            onUpdate(data.task);
            return data.task;
        } catch (err) {
            console.error('Failed to update task', err);
        }
    };

    const handleSaveTitle = async () => {
        if (editedTitle.trim() && editedTitle !== currentTask.title) {
            await handleUpdateTask({ title: editedTitle });
        }
        setIsEditingTitle(false);
    };

    const handleSaveDesc = async () => {
        if (editedDesc !== currentTask.description) {
            await handleUpdateTask({ description: editedDesc });
        }
        setIsEditingDesc(false);
        setDescTab('write');
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            const { data } = await taskAPI.addComment(task._id, comment);
            setCurrentTask(data.task);
            setComment('');
            onUpdate(data.task);
        } catch (err) {
            console.error('Failed to add comment', err);
        }
    };

    const handleDeleteTask = async () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await taskAPI.deleteTask(task._id);
                onClose();
                // Trigger refresh in parent? existing onUpdate might not handle deletion
                // We might need an onDelete prop, but for now just closing is safe
                if (onUpdate) onUpdate({ ...task, _deleted: true });
            } catch (err) {
                console.error('Failed to delete task', err);
            }
        }
    };

    const handlePaste = async (e, setter, currentText) => {
        const items = e.clipboardData?.items;
        if (!items) return;

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

    // Shared Markdown Components Config
    const markdownComponents = {
        img: ({ node, ...props }) => <img {...props} className="max-w-full rounded-md shadow-sm my-2" />,
        p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
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


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-border bg-muted/5">
                    <div className="flex-1 mr-4">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle();
                                        if (e.key === 'Escape') setIsEditingTitle(false);
                                    }}
                                    className="text-lg font-semibold h-10"
                                />
                                <Button size="sm" onClick={handleSaveTitle}><Check className="w-4 h-4" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}><X className="w-4 h-4" /></Button>
                            </div>
                        ) : (
                            <div className="group flex items-center gap-2">
                                <h2 className="text-xl font-bold tracking-tight text-foreground">{currentTask.title}</h2>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 h-6 w-6 text-muted-foreground"
                                    onClick={() => { setEditedTitle(currentTask.title); setIsEditingTitle(true); }}
                                >
                                    <Edit2 className="w-3 h-3" />
                                </Button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded uppercase tracking-wider border border-border/50 shadow-sm">
                                {currentTask.key || 'TASK'}
                            </span>
                            <Badge variant={PRIORITY_VARIANTS[currentTask.priority] || 'secondary'}>
                                {currentTask.priority}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                                {currentTask.stage}
                            </div>
                            {isOverdue && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Overdue
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-xs text-muted-foreground mr-2">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Created {format(new Date(currentTask.createdAt || Date.now()), 'MMM d')}
                        </div>
                        {canDelete && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleDeleteTask}
                                className="h-8 w-8"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">

                    {/* Main Content */}
                    <div className="flex-1 p-6 space-y-8 border-r border-border min-w-0">

                        {/* Description Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                                    Description
                                </h3>
                                {!isEditingDesc && (
                                    <Button size="xs" variant="ghost" onClick={() => { setEditedDesc(currentTask.description || ''); setIsEditingDesc(true); }}>
                                        Edit
                                    </Button>
                                )}
                            </div>

                            {isEditingDesc ? (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="border border-input rounded-md overflow-hidden">
                                        <div className="flex items-center gap-1 border-b border-input bg-muted/40 p-1">
                                            <button
                                                onClick={() => setDescTab('write')}
                                                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${descTab === 'write' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Write
                                            </button>
                                            <button
                                                onClick={() => setDescTab('preview')}
                                                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${descTab === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Preview
                                            </button>
                                        </div>

                                        {descTab === 'write' ? (
                                            <textarea
                                                className="flex min-h-[150px] w-full bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                                value={editedDesc}
                                                onChange={(e) => setEditedDesc(e.target.value)}
                                                onPaste={(e) => handlePaste(e, setEditedDesc, editedDesc)}
                                                placeholder="Add a more detailed description... (Markdown supported. Paste images to upload)"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="min-h-[150px] p-3 text-sm text-foreground prose dark:prose-invert prose-sm max-w-none overflow-y-auto">
                                                {editedDesc ? (
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                        {editedDesc}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Nothing to preview</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Markdown supported</span>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => { setIsEditingDesc(false); setDescTab('write'); }}>Cancel</Button>
                                            <Button size="sm" onClick={handleSaveDesc}>Save</Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => { setEditedDesc(currentTask.description || ''); setIsEditingDesc(true); }}
                                    className="text-sm text-foreground/80 leading-relaxed bg-muted/20 p-4 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 transition-all cursor-pointer min-h-[80px]"
                                >
                                    {currentTask.description ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                            {currentTask.description}
                                        </ReactMarkdown>
                                    ) : (
                                        <span className="text-muted-foreground italic">Add a description to this task...</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                Comments
                            </h3>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {currentTask.comments?.map((c, i) => (
                                    <div key={c._id || i} className="flex gap-3 group">
                                        <Avatar
                                            src={c.user?.avatar}
                                            fallback={c.user?.name?.charAt(0)}
                                            alt={c.user?.name}
                                            size="sm"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-foreground">{c.user?.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {c.createdAt ? format(new Date(c.createdAt), 'MMM d, p') : 'Just now'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-foreground/80 bg-muted/40 p-2.5 rounded-lg rounded-tl-none prose dark:prose-invert prose-sm max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                    {c.text}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!currentTask.comments || currentTask.comments.length === 0) && (
                                    <p className="text-xs text-muted-foreground text-center py-4">No comments yet.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="border border-input rounded-md overflow-hidden bg-background">
                                    <div className="flex items-center justify-between border-b border-input bg-muted/40 p-1">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setCommentTab('write')}
                                                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-sm transition-colors ${commentTab === 'write' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Write
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCommentTab('preview')}
                                                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-sm transition-colors ${commentTab === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Preview
                                            </button>
                                        </div>
                                    </div>

                                    {commentTab === 'write' ? (
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            onPaste={(e) => handlePaste(e, setComment, comment)}
                                            placeholder="Write a comment... (Markdown supported, Paste images)"
                                            className="flex min-h-[80px] w-full bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none resize-y"
                                        />
                                    ) : (
                                        <div className="min-h-[80px] p-3 text-sm text-foreground prose dark:prose-invert prose-sm max-w-none">
                                            {comment ? (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                    {comment}
                                                </ReactMarkdown>
                                            ) : (
                                                <span className="text-muted-foreground italic">Nothing to preview</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleAddComment}
                                        size="sm"
                                        disabled={!comment.trim()}
                                        variant="secondary"
                                        className="gap-2"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        Send Comment
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Properties */}
                    <div className="w-full md:w-72 bg-muted/5 p-6 space-y-8 h-full custom-scrollbar">

                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => handleUpdateTask({ priority: p })}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all
                                            ${currentTask.priority === p
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                : 'bg-background hover:bg-accent border-border text-foreground'
                                            }
                                        `}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</h3>
                            <select
                                className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={currentTask.type || 'Task'}
                                onChange={(e) => handleUpdateTask({ type: e.target.value })}
                            >
                                <option value="Task">Task</option>
                                <option value="Story">Story</option>
                                <option value="Bug">Bug</option>
                                <option value="Change Request">Change Request</option>
                                <option value="Epic">Epic</option>
                                <option value="Hotfix">Hotfix</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Improvement">Improvement</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reporter</h3>
                            <div className="flex items-center gap-2 bg-background border border-border px-2 pl-1 py-1 rounded-full text-xs shadow-sm w-fit">
                                <Avatar
                                    src={currentTask.createdBy?.avatar}
                                    fallback={currentTask.createdBy?.name?.charAt(0)}
                                    size="xs"
                                    className="w-5 h-5 text-[10px]"
                                />
                                <span className="pr-1">{currentTask.createdBy?.name || 'Unknown'}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignee</h3>
                            <div className="space-y-2">
                                {currentTask.assignedTo && currentTask.assignedTo.length > 0 ? (
                                    <div className="flex items-center gap-2 bg-background border border-border px-2 pl-1 py-1 rounded-full text-xs shadow-sm w-fit">
                                        <Avatar
                                            src={currentTask.assignedTo[0].avatar}
                                            fallback={currentTask.assignedTo[0].name?.charAt(0)}
                                            size="xs"
                                            className="w-5 h-5 text-[10px]"
                                        />
                                        <span className="pr-1">{currentTask.assignedTo[0].name}</span>
                                        <button
                                            onClick={() => handleUpdateTask({ assignedTo: [] })}
                                            className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">No one assigned</p>
                                )}

                                <select
                                    className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={currentTask.assignedTo?.[0]?._id || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        handleUpdateTask({ assignedTo: val ? [val] : [] });
                                    }}
                                >
                                    <option value="">Assign to...</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</h3>
                            <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{currentTask.dueDate ? format(new Date(currentTask.dueDate), 'PPP') : 'No due date'}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attachments</h3>
                            {currentTask.attachments?.length > 0 ? (
                                <div className="space-y-2">
                                    {currentTask.attachments.map((file, i) => (
                                        <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-background border border-border text-xs group cursor-pointer hover:border-primary/50 transition-colors">
                                            <Paperclip className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                                            <span className="truncate flex-1 font-medium">{file.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 border border-dashed border-border rounded-md text-center">
                                    <p className="text-xs text-muted-foreground">Drop files here to upload</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
