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
  lesson_id: string;
  name: string;
  pages: number;
  content: string;
  page_images?: { page: number; image_base64: string }[];
}

interface SavedItem {
  id: number;
  lesson_id?: string;
  document_name?: string;
  action_type: string;
  engine: string;
  snippet_text: string;
  ai_reply: string;
  created_at: string;
}

interface LessonEntry {
  id: string;
  title: string;
  type: 'summary' | 'explanation' | 'practice_qa' | 'manual_section';
  snippet?: string;
  content: string;
  image_url?: string;
  style?: {
    isBold?: boolean;
    isItalic?: boolean;
    fontSize?: 'small' | 'normal' | 'large' | 'heading';
  };
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  entries: LessonEntry[];
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
  const [activeTab, setActiveTab] = useState<'ai-chat' | 'notes' | 'lessons'>('lessons');

  // --- LESSON STATES ---
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: 'lesson-cnn',
      title: 'CNN',
      description: 'Convolutional Neural Networks notes & practice',
      entries: []
    }
  ]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('lesson-cnn');
  const [newLessonTitle, setNewLessonTitle] = useState<string>('');

  // --- MANUAL SECTION FORM STATES ---
  const [showAddSectionModal, setShowAddSectionModal] = useState<boolean>(false);
  const [customSectionTitle, setCustomSectionTitle] = useState<string>('');
  const [customSectionContent, setCustomSectionContent] = useState<string>('');
  const [customSectionBold, setCustomSectionBold] = useState<boolean>(false);
  const [customSectionItalic, setCustomSectionItalic] = useState<boolean>(false);
  const [customSectionFontSize, setCustomSectionFontSize] = useState<'small' | 'normal' | 'large' | 'heading'>('normal');
  const [customSectionImageUrl, setCustomSectionImageUrl] = useState<string>('');

  // --- DOCUMENT STATES (BOUND TO LESSONS) ---
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [activeDocument, setActiveDocument] = useState<StudyDocument | null>(null);

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('text');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [activeSnippet, setActiveSnippet] = useState<string>('');

  // Crop & Viewer Refs
  const viewerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionImageInputRef = useRef<HTMLInputElement>(null);
  const lessonPdfExportRef = useRef<HTMLDivElement>(null);
  const snippetsPdfExportRef = useRef<HTMLDivElement>(null);

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

  // Saved Items Persistence State
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoadingSavedItems, setIsLoadingSavedItems] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const activeLesson = lessons.find(l => l.id === selectedLessonId);
  const lessonDocuments = documents.filter(doc => doc.lesson_id === selectedLessonId);

  useEffect(() => {
    if (lessonDocuments.length > 0) {
      if (!activeDocument || activeDocument.lesson_id !== selectedLessonId) {
        setActiveDocument(lessonDocuments[0]);
      }
    } else {
      setActiveDocument(null);
    }
  }, [selectedLessonId, documents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping, isProcessingAction]);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        aiUsed: selectedAI,
        text: `Welcome to the Study Workspace for "${projectName}". Upload lesson-specific documents on the left, then capture text/crop regions to generate summaries and practice questions.`,
        timestamp: new Date()
      }
    ]);
  }, [projectName, selectedAI]);

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

  // --- HANDLER: CREATE NEW LESSON ---
  const handleCreateLesson = () => {
    if (!newLessonTitle.trim()) return;
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: newLessonTitle.trim(),
      description: `Created on ${new Date().toLocaleDateString()}`,
      entries: []
    };
    setLessons(prev => [...prev, newLesson]);
    setSelectedLessonId(newLesson.id);
    setNewLessonTitle('');
  };

  // --- HANDLER: ADD CUSTOM MANUAL SECTION ---
  const handleAddManualSection = () => {
    if (!customSectionTitle.trim() || !customSectionContent.trim() || !selectedLessonId) {
      alert("Please enter a title and content for your section.");
      return;
    }

    const newEntry: LessonEntry = {
      id: `manual-${Date.now()}`,
      title: customSectionTitle.trim(),
      type: 'manual_section',
      content: customSectionContent.trim(),
      image_url: customSectionImageUrl || undefined,
      style: {
        isBold: customSectionBold,
        isItalic: customSectionItalic,
        fontSize: customSectionFontSize
      },
      createdAt: new Date().toLocaleString()
    };

    setLessons(prev => prev.map(lesson => {
      if (lesson.id === selectedLessonId) {
        return { ...lesson, entries: [...lesson.entries, newEntry] };
      }
      return lesson;
    }));

    // Reset Modal Form
    setCustomSectionTitle('');
    setCustomSectionContent('');
    setCustomSectionBold(false);
    setCustomSectionItalic(false);
    setCustomSectionFontSize('normal');
    setCustomSectionImageUrl('');
    setShowAddSectionModal(false);
  };

  // --- HANDLER: SECTION IMAGE FILE ATTACH ---
  const handleSectionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomSectionImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- HANDLER: UPLOAD PDF UNDER CURRENT LESSON ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedLessonId) {
      alert("Please select or create a lesson first before uploading a document.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("lesson_id", selectedLessonId);

    try {
      const response = await fetch(
        `http://localhost:8000/api/projects/${projectId}/study/upload-document`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        const newDoc: StudyDocument = {
          id: data.document.id,
          lesson_id: selectedLessonId,
          name: data.document.name,
          pages: data.document.pages,
          content: data.document.content,
          page_images: data.document.page_images || []
        };
        setDocuments(prev => [newDoc, ...prev]);
        setActiveDocument(newDoc);
      } else {
        alert(`Upload failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message || "Failed to reach backend server."}`);
    }

    e.target.value = '';
  };

  // --- HANDLER: SAVE AI OUTPUT TO CURRENT LESSON ---
  const handleSaveToLesson = () => {
    if (!aiOutput || !selectedLessonId) return;

    const entryType: 'summary' | 'explanation' | 'practice_qa' = 
      activeAction === 'summarize' ? 'summary' :
      activeAction === 'explain' ? 'explanation' : 'practice_qa';

    const newEntry: LessonEntry = {
      id: `entry-${Date.now()}`,
      title: `${activeAction ? activeAction.toUpperCase() : 'NOTE'} - ${activeDocument?.name || 'General Context'}`,
      type: entryType,
      snippet: activeSnippet,
      content: aiOutput,
      createdAt: new Date().toLocaleString()
    };

    setLessons(prev => prev.map(lesson => {
      if (lesson.id === selectedLessonId) {
        return { ...lesson, entries: [...lesson.entries, newEntry] };
      }
      return lesson;
    }));

    alert(`Saved to lesson "${activeLesson?.title}"!`);
  };

  // --- HANDLER: EXPORT LESSON CONTENT OR SNIPPETS TO PDF ---
  const handleDownloadPdf = async (targetRef: React.RefObject<HTMLDivElement | null>, filenamePrefix: string) => {
    if (!targetRef.current) return;

    setIsExportingPdf(true);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = targetRef.current;
      const opt = {
        margin:       [0.4, 0.4, 0.4, 0.4],
        filename:     `${filenamePrefix}_${activeLesson?.title.replace(/\s+/g, '_') || 'Lesson'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Failed to export PDF. Ensure html2pdf.js is installed.");
    } finally {
      setIsExportingPdf(false);
    }
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

  // --- HELPER: CROP BOX TEXT EXTRACTION ---
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

  const handleRunAiAction = async (action: AIAction) => {
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
          project_id: projectId,
          lesson_id: selectedLessonId
        })
      });

      const data = await response.json();

      if (data.success) {
        setAiOutput(data.result);

        setSavedItems(prev => [{
          id: data.action_id,
          lesson_id: selectedLessonId,
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
      setAiOutput(`⚠️ Error: ${err.message || "Failed to process snippet. Please try again."}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

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

  const currentLessonSavedItems = savedItems.filter(item => !item.lesson_id || item.lesson_id === selectedLessonId);

  // Dynamic Class Helper for Custom Styling
  const getStyleClasses = (style?: LessonEntry['style']) => {
    if (!style) return 'text-xs text-slate-200';
    let classes = '';
    
    // Font Weight
    if (style.isBold) classes += ' font-bold';
    else classes += ' font-normal';

    // Font Style
    if (style.isItalic) classes += ' italic';

    // Font Size
    switch (style.fontSize) {
      case 'small':
        classes += ' text-[11px]';
        break;
      case 'large':
        classes += ' text-sm';
        break;
      case 'heading':
        classes += ' text-base font-bold text-blue-300';
        break;
      case 'normal':
      default:
        classes += ' text-xs';
        break;
    }

    return classes;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">

      {/* HIDDEN FILE INPUTS */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.txt,.doc,.docx,.pptx"
        className="hidden"
      />
      <input
        type="file"
        ref={sectionImageInputRef}
        onChange={handleSectionImageUpload}
        accept="image/*"
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

        {/* LEFT PANEL: LESSON PDF DOCUMENTS & READER */}
        <section className="w-1/2 p-4 flex flex-col border-r border-slate-800 bg-slate-950/40 overflow-y-auto">
          
          {/* Document Controls Header */}
          <div className="flex items-center justify-between mb-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium pl-1">Lesson PDFs:</span>
              {lessonDocuments.length > 0 ? (
                <select
                  value={activeDocument?.id}
                  onChange={(e) => {
                    const doc = lessonDocuments.find(d => d.id === Number(e.target.value));
                    if (doc) setActiveDocument(doc);
                  }}
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50"
                >
                  {lessonDocuments.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.pages} pgs)
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-600 italic">No PDFs in "{activeLesson?.title || 'Lesson'}"</span>
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
                + Upload PDF to {activeLesson?.title || 'Lesson'}
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
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 text-xs gap-2">
                <p>No document uploaded for <strong>"{activeLesson?.title}"</strong>.</p>
                <p>Click "+ Upload PDF to {activeLesson?.title}" above to add your study material.</p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL: AI ASSISTANT, LESSONS & SNIPPETS */}
        <section className="w-1/2 flex flex-col bg-slate-900">

          {/* Navigation Tabs */}
          <div className="flex bg-slate-950/60 border-b border-slate-800 px-4 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('lessons')}
              className={`py-3 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'lessons' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              📚 Lesson Modules & PDF
            </button>
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
              📝 Saved Snippets
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between min-h-0">
            
            {/* LESSON MODULES VIEW */}
            {activeTab === 'lessons' && (
              <div className="space-y-6 overflow-y-auto flex-1 pr-1">
                {/* Lesson Selection & Creation Header */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      LESSON MODULES
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddSectionModal(true)}
                        className="bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:bg-blue-600/50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        ✏️ + Add Written Section
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(lessonPdfExportRef, `Lesson_Summary`)}
                        disabled={isExportingPdf || !activeLesson?.entries.length}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {isExportingPdf ? 'Generating PDF...' : '📄 Download PDF'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Select / Open Existing Lesson */}
                    <select
                      value={selectedLessonId}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
                    >
                      {lessons.map(l => (
                        <option key={l.id} value={l.id}>
                          Open: {l.title} ({l.entries.length} saved)
                        </option>
                      ))}
                    </select>

                    {/* Create New Lesson */}
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        placeholder="New Lesson Title..."
                        className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleCreateLesson}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold"
                      >
                        + Create
                      </button>
                    </div>
                  </div>
                </div>

                {/* MODAL: ADD CUSTOM MANUAL SECTION WITH RICH TEXT & IMAGE */}
                {showAddSectionModal && (
                  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          ✏️ Write Custom Section for <span className="text-blue-400">"{activeLesson?.title}"</span>
                        </h3>
                        <button
                          onClick={() => setShowAddSectionModal(false)}
                          className="text-slate-400 hover:text-white text-sm"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Section Title</label>
                        <input
                          type="text"
                          value={customSectionTitle}
                          onChange={(e) => setCustomSectionTitle(e.target.value)}
                          placeholder="e.g. My Personal Summary or Key Equations"
                          className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Rich Text Formatting Toolbar */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Formatting & Styling Options</label>
                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                          <button
                            type="button"
                            onClick={() => setCustomSectionBold(!customSectionBold)}
                            className={`px-2.5 py-1 rounded font-bold border ${customSectionBold ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomSectionItalic(!customSectionItalic)}
                            className={`px-2.5 py-1 rounded italic border ${customSectionItalic ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                          >
                            I
                          </button>

                          <div className="h-4 w-px bg-slate-800 mx-1"></div>

                          <span className="text-[11px] text-slate-500">Size:</span>
                          <select
                            value={customSectionFontSize}
                            onChange={(e: any) => setCustomSectionFontSize(e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-2 py-1"
                          >
                            <option value="small">Small</option>
                            <option value="normal">Normal</option>
                            <option value="large">Large</option>
                            <option value="heading">Heading</option>
                          </select>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Content / Written Notes</label>
                        <textarea
                          rows={4}
                          value={customSectionContent}
                          onChange={(e) => setCustomSectionContent(e.target.value)}
                          placeholder="Write your study notes or explanation here..."
                          className={`w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 ${
                            customSectionBold ? 'font-bold' : ''
                          } ${customSectionItalic ? 'italic' : ''}`}
                        />
                      </div>

                      {/* Image Embed Options */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Include Image (Optional)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customSectionImageUrl}
                            onChange={(e) => setCustomSectionImageUrl(e.target.value)}
                            placeholder="Image URL or upload local file..."
                            className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => sectionImageInputRef.current?.click()}
                            className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
                          >
                            🖼️ Browse
                          </button>
                        </div>
                        {customSectionImageUrl && (
                          <div className="mt-2 border border-slate-800 rounded p-1 max-h-32 overflow-hidden bg-slate-950 flex items-center justify-center">
                            <img src={customSectionImageUrl} alt="Preview" className="max-h-28 object-contain" />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setShowAddSectionModal(false)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddManualSection}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-semibold"
                        >
                          Save Section
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* Printable Formatted Container for PDF Export */}
                <div ref={lessonPdfExportRef} className="space-y-4 bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-100">
                  {/* Clean PDF Header */}
                  <div className="border-b-2 border-blue-500/50 pb-4 mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block">LESSON SUMMARY REPORT</span>
                    <h1 className="text-xl font-black text-white mt-1">{activeLesson?.title || 'Selected Lesson'}</h1>
                    <p className="text-xs text-slate-400 mt-1">{projectName} • Practice Questions, Explanations & Written Sections</p>
                  </div>

                  {!activeLesson?.entries.length ? (
                    <div className="text-xs text-slate-500 italic py-8 text-center border border-dashed border-slate-800 rounded-lg">
                      No materials saved to this lesson yet. Run summaries, write custom sections, or quizzes in the AI Assistant tab and click "+ Save to Lesson".
                    </div>
                  ) : (
                    activeLesson.entries.map((entry, idx) => (
                      <div key={entry.id} className="border-b border-slate-800/80 pb-4 mb-4 last:border-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                            #{idx + 1} {entry.type.replace('_', ' ')}: {entry.title}
                          </span>
                          <span className="text-[10px] text-slate-500">{entry.createdAt}</span>
                        </div>

                        {entry.snippet && (
                          <blockquote className="text-xs italic text-slate-300 border-l-2 border-blue-500 pl-3 py-1 bg-slate-900/80 rounded-r">
                            "{entry.snippet}"
                          </blockquote>
                        )}

                        {/* Content Render with Custom Styling */}
                        <div className={`whitespace-pre-wrap leading-relaxed pt-1 ${getStyleClasses(entry.style)}`}>
                          {entry.content}
                        </div>

                        {/* Embedded Custom Section Image */}
                        {entry.image_url && (
                          <div className="mt-3 border border-slate-800 rounded-lg overflow-hidden bg-slate-900 max-w-md">
                            <img src={entry.image_url} alt="Section Attachment" className="w-full h-auto object-cover" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* AI CHAT & ACTION ENGINE */}
            {activeTab === 'ai-chat' && (
              <div className="flex flex-col h-full justify-between flex-1">

                <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-4">
                  
                  {/* Active Snippet */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                      Active Selected Snippet ({activeLesson?.title})
                    </span>
                    <p className="text-xs text-slate-300 italic font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800">
                      "{activeSnippet || 'No snippet selected from document.'}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Run AI Action on Snippet
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
                        ❓ Generate Q&A
                      </button>
                    </div>
                  </div>

                  {/* Output */}
                  {(isProcessingAction || aiOutput) && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-900">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          {activeAction} Output ({selectedAI})
                        </span>
                        <div className="flex items-center gap-2">
                          {aiOutput && (
                            <>
                              <button
                                type="button"
                                onClick={handleSaveToLesson}
                                className="text-[11px] bg-blue-600/30 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded hover:bg-blue-600/50 transition-colors"
                              >
                                + Save to {activeLesson?.title || 'Lesson'}
                              </button>
                              <button
                                type="button"
                                onClick={handleCopyOutput}
                                className="text-[11px] text-slate-400 hover:text-white transition-colors"
                              >
                                {copied ? '✓ Copied' : 'Copy'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isProcessingAction ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
                          <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                          <span>Processing snippet...</span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {aiOutput}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Messages */}
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

                {/* Input */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Ask ${selectedAI} about this document...`}
                      className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                    />
                    <button
                      type="submit"
                      disabled={isAiTyping || !chatInput.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
                    >
                      Send
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* SAVED SNIPPETS VIEW WITH PDF EXPORT */}
            {activeTab === 'notes' && (
              <div className="space-y-4 overflow-y-auto flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Saved Snippets ({activeLesson?.title || 'All'})
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(snippetsPdfExportRef, `Snippets_Report`)}
                    disabled={isExportingPdf || currentLessonSavedItems.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Export Snippets PDF
                  </button>
                </div>

                <div ref={snippetsPdfExportRef} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="border-b border-blue-500/40 pb-3 mb-2">
                    <span className="text-[10px] font-bold uppercase text-blue-400">LESSON SNIPPETS</span>
                    <h2 className="text-lg font-bold text-white">{activeLesson?.title}</h2>
                  </div>

                  {isLoadingSavedItems ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                      <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                      <span>Loading saved items...</span>
                    </div>
                  ) : currentLessonSavedItems.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-4">
                      No saved items found for this lesson.
                    </div>
                  ) : (
                    currentLessonSavedItems.map((item) => (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-bold text-blue-400">
                            {item.action_type} ({item.engine})
                          </span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        {item.document_name && (
                          <div className="text-[10px] text-slate-500">Document: {item.document_name}</div>
                        )}
                        <p className="text-xs text-slate-300 italic font-mono bg-slate-950 p-2 rounded border border-slate-800">
                          "{item.snippet_text}"
                        </p>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed pt-1">
                          {item.ai_reply}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}