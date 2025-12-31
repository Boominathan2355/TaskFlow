import React, { useState, useEffect } from 'react';
import { X, Check, Box, Loader2, AlertCircle } from 'lucide-react';
import Button from './ui/Button';
import { projectAPI } from '../services';

const UserProjectsModal = ({ isOpen, onClose, user }) => {
    const [allProjects, setAllProjects] = useState([]);
    const [assignedProjectIds, setAssignedProjectIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            fetchData();
        }
    }, [isOpen, user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const [allRes, userRes] = await Promise.all([
                projectAPI.getAllProjects(),
                projectAPI.getUserProjects(user._id || user.id)
            ]);

            setAllProjects(allRes.data.projects || []);
            setAssignedProjectIds((userRes.data.projects || []).map(p => p._id));
        } catch (err) {
            console.error('Failed to fetch projects:', err);
            setError('Failed to load project list');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleProject = (projectId) => {
        setAssignedProjectIds(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await projectAPI.updateUserProjects(user._id || user.id, assignedProjectIds);
            onClose();
        } catch (err) {
            console.error('Failed to update projects:', err);
            setError('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-muted/10">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Project Access</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Manage projects for {user?.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground font-medium">Loading projects...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {allProjects.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground italic">No projects available</p>
                                </div>
                            ) : allProjects.map((project) => (
                                <button
                                    key={project._id}
                                    onClick={() => handleToggleProject(project._id)}
                                    className={`
                                        flex items-center justify-between p-3 px-4 rounded-xl border transition-all text-left
                                        ${assignedProjectIds.includes(project._id)
                                            ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                                            : 'bg-muted/20 border-border hover:bg-muted/40'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                                            style={{ backgroundColor: project.color || '#3B82F6' }}
                                        >
                                            <Box className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-tight">{project.title}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
                                                {project.keyPrefix}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`
                                        w-5 h-5 rounded-full border flex items-center justify-center transition-all
                                        ${assignedProjectIds.includes(project._id)
                                            ? 'bg-primary border-primary text-white scale-110'
                                            : 'bg-background border-border opacity-50'
                                        }
                                    `}>
                                        {assignedProjectIds.includes(project._id) && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/10">
                    <Button variant="ghost" onClick={onClose} disabled={saving} className="text-xs font-bold uppercase tracking-widest">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || saving}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        {saving ? 'Updating...' : 'Save Assignments'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UserProjectsModal;
