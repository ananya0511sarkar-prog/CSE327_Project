"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Briefcase, Eye, EyeOff } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "student"
  const isExpert = role === "expert"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("") // ADDED: Hook mapping local data validation error notifications

  const handleSignup = async (e: React.SyntheticEvent<HTMLFormElement>) => {
  e.preventDefault()
  
  if (password !== confirm) {
    setError("Passwords don't match")
    return
  }
  // ADD THIS BLOCK:(TO MAKE THE PASSWORD STRONGER)
const passwordRegex = /^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
if (!passwordRegex.test(password)) {
    setError("Password must be at least 8 characters and include a special character (!@#$%^&* etc.)")
    return
}
  setError("")
  setLoading(true)

  try {
    // 🚀 HIT YOUR RECENTLY UPDATED NEON BACKEND ENDPOINT
    const response = await fetch("http://localhost:8000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
        role: role,
      }),
    })

    const data = await response.json()

    if (data.success) {
      // Successfully wrote to Neon! Redirect them to login
      router.push(`/login?role=${role}`)
    } else {
      // Show backend error message (e.g. "An account with this email already exists.")
      setError(data.message || "Something went wrong during signup.")
    }
  } catch (err) {
    console.error("Signup network crash error:", err)
    setError("Cannot connect to authorization server. Is your backend running?")
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="w-full max-w-md">
      <Card className="bg-slate-950/40 border-purple-500/30 backdrop-blur-xl shadow-2xl shadow-purple-950/40">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-3 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider w-fit
            ${isExpert ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"}`}>
            {isExpert ? <Briefcase className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
            {isExpert ? "EXPERT REGISTRATION" : "STUDENT REGISTRATION"}
          </div>
          <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create account
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Join as a{isExpert ? "n expert mentor" : " student"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-purple-500/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/60 transition-colors text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-purple-500/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/60 transition-colors text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-purple-500/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/60 transition-colors text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
              {/* ADD HINT HERE */}
          <p className="text-slate-500 text-xs -mt-2">
            Min. 8 characters with at least one special character (!@#$%^&*)
          </p>
            {/* ADDED: Supplementary validation confirm structure verification framework */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-purple-500/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/60 transition-colors text-sm"
              />
            </div>

            {/* ADDED: Render box node displaying mismatch alerts conditionally */}
            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}
            
          

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:opacity-90 text-white font-semibold transition-all duration-300 shadow-lg shadow-purple-500/20 cursor-pointer mt-1"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-center text-slate-400 text-sm">
              Already have an account?{" "}
              <Link
                href={`/login?role=${role}`}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>

            <p className="text-center text-slate-500 text-xs">
              Wrong role?{" "}
              <Link href="/role" className="text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-2">
                Go back
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}