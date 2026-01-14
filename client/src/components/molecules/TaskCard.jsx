import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Calendar, MessageSquare, Paperclip, AlertCircle, MoreHorizontal } from 'lucide-react';
import Badge from '../atoms/Badge';
import Avatar from '../atoms/Avatar';

const TaskCard = ({ task, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.stage !== 'Done';

    // Priority Border Colors - Using semantic tokens
    const priorityBorderColor = {
        'Low': 'border-l-priority-low',
        'Medium': 'border-l-priority-medium',
        'High': 'border-l-priority-high',
        'Urgent': 'border-l-priority-urgent'
    }[task.priority] || 'border-l-muted';

    // Priority Badge Variants
    const priorityVariant = {
        'Low': 'priority-low',
        'Medium': 'priority-medium',
        'High': 'priority-high',
        'Urgent': 'priority-urgent'
    }[task.priority] || 'secondary';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onClick(task)}
            className={`
                group relative bg-card p-4 rounded-lg border border-border/50 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200
                border-l-[3px] ${priorityBorderColor}
            `}
        >
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm leading-tight text-foreground group-hover:text-primary transition-colors">
                        {task.title}
                    </h4>
                    {isOverdue && (
                        <div title="Overdue" className="text-destructive">
                            <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>

                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded tracking-wider border border-border/50">
                        {task.key || 'TASK'}
                    </span>
                    <Badge variant={priorityVariant} className="rounded-md text-[10px] px-2 py-0.5 h-auto font-medium shadow-none border-transparent">
                        {task.priority}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-muted/30 border border-border/20">
                        {task.type || 'Task'}
                    </div>

                    {task.dueDate && (
                        <div className={`
                            flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md border border-transparent
                            ${isOverdue
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                            } transition-colors
                        `}>
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.dueDate), 'MMM d')}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                        {/* Always show icons slightly dimmed unless they have active counts */}
                        <div className={`flex items-center gap-1 ${task.comments?.length ? 'text-info' : ''}`}>
                            <MessageSquare className="w-3.5 h-3.5" />
                            {task.comments?.length > 0 && <span>{task.comments.length}</span>}
                        </div>

                        <div className={`flex items-center gap-1 ${task.attachments?.length ? 'text-primary' : ''}`}>
                            <Paperclip className="w-3.5 h-3.5" />
                            {task.attachments?.length > 0 && <span>{task.attachments.length}</span>}
                        </div>
                    </div>

                    <div className="flex -space-x-2">
                        {task.assignedTo?.map((user) => (
                            <Avatar
                                key={user._id}
                                src={user.avatar}
                                fallback={user.name?.charAt(0)}
                                alt={user.name}
                                size="sm"
                                className="w-6 h-6 border-2 border-card ring-0"
                            />
                        ))}
                        {(!task.assignedTo || task.assignedTo.length === 0) && (
                            <div className="w-6 h-6 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground/50">
                                <span className="sr-only">Unassigned</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
