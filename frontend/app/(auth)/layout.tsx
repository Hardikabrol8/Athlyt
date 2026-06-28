import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Link href="/" className="text-2xl font-bold tracking-tight">
        Athlyt
      </Link>
      {children}
    </main>
  );
}
