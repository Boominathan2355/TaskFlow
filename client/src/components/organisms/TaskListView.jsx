import React from 'react';
import { format } from 'date-fns';
import { AlertCircle, MessageSquare, Paperclip } from 'lucide-react';
import Badge from '../atoms/Badge';
import Avatar from '../atoms/Avatar';

const TaskListView = ({ tasks, onTaskClick }) => {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-16 border rounded-xl border-dashed bg-muted/5">
                <p className="text-muted-foreground font-medium">No tasks found. Try adjusting your filters.</p>
            </div>
        );
    }

    const PRIORITY_VARIANTS = {
        'Low': 'priority-low',
        'Medium': 'priority-medium',
        'High': 'priority-high',
        'Urgent': 'priority-urgent',
    };

    return (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/30 border-b border-border">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-foreground/80">ID</th>
                            <th className="px-6 py-4 font-semibold text-foreground/80">Task</th>
                            <th className="px-6 py-4 font-semibold text-foreground/80">Type</th>
                            <th className="px-6 py-4 font-semibold text-foreground/80">Priority</th>
                            <th className="px-6 py-4 font-semibold text-foreground/80 text-center">Stage</th>
                            <th className="px-6 py-4 font-semibold text-foreground/80 text-center">Assignee</th>
                            <th className="px-6 py-4 font-semibold text-foreground/80">Due Date</th>
                            <th className="px-6 py-4 font-semibold text-foreground/80 text-right">Activity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {tasks.map((task) => {
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.stage !== 'Done';

                            return (
                                <tr
                                    key={task._id}
                                    onClick={() => onTaskClick(task)}
                                    className="group hover:bg-muted/30 transition-all cursor-pointer"
                                >
                                    <td className="px-6 py-5">
                                        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded tracking-wider border border-border/50">
                                            {task.key || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 max-w-[400px]">
                                        <div className="flex items-start gap-3">
                                            {isOverdue ? (
                                                <div className="mt-1 text-destructive animate-pulse">
                                                    <AlertCircle className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="mt-1 w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                                            )}
                                            <div className="min-w-0">
                                                <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm truncate">
                                                    {task.title}
                                                </div>
                                                {task.description && (
                                                    <div className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5">
                                                        {task.description.replace(/[#*`!\[\]\(\)]/g, '')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs text-muted-foreground font-medium">{task.type || 'Task'}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge
                                            variant={PRIORITY_VARIANTS[task.priority] || 'secondary'}
                                            className="rounded-md font-medium text-[10px] px-2 py-0.5 border-transparent shadow-none"
                                        >
                                            {task.priority}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary/50 text-secondary-foreground border border-border">
                                            {task.stage}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex -space-x-1.5 justify-center">
                                            {task.assignedTo && task.assignedTo.length > 0 && task.assignedTo[0] ? (
                                                <Avatar
                                                    key={task.assignedTo[0]._id}
                                                    src={task.assignedTo[0].avatar}
                                                    fallback={task.assignedTo[0].name?.charAt(0)}
                                                    size="sm"
                                                    className="w-7 h-7 border-2 border-card ring-0"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full border border-dashed border-muted-foreground/30 bg-muted/20" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        {task.dueDate ? (
                                            <span className={`text-[13px] font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground/40 font-mono">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 text-muted-foreground/60">
                                            <div className="flex items-center gap-1.5" title="Comments">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span className="text-[11px] font-medium">{task.comments?.length || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Attachments">
                                                <Paperclip className="w-3.5 h-3.5" />
                                                <span className="text-[11px] font-medium">{task.attachments?.length || 0}</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TaskListView;
