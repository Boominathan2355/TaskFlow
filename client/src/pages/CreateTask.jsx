import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, AlertCircle, FileText, Tag, Flag, User, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import Avatar from '../components/atoms/Avatar';
import { uploadAPI, userAPI, projectAPI, taskAPI } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { config as appConfig } from '../config';
import MarkdownToolbar from '../components/molecules/MarkdownToolbar';

const PRIORITY_VARIANTS = {
    'Low': 'priority-low',
    'Medium': 'priority-medium',
    'High': 'priority-high',
    'Urgent': 'priority-urgent',
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

const CreateTask = () => {
    const { id: projectId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialStage = searchParams.get('stage') || 'Backlog';
    const { user } = useAuth();

    const [project, setProject] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Task');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [descTab, setDescTab] = useState('write');
    const [projectLoading, setProjectLoading] = useState(true);
    const descriptionRef = useRef(null);

    const API_URL = appConfig.API_URL;

    // Shared Markdown Components Config
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

    // Fetch project and users
    useEffect(() => {
        const fetchData = async () => {
            try {
                setProjectLoading(true);
                const [projectRes, usersRes] = await Promise.all([
                    projectAPI.getProjectById(projectId),
                    userAPI.getAllUsers()
                ]);
                setProject(projectRes.data.project);
                setUsers(usersRes.data.users || []);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Failed to load project details');
            } finally {
                setProjectLoading(false);
            }
        };
        fetchData();
    }, [projectId, initialStage]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('Task title is required');
            return;
        }

        if (!description.trim()) {
            setError('Description is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data } = await taskAPI.createTask({
                title,
                description,
                type,
                priority,
                dueDate: dueDate || null,
                assignedTo: assignedTo ? [assignedTo] : [],
                projectId: project._id
            });

            // Navigate to the newly created task using its ticket ID
            if (data.task && data.task._id) {
                navigate(`/projects/${projectId}/tasks/${data.task._id}`);
            } else {
                navigate(`/projects/${projectId}`);
            }
        } catch (err) {
            console.error('Failed to create task:', err);
            setError(err.response?.data?.error || 'Failed to create task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (projectLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/projects/${projectId}`)}
                                className="h-9 w-9"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Create New Task</h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Project: <span className="font-medium text-foreground">{project?.title}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`/projects/${projectId}`)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 shadow-lg shadow-primary/20"
                            >
                                {loading ? 'Creating...' : 'Create Task'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 bg-destructive/10 text-destructive text-sm p-4 rounded-lg flex items-center gap-2 border border-destructive/20">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form - Left Side */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Title */}
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-5 h-5 text-primary" />
                                <label className="text-sm font-semibold uppercase tracking-wider">
                                    Task Title <span className="text-destructive">*</span>
                                </label>
                            </div>
                            <Input
                                placeholder="Enter a clear, descriptive title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                                className="text-lg font-medium h-12 bg-muted/30"
                            />
                        </div>

                        {/* Description */}
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-primary" />
                                    <label className="text-sm font-semibold uppercase tracking-wider">
                                        Description <span className="text-destructive">*</span>
                                    </label>
                                </div>
                                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setDescTab('write')}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${descTab === 'write' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Write
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDescTab('preview')}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${descTab === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Preview
                                    </button>
                                </div>
                            </div>
                            <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
                                {descTab === 'write' ? (
                                    <div className="flex flex-col">
                                        <MarkdownToolbar
                                            textareaRef={descriptionRef}
                                            value={description}
                                            onChange={setDescription}
                                        />
                                        <textarea
                                            ref={descriptionRef}
                                            className="flex min-h-[400px] w-full bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none resize-none font-sans leading-relaxed"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            onPaste={(e) => handlePaste(e, setDescription, description)}
                                            placeholder="Describe the task in detail... (Markdown supported. Paste images to upload)"
                                        />
                                    </div>
                                ) : (
                                    <div className="min-h-[400px] p-4 text-sm text-foreground prose dark:prose-invert prose-sm max-w-none overflow-y-auto bg-background/50">
                                        {description ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                {description}
                                            </ReactMarkdown>
                                        ) : (
                                            <span className="text-muted-foreground/50 italic">No description provided</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                                Markdown supported. Paste images to upload directly.
                            </p>
                        </div>
                    </div>

                    {/* Sidebar - Right Side */}
                    <div className="space-y-6">
                        {/* Task Type */}
                        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="w-4 h-4 text-muted-foreground" />
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Task Type <span className="text-destructive">*</span>
                                </label>
                            </div>
                            <select
                                className="w-full h-10 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer text-foreground"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                {['Task', 'Story', 'Bug', 'Change Request', 'Epic', 'Hotfix', 'Maintenance', 'Improvement'].map(t => (
                                    <option key={t} value={t} className="bg-card text-foreground">{t}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Flag className="w-4 h-4 text-muted-foreground" />
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Priority <span className="text-destructive">*</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${priority === p
                                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                            : 'bg-muted/30 hover:bg-muted border-border text-foreground'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Assignee
                                </label>
                            </div>
                            <select
                                className="w-full h-10 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer text-foreground"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                            >
                                <option value="" className="bg-card text-foreground">Select Assignee...</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id} className="bg-card text-foreground">
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                            {assignedTo && (
                                <div className="mt-3 flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                    <Avatar
                                        src={users.find(u => u._id === assignedTo)?.avatar}
                                        fallback={users.find(u => u._id === assignedTo)?.name?.charAt(0)}
                                        size="sm"
                                    />
                                    <span className="text-sm font-medium">
                                        {users.find(u => u._id === assignedTo)?.name}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Due Date */}
                        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Due Date
                                </label>
                            </div>
                            <Input
                                type="date"
                                className="bg-muted/30 h-10"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

                        {/* Creator Info */}
                        <div className="bg-muted/30 rounded-xl border border-border/50 p-5">
                            <p className="text-xs text-muted-foreground mb-2">Creating as</p>
                            <div className="flex items-center gap-2">
                                <Avatar
                                    src={user?.avatar}
                                    fallback={user?.name?.charAt(0)}
                                    size="sm"
                                />
                                <div>
                                    <p className="text-sm font-medium">{user?.name}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTask;
