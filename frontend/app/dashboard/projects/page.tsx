"use client";

import { useState } from 'react';
import Link from 'next/link';

// Types definition for our integrated feature set
interface Project {
  id: number;
  title: string;
  status: string;
  badgeColor: string;
  date: string;
  details: string;
  aiEngine?: 'ChatGPT-4o' | 'Gemini 1.5 Pro' | 'Claude 3.5 Sonnet';
  expertSession?: {
    type: 'Paid Q&A' | 'Video Mock Interview';
    status: 'Scheduled' | 'Pending Payment' | 'Completed';
    cost?: string;
    dateText?: string;
  };
}

export default function ProjectsPage() {
  // Manage Active State for the "View Specs" Modal Window
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Core Data Stack representing your platforms pipelines
  const [allProjects, setAllProjects] = useState<Project[]>([
    { 
      id: 1, 
      title: "Project 1: FAANG Coding Challenges", 
      status: "Complete", 
      badgeColor: "text-emerald-600 bg-emerald-50 border-emerald-200", 
      date: "June 12, 2026", 
      details: "LeetCode patterns, graph traversals, and algorithmic problem-solving paradigms for tier-1 tech companies.",
      aiEngine: "Claude 3.5 Sonnet"
    },
    { 
      id: 2, 
      title: "Project 2: System Design for Scale", 
      status: "Complete", 
      badgeColor: "text-emerald-600 bg-emerald-50 border-emerald-200", 
      date: "June 08, 2026", 
      details: "Architecting rate limiters, distributed caching layers, data sharding strategies, and load balancing mechanics.",
      aiEngine: "ChatGPT-4o"
    },
    { 
      id: 3, 
      title: "Project 3: Behavioral Questions Practice", 
      status: "In Progress", 
      badgeColor: "text-amber-600 bg-amber-50 border-amber-200", 
      date: "Started Yesterday", 
      details: "Formulating STAR method responses for leadership, conflict resolution, and complex engineering challenges.",
      aiEngine: "Gemini 1.5 Pro",
      expertSession: {
        type: "Paid Q&A",
        status: "Completed",
        cost: "$15.00"
      }
    },
    { 
      id: 4, 
      title: "Project 4: Executive Mock Interview Session", 
      status: "Action Required", 
      badgeColor: "text-blue-600 bg-blue-50 border-blue-200", 
      date: "Scheduled", 
      details: "Live system architecture mapping breakdown session with a Principal Engineer from Netflix.",
      expertSession: {
        type: "Video Mock Interview",
        status: "Scheduled",
        cost: "$75.00",
        dateText: "Tomorrow at 4:00 PM (GMT+6)"
      }
    }
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative">
      <div className="flex flex-1">
        
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 px-2 py-4 text-white text-xl font-bold tracking-tight">
              <span className="text-blue-500 text-2xl font-black">X</span> InterviewX
            </div>
            
            {/* User Account Capsule */}
            <div className="flex flex-col items-center text-center my-6 border-b border-slate-800 pb-6">
              <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-3 overflow-hidden border-2 border-slate-600">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 2.654 1.057 5.063 2.769 6.843.048.05.084.111.104.177A11.966 11.966 0 0012 21c2.569 0 4.978-.813 6.953-2.195a.23.23 0 01.1-.114zM12 6.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5z" clipRule="evenodd" /></svg>
              </div>
              <h3 className="text-white font-semibold text-base">John Doe</h3>
              <p className="text-xs text-slate-500 mt-0.5">Aspiring Software Engineer</p>
            </div>

            {/* Sidebar Navigation Paths */}
            <nav className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
                Dashboard
              </Link>
              <Link href="/dashboard/projects" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800 text-white font-medium text-sm transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                Projects
              </Link>
            </nav>
          </div>
          
          <button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
            Log Out
          </button>
        </aside>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-8 overflow-y-auto">
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Interview Projects</h1>
              <p className="text-slate-500 text-sm mt-1">Deploy LLM-powered engine configurations or upgrade to live Human Specialist review.</p>
            </div>
            
            {/* Quick Action Premium Hooks */}
            <div className="flex gap-2">
              <button className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Ask Expert (Paid)
              </button>
              <button className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
                📹 Book Video Mock
              </button>
            </div>
          </header>

          {/* PROJECT DEPLOYMENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allProjects.map((project) => (
              <div key={project.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${project.badgeColor}`}>
                      {project.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{project.date}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{project.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{project.details}</p>
                  
                  {/* METADATA TARGET API PIPELINES */}
                  <div className="space-y-1.5 mb-4 pt-3 border-t border-slate-100">
                    {project.aiEngine && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">AI Evaluator:</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                          {project.aiEngine}
                        </span>
                      </div>
                    )}
                    
                    {project.expertSession && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">Human Specialist:</span>
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-medium">
                          {project.expertSession.type} ({project.expertSession.status})
                        </span>
                        {project.expertSession.dateText && (
                          <span className="text-slate-500 italic text-[11px] ml-1">
                            {project.expertSession.dateText}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* INTERACTIVE ACTIONS HUB */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setSelectedProject(project)}
                    className="flex-1 py-2 text-center text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View Specs
                  </button>
                  
                  <Link 
                    href={`/dashboard/projects/${project.id}/workspace`}
                    className="flex-1 py-2 text-center text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors block"
                  >
                    {project.expertSession?.type === "Video Mock Interview" ? "Join Video Call" : "Open Workspace"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* FOOTER GLOBAL BAR */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs space-y-2">
        <div className="flex justify-center gap-6 text-slate-300">
          <Link href="#" className="hover:text-white transition-colors">About Us</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
        </div>
        <div>Copyright © 2026 <span className="text-slate-300 font-medium">Interview Prep Platform</span>.</div>
      </footer>

      {/* SPECS OVERLAY MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-blue-600">Project Configuration Specification</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{selectedProject.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-semibold px-2 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-4 text-sm text-slate-600 leading-relaxed">
              <p>{selectedProject.details}</p>
              
              <div className="bg-slate-50 rounded-lg p-4 space-y-2.5 border border-slate-100">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Integrated Target APIs</h4>
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
                  <div className={`p-2 rounded border ${selectedProject.aiEngine === 'ChatGPT-4o' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-white text-slate-400 border-slate-200'}`}>
                    ChatGPT-4o
                  </div>
                  <div className={`p-2 rounded border ${selectedProject.aiEngine === 'Gemini 1.5 Pro' ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold' : 'bg-white text-slate-400 border-slate-200'}`}>
                    Gemini 1.5
                  </div>
                  <div className={`p-2 rounded border ${selectedProject.aiEngine === 'Claude 3.5 Sonnet' ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold' : 'bg-white text-slate-400 border-slate-200'}`}>
                    Claude 3.5
                  </div>
                </div>
              </div>

              {/* Specialist Integration Parameters */}
              <div className="p-4 rounded-lg border border-slate-100 bg-blue-50/40 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Expert Verification Stream</h4>
                {selectedProject.expertSession ? (
                  <div className="text-xs space-y-1">
                    <p><span className="font-semibold text-slate-700">Type:</span> {selectedProject.expertSession.type}</p>
                    <p><span className="font-semibold text-slate-700">Billing Tiers:</span> Premium Verified ({selectedProject.expertSession.cost})</p>
                    <p><span className="font-semibold text-slate-700">Pipeline Status:</span> <span className="font-medium text-blue-700">{selectedProject.expertSession.status}</span></p>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 italic">No human expert attached to this track yet.</span>
                    <button className="text-blue-600 font-bold hover:underline">Add Premium Review</button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Dismiss Specs
              </button>
              <button className="px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow transition-colors">
                Save Adjustments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}