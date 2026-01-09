import React from 'react';
import { Link } from 'react-router-dom'; // Using Link since we navigate in the main app
import { Calendar, CheckCircle2, Clock, Layers } from 'lucide-react';
import { format } from 'date-fns';

// Simple Progress component if not available elsewhere
const Progress = ({ value, className = "" }) => (
    <div className={`w-full bg-muted/50 rounded-full h-2 overflow-hidden ${className}`}>
        <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
    </div>
);

const ProjectCard = ({ project }) => {
    // Calculate stats safely. If tasks are not populated, default to 0.
    const tasks = project.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done' || t.stage === 'Done' || t.status === 'completed').length;

    // Calculate progress (avoid division by zero)
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const activeTasks = tasks.filter(t => (t.status === 'in-progress' || t.stage === 'In Progress') && t.status !== 'done').length;

    // For overdue, we need to check dueDate. Assuming t.dueDate exists.
    const overdueTasks = tasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done' && t.stage !== 'Done'
    ).length;

    // For backlog, check if stage is 'Backlog'
    const backlogTasks = tasks.filter(t => t.stage === 'Backlog').length;

    const members = project.members || [];

    return (
        <Link
            to={`/projects/${project._id}`}
            className="block group no-underline"
        >
            <div
                className="bg-card hover:shadow-lg transition-all duration-200 border border-border rounded-xl p-6 relative overflow-hidden h-full flex flex-col"
            >
                {/* Colored Left Border Indicator */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: project.color || '#3B82F6' }}
                />

                <div className="pl-3 mb-auto">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                        {project.description || 'No description provided'}
                    </p>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{completedTasks} / {totalTasks} tasks</span>
                        </div>
                        <Progress value={progress} />
                    </div>

                    <div className="flex items-center gap-4 text-xs mb-6">
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{activeTasks} active</span>
                        </div>

                        {overdueTasks > 0 && (
                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{overdueTasks} overdue</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{completedTasks} done</span>
                        </div>

                        {backlogTasks > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <Layers className="w-3.5 h-3.5 opacity-70" />
                                <span>{backlogTasks} backlog</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pl-3 flex items-center justify-between pt-4 border-t border-border mt-auto">
                    <div className="flex -space-x-2">
                        {members.slice(0, 4).map((member, i) => (
                            <div
                                key={member.user?._id || i}
                                className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden"
                                title={member.user?.name}
                            >
                                {member.user?.avatar ? (
                                    <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {member.user?.name?.charAt(0) || '?'}
                                    </span>
                                )}
                            </div>
                        ))}
                        {members.length > 4 && (
                            <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                                +{members.length - 4}
                            </div>
                        )}
                    </div>

                    <span className="text-xs text-muted-foreground">
                        {project.updatedAt ? format(new Date(project.updatedAt), 'MMM d, yyyy') : ''}
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default ProjectCard;
