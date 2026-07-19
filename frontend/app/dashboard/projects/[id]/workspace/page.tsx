"use client";

/**
 * ============================================================================
 * CHANGE SUMMARY — read this before diffing line by line
 * ============================================================================
 * This file has gone through three rounds of changes on top of the original:
 *
 * ROUND 1 — per-difficulty questions (fixes Prev/Next mixing difficulties)
 *   - questionsByDifficulty / indexByDifficulty replace the old single
 *     `questions` array + `currentQuestionIndex`.
 *   - localStorage keys for saved code now include difficulty.
 *
 * ROUND 2 — questions persist in the database (fixes "questions vanish on
 * logout / refresh")
 *   - generateLLMQuestion always sends engine: "Gemini" to the
 *     generate-question endpoint specifically (HARDCODED — see note at that
 *     line). Chat and Evaluate still use whichever engine is selected in the
 *     top-right tabs (selectedAI) — this hardcoding only affects question
 *     generation.
 *   - A new effect (STEP 2) fetches GET /api/projects/{id}/questions on
 *     mount and only generates fresh questions for difficulties that come
 *     back empty.
 *
 * ROUND 3 — full evaluation history per question (this round)
 *   - ChallengeQuestion now carries a real database `id` (not just its
 *     display `number`), because evaluations are linked to a specific saved
 *     question row, not just "Question #3 of Easy".
 *   - handleCheckAnswer now sends question_id in the evaluate request so the
 *     backend can save this attempt against the right question.
 *   - A new `evaluationHistory` state + effect loads every past evaluation
 *     for whichever question is currently active from
 *     GET /api/questions/{id}/evaluations, and renders them under the hint.
 *   - HARDCODED: fallback questions (generated when the backend/Gemini call
 *     fails) get `id: -1` as a sentinel, since they were never saved to the
 *     database and have no real row to attach evaluations to. The
 *     evaluation-history effect checks for this and skips fetching when
 *     id < 0.
 * ============================================================================
 */

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
  id: number;          // NEW (Round 3) — the real project_questions.id row from Neon.
                        // HARDCODED sentinel: fallback (offline) questions get id: -1
                        // since they were never saved, so evaluations can't attach to them.
  number: number;       // display position within its difficulty (Q1, Q2, ... of Easy/Medium/Hard)
  title: string;
  description: string;
  hint: string;
  starterCode: string;
}

// NEW (Round 1) — named type so Easy/Medium/Hard isn't retyped as a union everywhere
type Difficulty = 'Easy' | 'Medium' | 'Hard';

// NEW (Round 3) — shape of one row coming back from GET /api/questions/{id}/evaluations
interface EvaluationRecord {
  id: number;
  code_snapshot: string;
  evaluation_text: string;
  engine: string | null;
  created_at: string;
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
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [showHint, setShowHint] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  // (Round 1) Each difficulty gets its OWN question list and OWN current index,
  // keyed by difficulty, instead of one shared array/index for all three.
  const [questionsByDifficulty, setQuestionsByDifficulty] = useState<Record<Difficulty, ChallengeQuestion[]>>({
    Easy: [],
    Medium: [],
    Hard: []
  });
  const [indexByDifficulty, setIndexByDifficulty] = useState<Record<Difficulty, number>>({
    Easy: 0,
    Medium: 0,
    Hard: 0
  });

  // Derived shortcuts into the per-difficulty maps for whichever difficulty is
  // currently selected — the rest of the component can keep using `questions` /
  // `currentQuestionIndex` / `activeQuestion` exactly like the original file did.
  const questions = questionsByDifficulty[difficulty];
  const currentQuestionIndex = indexByDifficulty[difficulty];
  const activeQuestion = questions[currentQuestionIndex] || null;

  // --- STANDARD WORKSPACE STATES (unchanged from original) ---
  const [selectedAI, setSelectedAI] = useState<'ChatGPT' | 'Gemini' | 'Claude'>(initialAISelection);
  const [activeTab, setActiveTab] = useState<'ai-chat' | 'expert-qa' | 'video-call'>('ai-chat');
  const [chatInput, setChatInput] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'failed'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);

  // NEW (Round 3) — every past evaluation attempt for the CURRENTLY ACTIVE question.
  // Reloaded every time activeQuestion changes (see the effect below).
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationRecord[]>([]);
  const [expandedEvals, setExpandedEvals] = useState<Set<number>>(new Set());

