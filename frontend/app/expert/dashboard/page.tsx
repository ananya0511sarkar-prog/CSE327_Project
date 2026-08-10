"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ExpertProfile {
  name: string;
  email: string;
  role: string;
  company: string;
  avatar: string;
  priceBDT: number;
  bio: string;
  skills: string[];
}

interface TimeSlot {
  id: number;
  date: string;
  time: string;
  duration: string;
  isBooked: boolean;
}

interface Booking {
  id: number;
  candidateName: string;
  candidateEmail: string;
  targetRole: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  meetingUrl: string;
  feeBDT: number;
}

export default function ExpertDashboardPage() {
  const router = useRouter();
  
  // Set 'schedule' as the default active tab
  const [activeTab, setActiveTab] = useState<'schedule' | 'availability' | 'profile' | 'earnings'>('schedule');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─── EXPERT PROFILE STATE ──────────────────────────────────────
  const [profile, setProfile] = useState<ExpertProfile>({
    name: "Sarah Jenkins",
    email: "sarah.jenkins@google.com",
    role: "Senior Software Engineer",
    company: "Google",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    priceBDT: 8500,
    bio: "Ex-Meta, current Google Staff Engineer with 8+ years experience interviewing candidate software engineers.",
    skills: ["System Design", "Data Structures", "Go & Java"]
  });

  const [skillInput, setSkillInput] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // ─── BALANCE & STATS STATE ─────────────────────────────────────
  const [balance, setBalance] = useState({
    totalEarnedBDT: 357000,
    availableWithdrawBDT: 85000,
    pendingBDT: 17000
  });
  const [payoutRequested, setPayoutRequested] = useState(false);

  // ─── AVAILABILITY SLOTS STATE ──────────────────────────────────
  const [slots, setSlots] = useState<TimeSlot[]>([
    { id: 1, date: "2026-08-12", time: "04:00 PM", duration: "45 Mins", isBooked: true },
    { id: 2, date: "2026-08-14", time: "06:00 PM", duration: "45 Mins", isBooked: false },
    { id: 3, date: "2026-08-15", time: "02:00 PM", duration: "45 Mins", isBooked: false },
  ]);

  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotTime, setNewSlotTime] = useState("");

  // ─── SCHEDULED BOOKINGS STATE ──────────────────────────────────
  const [bookings] = useState<Booking[]>([
    {
      id: 101,
      candidateName: "Rahul Dey",
      candidateEmail: "rahul.dey.232@northsouth.edu",
      targetRole: "Frontend Engineer (React / Next.js)",
      date: "2026-08-12",
      time: "04:00 PM EST",
      status: "Upcoming",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      feeBDT: 8500
    },
    {
      id: 102,
      candidateName: "Ayesha Rahman",
      candidateEmail: "ayesha.rahman@gmail.com",
      targetRole: "Backend Engineer (Go)",
      date: "2026-08-08",
      time: "05:00 PM EST",
      status: "Completed",
      meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
      feeBDT: 8500
    }
  ]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Profile Picture File Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
        setIsUploading(false);
        setProfileSuccessMsg("Profile picture updated!");
        setTimeout(() => setProfileSuccessMsg(""), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg("Profile details saved successfully!");
    setTimeout(() => setProfileSuccessMsg(""), 3000);
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skillToRemove) });
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDate || !newSlotTime) return;

    const newSlot: TimeSlot = {
      id: Date.now(),
      date: newSlotDate,
      time: newSlotTime,
      duration: "45 Mins",
      isBooked: false
    };

    setSlots([...slots, newSlot]);
    setNewSlotDate("");
    setNewSlotTime("");
  };

  const handleRemoveSlot = (id: number) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const handleRequestPayout = () => {
    setPayoutRequested(true);
    setTimeout(() => {
      setBalance(prev => ({ ...prev, availableWithdrawBDT: 0 }));
      setPayoutRequested(false);
      alert("Payout request submitted! Funds will be transferred to your account within 24 hours.");
    }, 1500);
  };

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
            
            {/* Expert Profile Card with Quick Avatar Edit Overlay */}
            <div className="flex flex-col items-center text-center my-6 px-2">
              <div className="relative group cursor-pointer" onClick={handleTriggerFileInput}>
                <img 
                  src={profile.avatar} 
                  alt={profile.name} 
                  className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-blue-500 shadow-md group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-white font-bold text-sm tracking-wide break-all">
                {profile.name}
              </h3>
              <p className="text-xs text-blue-400 font-medium mt-0.5">Verified Interviewer</p>
            </div>

            <div className="border-t border-slate-800/80 my-5"></div>

            <nav className="space-y-1.5">
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${activeTab === 'schedule' ? 'bg-[#162032] text-white font-semibold border border-slate-700/50 shadow-inner' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'}`}
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Schedule & Bookings
              </button>

              <button 
                onClick={() => setActiveTab('availability')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${activeTab === 'availability' ? 'bg-[#162032] text-white font-semibold border border-slate-700/50 shadow-inner' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'}`}
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Availability Slots
              </button>

              <button 
                onClick={() => setActiveTab('earnings')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${activeTab === 'earnings' ? 'bg-[#162032] text-white font-semibold border border-slate-700/50 shadow-inner' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'}`}
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Wallet & Earnings
              </button>

              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${activeTab === 'profile' ? 'bg-[#162032] text-white font-semibold border border-slate-700/50 shadow-inner' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'}`}
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Expert Profile
              </button>
            </nav>
          </div>
          
          <button 
            type="button"
            onClick={handleLogout}
            className="w-full bg-[#e11d48] hover:bg-rose-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm mt-6"
          >
            Log Out
          </button>
        </aside>

        {/* Hidden File Input for Image Upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleImageFileChange} 
          className="hidden" 
        />

        {/* ─── MAIN WORKSPACE CONTENT ─── */}
        <main className="flex-1 p-8 overflow-y-auto">
          
          {/* STATS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Balance</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">৳{balance.availableWithdrawBDT.toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span></div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Earned</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">৳{balance.totalEarnedBDT.toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span></div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Sessions</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">{bookings.filter(b => b.status === 'Upcoming').length}</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Session Fee</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">৳{profile.priceBDT.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ 45m</span></div>
            </div>
          </div>

          {/* TAB 1: SCHEDULE & BOOKINGS (DEFAULT ACTIVE TAB) */}
          {activeTab === 'schedule' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Your Session Schedule</h2>
                <p className="text-slate-500 text-sm mt-0.5">Manage upcoming candidate mock interviews and past session records.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider">
                  Confirmed Bookings
                </div>

                <div className="divide-y divide-slate-100">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{booking.candidateName}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${booking.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500"><strong className="text-slate-700">Role:</strong> {booking.targetRole}</p>
                        <p className="text-xs text-slate-400"><strong className="text-slate-600">Email:</strong> {booking.candidateEmail}</p>
                        <p className="text-xs text-slate-600 font-mono mt-1">📅 {booking.date} at {booking.time}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 text-sm">৳{booking.feeBDT.toLocaleString()} BDT</span>
                        {booking.status === 'Upcoming' && (
                          <a 
                            href={booking.meetingUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors"
                          >
                            Join Meeting Link
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: AVAILABILITY SLOTS */}
          {activeTab === 'availability' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Manage Availability Slots</h2>
                <p className="text-slate-500 text-sm mt-0.5">Publish time slots so candidates can book mock sessions directly on your calendar.</p>
              </div>

              <form onSubmit={handleAddSlot} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Select Date</label>
                  <input 
                    type="date" 
                    required
                    value={newSlotDate}
                    onChange={(e) => setNewSlotDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Start Time</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., 04:00 PM EST"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow-sm transition-colors"
                >
                  + Add Slot
                </button>
              </form>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Active Time Slots</h3>
                
                {slots.length === 0 ? (
                  <p className="text-xs text-slate-400">No time slots added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {slots.map((slot) => (
                      <div key={slot.id} className={`p-4 rounded-xl border flex items-center justify-between ${slot.isBooked ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-blue-200 shadow-sm'}`}>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{slot.date}</div>
                          <div className="text-xs text-blue-600 font-semibold mt-0.5">{slot.time} ({slot.duration})</div>
                          <div className="text-[10px] text-slate-400 mt-1">{slot.isBooked ? '● Booked' : '○ Available'}</div>
                        </div>

                        {!slot.isBooked && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="text-slate-400 hover:text-rose-600 font-bold text-xs p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB 3: WALLET & EARNINGS */}
          {activeTab === 'earnings' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Wallet & Earnings Summary</h2>
                <p className="text-slate-500 text-sm mt-0.5">Track your interview income and request bank transfers or mobile wallet payouts.</p>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 rounded-xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ready for Withdrawal</span>
                  <div className="text-3xl font-extrabold text-white mt-1">৳{balance.availableWithdrawBDT.toLocaleString()} BDT</div>
                  <p className="text-xs text-slate-400 mt-1">Direct payout via bKash, Nagad, or Bank Wire.</p>
                </div>

                <button 
                  type="button"
                  onClick={handleRequestPayout}
                  disabled={balance.availableWithdrawBDT === 0 || payoutRequested}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3 px-6 rounded-lg shadow transition-colors"
                >
                  {payoutRequested ? 'Processing...' : 'Request Instant Payout'}
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Payout Ledger History</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <div>
                      <span className="font-bold text-slate-800">Bank Transfer #8841</span>
                      <p className="text-[11px] text-slate-400">August 02, 2026</p>
                    </div>
                    <span className="font-bold text-emerald-600">+ ৳170,000 BDT (Completed)</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <div>
                      <span className="font-bold text-slate-800">bKash Merchant Payout</span>
                      <p className="text-[11px] text-slate-400">July 20, 2026</p>
                    </div>
                    <span className="font-bold text-emerald-600">+ ৳102,000 BDT (Completed)</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: PROFILE SETTINGS & PHOTO UPLOAD */}
          {activeTab === 'profile' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Update Expert Profile</h2>
                <p className="text-slate-500 text-sm mt-0.5">Manage your photo, credentials, session pricing, and expertise tags.</p>
              </div>

              {profileSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                  <span>✓</span> {profileSuccessMsg}
                </div>
              )}

              {/* PROFILE PICTURE UPDATE BOX */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Profile Photo</h3>
                <p className="text-xs text-slate-500 mb-4">Upload a high-resolution professional headshot.</p>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <img 
                      src={profile.avatar} 
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md" 
                    />
                    {isUploading && (
                      <div className="absolute inset-0 rounded-full bg-slate-900/60 flex items-center justify-center text-white text-xs">
                        Uploading...
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-center sm:text-left">
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button 
                        type="button"
                        onClick={handleTriggerFileInput}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload Local File
                      </button>

                      <button 
                        type="button"
                        onClick={() => setProfile({ ...profile, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" })}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-lg transition-colors"
                      >
                        Reset Avatar
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400">Supports JPG, PNG, or WebP. Max file size: 5MB.</p>
                  </div>
                </div>
              </div>

              {/* PROFILE FORM */}
              <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Current Job Title</label>
                    <input 
                      type="text" 
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Company</label>
                    <input 
                      type="text" 
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Session Fee (BDT)</label>
                    <input 
                      type="number" 
                      value={profile.priceBDT}
                      onChange={(e) => setProfile({ ...profile, priceBDT: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Or Image Web URL</label>
                  <input 
                    type="text" 
                    value={profile.avatar}
                    onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Short Bio / Background</label>
                  <textarea 
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Skill Tags */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Expertise Tags</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add tag (e.g. System Design)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {profile.skills.map((skill, idx) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </section>
          )}

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
    </div>
  );
}