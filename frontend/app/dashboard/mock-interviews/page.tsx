"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface TimeSlot {
  id: number;
  date: string;
  time: string;
  duration?: string;
  isBooked: boolean;
}

interface Expert {
  id: number;
  name: string;
  email?: string;
  role: string;
  company: string;
  avatar: string;
  priceBDT: number;
  bio: string;
  skills: string[];
  slots?: TimeSlot[];
}

interface Booking {
  id: number;
  targetRole: string;
  date: string;
  time: string;
  feeBDT: number;
  status: string;
  expert: {
    name: string;
    role: string;
    company: string;
    avatar: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MockInterviewsPage() {
  const router = useRouter();

  // ─── STATES ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"browse" | "bookings">("browse");

  // Experts Data
  const [experts, setExperts] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // My Bookings Data
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("All");

  // Booking Modal State
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [targetRoleInput, setTargetRoleInput] = useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Auth Helper
  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  // ─── FETCH EXPERTS ────────────────────────────────────────────
  const fetchExperts = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/experts`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to load interview experts");
      }

      const data = await res.json();
      const rawArray = Array.isArray(data) ? data : data.experts || data.data || [];
      
      const normalizedData = rawArray.map((exp: any) => ({
        ...exp,
        priceBDT: exp.priceBDT ?? exp.price_bdt ?? 5000,
        slots: (exp.slots || []).map((s: any) => ({
          ...s,
          isBooked: s.isBooked ?? s.is_booked ?? false,
        })),
      }));

      setExperts(normalizedData);
    } catch (err: any) {
      console.error("Error loading experts:", err);
      setErrorMsg("Unable to load interviewers at this time.");
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  // ─── FETCH MY BOOKINGS ────────────────────────────────────────
  const fetchMyBookings = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    setIsLoadingBookings(true);

    try {
      let candidateEmail = "";
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        candidateEmail = tokenPayload.email || tokenPayload.sub || "";
      } catch (e) {
        candidateEmail = localStorage.getItem("user_email") || localStorage.getItem("email") || "";
      }

      if (!candidateEmail) {
        setIsLoadingBookings(false);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/api/candidate/bookings?email=${encodeURIComponent(candidateEmail)}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (res.ok) {
        const rawData = await res.json();
        
        const bookingsArray = Array.isArray(rawData)
          ? rawData
          : rawData.bookings || rawData.data || rawData.results || [];

        const normalizedBookings: Booking[] = bookingsArray.map((b: any) => ({
          id: b.id,
          targetRole: b.targetRole || b.target_role || "Software Engineer",
          feeBDT: b.feeBDT ?? b.fee_bdt ?? 5000,
          status: b.status || "Upcoming",
          date: b.date || b.slot?.date || b.slot_date || "Scheduled",
          time: b.time || b.slot?.time || b.slot_time || "TBD",
          expert: {
            name: b.expert?.name || b.expertName || b.expert_name || "Verified Expert",
            role: b.expert?.role || b.expertRole || b.expert_role || "Technical Interviewer",
            company: b.expert?.company || b.expertCompany || b.expert_company || "Tech Company",
            avatar: b.expert?.avatar || b.expertAvatar || b.expert_avatar || "/default-avatar.png",
          },
        }));

        setMyBookings(normalizedBookings);
      }
    } catch (err) {
      console.error("Error loading candidate bookings:", err);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchExperts();
    fetchMyBookings();
  }, [fetchExperts, fetchMyBookings]);

  // ─── OPEN BOOKING MODAL & FETCH SLOTS ──────────────────────────
  const handleOpenBookingModal = async (expert: Expert) => {
    setSelectedExpert(expert);
    setTargetRoleInput(expert.role);
    setSelectedSlot(null);
    setIsLoadingSlots(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/experts/${expert.id}/slots`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const slotsData = await res.json();
        const rawSlots = Array.isArray(slotsData) ? slotsData : slotsData.slots || [];
        
        const formattedSlots: TimeSlot[] = rawSlots.map((s: any) => ({
          id: s.id,
          date: s.date,
          time: s.time,
          duration: s.duration || "45 Mins",
          isBooked: s.isBooked ?? s.is_booked ?? false,
        }));

        setSelectedExpert((prev) => (prev ? { ...prev, slots: formattedSlots } : null));
      } else if (expert.slots) {
        const formattedSlots = expert.slots.map((s: any) => ({
          ...s,
          isBooked: s.isBooked ?? s.is_booked ?? false,
        }));
        setSelectedExpert((prev) => (prev ? { ...prev, slots: formattedSlots } : null));
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // ─── BOOKING HANDLER ──────────────────────────────────────────
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in as a candidate to book a mock interview.");
      router.push("/login");
      return;
    }

    if (!selectedExpert || !selectedSlot) {
      alert("Please select an available time slot.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        expertId: selectedExpert.id,
        expert_id: selectedExpert.id,
        slotId: selectedSlot.id,
        slot_id: selectedSlot.id,
        targetRole: targetRoleInput.trim() || selectedExpert.role,
        target_role: targetRoleInput.trim() || selectedExpert.role,
        feeBDT: selectedExpert.priceBDT,
        fee_bdt: selectedExpert.priceBDT,
        date: selectedSlot.date,
        time: selectedSlot.time
      };

      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to create booking.");
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedExpert(null);
        setSelectedSlot(null);
        setTargetRoleInput("");
        fetchExperts();
        fetchMyBookings();
      }, 2000);
    } catch (err: any) {
      alert(`Booking Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Experts
  const filteredExperts = experts.filter((exp) => {
    const matchesSearch =
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ?? false);

    const matchesRole =
      selectedRole === "All" ||
      exp.role.toLowerCase().includes(selectedRole.toLowerCase());

    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <div className="flex flex-1">
        
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 px-2 py-4 text-white text-xl font-bold tracking-tight">
              <span className="text-blue-500 text-2xl font-black">X</span> InterviewX
            </div>

            <div className="flex flex-col items-center text-center my-6 border-b border-slate-800 pb-6">
              <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-3 overflow-hidden border-2 border-slate-600">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 2.654 1.057 5.063 2.769 6.843.048.05.084.111.104.177A11.966 11.966 0 0012 21c2.569 0 4.978-.813 6.953-2.195a.23.23 0 01.1-.114zM12 6.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-base">Candidate Area</h3>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">Mock Interviews</p>
            </div>

            <nav className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                Dashboard
              </Link>
              <Link href="/dashboard/mock-interviews" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800 text-white font-medium text-sm transition-colors">
                Mock Interviews
              </Link>
              <Link href="/dashboard/resources" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                Resources
              </Link>
            </nav>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Log Out
          </button>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 p-8 overflow-y-auto space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              1-on-1 Mock Interviews
            </h1>
            <p className="text-slate-600 text-sm">
              Practice real coding, system design, and behavioral interviews with verified engineers.
            </p>
          </header>

          {/* TABS */}
          <div className="flex border-b border-slate-200 gap-6 pt-2">
            <button
              onClick={() => setActiveTab("browse")}
              className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === "browse"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Find Interviewers
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "bookings"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              My Booked Sessions
              {myBookings.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {myBookings.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: BROWSE EXPERTS */}
          {activeTab === "browse" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <input
                  type="text"
                  placeholder="Search by interviewer name, company, or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-96 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
                  {["All", "Software Engineer", "Frontend", "Backend", "System Design"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedRole === role
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-500 text-xs mt-2 font-medium">Loading verified experts...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredExperts.map((expert) => (
                    <div
                      key={expert.id}
                      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={expert.avatar || "/default-avatar.png"}
                            alt={expert.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shrink-0"
                          />
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{expert.name}</h3>
                            <p className="text-xs text-blue-600 font-semibold">{expert.role}</p>
                            <span className="text-[11px] text-slate-500 font-semibold">@ {expert.company}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {expert.bio || "Experienced technical interviewer."}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {expert.skills?.map((skill, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] px-2 py-0.5 rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Fee / 45 Mins</span>
                          <span className="text-lg font-extrabold text-slate-900">
                            ৳{expert.priceBDT ? expert.priceBDT.toLocaleString() : "5,000"} <span className="text-xs font-normal text-slate-500">BDT</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenBookingModal(expert)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors"
                        >
                          Book Session
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY BOOKED SESSIONS */}
          {activeTab === "bookings" && (
            <div className="space-y-4">
              {isLoadingBookings ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-500 text-xs mt-2 font-medium">Fetching scheduled sessions...</p>
                </div>
              ) : myBookings.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    📅
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">No Sessions Found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Schedule a session with an expert to start practicing.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("browse")}
                    className="bg-blue-600 text-white text-xs font-semibold px-5 py-2.5 rounded-lg"
                  >
                    Browse Experts
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={booking.expert.avatar}
                            alt={booking.expert.name}
                            className="w-12 h-12 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{booking.expert.name}</h4>
                            <p className="text-xs text-blue-600 font-medium">
                              {booking.expert.role} {booking.expert.company && `@ ${booking.expert.company}`}
                            </p>
                          </div>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {booking.status}
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-medium text-slate-400">Target Role:</span>
                          <span className="font-semibold text-slate-800">{booking.targetRole}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-medium text-slate-400">Date & Time:</span>
                          <span className="font-semibold text-blue-600">{booking.date} at {booking.time}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-medium text-slate-400">Paid Fee:</span>
                          <span className="font-bold text-slate-800">৳{booking.feeBDT?.toLocaleString()} BDT</span>
                        </div>
                      </div>

                      {/* Join Video Room Button (Routes to /room/[id]) */}
                      <button
                        type="button"
                        onClick={() => router.push(`/room/${booking.id}`)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-lg transition-colors"
                      >
                        Join Video Room
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* BOOKING MODAL */}
      {selectedExpert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-xl p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => {
                setSelectedExpert(null);
                setSelectedSlot(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              ✕
            </button>

            <div>
              <span className="text-xs text-blue-600 font-bold uppercase">Confirm Booking</span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">Practice with {selectedExpert.name}</h2>
              <p className="text-xs text-slate-500">{selectedExpert.role} @ {selectedExpert.company}</p>
            </div>

            {bookingSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center space-y-2">
                <div className="text-2xl">🎉</div>
                <h3 className="font-bold text-emerald-800 text-sm">Booking Confirmed!</h3>
                <p className="text-xs text-emerald-600">Your mock session has been recorded.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Target Role</label>
                  <input
                    type="text"
                    required
                    value={targetRoleInput}
                    onChange={(e) => setTargetRoleInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Select Slot</label>
                  {isLoadingSlots ? (
                    <div className="text-xs text-slate-500 text-center py-4">Fetching available slots...</div>
                  ) : !selectedExpert.slots || selectedExpert.slots.filter((s) => !s.isBooked).length === 0 ? (
                    <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-500 text-center">
                      No open slots available right now.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {selectedExpert.slots
                        .filter((s) => !s.isBooked)
                        .map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                              selectedSlot?.id === slot.id
                                ? "bg-blue-50 border-blue-600 text-blue-900 font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <div className="font-semibold">{slot.date}</div>
                            <div className="text-[10px] text-blue-600 mt-0.5">{slot.time}</div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Price</span>
                    <div className="text-base font-bold text-slate-900">
                      ৳{selectedExpert.priceBDT ? selectedExpert.priceBDT.toLocaleString() : "5,000"} BDT
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedSlot || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs py-3 px-6 rounded-lg transition-colors"
                  >
                    {isSubmitting ? "Booking..." : "Confirm & Pay"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}