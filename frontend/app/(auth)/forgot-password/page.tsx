"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "student"

  // Step state: 1 = Request Email, 2 = Type New Password
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Handler for Step 1: Submitting Email to Backend
  const handleVerifyEmail = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // 🚀 Hit your backend's forgot-password route to see if the user exists
      const response = await fetch("http://localhost:8000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        // Move to the password input stage on the same page
        setStep(2)
      } else {
        setError(data.message || "This email is not registered in our system.")
      }
    } catch (err) {
      setError("Cannot reach authorization server.")
    } finally {
      setLoading(false)
    }
  }

  // Handler for Step 2: Submitting the New Password
  const handlePasswordUpdate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
  
// ADD THIS:(TO MAKE THE PASSWORD STRONGER)
const passwordRegex = /^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
if (!passwordRegex.test(newPassword)) {
  setError("Password must be at least 8 characters and include a special character (!@#$%^&* etc.)")
  return
}

    setLoading(true)
    setError("")

    try {
      // 🚀 Hit your backend's reset-password route to commit the update to Neon
      const response = await fetch("http://localhost:8000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage("🎉 Password updated successfully! Redirecting to login...")
        setTimeout(() => {
          router.push(`/login?role=${role}`)
        }, 2500)
      } else {
        setError(data.message || "Failed to update password.")
      }
    } catch (err) {
      setError("Failed to push update to server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto mt-20">
      <Card className="bg-slate-950/40 border-purple-500/30 backdrop-blur-xl shadow-2xl shadow-purple-950/40">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {step === 1 ? "Reset Password" : "Set New Password"}
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            {step === 1 
              ? "Enter your email to verify your identity" 
              : `Updating credentials for ${email}`
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {successMessage ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg p-4 text-center font-mono">
              {successMessage}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3 text-center font-mono">
                  {error}
                </div>
              )}

              {/* 🚪 STEP 1: Email Verification UI */}
              {step === 1 && (
                <form onSubmit={handleVerifyEmail} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 text-sm font-medium">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-purple-500/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/60 transition-colors text-sm"
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-semibold cursor-pointer">
                    {loading ? "Verifying..." : "Verify Email"}
                  </Button>
                </form>
              )}

              {/* 🔑 STEP 2: Password Reset UI */}
              {step === 2 && (
                <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 text-sm font-medium">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-purple-500/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/60 transition-colors text-sm"
                    />
                  </div>
                   
                  <p className="text-slate-500 text-xs -mt-2">
                       Min. 8 characters with at least one special character (!@#$%^&*)
                  </p>


                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 text-sm font-medium">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-purple-500/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/60 transition-colors text-sm"
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white font-semibold cursor-pointer">
                    {loading ? "Saving changes..." : "Update Password"}
                  </Button>
                </form>
              )}

              <div className="text-center mt-2">
                <Link href={`/login?role=${role}`} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}