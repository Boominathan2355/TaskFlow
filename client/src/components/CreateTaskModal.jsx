import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Button from './ui/Button';
import Input from './ui/Input';
import { uploadAPI, userAPI } from '../services';

import { config as appConfig } from '../config';

const CreateTaskModal = ({ isOpen, onClose, onCreate, project, initialStage }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Task');
    const [priority, setPriority] = useState('Medium');
    const [stage, setStage] = useState(initialStage || 'Backlog');
    const [dueDate, setDueDate] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [descTab, setDescTab] = useState('write'); // write | preview

    const API_URL = appConfig.API_URL;

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

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setType('Task');
            setPriority('Medium');
            setStage(initialStage || (project?.workflowStages?.[0] || 'Backlog'));
            setDueDate('');
            setAssignedTo('');
            setError('');
            setDescTab('write');
            fetchAllUsers();
        }
    }, [isOpen, initialStage, project]);

    const fetchAllUsers = async () => {
        try {
            const { data } = await userAPI.getAllUsers();
            setUsers(data.users || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    if (!isOpen) return null;

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

        if (!type || type === '') {
            setError('Task type is required');
            return;
        }

        if (!priority || priority === '') {
            setError('Priority is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onCreate({
                title,
                description,
                type,
                priority,
                stage,
                dueDate: dueDate || null,
                assignedTo: assignedTo ? [assignedTo] : [],
                projectId: project._id // Ensure this matches backend expectation
            });
            onClose();
        } catch (err) {
            console.error('Failed to create task:', err);
            setError('Failed to create task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/10">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Create New Task</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Project: {project?.title}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6">
                        {error && (
                            <div className="mb-6 bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content (Left) */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider text-[10px] flex items-center">
                                        Task Title <span className="text-destructive ml-1">*</span>
                                    </label>
                                    <Input
                                        placeholder="What needs to be done?"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        autoFocus
                                        className="text-lg font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider text-[10px] flex items-center">
                                            Description <span className="text-destructive ml-1">*</span>
                                        </label>
                                        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md border border-border/50">
                                            <button
                                                type="button"
                                                onClick={() => setDescTab('write')}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${descTab === 'write' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                EDIT
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDescTab('preview')}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${descTab === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                PREVIEW
                                            </button>
                                        </div>
                                    </div>
                                    <div className="border border-border rounded-lg overflow-hidden bg-muted/10 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                                        {descTab === 'write' ? (
                                            <textarea
                                                className="flex min-h-[300px] w-full bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none font-sans leading-relaxed"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                onPaste={(e) => handlePaste(e, setDescription, description)}
                                                placeholder="Describe the task... (Markdown supported. Paste images to upload)"
                                            />
                                        ) : (
                                            <div className="min-h-[300px] p-4 text-sm text-foreground prose dark:prose-invert prose-sm max-w-none overflow-y-auto bg-background/50">
                                                {description ? (
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                        {description}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <span className="text-muted-foreground/50 italic text-xs">No description provided</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                        Markdown is supported. Paste images to upload directly.
                                    </p>
                                </div>
                            </div>

                            {/* Sidebar Content (Right) */}
                            <div className="space-y-6 lg:border-l lg:pl-8 border-border">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider text-[10px] flex items-center">
                                            Task Type <span className="text-destructive ml-1">*</span>
                                        </label>
                                        <select
                                            className="w-full h-9 rounded-md border border-border/50 bg-card px-3 py-1 text-sm shadow-sm transition-all focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer text-foreground"
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                        >
                                            <option value="Task" className="bg-card text-foreground">Task</option>
                                            <option value="Story" className="bg-card text-foreground">Story</option>
                                            <option value="Bug" className="bg-card text-foreground">Bug</option>
                                            <option value="Change Request" className="bg-card text-foreground">Change Request</option>
                                            <option value="Epic" className="bg-card text-foreground">Epic</option>
                                            <option value="Hotfix" className="bg-card text-foreground">Hotfix</option>
                                            <option value="Maintenance" className="bg-card text-foreground">Maintenance</option>
                                            <option value="Improvement" className="bg-card text-foreground">Improvement</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider text-[10px] flex items-center">
                                            Priority <span className="text-destructive ml-1">*</span>
                                        </label>
                                        <select
                                            className="w-full h-9 rounded-md border border-border/50 bg-card px-3 py-1 text-sm shadow-sm transition-all focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer text-foreground"
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                        >
                                            {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                                <option key={p} value={p} className="bg-card text-foreground">{p}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider text-[10px]">Assignee</label>
                                        <select
                                            className="w-full h-9 rounded-md border border-border/50 bg-card px-3 py-1 text-sm shadow-sm transition-all focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer text-foreground"
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
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider text-[10px]">Due Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
                                            <Input
                                                type="date"
                                                className="pl-9 bg-background/50 h-9 text-sm"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-border bg-muted/10">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="text-xs font-bold uppercase tracking-widest">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                            {loading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
