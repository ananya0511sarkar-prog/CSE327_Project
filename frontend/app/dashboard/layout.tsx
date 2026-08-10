// app/dashboard/layout.tsx
"use client";
import ProtectedRoute from "@/components/ui/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {/* Every page under /dashboard renders inside here */}
      {children}
    </ProtectedRoute>
  );
}