import Link from 'next/link';

export default function DashboardPage() {
  // Mock data for previous projects
  const previousProjects = [
    {
      id: 1,
      title: "Project 1: FAANG Coding Challenges",
      status: "Complete",
      statusColor: "text-emerald-600 bg-emerald-50",
      score: "85% Score",
      summary: "FAANG Coding Challenges, project structure of coding challenges and discuss design contents and project..."
    },
    {
      id: 2,
      title: "Project 2: System Design for Scale",
      status: "Complete",
      statusColor: "text-emerald-600 bg-emerald-50",
      score: "78% Score",
      summary: "System Design for Scale to consent project, design interior connection and near-code interviews and projects..."
    },
    {
      id: 3,
      title: "Project 3: Behavioral Questions Practice",
      status: "In Progress",
      statusColor: "text-amber-600 bg-amber-50",
      score: "60% Complete",
      summary: "Behavioral questions practice, and interaction-relevant behavioral questions practice in behavioral practices."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* MAIN CONTAINER */}
      <div className="flex flex-1">
        
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shrink-0">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2 px-2 py-4 text-white text-xl font-bold tracking-tight">
              <span className="text-blue-500 text-2xl font-black">X</span> InterviewX
            </div>

            {/* Profile Brief */}
            <div className="flex flex-col items-center text-center my-6 border-b border-slate-800 pb-6">
              <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-3 overflow-hidden border-2 border-slate-600">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 2.654 1.057 5.063 2.769 6.843.048.05.084.111.104.177A11.966 11.966 0 0012 21c2.569 0 4.978-.813 6.953-2.195a.23.23 0 01.1-.114zM12 6.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-base">John Doe</h3>
              <p className="text-xs text-slate-500 mt-0.5">Aspiring Software Engineer</p>
            </div>

            {/* Nav Routes */}
            <nav className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800 text-white font-medium text-sm transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
                Dashboard
              </Link>
              <Link href="/dashboard/projects" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                Projects
              </Link>
              <Link href="/dashboard/mock-interviews" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Mock Interviews
              </Link>
              <Link href="/dashboard/resources" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Resources
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Profile
              </Link>
              <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white text-slate-400 font-medium text-sm transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM12 15a3 3 0 100-6 3 3 0 000 6z" /></svg>
                Settings
              </Link>
            </nav>
          </div>

          {/* Log Out Button */}
          <button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors focus:outline-none">
            Log Out
          </button>
        </aside>

        {/* MAIN DASHBOARD SPACE */}
        <main className="flex-1 p-8 overflow-y-auto">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              InterviewX Dashboard
            </h1>
          </header>

          {/* TWO VERTICAL SECTIONS (RESUME STYLE MAP) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* LEFT SECTION: USER INFO & RESUME SUMMARY */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
                User Info & Summary
              </h2>
              
              {/* Profile Meta Row */}
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <div className="w-24 h-28 bg-slate-100 rounded-md shrink-0 flex items-center justify-center text-slate-300 border border-slate-200 overflow-hidden">
                  {/* Generic avatar matching image placement */}
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <h3 className="text-2xl font-bold text-slate-900">John Doe</h3>
                  <p className="font-semibold text-slate-800">Contact info</p>
                  <p className="flex items-center gap-2">✉ johndoe@email.com</p>
                  <p className="flex items-center gap-2">📞 (555) 123-4567</p>
                  <Link href="#" className="text-blue-600 hover:underline inline-block">in LinkedIn</Link>
                </div>
              </div>

              {/* Summary Paragraph */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Summary</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  John is a dedicated professional utilizing simulation software to build a structured approach 
                  to coding framework experiences, while enhancing systems engineering practices. Has vast analytical skills 
                  and client-facing competencies looking forward to landing roles inside core developer environments.
                </p>
              </div>

              {/* Tech Stack List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Tech Stack & Skills</h4>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-1">
                  <li>APIs & Software Engineering</li>
                  <li>Python & Deep Learning</li>
                  <li>System Design Architecture</li>
                  <li>JavaScript / TypeScript</li>
                  <li>Next.js Framework</li>
                  <li>PostgreSQL & SQL Databases</li>
                </ul>
              </div>
            </section>

            {/* RIGHT SECTION: PROJECTS HUB */}
            <section className="space-y-6">
              
              {/* Box A: Create New Project */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">My Interview Projects</h2>
                <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 group">
                  <span className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">+</span>
                  Create New Interview Project
                </button>
              </div>

              {/* Box B: Previous Projects list */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Previous Projects
                </h2>
                
                <div className="space-y-3">
                  {previousProjects.map((project) => (
                    <div key={project.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {project.title}
                        </h4>
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded">
                          {project.score}
                        </span>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-2 ${project.statusColor}`}>
                        {project.status}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">
                        <span className="font-semibold text-slate-700">Summary: </span>
                        {project.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </section>
          </div>
        </main>
      </div>

      {/* FOOTER BAR */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs space-y-2">
        <div className="flex justify-center gap-6 text-slate-300">
          <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        </div>
        <div>
          Copyright © 2026 <span className="text-slate-300 font-medium">Interview Prep Platform</span>. All rights reserved.
        </div>
      </footer>
    </div>
  );
}