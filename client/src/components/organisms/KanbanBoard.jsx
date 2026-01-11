import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from '../molecules/TaskCard';

const KanbanBoard = ({ tasks, stages, onTaskMove, onTaskClick, onAddTask }) => {
    const [activeTask, setActiveTask] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requirement for drag detection
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        const { active } = event;
        const task = tasks.find(t => t._id === active.id);
        setActiveTask(task);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        // Clear drag overlay
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id;
        const task = tasks.find(t => t._id === taskId);

        // Dropped on a column (stage)
        if (stages.includes(over.id)) {
            if (task.stage !== over.id) {
                onTaskMove(taskId, over.id);
            }
            return;
        }

        // Dropped on another task
        const overTask = tasks.find(t => t._id === over.id);
        if (overTask && overTask.stage !== task.stage) {
            onTaskMove(taskId, overTask.stage);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {stages.map(stage => (
                    <KanbanColumn
                        key={stage}
                        id={stage}
                        stage={stage}
                        title={stage}
                        tasks={tasks.filter(task => task.stage === stage)}
                        onTaskClick={onTaskClick}
                        onAddTask={onAddTask}
                    />
                ))}
            </div>


            <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
