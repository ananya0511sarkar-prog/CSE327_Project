"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@developer.com',
    role: 'Full Stack Engineer',
    company: 'Seeking New Opportunities',
    github: 'github.com/johndoe',
    bio: 'Passionate about distributed systems, concurrent programming, and optimizing pipeline infrastructure.',
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard/projects" className="hover:text-white transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-200">Profile</span>
        </div>

        {/* Profile Card Header */}
        <header className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md">
            {profile.name.charAt(0)}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
            <p className="text-sm text-blue-400 font-medium">{profile.role} • <span className="text-slate-400">{profile.company}</span></p>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">{profile.bio}</p>
          </div>
        </header>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Account Details Form */}
          <section className="md:col-span-2 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Personal Details</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400 uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={profile.email}
                  disabled
                  className="w-full bg-slate-900/50 border border-slate-800/60 rounded-lg p-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400 uppercase">Target Role</label>
                <input 
                  type="text" 
                  value={profile.role}
                  onChange={(e) => setProfile({...profile, role: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400 uppercase">GitHub Profile</label>
                <input 
                  type="text" 
                  value={profile.github}
                  onChange={(e) => setProfile({...profile, github: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[11px] font-medium text-slate-400 uppercase">Bio</label>
              <textarea 
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-md transition-all">
                Save Profile Changes
              </button>
            </div>
          </section>

          {/* Performance Summary Sidebar */}
          <section className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Prep Statistics</h2>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 border border-slate-800/60 rounded-xl flex justify-between items-center">
                <span className="text-xs text-slate-400">Mock Sessions Executed</span>
                <span className="text-sm font-bold text-blue-400">14</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800/60 rounded-xl flex justify-between items-center">
                <span className="text-xs text-slate-400">Expert Code Reviews</span>
                <span className="text-sm font-bold text-emerald-400">3</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800/60 rounded-xl flex justify-between items-center">
                <span className="text-xs text-slate-400">Avg. Diagnostic Score</span>
                <span className="text-sm font-bold text-purple-400">88%</span>
              </div>
            </div>

            <div className="p-4 bg-linear-to-br from-blue-950/50 to-slate-950 border border-blue-900/30 rounded-xl text-center space-y-2">
              <p className="text-[11px] text-blue-300 font-medium">Ready for live assessments?</p>
              <Link href="/dashboard/workspace" className="inline-block bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-semibold py-1.5 px-3 rounded transition-colors">
                Launch Workspace
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}