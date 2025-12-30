import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uploadAPI } from '../services';

const COLORS = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
];

import { config as appConfig } from '../config';

const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [descTab, setDescTab] = useState('write'); // write | preview

    const API_URL = appConfig.API_URL;

    if (!isOpen) return null;

    const handlePaste = async (e) => {
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
                const textBefore = description.substring(0, startPos);
                const textAfter = description.substring(endPos);

                const placeholder = `![Uploading ${file.name}...]`;
                setDescription(`${textBefore}${placeholder}${textAfter}`);

                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const { data } = await uploadAPI.uploadFile(formData);
                    const imageUrl = `${API_URL}${data.url}`;

                    setDescription(prev => prev.replace(placeholder, `![Image](${imageUrl})`));
                } catch (error) {
                    console.error('Upload failed:', error);
                    setDescription(prev => prev.replace(placeholder, `[Upload Failed]`));
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onCreate({ title, description, color });
            setTitle('');
            setDescription('');
            setColor(COLORS[0]);
            setDescTab('write');
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-border">
                <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold tracking-tight">Create New Project</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Project Name
                        </label>
                        <Input
                            id="title"
                            placeholder="Enter project name"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Description
                        </label>
                        <div className="border border-input rounded-md overflow-hidden">
                            <div className="flex items-center gap-1 border-b border-input bg-muted/40 p-1">
                                <button
                                    type="button"
                                    onClick={() => setDescTab('write')}
                                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${descTab === 'write' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Write
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDescTab('preview')}
                                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${descTab === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Preview
                                </button>
                            </div>

                            {descTab === 'write' ? (
                                <textarea
                                    id="description"
                                    className="flex min-h-[100px] w-full bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none resize-y"
                                    placeholder="What is this project about? (Markdown supported, Paste images)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onPaste={handlePaste}
                                />
                            ) : (
                                <div className="min-h-[100px] p-3 text-sm text-foreground prose dark:prose-invert prose-sm max-w-none">
                                    {description ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {description}
                                        </ReactMarkdown>
                                    ) : (
                                        <span className="text-muted-foreground italic">Nothing to preview</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Project Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring ${color === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                >
                                    {color === c && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading} className="bg-primary text-white">
                            Create Project
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
