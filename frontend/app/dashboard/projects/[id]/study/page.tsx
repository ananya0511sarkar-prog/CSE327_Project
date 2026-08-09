"use client";

import { useState, use, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface StudyWorkspaceProps {
  params: Promise<{ id: string }>;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  aiUsed?: 'ChatGPT' | 'Gemini' | 'Claude';
  timestamp: Date;
}

interface StudyDocument {
  id: number;
  name: string;
  pages: number;
  content: string;
   // NEW: fallback images for pages that had unreliable text extraction —
  // returned by the backend alongside content.
  page_images?: { page: number; image_base64: string }[];
}


// === FIX 2: saved summaries/flashcards persistence ===
// Shape returned by GET /study/saved-items — one saved summarize/explain/
// questions result from the DB.
interface SavedItem {
  id: number;
  document_name?: string;
  action_type: string;
  engine: string;
  snippet_text: string;
  ai_reply: string;
  created_at: string;
}

type SelectionMode = 'text' | 'crop';
type AIAction = 'summarize' | 'explain' | 'questions';

export default function StudyPage({ params }: StudyWorkspaceProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const searchParams = useSearchParams();
  const projectName = searchParams.get('name') || `Project Track #${projectId}`;
  const incomingEngine = searchParams.get('engine') || 'Claude';



  const initialAISelection = incomingEngine.includes('Gemini')
    ? 'Gemini'
    : incomingEngine.includes('ChatGPT')
      ? 'ChatGPT'
      : 'Claude';

  // --- WORKSPACE STATES ---
  const [selectedAI, setSelectedAI] = useState<'ChatGPT' | 'Gemini' | 'Claude'>(initialAISelection);
  const [activeTab, setActiveTab] = useState<'ai-chat' | 'expert-qa' | 'notes'>('ai-chat');

  // CHANGED: Document list now starts EMPTY instead of seeded with 2 fake PDFs.
  // Real documents will only appear once the user uploads one (or once we wire up
  // fetching saved documents from Neon in the next step).
  const [documents, setDocuments] = useState<StudyDocument[]>([]);

  // CHANGED: activeDocument can now be null (no document selected yet), instead of
  // being force-set to documents[0] which crashed/faked data when the list was empty.
  const [activeDocument, setActiveDocument] = useState<StudyDocument | null>(null);

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('text');

  // CHANGED: No longer pre-seeded with the fake "Index-based lookup..." sentence.
  // Highlights now only appear once the user actually selects/crops real text.
  const [highlights, setHighlights] = useState<string[]>([]);

  // CHANGED: No longer pre-filled with fake snippet text — starts blank until
  // the user selects or crops something themselves.
  const [activeSnippet, setActiveSnippet] = useState<string>('');

  // Crop Region States
  const viewerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // AI Processing States
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [aiOutput, setAiOutput] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // === FIX 2: saved summaries/flashcards persistence ===
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoadingSavedItems, setIsLoadingSavedItems] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping, isProcessingAction]);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        aiUsed: selectedAI,
        text: `Welcome to the Study Interface for "${projectName}". Upload a document on the left, then select or crop text and use the AI actions on the right to summarize, explain, or generate quizzes.`,
        timestamp: new Date()
      }
    ]);
  }, [projectName, selectedAI]);


  // === FIX 2: saved summaries/flashcards persistence ===
// Loads previously saved summarize/explain/questions results from the DB
// as soon as the Study page opens. This is what makes the Notes tab
// survive a refresh or a logout -> login: it's reading from the server,
// not from local component state that resets on unmount.
useEffect(() => {
  const loadSavedItems = async () => {
    setIsLoadingSavedItems(true);
    try {
      const res = await fetch(`http://localhost:8000/api/projects/${projectId}/study/saved-items`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedItems(data);
      }
    } catch (err) {
      console.error("Failed to load saved study items:", err);
    } finally {
      setIsLoadingSavedItems(false);
    }
  };
  loadSavedItems();
}, [projectId]);

