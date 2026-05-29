"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Map as MapIcon, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useHydrated } from "@/hooks/useHydrated";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(4, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useAuthStore((s) => s.user);
  const signIn = useAuthStore((s) => s.signIn);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (hydrated && user) router.replace("/dashboard");
  }, [hydrated, user, router]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    signIn({
      email: values.email,
      name: values.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      role: "Territory Admin",
    });
    router.replace("/dashboard");
  };

  const fillDemo = () => {
    setValue("email", "admin@distributor.app");
    setValue("password", "demo1234");
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-12 h-96 w-96 rounded-full bg-indigo-500/30 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[26rem] w-[26rem] rounded-full bg-teal-400/20 blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 h-[32rem] w-[32rem] rounded-full bg-violet-500/20 blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      </div>

      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
        <div className="hidden flex-col gap-8 lg:flex">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 shadow-lg shadow-indigo-500/30">
              <MapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Enterprise GIS</p>
              <h2 className="text-xl font-semibold">TerritoryOS</h2>
            </div>
          </div>
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Distributor coverage, beautifully visualized
            </span>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Draw, assign, and monitor every <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-teal-300 bg-clip-text text-transparent">distributor territory</span> in one map.
            </h1>
            <p className="max-w-md text-muted-foreground">
              A premium SaaS GIS dashboard for sales operations teams — purpose-built to streamline coverage planning,
              distributor onboarding, and performance tracking.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { v: "8", l: "Territories" },
              { v: "$1.87M", l: "Monthly Sales" },
              { v: "1.2K", l: "Active Outlets" },
            ].map((s) => (
              <div key={s.l} className="glass gradient-border rounded-xl p-4">
                <div className="text-2xl font-semibold">{s.v}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass gradient-border relative w-full rounded-2xl p-8 shadow-2xl shadow-black/40 animate-fade-in">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400">
              <MapIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold">TerritoryOS</h2>
          </div>

          <h3 className="text-2xl font-semibold tracking-tight">Welcome back</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage your distributor network.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={fillDemo}>
              Use demo credentials
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo build · no real authentication · data persisted locally
          </p>
        </div>
      </div>
    </main>
  );
}
