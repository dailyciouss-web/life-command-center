import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { TaskItem } from './tasks/TaskItem';
import { Plus, Search, Filter } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { motion } from 'motion/react';

export const TasksView: React.FC = () => {
  const { state, addTask, updateTask, deleteTask } = useAppState();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'completed'>('all');

  const handleAddRoot = () => {
    addTask({ parentId: null, name: 'New Task Group' });
  };

  const filteredRootIds = state.rootTaskIds.filter(id => {
    const task = state.tasks[id];
    if (!task) return false;
    if (search && !task.name.toLowerCase().includes(search.toLowerCase())) return false;
    
    if (filter === 'completed') return task.isCompleted;
    if (filter === 'today') return task.dueDate === new Date().toISOString().split('T')[0];
    
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/[0.06] backdrop-blur-xl flex items-center justify-center border border-white/[0.12]">
              <div className="w-5 h-5 bg-indigo-400 rounded-sm rotate-45"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">Command Center</h1>
              <p className="text-[10px] text-white/50 tracking-widest uppercase">Personal Intelligence Hub</p>
            </div>
          </div>
          <button 
            onClick={handleAddRoot}
            className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-grow">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light"
              />
            </div>
          </div>
          <GlassCard intensity="low" className="p-3 cursor-pointer">
            <Filter size={18} className="text-white/40" />
          </GlassCard>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {['all', 'today', 'overdue', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === f 
                ? 'bg-white text-black' 
                : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <section className="flex flex-col gap-6">
        {filteredRootIds.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <Plus className="text-white/20" />
            </div>
            <p className="text-white/30 text-sm">No tasks found. Create one to begin.</p>
          </div>
        ) : (
          filteredRootIds.map(id => (
            <TaskItem 
              key={id} 
              taskId={id} 
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
