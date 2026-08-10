"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getValidUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getValidUser();

    if (user) {
      if (user.role === "expert") {
        router.replace("/expert");
      } else {
        router.replace("/dashboard");
      }
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400 text-sm font-mono">
        VERIFYING AUTHENTICATION...
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
      <Image
        src="/space-bg.jpg"
        alt="Space Nebula Background"
        fill
        priority
        className="object-cover object-center z-0"
      />
      <Card className="relative w-full max-w-md bg-slate-950/40 border-purple-500/30 backdrop-blur-xl shadow-2xl shadow-purple-950/40 z-10 transition-all duration-300 hover:border-purple-500/50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Nova Nebula Dashboard
          </CardTitle>
          <CardDescription className="text-slate-300 mt-1 font-mono text-xs tracking-wider">
            SYSTEM STATUS // OPERATIONAL
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5">
          <p className="text-center text-sm text-slate-200 leading-relaxed font-medium">
            Welcome back. Your user interface theme is running flawlessly on top of the cosmic spectrum layout.
          </p>
          <Link href="/role" className="w-full">
            <Button className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:opacity-90 text-white font-semibold transition-all duration-300 shadow-lg shadow-purple-500/20 cursor-pointer">
              Access System
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}