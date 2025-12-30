import React, { useState, useEffect } from 'react';
import { X, Plus, GripVertical, AlertCircle, Trash2 } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import { projectAPI } from '../services';

const ProjectSettingsModal = ({ isOpen, onClose, project, onUpdate }) => {
    const [stages, setStages] = useState([]);
    const [newStage, setNewStage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

                    <div className="space-y-2">
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
