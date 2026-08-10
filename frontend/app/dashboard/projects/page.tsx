"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── TYPES ────────────────────────────────────────────────────────
interface UserProfile {
  email?: string;
  role?: string;
}

interface Project {
  id: number;
  title: string;
  status: string;
  badgeColor: string;
  date: string;
  details: string;
  aiEngine?: 'ChatGPT-4o' | 'Gemini 1.5 Pro' | 'Claude 3.5 Sonnet';
}

// Maps status -> Tailwind badge classes
const getBadgeColor = (status: string) => {
  if (status === "Complete") return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (status === "Action Required") return "text-blue-600 bg-blue-50 border-blue-200";
  return "text-amber-600 bg-amber-50 border-amber-200"; // In Progress / default
};

// Converts raw project object from API into UI format
const mapApiProject = (p: any): Project => ({
  id: p.id,
  title: p.title,
  status: p.status,
  badgeColor: getBadgeColor(p.status),
  date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
  details: p.details,
  aiEngine: p.ai_engine,
});

export default function ProjectsPage() {
  // User profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for showing the detailed project specs modal window
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states for creating a new project track inline
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newEngine, setNewEngine] = useState<'ChatGPT-4o' | 'Gemini 1.5 Pro' | 'Claude 3.5 Sonnet'>('Claude 3.5 Sonnet');

  // Real project data
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  // Fetch user profile and projects on page load
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      setIsLoading(true);

      try {
        // Fetch User Profile
        const profileRes = await fetch("http://localhost:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // Fetch Projects
        const projectsRes = await fetch("http://localhost:8000/api/projects", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setAllProjects(projectsData.map(mapApiProject));
        }
      } catch (err) {
        console.error("Failed to fetch page data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler to provision a new project
  const handleProvisionProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          details: newDetails.trim() || "No customized problem architecture instructions supplied yet.",
          ai_engine: newEngine
        })
      });
      const created = await res.json();
      setAllProjects(prev => [...prev, mapApiProject(created)]);
    } catch (err) {
      console.error("Failed to create project:", err);
    }

    setNewTitle('');
    setNewDetails('');
    setNewEngine('Claude 3.5 Sonnet');
    setIsCreating(false);
  };

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
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 2.654 1.057 5.063 2.769 6.843.048.05.084.111.104.177A11.966 11.966 0 0012 21c2.569 0 4.978-.813 6.953-2.195a.23.23 0 01.1-.114zM12 6.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-base">
                {isLoading ? 'Loading...' : profile?.email || 'No user session'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{profile?.role || ''}</p>
            </div>

            <nav className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard/projects" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800 text-white font-medium text-sm transition-colors">
                Projects
              </Link>
              <Link href="/dashboard/mock-interviews" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                Mock Interviews
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                Profile
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
            
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setIsCreating(!isCreating)}
                className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isCreating ? '✕ Close Form' : '➕ Create New Project'}
              </button>
              <button className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Ask Expert (Paid)
              </button>
            </div>
          </header>

          {/* DYNAMIC FORM DRAWER INLINE PANEL */}
          {isCreating && (
            <form onSubmit={handleProvisionProject} className="bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 border border-slate-800 rounded-xl p-6 shadow-md mb-8 animate-in fade-in slide-in-from-top-4 duration-200 space-y-4 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Configure New Workspace Track</h3>
                <p className="text-xs text-slate-400">Initialize custom prompts and isolate context paths across independent LLM engines.</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-300">Project Track Name</label>
                  <input 
                    type="text" 
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Dynamic Programming & Array Optimization" 
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-300">Default Evaluator Engine API</label>
                  <select 
                    value={newEngine}
                    onChange={(e) => setNewEngine(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
                  >
                    <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Recommended)</option>
                    <option value="ChatGPT-4o">ChatGPT-4o Engine</option>
                    <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-300">Sandbox Structural Details (Optional)</label>
                  <textarea 
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    placeholder="Provide notes on patterns or architectural specifications to focus evaluation workflows..."
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs sm:text-sm h-20 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow transition-colors"
                >
                  Deploy Project Track
                </button>
              </div>
            </form>
          )}

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
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Project {project.id}: {project.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{project.details}</p>
                  
                  <div className="space-y-1.5 mb-4 pt-3 border-t border-slate-100">
                    {project.aiEngine && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">AI Evaluator:</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                          {project.aiEngine}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* ACTION BUTTONS */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setSelectedProject(project)}
                    className="flex-1 py-2 text-center text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View Specs
                  </button>

                  <Link 
                    href={`/dashboard/projects/${project.id}/study?name=${encodeURIComponent(project.title)}&topic=${encodeURIComponent(project.details)}`}
                    className="flex-1 py-2 text-center text-xs font-semibold rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors block"
                  >
                    Study Page
                  </Link>
                  
                  <Link 
                    href={`/dashboard/projects/${project.id}/workspace?name=${encodeURIComponent(`Project ${project.id}: ${project.title}`)}&topic=${encodeURIComponent(project.details)}&engine=${encodeURIComponent(project.aiEngine || 'Gemini 1.5 Pro')}`}
                    className="flex-1 py-2 text-center text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors block"
                  >
                    Open Workspace
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
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">Project {selectedProject.id}: {selectedProject.title}</h2>
              </div>
              <button 
                type="button"
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
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Dismiss Specs
              </button>
              <button type="button" className="px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow transition-colors">
                Save Adjustments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}