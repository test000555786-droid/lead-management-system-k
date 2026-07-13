"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left pane: Branding & Visuals (Hidden on small screens) */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Subtle background glow/gradient */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--crm-accent)]/30 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--crm-accent)] flex items-center justify-center text-white shadow-lg shadow-[var(--crm-accent)]/20">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Lead CRM</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-medium leading-[1.1] tracking-tight">
            Streamline your <span className="text-[var(--crm-accent-tint)]">lead management</span> effortlessly.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            The all-in-one platform to track, engage, and convert leads into lifelong customers.
          </p>
        </div>
        
        <div className="relative z-10 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Lead CRM. All rights reserved.
        </div>
      </div>

      {/* Right pane: Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-slate-50 lg:bg-white relative">
        <div className="w-full max-w-[400px] space-y-8">
          
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <div className="lg:hidden mx-auto mb-4 h-12 w-12 rounded-xl bg-[var(--crm-accent)] flex items-center justify-center text-white shadow-sm">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 text-slate-900 focus-visible:ring-[var(--crm-accent)] shadow-sm rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-white border-slate-200 text-slate-900 focus-visible:ring-[var(--crm-accent)] shadow-sm rounded-lg"
              />
            </div>
            
            {error && (
              <div className="p-3 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium bg-[var(--crm-accent)] hover:bg-[var(--crm-accent-hover)] text-white shadow-md shadow-[var(--crm-accent)]/20 transition-all rounded-lg mt-2" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          
        </div>
      </div>
    </div>
  );
}
