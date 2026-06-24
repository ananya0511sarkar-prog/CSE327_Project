"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Briefcase } from "lucide-react" // ADDED: Icon identifiers for roles

export default function RolePage() {
  const router = useRouter()

  return (
    <div className="w-full max-w-lg">
      <Card className="bg-slate-950/40 border-purple-500/30 backdrop-blur-xl shadow-2xl shadow-purple-950/40">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Who are you?
          </CardTitle>
          <CardDescription className="text-slate-300 font-mono text-xs tracking-wider mt-1">
            SELECT YOUR ROLE TO CONTINUE
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col sm:flex-row gap-4 mt-4">
          {/* ADDED: Dynamic Client Router navigation carrying role parameter strings */}
          {/* Student Selection Interaction Card */}
          <button
            onClick={() => router.push("/login?role=student")}
            className="flex-1 group flex flex-col items-center gap-3 p-6 rounded-xl border border-purple-500/20 bg-slate-900/40 hover:bg-purple-900/30 hover:border-purple-400/50 transition-all duration-300 cursor-pointer"
          >
            <div className="p-4 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-all">
              <GraduationCap className="w-8 h-8 text-blue-400" />
            </div>
            <span className="text-white font-bold text-lg">Student</span>
            <span className="text-slate-400 text-xs text-center leading-relaxed">
              Practice interviews, get AI mentorship, and ace your exams
            </span>
          </button>

          {/* Expert Selection Interaction Card */}
          <button
            onClick={() => router.push("/login?role=expert")}
            className="flex-1 group flex flex-col items-center gap-3 p-6 rounded-xl border border-purple-500/20 bg-slate-900/40 hover:bg-pink-900/30 hover:border-pink-400/50 transition-all duration-300 cursor-pointer"
          >
            <div className="p-4 rounded-full bg-pink-500/20 group-hover:bg-pink-500/30 transition-all">
              <Briefcase className="w-8 h-8 text-pink-400" />
            </div>
            <span className="text-white font-bold text-lg">Expert</span>
            <span className="text-slate-400 text-xs text-center leading-relaxed">
              Mentor students, conduct mock interviews, share your expertise
            </span>
          </button>
        </CardContent>
      </Card>
    </div>
  )
}