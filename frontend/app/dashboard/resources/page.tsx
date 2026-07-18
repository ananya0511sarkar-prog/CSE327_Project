"use client";

import Link from 'next/link';

export default function ResourcesPage() {
  const specializedTracks = [
    { title: 'Concurrent Memory Architectures', level: 'Advanced', duration: '45 mins', badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { title: 'Designing Safe Recurrent Pipelines', level: 'Expert', duration: '60 mins', badgeColor: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { title: 'Asynchronous Event Looping Isolation', level: 'Intermediate', duration: '30 mins', badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard/projects" className="hover:text-white transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-200">Preparation Resources</span>
        </div>

        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">System Curriculum & Reference Packs</h1>
            <p className="text-xs text-slate-400 mt-1">Exhaustive theoretical paths built to augment automated AI design evaluations.</p>
          </div>
          <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-medium self-start sm:self-center">
            ✓ Sandbox Access Premium Validated
          </div>
        </header>

        <hr className="border-slate-800" />

        {/* Main Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Large Column: Curated Syllabus Lists */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Specialized Interactive Tracks</h2>
            
            <div className="space-y-4">
              {specializedTracks.map((track, i) => (
                <div key={i} className="p-5 bg-slate-950 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm group">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${track.badgeColor}`}>
                        {track.level}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">🕒 {track.duration}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{track.title}</h3>
                  </div>
                  <button className="bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white font-medium text-xs py-2 px-4 rounded-lg border border-slate-800 group-hover:border-blue-500 shadow-inner transition-all self-start sm:self-center">
                    Launch Sandbox Guide
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Smaller Column: System Documentation Utilities */}
          <div className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">System Architecture Manuals</h2>
            
            <div className="bg-linear-to-br from-slate-950 to-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-md">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Heap Memory Overflow Blueprint</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Deep analysis manual targeted at evaluating multi-threaded recursion boundaries. Critical checklist preparation text before jumping on live video expert runs.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/50 text-[11px] font-mono text-blue-300">
                // System Diagnostics Spec v4.12 <br />
                # Runtime Guardrails Active
              </div>

              <a 
                href="#download-doc"
                className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-lg shadow transition-all"
              >
                Download Documentation Pack (.PDF)
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}