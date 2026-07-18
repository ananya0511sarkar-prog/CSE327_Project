"use client";

import { useState, use } from 'react';
import Link from 'next/link';

interface WorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  // Unwrap the dynamic route parameter id safely using React's use() hook
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  // State Management for AI Selection and User Interaction
  const [selectedAI, setSelectedAI] = useState<'ChatGPT' | 'Gemini' | 'Claude'>('Claude');
  const [activeTab, setActiveTab] = useState<'ai-chat' | 'expert-qa' | 'video-call'>('ai-chat');
  const [chatInput, setChatInput] = useState('');
  const [codeSnippet, setCodeSnippet] = useState(`// Project ID: ${projectId}\nfunction optimizePipeline(data) {\n  // Write your interview solution here...\n  return data;\n}`);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* WORKSPACE HEADER BAR */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
            &larr; Back to Projects
          </Link>
          <div className="h-4 w-px bg-slate-800"></div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded border border-blue-500/30">
              Project #{projectId}
            </span>
            Interactive Preparation Workspace
          </h1>
        </div>

        {/* AI ENGINE PICKER SWITCH */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          {(['ChatGPT', 'Gemini', 'Claude'] as const).map((ai) => (
            <button
              key={ai}
              type="button"
              onClick={() => setSelectedAI(ai)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                selectedAI === ai 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ai}
            </button>
          ))}
        </div>
      </header>

      {/* TWO-PANEL WORKSPACE split layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: CODE INTERFACES */}
        <section className="w-1/2 p-4 flex flex-col border-r border-slate-800 bg-slate-950/40">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Coding Sandbox</span>
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> 
              Compiler Sandbox Active
            </span>
          </div>
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            className="flex-1 w-full bg-slate-950 text-slate-300 font-mono text-sm p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed shadow-inner"
          />
        </section>

        {/* RIGHT PANEL: DYNAMIC FEATURE TRACKS */}
        <section className="w-1/2 flex flex-col bg-slate-900">
          
          {/* TAB SEGMENTS LAYER */}
          <div className="flex bg-slate-950/60 border-b border-slate-800 px-4 text-xs">
            <button 
              type="button"
              onClick={() => setActiveTab('ai-chat')}
              className={`py-3 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'ai-chat' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              🤖 {selectedAI} Assistant
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('expert-qa')}
              className={`py-3 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'expert-qa' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              👑 Expert Premium Q&A
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('video-call')}
              className={`py-3 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'video-call' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              📹 Live Video Mock
            </button>
          </div>

          {/* TAB WINDOW CONTENT BOX */}
          <div className="flex-1 p-6 overflow-y-auto">
            
            {/* VIEW A: MULTI-LLM ASSISTANT ENGINE */}
            {activeTab === 'ai-chat' && (
              <div className="h-full flex flex-col justify-between">
                <div className="space-y-4 text-sm">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl max-w-[85%] text-slate-300">
                    Hello John! I am running your code structural diagnostics directly through the <strong className="text-white font-semibold">{selectedAI} API pipeline</strong>. Paste any question parameters or structural errors, and let's optimize it.
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/30 p-4 rounded-xl max-w-[85%] ml-auto text-blue-200 text-right">
                    Can you check if my code safely guards against recursive memory heap overflows?
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Prompt ${selectedAI} engine...`}
                    className="flex-1 bg-slate-950 text-slate-200 text-xs sm:text-sm rounded-lg px-4 border border-slate-800 focus:outline-none focus:border-blue-500/50"
                  />
                  <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow">
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* VIEW B: PAID HUMAN VERIFIED QUESTIONS */}
            {activeTab === 'expert-qa' && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-950 to-slate-950 border border-blue-900/50 rounded-xl">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-1">
                    <span>👑</span> Direct Staff Escalation
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Stuck on advanced system design blockers that AI logic falls flat on? Send complex code architecture paths straight to verified staff reviewers from FAANG companies.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Pricing Tier per Review</span>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">$15.00 / Query</span>
                  </div>
                  <textarea 
                    placeholder="Describe your architecture bottleneck in detail. Staff responses include full diagrams and code reviews inside 12 hours..."
                    className="w-full h-24 bg-slate-900 text-slate-200 rounded-lg p-3 text-xs border border-slate-800 focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                  <button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-md shadow-md transition-colors">
                    Pay $15.00 & Dispatch to Expert
                  </button>
                </div>
              </div>
            )}

            {/* VIEW C: VIDEO MOCK CALL CALL WINDOW */}
            {activeTab === 'video-call' && (
              <div className="space-y-4">
                <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-6 space-y-3 z-10">
                    <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center border border-blue-500/40 text-lg animate-pulse">
                      📹
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Live Mock Video Link Ready</h4>
                      <p className="text-xs text-slate-500 mt-1">Tier 1 Expert: Principal Engineer from Netflix ($75.00 / hr)</p>
                    </div>
                    <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-5 rounded-lg shadow-md transition-all active:scale-95">
                      Launch Video Interface
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 px-2 py-1 rounded text-[10px] text-slate-400 border border-slate-800 z-20">
                    🔴 Standby Mode
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-2 text-slate-400">
                  <p className="font-semibold text-slate-300">Video Call Specifications:</p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>45 minutes interactive whiteboarding execution session.</li>
                    <li>15 minutes exhaustive line-by-line grading and tactical critique.</li>
                    <li>Full dashboard recording uploaded directly into your profile archive.</li>
                  </ul>
                </div>
              </div>
            )}

          </div>
        </section>
      </div>
    </div>
  );
}