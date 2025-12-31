import React, { useState, useEffect } from 'react';
import { X, Plus, GripVertical, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import Input from './ui/Input';
import { projectAPI } from '../services';

const ProjectSettingsModal = ({ isOpen, onClose, project, onUpdate, isAdmin }) => {
    const [stages, setStages] = useState([]);
    const [newStage, setNewStage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (project?.workflowStages) {
            setStages([...project.workflowStages]);
        }
    }, [project, isOpen]);

    if (!isOpen) return null;

    const handleAddStage = () => {
        const trimmed = newStage.trim();
        if (!trimmed) return;
        if (stages.includes(trimmed)) {
            setError('Stage already exists');
            return;
        }
        setStages([...stages, trimmed]);
        setNewStage('');
        setError('');
    };

    const handleRemoveStage = (index) => {
        if (stages.length <= 1) {
            setError('Project must have at least one stage');
            return;
        }
        const updated = stages.filter((_, i) => i !== index);
        setStages(updated);
        setError('');
    };

    const handleMove = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= stages.length) return;

        const updated = [...stages];
        const temp = updated[index];
        updated[index] = updated[newIndex];
        updated[newIndex] = temp;
        setStages(updated);
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await projectAPI.updateProject(project._id, {
                workflowStages: stages
            });
            onUpdate(data.project);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update workflow');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (confirmDelete !== project.title) return;

        setLoading(true);
        setError('');
        try {
            await projectAPI.deleteProject(project._id);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete project');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/10">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Workflow Settings</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Manage board columns for {project?.title}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Board Stages
                        </label>
                        <div className="space-y-2">
                            {stages.map((stage, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border group"
                                >
                                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            disabled={index === 0}
                                            onClick={() => handleMove(index, -1)}
                                            className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-20"
                                        >
                                            <Plus className="w-3 h-3 rotate-45 scale-75" title="Move Up" />
                                        </button>
                                        <button
                                            disabled={index === stages.length - 1}
                                            onClick={() => handleMove(index, 1)}
                                            className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-20 translate-y-[-4px]"
                                        >
                                            <Plus className="w-3 h-3 rotate-180 scale-75" title="Move Down" />
                                        </button>
                                    </div>
                                    <span className="flex-1 text-sm font-medium">{stage}</span>
                                    <button
                                        onClick={() => handleRemoveStage(index)}
                                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 pb-4">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Add New Stage
                        </label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Stage name (e.g. Testing)"
                                value={newStage}
                                onChange={(e) => setNewStage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                                className="h-9 text-sm"
                            />
                            <Button size="sm" onClick={handleAddStage} type="button">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    {isAdmin && (
                        <div className="pt-6 border-t border-border">
                            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-4">
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="w-4 h-4" />
                                    <h3 className="text-sm font-bold uppercase tracking-tight">Danger Zone</h3>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Deleting this project will permanently remove all associated tasks, comments, and files. This action cannot be undone.
                                </p>

                                {!isDeleting ? (
                                    <Button
                                        variant="outline"
                                        className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                                        onClick={() => setIsDeleting(true)}
                                    >
                                        Delete Project
                                    </Button>
                                ) : (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">
                                                Confirm project title
                                            </p>
                                            <Input
                                                placeholder={`Type "${project.title}" to confirm`}
                                                value={confirmDelete}
                                                onChange={(e) => setConfirmDelete(e.target.value)}
                                                className="h-9 text-sm border-destructive/30 focus:border-destructive focus:ring-destructive/20"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-[11px] uppercase tracking-widest"
                                                disabled={confirmDelete !== project.title || loading}
                                                onClick={handleDelete}
                                            >
                                                {loading ? 'Deleting...' : 'Confirm Delete'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="px-4 text-[11px] font-bold uppercase tracking-widest"
                                                onClick={() => {
                                                    setIsDeleting(false);
                                                    setConfirmDelete('');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/10">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="text-xs font-bold uppercase tracking-widest">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                        {loading ? 'Saving...' : 'Save Workflow'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProjectSettingsModal;
