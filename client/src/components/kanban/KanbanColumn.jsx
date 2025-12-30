import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import Button from '../ui/Button';

// Refined colors to match the design screenshot
const STAGE_STYLES = {
    'Backlog': {
        wrapper: 'bg-gray-50/80 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800',
        header: 'text-gray-700 dark:text-gray-300',
        badge: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    },
    'In Progress': {
        wrapper: 'bg-blue-50/80 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30',
        header: 'text-blue-700 dark:text-blue-300',
        badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
    },
    'Review': {
        wrapper: 'bg-purple-50/80 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30',
        header: 'text-purple-700 dark:text-purple-300',
        badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
    },
    'Done': {
        wrapper: 'bg-green-50/80 dark:bg-green-900/10 border-green-100 dark:border-green-900/30',
        header: 'text-green-700 dark:text-green-300',
        badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
    },
};

const KanbanColumn = ({ stage, tasks, onTaskClick, onAddTask }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: stage,
    });

    const styles = STAGE_STYLES[stage] || {
        wrapper: 'bg-muted/30 border-border',
        header: 'text-foreground',
        badge: 'bg-muted text-muted-foreground'
    };

    return (
        <div className="flex flex-col w-80 shrink-0">
            {/* Column Wrapper - merged header and body visual */}
            <div
                ref={setNodeRef}
                className={`
                    flex flex-col h-full rounded-xl border transition-colors min-h-[500px]
                    ${styles.wrapper}
                    ${isOver ? 'ring-2 ring-primary/20 bg-accent/20' : ''}
                `}
            >
                {/* Header */}
                <div className={`p-4 flex items-center justify-between ${styles.header}`}>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm tracking-tight">{stage}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                            {tasks.length}
                        </span>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 hover:bg-black/5 dark:hover:bg-white/10"
                        onClick={() => onAddTask(stage)}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Tasks Container */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                onClick={onTaskClick}
                            />
                        ))}
                    </SortableContext>

                    {tasks.length === 0 && (
                        <div className="h-24 flex items-center justify-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-lg">
                            <p className="text-xs text-muted-foreground/50 font-medium">Drop valid items</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KanbanColumn;
