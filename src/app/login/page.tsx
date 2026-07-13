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
    <div className="flex min-h-screen items-center justify-center bg-[var(--crm-bg)] p-4">
      <Card className="w-full max-w-sm shadow-md rounded-xl border-[var(--crm-border)]">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-[var(--crm-accent)] flex items-center justify-center text-white shadow-sm">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-[var(--crm-text-primary)]">Lead CRM</CardTitle>
            <CardDescription className="text-[var(--crm-text-secondary)] mt-1">Sign in with your staff credentials</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--crm-text-primary)]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-[var(--crm-accent)] border-[var(--crm-border)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--crm-text-primary)]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-[var(--crm-accent)] border-[var(--crm-border)]"
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded-md text-center">{error}</p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-[var(--crm-accent)] hover:bg-[var(--crm-accent-hover)] text-white shadow-sm" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