// --- HANDLER: UPLOAD DOCUMENT ---
// CHANGED: no longer reads the raw file locally with FileReader.readAsText().
// That was dumping raw PDF binary bytes (%PDF-1.5, stream, endobj...) straight
// into the viewer, which is the garbage text you were seeing.
// Now this POSTs the actual file to the FastAPI backend, which uses pdfplumber
// to properly extract clean text server-side, then we use THAT response
// to populate the document — not the raw file.
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Build multipart form data — matches FastAPI's `file: UploadFile = File(...)` param
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      `http://localhost:8000/api/projects/${projectId}/study/upload-document`,
      {
        method: "POST",
        body: formData,
        // NOTE: do NOT manually set Content-Type here — the browser sets the
        // correct multipart/form-data boundary automatically when using FormData.
      }
    );

    const data = await response.json();

    if (data.success) {
      // Use the backend's cleanly-extracted content, id, and page count —
      // not anything read locally from the raw file.
      const newDoc: StudyDocument = {
        id: data.document.id,
        name: data.document.name,
        pages: data.document.pages,
        content: data.document.content,
        // NEW: carry the page-image fallbacks through to the viewer
        page_images: data.document.page_images || []
      };
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocument(newDoc);
    } else {
      console.error("Upload failed:", data.error);
      alert(`Upload failed: ${data.error || "Unknown error"}`);
    }
  } catch (err: any) {
    console.error("Upload error:", err);
    alert(`Upload error: ${err.message || "Failed to reach backend server."}`);
  }

  e.target.value = '';
};

  // --- HANDLER: TEXT HIGHLIGHT CAPTURE ---
  const handleTextSelection = () => {
    if (selectionMode !== 'text') return;
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText && selectedText.length > 0) {
      setActiveSnippet(selectedText);
      setHighlights(prev => Array.from(new Set([...prev, selectedText])));
    }
  };

  // --- HELPER: EXTRACT TEXT WITHIN CROP BOX COORDINATES ---
  const extractTextFromCropBox = (box: { x: number; y: number; width: number; height: number }) => {
    if (!viewerRef.current) return '';
    const viewerRect = viewerRef.current.getBoundingClientRect();
    const cropRect = {
      left: viewerRect.left + box.x,
      top: viewerRect.top + box.y,
      right: viewerRect.left + box.x + box.width,
      bottom: viewerRect.top + box.y + box.height,
    };

    const extractedChars: string[] = [];
    const walker = document.createTreeWalker(viewerRef.current, NodeFilter.SHOW_TEXT, null);

    let node: Node | null = walker.nextNode();
    while (node) {
      const textNode = node as Text;
      const text = textNode.nodeValue || '';
      if (text.trim().length > 0) {
        const range = document.createRange();
        for (let i = 0; i < text.length; i++) {
          range.setStart(textNode, i);
          range.setEnd(textNode, i + 1);
          const rRect = range.getBoundingClientRect();
          if (
            rRect.left >= cropRect.left - 4 &&
            rRect.right <= cropRect.right + 4 &&
            rRect.top >= cropRect.top - 4 &&
            rRect.bottom <= cropRect.bottom + 4
          ) {
            extractedChars.push(text[i]);
          }
        }
      }
      node = walker.nextNode();
    }

    return extractedChars.join('').replace(/\s+/g, ' ').trim();
  };

  // --- HANDLERS: CROP AREA SELECTION ---
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectionMode !== 'crop' || !viewerRef.current) return;
    const rect = viewerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setCropBox({ x, y, width: 0, height: 0 });
    setIsCropping(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !startPos || !viewerRef.current) return;
    const rect = viewerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setCropBox({
      x: Math.min(startPos.x, currentX),
      y: Math.min(startPos.y, currentY),
      width: Math.abs(currentX - startPos.x),
      height: Math.abs(currentY - startPos.y)
    });
  };

  const handleMouseUp = () => {
    if (!isCropping) return;
    setIsCropping(false);
    if (cropBox && cropBox.width > 15 && cropBox.height > 15) {
      const extractedText = extractTextFromCropBox(cropBox);
      if (extractedText) {
        setActiveSnippet(extractedText);
        setHighlights(prev => Array.from(new Set([...prev, extractedText])));
      } else {
        setActiveSnippet(`[Cropped Box Region: ${Math.round(cropBox.width)}px x ${Math.round(cropBox.height)}px]`);
      }
    }
  };

  // --- RENDERER: HIGHLIGHT TEXT IN CONTENT ---
  const renderHighlightedContent = (content: string) => {
    if (!highlights.length) return content;

    const escaped = highlights
      .filter(h => h.trim().length > 0)
      .map(h => h.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

    if (!escaped.length) return content;

    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = content.split(regex);

    return parts.map((part, idx) => {
      const isMatch = highlights.some(h => h.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark key={idx} className="bg-amber-300 text-slate-950 font-medium px-1 py-0.5 rounded shadow-sm">
            {part}
          </mark>
        );
      }
      return part;
    });
  };
  

 // NEW: splits content on the [[PAGE_IMAGE:N]] marker tokens the backend
  // inserts for unreliable-text pages, and renders an actual <img> in place
  // of each token instead of ever showing raw garbled (cid:N) text.
  const renderContentWithImages = (content: string, pageImages: { page: number; image_base64: string }[] = []) => {
    const parts = content.split(/\[\[PAGE_IMAGE:(\d+)\]\]/g);
    return parts.map((part, idx) => {
      const isPageNumber = idx % 2 === 1;
      if (isPageNumber) {
        const pageNum = Number(part);
        const match = pageImages.find(p => p.page === pageNum);
        if (!match) return null;
        return (
          <div key={`img-${idx}`} className="my-4 border border-slate-800 rounded-lg overflow-hidden">
            <div className="text-[10px] text-slate-500 px-2 py-1 bg-slate-900 border-b border-slate-800">
              Page {pageNum}
            </div>
            <img
              src={`data:image/png;base64,${match.image_base64}`}
              alt={`Page ${pageNum}`}
              className="w-full h-auto"
            />
          </div>
        );
      }
      return <span key={`text-${idx}`}>{renderHighlightedContent(part)}</span>;
    });
  };


  // --- HANDLER: RUN AI ACTION ON CAPTURED SNIPPET ---
  const handleRunAiAction = async (action: AIAction) => {
    // CHANGED: guard against activeDocument being null now that there's no default doc.
    if (!activeSnippet.trim() || isProcessingAction || !activeDocument) return;

    setActiveAction(action);
    setIsProcessingAction(true);
    setAiOutput('');

    try {
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/study/process-snippet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: selectedAI,
          action: action,
          snippet: activeSnippet,
          document_name: activeDocument.name,
          project_id: projectId
        })
      });

      const data = await response.json();

      if (data.success) {
        setAiOutput(data.result);

                // === FIX 2: saved summaries/flashcards persistence ===
        // Push this result straight into the saved list so it shows up in
        // "Saved Summaries & Flashcards" immediately — it's already
        // persisted server-side (process-snippet just saved it and handed
        // back its id/created_at), this just keeps the UI in sync without
        // a full refetch.
        setSavedItems(prev => [{
          id: data.action_id,
          document_name: activeDocument.name,
          action_type: action,
          engine: selectedAI,
          snippet_text: activeSnippet,
          ai_reply: data.result,
          created_at: data.created_at
        }, ...prev]);

      } else {
        throw new Error(data.error || "Failed to process snippet.");
      }
    } catch (err: any) {
      // CHANGED: removed the three canned fake outputs (summarize/explain/questions)
      // that used to silently pretend the AI call succeeded. Now a failed call shows
      // a real error to the user instead of misleading fabricated text.
      console.error(err);
      setAiOutput(`⚠️ Error: ${err.message || "Failed to process snippet. Please try again."}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // --- HANDLER: CHAT MESSAGE ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;

    const userText = chatInput;
    setChatInput('');

    setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'user', text: userText, timestamp: new Date() }]);
    setIsAiTyping(true);

    try {
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: selectedAI,
          message: userText,
          code_context: activeSnippet,
          question_metadata: {
            // CHANGED: activeDocument can be null now, so this no longer assumes
            // a document is always selected.
            title: `Document Context: ${activeDocument ? activeDocument.name : 'No document selected'}`,
            difficulty: 'Medium'
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: Math.random().toString(),
          sender: 'ai',
          aiUsed: selectedAI,
          text: data.reply,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(data.reply || data.error || "Failed to receive message.");
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        aiUsed: selectedAI,
        text: `⚠️ Error: ${error.message || "Failed to resolve connection to backend server."}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(aiOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">

      {/* HIDDEN FILE INPUT */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.txt,.doc,.docx,.pptx"
        className="hidden"
      />

      {/* HEADER BAR */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/projects/${projectId}/workspace`} className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
            &larr; Back to Workspace
          </Link>
          <div className="h-4 w-px bg-slate-800"></div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded border border-blue-500/30">
              {projectName}
            </span>
            AI Study Workspace
          </h1>
        </div>

        {/* CONTROLS & AI ENGINE TOGGLES */}
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            {(['ChatGPT', 'Gemini', 'Claude'] as const).map((ai) => (
              <button
                key={ai}
                type="button"
                onClick={() => setSelectedAI(ai)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  selectedAI === ai ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ai}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 2-PANEL SPLIT WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL: UPLOADED DOCUMENTS & INTERACTIVE READER */}
        <section className="w-1/2 p-4 flex flex-col border-r border-slate-800 bg-slate-950/40 overflow-y-auto">
          
          {/* Document Controls Header */}
          <div className="flex items-center justify-between mb-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium pl-1">Document:</span>
              {/* CHANGED: dropdown only renders once there's at least one real document.
                  Previously this assumed documents[0] always existed. */}
              {documents.length > 0 ? (
                <select
                  value={activeDocument?.id}
                  onChange={(e) => {
                    const doc = documents.find(d => d.id === Number(e.target.value));
                    if (doc) setActiveDocument(doc);
                  }}
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50"
                >
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.pages} pgs)
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-600 italic">No documents uploaded yet</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode('text');
                    setCropBox(null);
                  }}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    selectionMode === 'text' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Highlight Text
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('crop')}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    selectionMode === 'crop' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Crop Area
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 border border-purple-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                + Upload PDF
              </button>
            </div>
          </div>

          {/* Reader Display */}
          <div
            ref={viewerRef}
            onMouseUp={selectionMode === 'text' ? handleTextSelection : handleMouseUp}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            className={`relative flex-1 bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm overflow-y-auto selection:bg-amber-300 selection:text-slate-950 ${
              selectionMode === 'crop' ? 'cursor-crosshair select-none' : 'cursor-text select-text'
            }`}
          >
            {/* Visual Drag Box for Crop Mode */}
            {selectionMode === 'crop' && cropBox && (
              <div
                className="absolute border-2 border-dashed border-blue-400 bg-blue-500/20 pointer-events-none rounded z-10"
                style={{
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`
                }}
              />
            )}

            {/* CHANGED: this whole block is now conditional on activeDocument existing.
                Previously it assumed activeDocument was always set (from the fake seed data)
                and also included a hardcoded "Click to Capture Snippet" demo box with a
                fake sentence baked into its onClick — that box has been deleted entirely. */}
            {activeDocument ? (
              <>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-900 text-xs text-slate-500">
                  <span>Viewer: {activeDocument.name}</span>
                  <span className="capitalize">Mode: {selectionMode} Selection</span>
                </div>

               <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  <div className="whitespace-pre-wrap">
                    {renderContentWithImages(activeDocument.content, activeDocument.page_images)}
                  </div>
                </div>
              </>
            ) : (
              // CHANGED: new empty-state placeholder shown until a real document is uploaded.
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 text-xs gap-2">
                <p>No document uploaded yet.</p>
                <p>Click "+ Upload PDF" above to get started.</p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL: AI STUDY COMPANION & ACTION ENGINE */}
        <section className="w-1/2 flex flex-col bg-slate-900">

          {/* Navigation Tabs */}
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
              onClick={() => setActiveTab('notes')}
              className={`py-3 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'notes' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              📝 Saved Summaries & Flashcards
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between min-h-0">
            {activeTab === 'ai-chat' && (
              <div className="flex flex-col h-full justify-between flex-1">

                <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-4">
                  
                  {/* Active Snippet Display */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                      Active Selected Text
                    </span>
                    <p className="text-xs text-slate-300 italic font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      "{activeSnippet || 'No snippet selected.'}"
                    </p>
                  </div>

                  {/* AI Action Triggers */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Run Action on Selection
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRunAiAction('summarize')}
                        disabled={isProcessingAction}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                          activeAction === 'summarize'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        ⚡ Summarize
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRunAiAction('explain')}
                        disabled={isProcessingAction}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                          activeAction === 'explain'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        💡 Explain Concept
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRunAiAction('questions')}
                        disabled={isProcessingAction}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                          activeAction === 'questions'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        ❓ Generate Questions
                      </button>
                    </div>
                  </div>

                  {/* AI Action Output */}
                  {(isProcessingAction || aiOutput) && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-900">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          {activeAction} Output ({selectedAI})
                        </span>
                        {aiOutput && (
                          <button
                            type="button"
                            onClick={handleCopyOutput}
                            className="text-[11px] text-slate-400 hover:text-white transition-colors"
                          >
                            {copied ? '✓ Copied' : 'Copy'}
                          </button>
                        )}
                      </div>

                      {isProcessingAction ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
                          <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                          <span>Processing snippet with AI...</span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {aiOutput}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Chat Messages */}
                  <div className="space-y-3 pt-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl max-w-[85%] text-xs border transition-all ${
                          msg.sender === 'user'
                            ? 'bg-blue-800/40 border-slate-700/30 ml-auto text-blue-200 text-right'
                            : 'bg-slate-950 border-slate-800 text-slate-300 mr-auto'
                        }`}
                      >
                        {msg.sender === 'ai' && (
                          <div className="text-[10px] uppercase text-blue-400 font-bold tracking-wider mb-1">
                            {msg.aiUsed} Agent
                          </div>
                        )}
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                      </div>
                    ))}

                    {isAiTyping && (
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl max-w-[80%] text-slate-400 mr-auto flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] font-bold text-blue-400 tracking-wider mr-1">{selectedAI} is thinking</span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300"></span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                </div>

                {/* Bottom Chat Input Form */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isAiTyping || isProcessingAction}
                      placeholder={`Ask ${selectedAI} follow-up questions...`}
                      className="flex-1 bg-slate-950 text-slate-200 text-xs sm:text-sm rounded-lg px-4 border border-slate-800 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isAiTyping || isProcessingAction}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors"
                    >
                      Send
                    </button>
                  </form>
                </div>

              </div>
            )}

                       {activeTab === 'notes' && (
              // === FIX 2: saved summaries/flashcards persistence ===
              // Real, DB-backed list of every summarize/explain/questions
              // result saved for this project — loaded via GET
              // /study/saved-items on mount, kept in sync locally whenever
              // a new action runs successfully.
              <div className="space-y-3">
                <h3 className="font-bold text-white text-sm mb-1">Saved Key Concepts</h3>

                {isLoadingSavedItems && (
                  <p className="text-xs text-slate-500">Loading saved items…</p>
                )}

                {!isLoadingSavedItems && savedItems.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Nothing saved yet — run Summarize, Explain Concept, or Generate Questions
                    on a selection and it'll show up here permanently, even after a refresh
                    or logging back in.
                  </p>
                )}

                {savedItems.map(item => (
                  <div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {item.action_type} · {item.engine}
                      </span>
                      <span className="text-[10px] text-slate-500 text-right">
                        {item.document_name} · {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-500 italic mb-2">"{item.snippet_text}"</p>
                    <p className="whitespace-pre-wrap leading-relaxed">{item.ai_reply}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}