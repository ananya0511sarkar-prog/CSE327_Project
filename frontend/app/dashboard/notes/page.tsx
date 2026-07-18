"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function NotesOCRPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Mock processing simulation for engine visualization
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);
    setExtractedText(null);

    // Simulate OCR Scan pipeline latency
    setTimeout(() => {
      setIsUploading(false);
      setExtractedText(
        `// EXTRACTED TEXT VIA CORE SYSTEM OCR\n` +
        `class SlottedRateLimiter {\n` +
        `    // Parsed from handwritten whiteboard session\n` +
        `    constructor(windowSizeMs, maxRequests) {\n` +
        `        this.windowSizeMs = windowSizeMs;\n` +
        `        this.maxRequests = maxRequests;\n` +
        `        this.buckets = new Map();\n` +
        `    }\n` +
        `}`
      );
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard/projects" className="hover:text-white transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-200">OCR Repository Processing</span>
        </div>

        {/* Page Header */}
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">OCR Note Pipeline</h1>
          <p className="text-sm text-slate-400">Upload static snapshots of diagrams, architectures, or technical whiteboards to convert them to active system notes.</p>
        </header>

        {/* Main Interface Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          
          {/* File Interaction Area */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Document Source</h2>
              
              {/* Drag Drop Input Field Element */}
              <label className="group flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-8 cursor-pointer bg-slate-900/30 hover:bg-slate-950 transition-all relative overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-900 group-hover:bg-blue-600/10 rounded-lg flex items-center justify-center border border-slate-800 mx-auto transition-colors">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <p className="text-xs font-medium text-slate-300">Drop blueprint snapshot or <span className="text-blue-400">browse</span></p>
                  <p className="text-[10px] text-slate-500">Supports PNG, JPG, WebP up to 10MB</p>
                </div>
              </label>

              {fileName && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 truncate max-w-[180px]">{fileName}</span>
                  {isUploading && (
                    <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded animate-pulse font-medium">
                      Processing Matrix...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Machine Output Processing Panel */}
          <div className="md:col-span-3 h-full">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col h-full min-h-[300px]">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Parser Output Workspace</h2>
                {extractedText && (
                  <button 
                    onClick={() => navigator.clipboard.writeText(extractedText)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md transition-colors"
                  >
                    Copy String
                  </button>
                )}
              </div>

              <div className="flex-1 bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-auto max-h-[350px] relative">
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                    <div className="space-y-2 text-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-[11px] text-slate-500 tracking-wide">Executing OCR Neural Inference...</p>
                    </div>
                  </div>
                ) : extractedText ? (
                  <pre className="whitespace-pre-wrap leading-relaxed text-slate-300">{extractedText}</pre>
                ) : (
                  <p className="text-slate-600 italic text-center pt-12">No document buffered. Initialize a manual upload sequence to target layout parser metrics.</p>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}