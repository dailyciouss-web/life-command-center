import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { format, isSameDay } from 'date-fns';
import { TaskItem } from './tasks/TaskItem';
import { Task } from '../types';

export const TodayView: React.FC = () => {
  const { state, updateTask, deleteTask, addTask } = useAppState();
  const today = new Date();

  // Find all tasks due today, regardless of hierarchy
  const todayTasks = (Object.values(state.tasks) as Task[]).filter(task => {
    if (!task.dueDate) return false;
    try {
      return isSameDay(new Date(task.dueDate), today);
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight uppercase">Today's Focus</h1>
        <p className="text-white/50 text-[10px] tracking-widest uppercase">{format(today, 'EEEE, d MMMM yyyy')}</p>
      </header>

      <section className="flex flex-col gap-4">
        {todayTasks.length === 0 ? (
          <div className="py-20 text-center text-white/30 italic text-sm">
            Everything is clear for today.
          </div>
        ) : (
          todayTasks.map(task => (
            <TaskItem 
              key={task.id}
              taskId={task.id}
              tasks={state.tasks}
              depth={0}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onAddChild={(pid) => addTask({ parentId: pid, name: 'New Subtask' })}
            />
          ))
        )}
      </section>
    </div>
  );
};
