"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getValidUser } from "@/lib/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getValidUser();

    if (user) {
      if (user.role === "expert") {
        router.replace("/expert/dashboard");
      } else {
        router.replace("/dashboard");
      }
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden bg-slate-950">
        <Image
          src="/space-bg.jpg"
          alt="Space Background"
          fill
          priority
          className="object-cover object-center z-0"
        />
        <div className="relative z-10 text-slate-300 font-mono text-xs tracking-wider">
          SYSTEM STATUS // VERIFYING AUTHENTICATION...
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
      {/* Re-using your exact full-screen space backdrop asset */}
      <Image
        src="/space-bg.jpg"
        alt="Space Background"
        fill
        priority
        className="object-cover object-center z-0"
      />
      {/* Content wrapper mounting children above layout graphics mask */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}