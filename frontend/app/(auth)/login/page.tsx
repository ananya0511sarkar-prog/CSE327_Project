"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Briefcase, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const role = searchParams.get("role") || "student"
  const isExpert = role === "expert"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("") 

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    setError(""); 

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 🚀 Extract the true role saved in Neon PostgreSQL
        const trueRole = data.user.role.toLowerCase();
        const expectedRole = role.toLowerCase();

        // Optional safety check: Ensure they are logging into the correct portal layout
        if (trueRole !== expectedRole) {
          setError(`This account is registered as a ${trueRole}. Please use the correct portal link.`);
          return;
        }

        // Send them to their dedicated live dashboards safely
        if (trueRole === "expert") {
          router.push("/expert-dashboard");
        } else {
          router.push("/dashboard"); // or /student-dashboard depending on your naming convention
        }
      } else {
        setError(data.message || "Invalid email or password configuration.");
      }
    } catch (err) {
      setError("Could not connect to the authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="bg-slate-950/40 border-purple-500/30 backdrop-blur-xl shadow-2xl shadow-purple-950/40">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-3 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider w-fit
            ${isExpert ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"}`}>
            {isExpert ? <Briefcase className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
            {isExpert ? "EXPERT PORTAL" : "STUDENT PORTAL"}
          </div>
          <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome back
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Sign in to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3 text-center font-mono">
                {error}
              </div>
            )}

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

            <div className="text-right -mt-2">
              <Link
                href={`/forgot-password?role=${role}`}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:opacity-90 text-white font-semibold transition-all duration-300 shadow-lg shadow-purple-500/20 cursor-pointer mt-1"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-slate-400 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href={`/signup?role=${role}`}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Sign up
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