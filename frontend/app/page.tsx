
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
      
      {/* 🌌 High-Performance Full Screen Background Image */}
      <Image
        src="/space-bg.jpg"
        alt="Space Nebula Background"
        fill
        priority
        className="object-cover object-center z-0"
      />

      {/* 🪟 Frosted Glass UI Container floating over the space image */}
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
          
          {/* Custom Vibrant Matching Gradient Button */}
          <Button className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:opacity-90 text-white font-semibold transition-all duration-300 shadow-lg shadow-purple-500/20 cursor-pointer">
            Access System
          </Button>
        </CardContent>
      </Card>

    </div>
  )
}


/*import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
*/