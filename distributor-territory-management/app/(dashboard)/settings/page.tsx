"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  Database,
  Key,
  LogOut,
  Mail,
  RefreshCcw,
  Save,
  Shield,
  User2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/authStore";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const [saved, setSaved] = useState(false);

  const resetDemoData = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("dtm.territories");
    window.localStorage.removeItem("dtm.distributors");
    window.location.reload();
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace preferences and account configuration.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User2 className="h-4 w-4 text-indigo-400" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input id="full-name" defaultValue={user?.name ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue={user?.role ?? "Territory Admin"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input id="region" defaultValue="Karachi, Pakistan" />
              </div>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="gradient" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Save profile
              </Button>
              {saved && (
                <Badge variant="success">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Saved
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-400" />
              Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace">Workspace name</Label>
              <Input id="workspace" defaultValue="Acme Distribution" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Default city</Label>
                <Input id="city" defaultValue="Karachi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" defaultValue="USD" />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Email alerts</div>
                  <div className="text-xs text-muted-foreground">
                    Get notified when a distributor falls below target.
                  </div>
                </div>
                <Badge variant="success" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Weekly digest</div>
                  <div className="text-xs text-muted-foreground">
                    Summary report delivered every Monday.
                  </div>
                </div>
                <Badge variant="info" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-400" />
              Demo data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The demo persists territories and distributors locally in this browser. Reset to restore the original seed.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={resetDemoData}>
                <RefreshCcw className="h-4 w-4" />
                Reset demo data
              </Button>
              <Badge variant="muted">
                <Database className="h-3 w-3" />
                LocalStorage backend
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-rose-400" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Key className="h-4 w-4" />
                Single sign-on
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Connect your IdP (Okta, Azure AD) for enterprise SSO. Available on production plans.
              </p>
            </div>
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
