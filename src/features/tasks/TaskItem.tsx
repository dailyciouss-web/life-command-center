import React, { useState } from 'react';
import { Task } from '../../types';
import { GlassCard } from '../../components/GlassCard';
import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, MoreVertical, CheckCircle2, Circle } from 'lucide-react';
import { getTaskCompletion, hexToHue } from './utils';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface TaskItemProps {
  taskId: string;
  tasks: Record<string, Task>;
  depth: number;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  taskId, 
  tasks, 
  depth, 
  onUpdate, 
  onDelete, 
  onAddChild 
}) => {
  const task = tasks[taskId];
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!task) return null;

  const completion = getTaskCompletion(taskId, tasks);
  const isGroup = task.childrenIds.length > 0;
  
  // Calculate vividness
  // Low completion = desaturated
  // High completion = full vivid color
  const saturation = 10 + (completion * 90); 
  const opacity = 0.2 + (completion * 0.8);
  const colorWithIntensity = isGroup ? `hsla(${hexToHue(task.color)}, ${saturation}%, 50%, ${opacity})` : `${task.color}${task.isCompleted ? 'ff' : '44'}`;

  return (
    <div className={cn("flex flex-col gap-2", depth > 0 && "ml-4 border-l border-white/10 pl-4 py-1")}>
      <GlassCard 
        className={cn(
          "transition-all duration-500",
          task.isCompleted && "border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        )}
        style={{
          borderColor: isGroup ? task.color : undefined,
          borderOpacity: opacity,
          background: isGroup ? `rgba(255,255,255, ${0.05 + (completion * 0.1)})` : undefined
        }}
      >
        <div className="flex items-center p-4 gap-3">
          <button 
            onClick={() => onUpdate(taskId, { isCompleted: !task.isCompleted })}
            className="flex-shrink-0"
          >
            {task.isCompleted ? (
              <CheckCircle2 size={24} style={{ color: task.color }} />
            ) : (
              <Circle size={24} className="text-white/20" />
            )}
          </button>

          <div className="flex-grow min-w-0" onClick={() => isGroup && setIsExpanded(!isExpanded)}>
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "text-base font-medium truncate transition-colors duration-500",
                task.isCompleted ? "text-white/40 line-through" : "text-white"
              )}>
                {task.name}
              </h3>
              {isGroup && (
                 <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/60">
                   {Math.round(completion * 100)}%
                 </span>
              )}
            </div>
            {task.notes && (
              <p className="text-xs text-white/40 mt-0.5 truncate">{task.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => onAddChild(taskId)}
              className="p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white"
            >
              <Plus size={18} />
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 hover:bg-white/10 rounded-full text-white/40 transition-transform"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Completion Progress Bar for Groups */}
        {isGroup && (
          <div className="h-1 w-full bg-white/5 relative">
            <motion.div 
              className="absolute inset-y-0 left-0"
              initial={{ width: 0 }}
              animate={{ width: `${completion * 100}%` }}
              style={{ backgroundColor: task.color, filter: `saturate(${saturation}%)` }}
            />
          </div>
        )}

        {/* Sub-menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 flex gap-4 border-t border-white/5 pt-2"
            >
              <button 
                onClick={() => {
                  const newName = prompt('New name:', task.name);
                  if (newName) onUpdate(taskId, { name: newName });
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-1 text-xs text-white/60 hover:text-white"
              >
                <Edit2 size={12} /> Rename
              </button>
              <button 
                onClick={() => {
                   const newColor = prompt('Enter hex color (e.g. #ff0000):', task.color);
                   if (newColor) onUpdate(taskId, { color: newColor });
                   setIsMenuOpen(false);
                }}
                className="flex items-center gap-1 text-xs text-white/60 hover:text-white"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task.color }} /> Color
              </button>
              <button 
                onClick={() => onDelete(taskId)}
                className="flex items-center gap-1 text-xs text-red-400/80 hover:text-red-400 ml-auto"
              >
                <Trash2 size={12} /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && task.childrenIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2"
          >
            {task.childrenIds.map(cid => (
              <TaskItem 
                key={cid}
                taskId={cid}
                tasks={tasks}
                depth={depth + 1}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
