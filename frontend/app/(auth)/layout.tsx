import Image from "next/image"

// ADDED: Root structural context wrapper for entire authorization route group
export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
  )
}