import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { GlassCard } from '../components/GlassCard';
import { Download, Upload, Trash2, Github, ShieldCheck, Heart } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { exportData, importData, setState } = useAppState();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            importData(event.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight uppercase">System Settings</h1>
        <p className="text-white/50 text-[10px] tracking-widest uppercase">Data & Preferences</p>
      </header>

      <section className="flex flex-col gap-4">
        <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white/40 px-1">Data Management</h3>
        
        <GlassCard className="divide-y divide-white/5">
          <button 
            onClick={exportData}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download size={20} className="text-indigo-400" />
              <div className="text-left">
                <p className="text-sm font-medium">Export Backup</p>
                <p className="text-[10px] text-white/40">Save your data as a JSON file</p>
              </div>
            </div>
          </button>

          <button 
            onClick={handleImportClick}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Upload size={20} className="text-emerald-400" />
              <div className="text-left">
                <p className="text-sm font-medium">Import Backup</p>
                <p className="text-[10px] text-white/40">Restore data from a JSON file</p>
              </div>
            </div>
          </button>

          <button 
            onClick={handleReset}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={20} className="text-rose-400" />
              <div className="text-left">
                <p className="text-sm font-medium">Reset All Data</p>
                <p className="text-[10px] text-white/40">Wipe all local storage and start over</p>
              </div>
            </div>
          </button>
        </GlassCard>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white/40 px-1">About</h3>
        <GlassCard className="p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative shadow-2xl">
              <ShieldCheck size={40} className="text-white" />
              <div className="absolute -inset-2 bg-indigo-500/20 blur-xl rounded-full -z-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Life Command Center</h2>
              <p className="text-white/40 text-xs">v1.0.0 Alpha</p>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-[240px]">
              A premium personal organizer designed for efficiency and aesthetic satisfaction.
            </p>
            <div className="flex items-center gap-1 text-[10px] text-white/20 uppercase tracking-widest mt-4">
              Made with <Heart size={10} className="text-rose-400" /> for organizers
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};
