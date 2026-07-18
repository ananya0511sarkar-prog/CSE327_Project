"use client";

import { useState, use, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface WorkspacePageProps {
  params: Promise<{ id: string }>;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  aiUsed?: 'ChatGPT' | 'Gemini' | 'Claude';
  timestamp: Date;
}

interface ChallengeQuestion {
  number: number;
  title: string;
  description: string;
  hint: string;
  starterCode: string;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const searchParams = useSearchParams();
  const projectName = searchParams.get('name') || `Project Track #${projectId}`;
  const projectTopic = searchParams.get('topic') || "General Coding Track Parameters";
  const incomingEngine = searchParams.get('engine') || 'Claude';

  const initialAISelection = incomingEngine.includes('Gemini') 
    ? 'Gemini' 
    : incomingEngine.includes('ChatGPT') 
      ? 'ChatGPT' 
      : 'Claude';

  // --- WORKFLOW STATES ---
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  
  // Start with an empty questions array so we can cleanly populate from the LLM
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);

  const activeQuestion = questions[currentQuestionIndex] || null;

  // --- STANDARD WORKSPACE STATES ---
  const [selectedAI, setSelectedAI] = useState<'ChatGPT' | 'Gemini' | 'Claude'>(initialAISelection);
  const [activeTab, setActiveTab] = useState<'ai-chat' | 'expert-qa' | 'video-call'>('ai-chat');
  const [chatInput, setChatInput] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false); 
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'failed'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);

  // --- 1. DYNAMIC LLM QUESTION GENERATOR FUNCTION ---
  const generateLLMQuestion = async (forcedDifficulty?: 'Easy' | 'Medium' | 'Hard') => {
    setIsGeneratingQuestion(true);
    const targetDifficulty = forcedDifficulty || difficulty;
    
    try {
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/generate-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          difficulty: targetDifficulty, 
          topic: projectTopic, 
          project_name: projectName,
          engine: selectedAI 
        })
      });
      const data = await response.json();
      
      if (data.success && data.question) {
        const newQ: ChallengeQuestion = {
          number: questions.length + 1,
          title: data.question.title,
          description: data.question.description,
          hint: data.question.hint,
          starterCode: data.question.starterCode || `// Write your solution here...`
        };
        setQuestions(prev => [...prev, newQ]);
        setCurrentQuestionIndex(questions.length); // Push index forward to the brand new question
      } else {
        // Fallback placeholder if backend is missing properties
        throw new Error(data.error || "Invalid response format from generator API");
      }
    } catch (e: any) {
      console.error("Error generating question:", e);
      // Generate an emergency question to keep UI functional if backend completely fails
      const fallbackQ: ChallengeQuestion = {
        number: questions.length + 1,
        title: `Dynamic Interview Probe: ${projectTopic}`,
        description: `Please write an efficient implementation matching your project parameters for: ${projectName}. (Backend API Generation Failed)`,
        hint: `Focus on clean algorithmic structural decomposition.`,
        starterCode: `// API offline fallback code execution scope\nfunction solution() {\n  \n}`
      };
      setQuestions(prev => [...prev, fallbackQ]);
      setCurrentQuestionIndex(questions.length);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  // --- 2. AUTOMATIC INITIAL QUESTION TRIGGER ON LOAD ---
  useEffect(() => {
    if (projectName && projectTopic && questions.length === 0) {
      generateLLMQuestion();
      
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          aiUsed: selectedAI,
          text: `Welcome John! I'm dynamically compiling custom ${difficulty} interview vectors for "${projectName}" based on your topic focus: "${projectTopic}"...`,
          timestamp: new Date()
        }
      ]);
    }
  }, [projectName, projectTopic]);

  // --- 3. DYNAMIC SYNC WHEN DIFFICULTY SELECTOR CHANGED ---
  const handleDifficultyChange = (level: 'Easy' | 'Medium' | 'Hard') => {
    setDifficulty(level);
    // Request a fresh contextual problem with the updated difficulty level right away
    generateLLMQuestion(level);
  };

  // --- 4. LOCAL STORAGE SYNC ---
  useEffect(() => {
    if (!activeQuestion) return;
    const storageKey = `workspace_${projectId}_q${activeQuestion.number}`;
    const savedProgress = localStorage.getItem(storageKey);
    
    if (savedProgress) {
      setCodeSnippet(savedProgress);
    } else {
      setCodeSnippet(activeQuestion.starterCode);
    }
    setShowHint(false);
  }, [projectId, currentQuestionIndex, activeQuestion]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping, isEvaluating]);

  const handleSaveCode = async () => {
    if (!activeQuestion) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const storageKey = `workspace_${projectId}_q${activeQuestion.number}`;
      localStorage.setItem(storageKey, codeSnippet);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('failed');
    } finally {
      setIsSaving(false);
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
          code_context: codeSnippet,
          question_metadata: {
            question_number: activeQuestion?.number || 1,
            title: activeQuestion?.title || "Context Assessment",
            difficulty
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
        throw new Error(data.reply || data.error || "Failed to receive message feedback pipeline.");
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        aiUsed: selectedAI,
        text: `⚠️ Chat Error: ${error.message || "Failed to resolve connection to backend server context."}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // --- FIXED: PARSING DYNAMIC ERROR LOG METRICS ---
  const handleCheckAnswer = async () => {
    if (isEvaluating || !activeQuestion) return;
    setIsEvaluating(true);
    
    const latestSavedCode = localStorage.getItem(`workspace_${projectId}_q${activeQuestion.number}`) || codeSnippet;

    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      sender: 'user',
      text: `🔍 Evaluating system solution for Question #${activeQuestion.number} (${activeQuestion.title}) under difficulty parameters [${difficulty}]...`,
      timestamp: new Date()
    }]);

    try {
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: selectedAI,
          code_context: latestSavedCode,
          difficulty_context: difficulty,
          question_number: activeQuestion.number,
          question_title: activeQuestion.title,
          project_context: { name: projectName, topic: projectTopic }
        })
      });
      
      const data = await response.json();
      
      // Fixed logic: Render whatever message or compilation summary your backend returns directly!
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        aiUsed: selectedAI,
        text: data.success 
          ? data.reply 
          : `⚠️ Evaluation Failed: ${data.reply || data.error || "The grading engine returned an explicitly non-successful runtime signature."}`,
        timestamp: new Date()
      }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        aiUsed: selectedAI,
        text: `❌ Connection Error: Unable to query evaluation endpoint. Details: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER BAR */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
            &larr; Back to Projects
          </Link>
          <div className="h-4 w-px bg-slate-800"></div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded border border-blue-500/30">
              {projectName}
            </span>
            Interactive Preparation Workspace
          </h1>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Difficulty:</span>
            {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => handleDifficultyChange(level)}
                className={`px-2 py-1 rounded transition-all font-semibold ${
                  difficulty === level 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

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

      {/* SPLIT LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: QUESTION DESCRIPTION & WORKBENCH */}
        <section className="w-1/2 p-4 flex flex-col border-r border-slate-800 bg-slate-950/40 overflow-y-auto">
          
          {isGeneratingQuestion ? (
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-8 mb-4 flex flex-col items-center justify-center gap-3 animate-pulse">
              <span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></span>
              <p className="text-xs text-purple-300 font-medium tracking-wide">LLM is synthesizing situational challenge criteria context...</p>
            </div>
          ) : activeQuestion ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">
                  Problem Context Vector {activeQuestion.number} of {questions.length}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-xs font-medium rounded transition-colors"
                  >
                    &larr; Prev
                  </button>
                  <button
                    type="button"
                    disabled={currentQuestionIndex === questions.length - 1}
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-xs font-medium rounded transition-colors"
                  >
                    Next &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => generateLLMQuestion()}
                    className="p-1 px-2 bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 border border-purple-500/30 text-xs rounded transition-colors"
                  >
                    ⚡ Generate New
                  </button>
                </div>
              </div>

              <h2 className="text-base font-bold text-white mb-1">{activeQuestion.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">{activeQuestion.description}</p>
              
              <div className="pt-2 border-t border-slate-900">
                {!showHint ? (
                  <button
                    type="button"
                    onClick={() => setShowHint(true)}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    💡 Need a hint? Reveal structural pointer
                  </button>
                ) : (
                  <div className="bg-amber-500/5 text-amber-300 p-3 rounded-lg border border-amber-500/20 text-xs leading-relaxed">
                    <span className="font-bold text-amber-400 block mb-0.5">Hint Framework:</span>
                    {activeQuestion.hint}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-4 text-center text-xs text-slate-400">
              No active test vector loaded. Click "Generate New" above to query your chosen backend runner.
            </div>
          )}

          {/* CODE EDITOR BOX */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Answering Sandbox</span>
              <div className="flex items-center gap-3">
                {saveStatus === 'saved' && <span className="text-[11px] text-emerald-400 font-medium">✓ Cached in LocalStorage</span>}
                {saveStatus === 'failed' && <span className="text-[11px] text-red-400 font-medium">⚠️ Cache failed</span>}
                <button
                  type="button"
                  onClick={handleSaveCode}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition-colors"
                >
                  {isSaving ? 'Saving...' : '💾 Save Code'}
                </button>
              </div>
            </div>
            
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              className="flex-1 w-full bg-slate-950 text-slate-300 font-mono text-sm p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed shadow-inner"
            />
          </div>
        </section>

        {/* RIGHT PANEL: CHAT SYSTEM & LIVE EVALUATION ENGINE */}
        <section className="w-1/2 flex flex-col bg-slate-900">
          
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
              👑 Premium Help
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('video-call')}
              className={`py-3 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'video-call' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              📹 Mock Calls
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between min-h-0">
            {activeTab === 'ai-chat' && (
              <div className="flex flex-col h-full justify-between flex-1">
                
                <div className="space-y-4 text-sm overflow-y-auto flex-1 pr-1 pb-4">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-4 rounded-xl max-w-[85%] border transition-all ${
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
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  ))}

                  {isAiTyping && (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl max-w-[80%] text-slate-400 mr-auto flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-blue-400 tracking-wider mr-1">{selectedAI} is processing pipeline telemetry</span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300"></span>
                    </div>
                  )}

                  {isEvaluating && (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl max-w-[80%] text-slate-400 mr-auto flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-400 tracking-wider mr-1">{selectedAI} running testing suites</span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-300"></span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  <button
                    type="button"
                    onClick={handleCheckAnswer}
                    disabled={isEvaluating || isAiTyping || !activeQuestion}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/40 text-white font-bold text-sm py-2.5 rounded-xl shadow-md transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    {isEvaluating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Compiling Sandbox Metrics...
                      </>
                    ) : (
                      `🎯 Evaluate Question #${activeQuestion?.number || 1} with ${selectedAI}`
                    )}
                  </button>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isAiTyping || isEvaluating}
                      placeholder={`Ask ${selectedAI} relative architecture hints...`}
                      className="flex-1 bg-slate-950 text-slate-200 text-xs sm:text-sm rounded-lg px-4 border border-slate-800 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                    />
                    <button 
                      type="submit" 
                      disabled={isAiTyping || isEvaluating}
                      className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/40 text-white font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-700 transition-colors"
                    >
                      Send
                    </button>
                  </form>
                </div>

              </div>
            )}

            {activeTab === 'expert-qa' && (
              <div className="p-4 bg-gradient-to-br from-blue-950 to-slate-950 border border-blue-900/50 rounded-xl">
                <h3 className="text-sm font-bold text-white mb-1">👑 Direct Staff Escalation</h3>
                <p className="text-xs text-slate-400">Send complex architecture logs directly to engineers.</p>
              </div>
            )}

            {activeTab === 'video-call' && (
              <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center">
                <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-5 rounded-lg">Launch Video Interface</button>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}