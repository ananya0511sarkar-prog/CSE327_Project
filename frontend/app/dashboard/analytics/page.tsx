"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function AnalyticsPage() {
  // Mock data for analytics
  const [stats] = useState({
    globalPercentile: 92,
    rank: "142 / 2,450",
    avgSolveTime: "24m 12s",
    peerAvgTime: "31m 45s",
    accuracy: 88,
    peerAccuracy: 74,
    categories: [
      { name: "System Design", score: 94, percentile: 96 },
      { name: "Algorithms & Data Structures", score: 85, percentile: 88 },
      { name: "Concurrency & OS", score: 89, percentile: 93 },
      { name: "Database Optimization", score: 82, percentile: 79 },
    ]
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard/projects" className="hover:text-white transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-200">Performance Analytics</span>
        </div>

        {/* Page Header */}
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Performance Workspace</h1>
          <p className="text-sm text-slate-400">Real-time benchmark comparison against thousands of platform candidates.</p>
        </header>

        {/* Top Level Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl"></div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Global Percentile</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black text-purple-400">{stats.globalPercentile}th</span>
              <span className="text-xs text-emerald-400 font-medium">Top 8%</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Global Leaderboard Rank</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-blue-400">#{stats.rank.split(" ")[0]}</span>
              <span className="text-xs text-slate-500">out of {stats.rank.split(" ")[2]}</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Accuracy vs Peer Avg</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black text-emerald-400">{stats.accuracy}%</span>
              <span className="text-xs text-slate-400">vs {stats.peerAccuracy}% avg</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl"></div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Solve Speed</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-amber-400">{stats.avgSolveTime.split(" ")[0]}</span>
              <span className="text-xs text-emerald-400 font-medium">23% faster than peers</span>
            </div>
          </div>

        </div>

        {/* Detailed Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Component Category Mastery Matrix */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white">Domain-Specific Performance</h2>
              <p className="text-xs text-slate-400">Your core technical proficiencies calibrated against active peer cohorts.</p>
            </div>

            <div className="space-y-4">
              {stats.categories.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="text-slate-400">Score: <strong className="text-blue-400">{cat.score}%</strong> • Percentile: <strong className="text-purple-400">{cat.percentile}th</strong></span>
                  </div>
                  {/* Custom Track Bar */}
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/60">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-500 rounded-full transition-all duration-500" 
                      style={{ width: `${cat.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Distribution insights */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">Percentile Insights</h2>
              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                <p>
                  🎯 You run <span className="text-blue-400 font-semibold">7m 33s faster</span> than the global dynamic baseline on concurrent programming matrices.
                </p>
                <p>
                  📈 Your runtime optimizations scored higher than <span className="text-purple-400 font-semibold">96%</span> of developers this week.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-900 mt-4">
              <Link href="/dashboard/workspace" className="w-full block text-center bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-semibold py-2.5 rounded-lg transition-colors">
                Practice Target Weaknesses
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}