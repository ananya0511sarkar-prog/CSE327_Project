"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    weeklyReport: false,
    apiKeyVisibility: false,
    defaultAI: 'Claude' as 'ChatGPT' | 'Gemini' | 'Claude',
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard/projects" className="hover:text-white transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-200">Settings</span>
        </div>

        <header>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-xs text-slate-400 mt-1">Configure your code environment workspace preference thresholds.</p>
        </header>

        <hr className="border-slate-800" />

        <div className="space-y-6">
          {/* Section: AI Preferences */}
          <section className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Workspace AI Engine Defaults</h2>
            <p className="text-xs text-slate-500 leading-relaxed">Select the primary model called dynamically when initializing code sandbox execution views.</p>
            
            <div className="flex gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg max-w-sm text-xs">
              {(['ChatGPT', 'Gemini', 'Claude'] as const).map((ai) => (
                <button
                  key={ai}
                  type="button"
                  onClick={() => setSettings({...settings, defaultAI: ai})}
                  className={`flex-1 py-2 rounded-md font-medium transition-all ${settings.defaultAI === ai ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {ai}
                </button>
              ))}
            </div>
          </section>

          {/* Section: Alert Configuration toggles */}
          <section className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Notification Channels</h2>
            
            <div className="space-y-4 divide-y divide-slate-800/60">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Expert Evaluation Alerts</h3>
                  <p className="text-[11px] text-slate-400">Receive dashboard pings when FAANG staff return architectural feedback reviews.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.notifications} 
                  onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500" 
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Weekly Compilation Overviews</h3>
                  <p className="text-[11px] text-slate-400">Get an aggregated digest tracing algorithm progress metrics straight to your email.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.weeklyReport} 
                  onChange={(e) => setSettings({...settings, weeklyReport: e.target.checked})}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500" 
                />
              </div>
            </div>
          </section>

          {/* Section: Security Token / Integration Mock */}
          <section className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Developer Integrations</h2>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-400 uppercase">Workspace Bearer API Pipeline Token</label>
              <div className="flex gap-2">
                <input 
                  type={settings.apiKeyVisibility ? "text" : "password"} 
                  value="sk_live_51Nx90F2v_workspace_sandbox_pipeline_auth" 
                  disabled
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs p-2.5 rounded-lg border-dashed"
                />
                <button 
                  type="button" 
                  onClick={() => setSettings({...settings, apiKeyVisibility: !settings.apiKeyVisibility})}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 rounded-lg border border-slate-700/50 font-medium transition-colors"
                >
                  {settings.apiKeyVisibility ? "Hide" : "Reveal"}
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}