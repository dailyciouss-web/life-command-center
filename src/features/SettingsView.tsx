import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { GlassCard } from '../components/GlassCard';
import { Download, Upload, Trash2, ShieldCheck, Heart, Save, RotateCcw, Clock, Shield } from 'lucide-react';
import { format } from 'date-fns';

export const SettingsView: React.FC = () => {
  const { 
    exportData, 
    importData, 
    state, 
    createSnapshot, 
    snapshots, 
    restoreSnapshot, 
    deleteSnapshot 
  } = useAppState();

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
        <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white/40 px-1">Backup & Restore</h3>
        
        <GlassCard className="p-1 divide-y divide-white/5">
          <button 
            onClick={() => createSnapshot()}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-t-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Save size={20} className="text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Create Local Snapshot</p>
                <p className="text-[10px] text-white/40">Manual temporary point-in-time recovery</p>
              </div>
            </div>
            <RotateCcw size={16} className="text-white/20" />
          </button>

          <button 
            onClick={exportData}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Download size={20} className="text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Export JSON Backup</p>
                <p className="text-[10px] text-white/40">Download full database for external storage</p>
              </div>
            </div>
          </button>

          <button 
            onClick={handleImportClick}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Upload size={20} className="text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Import JSON Backup</p>
                <p className="text-[10px] text-white/40">Restore data from an exported file</p>
              </div>
            </div>
          </button>

          <button 
            onClick={handleReset}
            className="w-full flex items-center justify-between p-4 hover:bg-rose-500/5 transition-colors rounded-b-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <Trash2 size={20} className="text-rose-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-rose-400">Wipe All Data</p>
                <p className="text-[10px] text-rose-400/40">Dangerous: Irreversibly clear all local data</p>
              </div>
            </div>
          </button>
        </GlassCard>
      </section>

      {snapshots.length > 0 && (
        <section className="flex flex-col gap-4">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white/40 px-1">Local Snapshots</h3>
          <div className="flex flex-col gap-2">
            {snapshots.map((snap) => (
              <GlassCard key={snap.id} className="p-3 flex items-center justify-between border-white/5">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-white/20" />
                  <div>
                    <p className="text-xs font-bold">{snap.name}</p>
                    <p className="text-[10px] text-white/40 italic">
                      {format(new Date(snap.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => deleteSnapshot(snap.id)}
                    className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors group"
                   >
                     <Trash2 size={14} className="text-white/20 group-hover:text-rose-400" />
                   </button>
                   <button 
                    onClick={() => restoreSnapshot(snap.data)}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                   >
                     Restore
                   </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white/40 px-1">Security Status</h3>
        <GlassCard className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Shield size={16} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold">Auto-Snapshots Active</p>
                <p className="text-[10px] text-white/40 italic">Last snapshot: {state.settings?.lastBackup ? format(new Date(state.settings.lastBackup), 'HH:mm dd/MM') : 'Never'}</p>
              </div>
            </div>
            <div className="w-10 h-5 bg-emerald-500/20 rounded-full border border-emerald-500/50 flex items-center px-1">
               <div className="w-3 h-3 bg-emerald-400 rounded-full ml-auto" />
            </div>
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
              <p className="text-white/40 text-xs">v1.2.0 Stable Build</p>
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
