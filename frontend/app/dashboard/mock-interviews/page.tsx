"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Expert {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  priceBDT: number; // Updated to BDT for SSLCommerz
  skills: string[];
  bio: string;
}

const MOCK_EXPERTS: Expert[] = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Senior Software Engineer",
    company: "Google",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 42,
    priceBDT: 8500,
    skills: ["System Design", "Data Structures", "Go & Java"],
    bio: "Ex-Meta, current Google Staff Engineer with 8+ years experience interviewing candidate software engineers."
  },
  {
    id: 2,
    name: "Alex Rivera",
    role: "Tech Lead & Frontend Architect",
    company: "Meta",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 29,
    priceBDT: 7000,
    skills: ["React & Next.js", "Frontend Architecture", "Behavioral"],
    bio: "Specializing in React, web performance, and behavioral storytelling for big tech interviews."
  },
  {
    id: 3,
    name: "Priya Sharma",
    role: "Engineering Manager",
    company: "Amazon",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 56,
    priceBDT: 10000,
    skills: ["Leadership Principles", "System Architecture", "Mock Prep"],
    bio: "Bar Raiser at Amazon with over 200+ conducted interviews. Expert in leadership and deep technical probes."
  }
];

export default function MockInterviewsPage() {
  const router = useRouter();
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("All");

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // SSLCommerz Payment Handler
  const handleInitiateSSLCommerz = async () => {
    if (!selectedExpert) return;
    setIsProcessingPayment(true);

    const token = localStorage.getItem("token");

    try {
      // 1. Call backend API to create payment session
      const response = await fetch("http://localhost:8000/api/payment/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          expert_id: selectedExpert.id,
          amount: selectedExpert.priceBDT,
          currency: "BDT"
        })
      });

      const data = await response.json();

      if (data.GatewayPageURL) {
        // 2. Redirect user to SSLCommerz Sandbox Gateway Page
        window.location.href = data.GatewayPageURL;
      } else {
        // Fallback demo redirect for local frontend testing without backend running
        window.open("https://sandbox.sslcommerz.com/EasyCheckOut/testbox/", "_blank");
        setIsProcessingPayment(false);
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      // Fallback demo for presentation testing
      alert("Redirecting to SSLCommerz Mock Sandbox...");
      window.open("https://sandbox.sslcommerz.com/EasyCheckOut/testbox/", "_blank");
      setIsProcessingPayment(false);
    }
  };

  const filteredExperts = MOCK_EXPERTS.filter((expert) => {
    const matchesSearch =
      expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      expert.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany =
      selectedCompany === "All" || expert.company === selectedCompany;

    return matchesSearch && matchesCompany;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative">
      <div className="flex flex-1">
        
        {/* ─── LEFT NAVIGATION SIDEBAR ─── */}
        <aside className="w-64 bg-[#0a0f1d] text-slate-300 flex flex-col justify-between p-5 shrink-0 border-r border-slate-800/40">
          <div>
            <div className="flex items-center gap-2 px-2 py-4 text-white text-2xl font-bold tracking-tight">
              <span className="text-blue-500 font-black">X</span> 
              <span className="font-serif tracking-normal text-white">InterviewX</span>
            </div>
            
            <div className="flex flex-col items-center text-center my-6 px-2">
              <div className="w-20 h-20 bg-slate-800/60 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-700/40">
                <div className="w-10 h-10 rounded-full border-[3px] border-slate-400/70 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-400"></div>
                </div>
              </div>
              <h3 className="text-white font-bold text-sm tracking-wide break-all">
                rahul.dey.232@northsouth.edu
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-normal">Student</p>
            </div>

            <div className="border-t border-slate-800/80 my-5"></div>

            <nav className="space-y-1.5">
              <Link href="/dashboard" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/40 font-medium text-sm transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
                Dashboard
              </Link>

              <Link href="/dashboard/projects" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/40 font-medium text-sm transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                Projects
              </Link>

              <Link href="/dashboard/mock-interviews" className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#162032] text-white font-semibold text-sm transition-colors border border-slate-700/50 shadow-inner">
                <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Mock Interviews
              </Link>

              <Link href="/dashboard/resources" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/40 font-medium text-sm transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Resources
              </Link>

              <Link href="/dashboard/profile" className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/40 font-medium text-sm transition-colors">
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold border border-slate-700">N</div>
                Profile
              </Link>
            </nav>
          </div>
          
          <button type="button" onClick={handleLogout} className="w-full bg-[#e11d48] hover:bg-rose-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm mt-6">
            Log Out
          </button>
        </aside>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-8 overflow-y-auto">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expert Mock Interviews</h1>
            <p className="text-slate-500 text-sm mt-1">Book 1-on-1 live mock interviews with top industry engineers and hiring managers.</p>
          </header>

          {/* SEARCH & FILTER BAR */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input 
                type="text" 
                placeholder="Search by name, skill, or role..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Company:</label>
              <select 
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
              >
                <option value="All">All Companies</option>
                <option value="Google">Google</option>
                <option value="Meta">Meta</option>
                <option value="Amazon">Amazon</option>
              </select>
            </div>
          </div>

          {/* EXPERT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map((expert) => (
              <div key={expert.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img src={expert.avatar} alt={expert.name} className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{expert.company}</span>
                        <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">★ {expert.rating} ({expert.reviewsCount})</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 truncate mt-1">{expert.name}</h3>
                      <p className="text-xs text-slate-500 font-medium truncate">{expert.role}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">{expert.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {expert.skills.map((skill, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-slate-900">৳{expert.priceBDT.toLocaleString()}</span>
                    <span className="text-xs text-slate-400"> BDT</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedExpert(expert)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-colors"
                  >
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* SSLCOMMERZ CHECKOUT MODAL */}
      {selectedExpert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-blue-600">SSLCommerz Sandbox Checkout</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">Book Session with {selectedExpert.name}</h2>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedExpert(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-semibold px-2 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <img src={selectedExpert.avatar} alt={selectedExpert.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900">{selectedExpert.name}</h4>
                  <p className="text-[11px] text-slate-500">{selectedExpert.role} @ {selectedExpert.company}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span>Session Length:</span>
                  <strong className="text-slate-800">45 Minutes</strong>
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway:</span>
                  <strong className="text-emerald-600 font-semibold">SSLCommerz Sandbox (bKash/Cards)</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total Payable Amount:</span>
                  <strong className="text-blue-600 text-sm">৳{selectedExpert.priceBDT.toLocaleString()} BDT</strong>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setSelectedExpert(null)}
                  disabled={isProcessingPayment}
                  className="px-4 py-2 font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleInitiateSSLCommerz}
                  disabled={isProcessingPayment}
                  className="px-4 py-2 font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow transition-colors flex items-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Redirecting...
                    </>
                  ) : (
                    `Pay ৳${selectedExpert.priceBDT.toLocaleString()} via SSLCommerz`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}