const toggleEvalExpanded = (evalId: number) => {
  setExpandedEvals(prev => {
    const next = new Set(prev);
    if (next.has(evalId)) {
      next.delete(evalId);
    } else {
      next.add(evalId);
    }
    return next;
  });
};

  // ==========================================================================
  // STEP 1 — QUESTION GENERATOR
  // Appends into questionsByDifficulty[targetDifficulty] (Round 1) and always
  // asks the backend to grade/generate using Gemini specifically (Round 2).
  // ==========================================================================
  const generateLLMQuestion = async (forcedDifficulty?: Difficulty) => {
    const targetDifficulty = forcedDifficulty || difficulty;
    setIsGeneratingQuestion(true);

    try {
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/generate-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: targetDifficulty,
          topic: projectTopic,
          project_name: projectName,
          // HARDCODED (Round 2): question generation always uses free-tier Gemini,
          // regardless of what selectedAI is set to in the top-right tabs. That
          // selector still controls the CHAT and EVALUATE calls below — only the
          // question generator itself is locked to Gemini.
          engine: "Gemini"
        })
      });
      const data = await response.json();

      if (!data.success || !data.question) {
        throw new Error(data.error || "Invalid response format from generator API");
      }

      // Append the new question into ONLY this difficulty's list.
      // data.question_id comes from the backend's ProjectQuestionDB row it just
      // created — this is the real DB id we need later for saving evaluations.
      setQuestionsByDifficulty(prev => {
        const existing = prev[targetDifficulty];
        const newQ: ChallengeQuestion = {
          id: data.question_id,   // NEW (Round 3)
          number: existing.length + 1,
          title: data.question.title,
          description: data.question.description,
          hint: data.question.hint,
          starterCode: data.question.starterCode || `// Write your solution here...`
        };
        return { ...prev, [targetDifficulty]: [...existing, newQ] };
      });

      // Move the pointer for THIS difficulty to the newly-added question.
      // NOTE: reads questionsByDifficulty[targetDifficulty].length from the
      // surrounding closure rather than from inside the state updater above.
      // For a single generate call this is correct (existing.length before
      // appending == the new item's index), but back-to-back rapid calls
      // before a re-render settles could compute a stale value. Not an issue
      // with current usage (one click == one call), just flagging it.
      setIndexByDifficulty(prev => ({
        ...prev,
        [targetDifficulty]: questionsByDifficulty[targetDifficulty].length
      }));

    } catch (e: any) {
      console.error("Error generating question:", e);
      // Fallback question so the UI doesn't dead-end if the backend/Gemini call fails.
      // HARDCODED (Round 3): id: -1 marks this as "never saved to the database" —
      // the evaluation-history effect below checks for this and skips fetching,
      // since there's no real question_evaluations foreign key to attach to.
      setQuestionsByDifficulty(prev => {
        const existing = prev[targetDifficulty];
        const fallbackQ: ChallengeQuestion = {
          id: -1,   // HARDCODED sentinel — see note above
          number: existing.length + 1,
          title: `Dynamic Interview Probe: ${projectTopic}`,
          description: `Please write an efficient implementation matching your project parameters for: ${projectName}. (Backend API Generation Failed)`,
          hint: `Focus on clean algorithmic structural decomposition.`,
          starterCode: `// API offline fallback code execution scope\nfunction solution() {\n  \n}`
        };
        return { ...prev, [targetDifficulty]: [...existing, fallbackQ] };
      });
      setIndexByDifficulty(prev => ({
        ...prev,
        [targetDifficulty]: questionsByDifficulty[targetDifficulty].length
      }));
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  // ==========================================================================
  // STEP 2 — LOAD SAVED QUESTIONS FROM THE DATABASE ON PAGE LOAD (Round 2)
  // Fetches GET /api/projects/{id}/questions first, so returning users see
  // their old questions instead of fresh ones every time. Only generates a
  // new question for the active difficulty if it truly has nothing saved yet.
  // ==========================================================================
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/projects/${projectId}/questions`);
        const saved: {
          id: number;           // NEW (Round 3) — real DB row id, comes from ProjectQuestionOut
          difficulty: Difficulty;
          number: number;
          title: string;
          description: string;
          hint: string;
          starter_code: string; // backend uses snake_case, frontend uses camelCase — mapped below
        }[] = await res.json();

        // Group the flat list coming back from the DB into our three buckets
        const grouped: Record<Difficulty, ChallengeQuestion[]> = { Easy: [], Medium: [], Hard: [] };
        for (const q of saved) {
          grouped[q.difficulty].push({
            id: q.id,   // NEW (Round 3)
            number: q.number,
            title: q.title,
            description: q.description,
            hint: q.hint,
            starterCode: q.starter_code
          });
        }
        // Backend already orders by (difficulty, number), but sort defensively anyway
        (Object.keys(grouped) as Difficulty[]).forEach(d => grouped[d].sort((a, b) => a.number - b.number));

        setQuestionsByDifficulty(grouped);
        // Point each difficulty's index at its LAST saved question (most recent),
        // or 0 if that difficulty has none yet.
        setIndexByDifficulty({
          Easy: Math.max(grouped.Easy.length - 1, 0),
          Medium: Math.max(grouped.Medium.length - 1, 0),
          Hard: Math.max(grouped.Hard.length - 1, 0)
        });

        // Only the ACTIVE difficulty gets auto-generated if it's empty.
        // (If the user later switches to a different empty difficulty,
        // handleDifficultyChange below handles that separately.)
        if (grouped[difficulty].length === 0) {
          await generateLLMQuestion(difficulty);
        }

        setMessages([
          {
            id: 'welcome',
            sender: 'ai',
            aiUsed: selectedAI,
            text: `Welcome! I'm dynamically compiling custom ${difficulty} interview vectors for "${projectName}" based on your topic focus: "${projectTopic}"...`,
            timestamp: new Date()
          }
        ]);
      } catch (e) {
        console.error("Failed to load saved questions:", e);
        // If the DB fetch itself fails (backend down, network issue), fall
        // back to generating a fresh question so the page still works.
        await generateLLMQuestion(difficulty);
      }
    };

    if (projectName && projectTopic) {
      loadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName, projectTopic]);

  // ==========================================================================
  // STEP 3 — DIFFICULTY TAB CLICKED (Round 1)
  // Only generates a new question if that difficulty's list is still empty —
  // switching back to a difficulty you've already visited just shows what's
  // already there instead of silently adding another question every time.
  // ==========================================================================
  const handleDifficultyChange = (level: Difficulty) => {
    setDifficulty(level);
    if (questionsByDifficulty[level].length === 0) {
      generateLLMQuestion(level);
    }
  };

  // ==========================================================================
  // STEP 4 — LOCAL STORAGE SYNC FOR THE CODE EDITOR (Round 1)
  // Storage key includes `difficulty` — Easy Q1 and Hard Q1 both exist
  // independently (numbering restarts per difficulty), so without this,
  // one would silently overwrite the other's saved code.
  // ==========================================================================
  useEffect(() => {
    if (!activeQuestion) return;
    const storageKey = `workspace_${projectId}_${difficulty}_q${activeQuestion.number}`;
    const savedProgress = localStorage.getItem(storageKey);

    if (savedProgress) {
      setCodeSnippet(savedProgress);
    } else {
      setCodeSnippet(activeQuestion.starterCode);
    }
    setShowHint(false);
  }, [projectId, difficulty, currentQuestionIndex, activeQuestion]);

  // ==========================================================================
  // STEP 5 — LOAD EVALUATION HISTORY FOR THE ACTIVE QUESTION (NEW, Round 3)
  // Every time the active question changes (switching Prev/Next, switching
  // difficulty, or a fresh question just got generated), fetch every past
  // evaluation attempt for THIS specific question id and store it for display.
  // Skips the fetch entirely for fallback questions (id: -1, see note above),
  // since those were never saved and have nothing to fetch.
  // ==========================================================================
  useEffect(() => {
    const loadEvaluations = async () => {
      if (!activeQuestion || activeQuestion.id < 0) {
        setEvaluationHistory([]);
        return;
      }
      try {
        const res = await fetch(`http://localhost:8000/api/questions/${activeQuestion.id}/evaluations`);
        const data: EvaluationRecord[] = await res.json();
        setEvaluationHistory(data);
      } catch (e) {
        console.error("Failed to load evaluation history:", e);
        setEvaluationHistory([]);
      }
    };
    loadEvaluations();
  }, [activeQuestion]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping, isEvaluating]);

  const handleSaveCode = async () => {
    if (!activeQuestion) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      // (Round 1) key includes difficulty — see STEP 4 note above
      const storageKey = `workspace_${projectId}_${difficulty}_q${activeQuestion.number}`;
      localStorage.setItem(storageKey, codeSnippet);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('failed');
    } finally {
      setIsSaving(false);
    }
  };

  // --- CHAT WITH THE SELECTED AI (unchanged — still uses selectedAI, not locked to Gemini) ---
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

  // --- EVALUATE CURRENT CODE ---
  // (Round 1) localStorage key includes difficulty.
  // (Round 3) request body now includes question_id so the backend can save
  // this attempt against the right row in project_questions, and after a
  // successful evaluation this component re-fetches the history so the new
  // attempt shows up immediately without needing a page refresh.
  const handleCheckAnswer = async () => {
    if (isEvaluating || !activeQuestion) return;
    setIsEvaluating(true);

    const latestSavedCode = localStorage.getItem(`workspace_${projectId}_${difficulty}_q${activeQuestion.number}`) || codeSnippet;

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
          question_id: activeQuestion.id,   // NEW (Round 3)
          question_number: activeQuestion.number,
          question_title: activeQuestion.title,
          project_context: { name: projectName, topic: projectTopic }
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        aiUsed: selectedAI,
        text: data.success
          ? data.reply
          : `⚠️ Evaluation Failed: ${data.reply || data.error || "The grading engine returned an explicitly non-successful runtime signature."}`,
        timestamp: new Date()
      }]);

      // NEW (Round 3): refresh the evaluation history right after a successful
      // grade, so the new attempt appears without needing a page reload.
      if (data.success && activeQuestion.id >= 0) {
        try {
          const historyRes = await fetch(`http://localhost:8000/api/questions/${activeQuestion.id}/evaluations`);
          const historyData: EvaluationRecord[] = await historyRes.json();
          setEvaluationHistory(historyData);
        } catch (historyErr) {
          console.error("Failed to refresh evaluation history:", historyErr);
        }
      }
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
                    // (Round 1) only moves the index for the CURRENT difficulty
                    onClick={() => setIndexByDifficulty(prev => ({ ...prev, [difficulty]: prev[difficulty] - 1 }))}
                    className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-xs font-medium rounded transition-colors"
                  >
                    &larr; Prev
                  </button>
                  <button
                    type="button"
                    disabled={currentQuestionIndex === questions.length - 1}
                    onClick={() => setIndexByDifficulty(prev => ({ ...prev, [difficulty]: prev[difficulty] + 1 }))}
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

              {/* NEW (Round 3) — past evaluation attempts for this exact question */}
             {evaluationHistory.length > 0 && (
  <div className="mt-3 pt-3 border-t border-slate-900 space-y-2">
    <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase block">
      Past Evaluations ({evaluationHistory.length})
    </span>
    {evaluationHistory.map((ev, i) => {
      const isExpanded = expandedEvals.has(ev.id);
      return (
        <div key={ev.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-500">Attempt {i + 1} · {ev.engine || 'unknown engine'}</span>
            <button
              type="button"
              onClick={() => toggleEvalExpanded(ev.id)}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
            </button>
          </div>
          <div className={`text-slate-300 whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
            {ev.evaluation_text}
          </div>
        </div>
      );
    })}
  </div>
)}        
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

        {/* RIGHT PANEL: CHAT SYSTEM & LIVE EVALUATION ENGINE (unchanged) */}
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