"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
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

interface WalletBalance {
  totalEarnedBDT: number;
  availableWithdrawBDT: number;
  pendingBDT: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ExpertDashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─── TABS & LOADING STATES ─────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'schedule' | 'availability' | 'profile' | 'create-profile' | 'earnings'>('schedule');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [payoutRequested, setPayoutRequested] = useState<boolean>(false);

  // ─── DYNAMIC STATES ────────────────────────────────────────────
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // ─── FORM INPUT STATES ─────────────────────────────────────────
  const [skillInput, setSkillInput] = useState<string>("");
  const [newSlotDate, setNewSlotDate] = useState<string>("");
  const [newSlotTime, setNewSlotTime] = useState<string>("");

  // ─── NEW PROFILE FORM STATE ────────────────────────────────────
  const [createProfileData, setCreateProfileData] = useState<ExpertProfile>({
    name: "",
    email: "",
    role: "",
    company: "",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    priceBDT: 5000,
    bio: "",
    skills: []
  });
  const [createSkillInput, setCreateSkillInput] = useState<string>("");

  // Helper function for Auth Headers
  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }, []);

  // ─── FETCH DASHBOARD DATA ─────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const headers = getAuthHeaders();

      const [profileRes, slotsRes, bookingsRes, walletRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/expert/profile`, { headers }),
        fetch(`${API_BASE_URL}/api/expert/slots`, { headers }),
        fetch(`${API_BASE_URL}/api/expert/bookings`, { headers }),
        fetch(`${API_BASE_URL}/api/expert/wallet`, { headers })
      ]);

      if (profileRes.status === 401 || walletRes.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data && Object.keys(data).length > 0) {
          setProfile({
            name: data.name || "",
            email: data.email || "",
            role: data.role || "",
            company: data.company || "",
            avatar: data.avatar || "/default-avatar.png",
            priceBDT: data.priceBDT || 0,
            bio: data.bio || "",
            skills: data.skills || []
          });
        }
      }

      if (slotsRes.ok) {
        const data = await slotsRes.json();
        setSlots(data);
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data);
      }

      if (walletRes.ok) {
        const data = await walletRes.json();
        setBalance({
          totalEarnedBDT: data.totalEarnedBDT || 0,
          availableWithdrawBDT: data.availableWithdrawBDT || 0,
          pendingBDT: data.pendingBDT || 0
        });
      }

    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setErrorMsg("Could not connect to backend server. Please verify your connection.");
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ─── HANDLERS ──────────────────────────────────────────────────

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders()
      });
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  // CREATE NEW PROFILE SUBMIT HANDLER
  const handleCreateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/api/expert/profile`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(createProfileData)
      });

      if (!res.ok) throw new Error("Failed to create profile");

      const newProfile = await res.json();
      setProfile(newProfile);
      setProfileSuccessMsg("Expert profile created successfully!");
      setActiveTab('profile'); // Switch to profile view/edit tab
      setTimeout(() => setProfileSuccessMsg(""), 4000);
    } catch (err) {
      alert("Error creating expert profile on backend.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/expert/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(profile)
      });

      if (!res.ok) throw new Error("Failed to save profile");

      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      setProfileSuccessMsg("Profile updated successfully!");
      setTimeout(() => setProfileSuccessMsg(""), 3000);
    } catch (err) {
      alert("Error saving profile to backend.");
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDate || !newSlotTime) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/expert/slots`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          date: newSlotDate,
          time: newSlotTime,
          duration: "45 Mins"
        })
      });

      if (!res.ok) throw new Error("Failed to add slot");

      const createdSlot = await res.json();
      setSlots((prev) => [...prev, createdSlot]);
      setNewSlotDate("");
      setNewSlotTime("");
    } catch (err) {
      alert("Error creating availability slot.");
    }
  };

  const handleRemoveSlot = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/expert/slots/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error("Failed to remove slot");

      setSlots((prev) => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Error deleting availability slot.");
    }
  };

  const handleRequestPayout = async () => {
    if (!balance || balance.availableWithdrawBDT <= 0) return;
    setPayoutRequested(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/expert/payout`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount: balance.availableWithdrawBDT })
      });

      if (!res.ok) throw new Error("Payout failed");

      setBalance(prev => prev ? { ...prev, availableWithdrawBDT: 0 } : null);
      alert("Payout request submitted successfully!");
    } catch (err) {
      alert("Failed to submit payout request.");
    } finally {
      setPayoutRequested(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/expert/upload-avatar`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });

        if (res.ok) {
          const { avatarUrl } = await res.json();
          setProfile({ ...profile, avatar: avatarUrl });
          setProfileSuccessMsg("Profile picture uploaded!");
          setTimeout(() => setProfileSuccessMsg(""), 3000);
        }
      } catch (err) {
        alert("Image upload failed.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Skill management for Update Profile
  const handleAddSkill = () => {
    if (profile && skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (profile) {
      setProfile({ ...profile, skills: profile.skills.filter(s => s !== skillToRemove) });
    }
  };

  // Skill management for Create Profile
  const handleAddCreateSkill = () => {
    if (createSkillInput.trim() && !createProfileData.skills.includes(createSkillInput.trim())) {
      setCreateProfileData({
        ...createProfileData,
        skills: [...createProfileData.skills, createSkillInput.trim()]
      });
      setCreateSkillInput("");
    }
  };

  const handleRemoveCreateSkill = (skillToRemove: string) => {
    setCreateProfileData({
      ...createProfileData,
      skills: createProfileData.skills.filter(s => s !== skillToRemove)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-400">Loading dynamic data from backend server...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative">
      {errorMsg && (
        <div className="bg-rose-600 text-white text-xs text-center py-2.5 font-bold shadow-md">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-1">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-[#0a0f1d] text-slate-300 flex flex-col justify-between p-5 shrink-0 border-r border-slate-800/40">
          <div>
            <div className="flex items-center gap-2 px-2 py-4 text-white text-2xl font-bold tracking-tight">
              <span className="text-blue-500 font-black">X</span> 
              <span className="font-serif tracking-normal text-white">InterviewX</span>
            </div>
            
            {/* Dynamic Profile Header */}
            <div className="flex flex-col items-center text-center my-6 px-2">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img 
                  src={profile?.avatar || "/default-avatar.png"} 
                  alt={profile?.name || "User Avatar"} 
                  className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-blue-500 shadow-md group-hover:opacity-80 transition-opacity"
                />
              </div>

              <h3 className="text-white font-bold text-sm tracking-wide break-all">
                {profile?.name || "No Profile Set"}
              </h3>
              <p className="text-xs text-blue-400 font-medium mt-0.5">{profile?.role || "Verified Expert"}</p>
            </div>

            <div className="border-t border-slate-800/80 my-5"></div>

            <nav className="space-y-1.5">
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${activeTab === 'schedule' ? 'bg-[#162032] text-white font-semibold border border-slate-700/50 shadow-inner' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'}`}
              >
                Schedule & Bookings
              </button>

              <button 
                onClick={() => setActiveTab('availability')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${activeTab === 'availability' ? 'bg-[#162032] text-white font-semibold border border-slate-700/50 shadow-inner' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'}`}
              >
                Availability Slots
              </button>

              <button 
                onClick={() => setActiveTab('earnings')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${activeTab === 'earnings' ? 'bg-[#162032] text-white font-semibold border border-slate-700/50 shadow-inner' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'}`}
              >
                Wallet & Earnings
              </button>

              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${activeTab === 'profile' ? 'bg-[#162032] text-white font-semibold border border-slate-700/50 shadow-inner' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'}`}
              >
                Expert Profile
              </button>

              {/* NEW TAB BUTTON: CREATE PROFILE */}
              <button 
                onClick={() => setActiveTab('create-profile')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${activeTab === 'create-profile' ? 'bg-[#162032] text-[#38bdf8] font-semibold border border-slate-700/50 shadow-inner' : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/40'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                + Create Profile
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

        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleImageFileChange} 
          className="hidden" 
        />

        {/* MAIN WORKSPACE */}
        <main className="flex-1 p-8 overflow-y-auto">
          
          {/* STATS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Balance</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                ৳{(balance?.availableWithdrawBDT || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Earned</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                ৳{(balance?.totalEarnedBDT || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Sessions</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {bookings.filter(b => b.status === 'Upcoming').length}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Session Fee</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                ৳{(profile?.priceBDT || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">/ 45m</span>
              </div>
            </div>
          </div>

          {/* TAB 1: SCHEDULE & BOOKINGS */}
          {activeTab === 'schedule' && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Your Session Schedule</h2>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider">
                  Confirmed Bookings
                </div>

                {bookings.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No dynamic bookings found on the backend.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{booking.candidateName}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500"><strong>Role:</strong> {booking.targetRole}</p>
                          <p className="text-xs text-slate-400"><strong>Email:</strong> {booking.candidateEmail}</p>
                          <p className="text-xs text-slate-600 font-mono mt-1">📅 {booking.date} at {booking.time}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800 text-sm">৳{booking.feeBDT?.toLocaleString()} BDT</span>
                          
                          {/* UPDATED: Join Video Room routing to /room/[id] */}
                          {booking.status === 'Upcoming' && (
                            <button 
                              type="button"
                              onClick={() => router.push(`/room/${booking.id}`)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                            >
                              <span>📹 Join Video Room</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB 2: AVAILABILITY SLOTS */}
          {activeTab === 'availability' && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Manage Availability Slots</h2>

              <form onSubmit={handleAddSlot} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Select Date</label>
                  <input 
                    type="date" 
                    required
                    value={newSlotDate}
                    onChange={(e) => setNewSlotDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg"
                >
                  + Add Slot
                </button>
              </form>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Active Time Slots</h3>
                
                {slots.length === 0 ? (
                  <p className="text-xs text-slate-400">No time slots found from backend.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {slots.map((slot) => (
                      <div key={slot.id} className="p-4 rounded-xl border flex items-center justify-between bg-white border-blue-200 shadow-sm">
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
              <h2 className="text-2xl font-bold text-slate-900">Wallet & Earnings</h2>

              <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ready for Withdrawal</span>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    ৳{(balance?.availableWithdrawBDT || 0).toLocaleString()} BDT
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleRequestPayout}
                  disabled={!balance || balance.availableWithdrawBDT <= 0 || payoutRequested}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3 px-6 rounded-lg transition-colors"
                >
                  {payoutRequested ? 'Processing...' : 'Request Instant Payout'}
                </button>
              </div>
            </section>
          )}

          {/* NEW SECTION FORM: CREATE EXPERT PROFILE */}
          {activeTab === 'create-profile' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Create New Expert Profile</h2>
                <p className="text-slate-500 text-sm mt-0.5">Fill in your professional details to set up your mock interviewer account.</p>
              </div>

              <form onSubmit={handleCreateProfileSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      value={createProfileData.name}
                      onChange={(e) => setCreateProfileData({ ...createProfileData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Professional Email *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="john@company.com"
                      value={createProfileData.email}
                      onChange={(e) => setCreateProfileData({ ...createProfileData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Current Job Title *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Senior Software Engineer"
                      value={createProfileData.role}
                      onChange={(e) => setCreateProfileData({ ...createProfileData, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Company / Organization *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Google, Meta, Microsoft"
                      value={createProfileData.company}
                      onChange={(e) => setCreateProfileData({ ...createProfileData, company: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Session Fee per 45 Mins (BDT) *</label>
                    <input 
                      type="number" 
                      required
                      min={1000}
                      step={500}
                      value={createProfileData.priceBDT}
                      onChange={(e) => setCreateProfileData({ ...createProfileData, priceBDT: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Avatar Image URL</label>
                    <input 
                      type="text" 
                      placeholder="https://..."
                      value={createProfileData.avatar}
                      onChange={(e) => setCreateProfileData({ ...createProfileData, avatar: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Short Bio / Interviewer Experience *</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="Describe your technical interviewing experience and domain expertise..."
                    value={createProfileData.bio}
                    onChange={(e) => setCreateProfileData({ ...createProfileData, bio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Expertise Skills */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Expertise Tags</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add tag (e.g. System Design, React, Node.js)"
                      value={createSkillInput}
                      onChange={(e) => setCreateSkillInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      type="button"
                      onClick={handleAddCreateSkill}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 rounded-lg transition-colors"
                    >
                      Add Tag
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {createProfileData.skills.map((skill, idx) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        {skill}
                        <button type="button" onClick={() => handleRemoveCreateSkill(skill)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-8 rounded-lg shadow-sm transition-colors"
                  >
                    Submit & Create Expert Profile
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* TAB 4: UPDATE PROFILE SETTINGS */}
          {activeTab === 'profile' && profile && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Update Expert Profile</h2>

              {profileSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-lg text-xs font-bold">
                  ✓ {profileSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Current Job Title</label>
                    <input 
                      type="text" 
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Company</label>
                    <input 
                      type="text" 
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Session Fee (BDT)</label>
                    <input 
                      type="number" 
                      value={profile.priceBDT}
                      onChange={(e) => setProfile({ ...profile, priceBDT: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Short Bio</label>
                  <textarea 
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Expertise Tags</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add tag (e.g. System Design)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                    />
                    <button 
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-slate-800 text-white font-bold text-xs px-4 rounded-lg"
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
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow-sm"
                  >
                    Save Changes to Backend
                  </button>
                </div>
              </form>
            </section>
          )}

        </main>
      </div>

      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs">
        <div>Copyright © 2026 <span className="text-slate-300 font-medium">Interview Prep Platform</span>.</div>
      </footer>
    </div>
  );
}