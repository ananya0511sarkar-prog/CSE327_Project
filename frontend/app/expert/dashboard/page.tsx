"use client";

import { useState } from 'react';

// Basic shadcn primitives
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ExpertDashboard() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleLogout = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      
      {/* 1. TOP NAVBAR */}
      <header className="max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800 mb-8">
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">EXPERT CONSOLE</Badge>
          <span className="text-sm font-semibold text-slate-400">| Reviewer Portal</span>
        </div>
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs"
        >
          Log Out
        </Button>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        
        {/* 2. FINANCES OVERVIEW */}
        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Finances This Month</p>
              <h2 className="text-3xl font-black text-white mt-1">$1,245.00</h2>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Pending Payouts</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">$90.00</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Cleared Funds</span>
                <span className="font-bold text-slate-300 mt-0.5 block">$1,155.00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. TWO-COLUMN CONTENT SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: SUBMIT QUESTIONS FORM */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Curriculum Contribution</h3>
            
            <Card className="bg-slate-950 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-white">Publish New Interview Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Title Input */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Challenge Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Memory Boundary Analysis"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {/* Description Input */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Problem Statement & Constraints</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe specific engineering failure cases candidates should code safely against..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4">
                    Publish to Sandbox Pool
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLUMN 2: SCHEDULED MEETINGS LIST */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Scheduled Live Mocks</h3>
            
            <Card className="bg-gradient-to-br from-slate-950 to-slate-900 border-slate-800">
              <CardContent className="p-4 space-y-3">
                {/* Single Scheduled Item Box */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-blue-400 font-bold font-mono">TODAY @ 14:00 UTC</span>
                    <Badge variant="destructive" className="h-4 text-[9px] uppercase font-bold bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/20">
                      Live Room Ready
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-white">45-min Whiteboarding Session</h4>
                  <p className="text-[11px] text-slate-400">Candidate: Marcus Vance</p>
                  <Button size="sm" className="w-full mt-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                    Launch Video Interface
                  </Button>
                </div>

                {/* Placeholder for future item */}
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/40 opacity-50 text-[11px]">
                  <span className="text-slate-500 block font-mono">TOMORROW @ 17:30 UTC</span>
                  <span className="text-slate-300 font-medium">System Architecture Review</span>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}