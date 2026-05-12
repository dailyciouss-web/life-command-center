import { Task } from '../../types';

export const getTaskCompletion = (taskId: string, tasks: Record<string, Task>): number => {
  const task = tasks[taskId];
  if (!task) return 0;
  
  if (task.childrenIds.length === 0) {
    return task.isCompleted ? 1 : 0;
  }
  
  const totalWeight = task.childrenIds.length;
  const completedWeight = task.childrenIds.reduce((acc, cid) => {
    return acc + getTaskCompletion(cid, tasks);
  }, 0);
  
  return completedWeight / totalWeight;
};

export const getIntensityColor = (baseColor: string, completion: number): string => {
  return baseColor;
};

export const hexToHue = (hex: string): number => {
  // Simple hex to hue conversion for common colors
  // Default to 220 (Indigo) if not found
  const colors: Record<string, number> = {
    '#3b82f6': 220, // Blue
    '#10b981': 160, // Green
    '#f59e0b': 40,  // Amber
    '#ef4444': 0,   // Red
    '#8b5cf6': 260, // Purple
    '#ec4899': 330, // Pink
  };
  return colors[hex] || 220;
};

