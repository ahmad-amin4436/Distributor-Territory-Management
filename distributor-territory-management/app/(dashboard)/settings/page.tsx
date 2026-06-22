"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  Key,
  LogOut,
  Save,
  Shield,
  User2,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { authApi, ApiError } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const [saved, setSaved] = useState(false);

  // --- Add user form state ---
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [addStatus, setAddStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [addingUser, setAddingUser] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setAddStatus({ type: "error", message: "Enter a valid email address." });
      return;
    }
    if (newPassword.length < 4) {
      setAddStatus({ type: "error", message: "Password must be at least 4 characters." });
      return;
    }

    setAddingUser(true);
    setAddStatus(null);
    try {
      await authApi.register(newEmail, newPassword, newName || undefined);
      setAddStatus({ type: "success", message: `User ${newEmail} added successfully.` });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setAddStatus({ type: "error", message: `${newEmail} is already registered.` });
      } else {
        setAddStatus({
          type: "error",
          message: (err as Error).message || "Failed to add user.",
        });
      }
    } finally {
      setAddingUser(false);
    }
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
        {/* Profile */}
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
                <Input id="role" defaultValue={user?.role ?? "Territory Admin"} readOnly />
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

        {/* Workspace */}
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
                <Input id="currency" defaultValue="PKR" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              User management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Current session */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Signed-in user
                </p>
                <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 text-sm font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{user?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{user?.email ?? "—"}</div>
                    </div>
                    <Badge variant="info" className="ml-auto capitalize">
                      {user?.role ?? "user"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Add user form */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Add new user
                </p>
                <form onSubmit={handleAddUser} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-name">Full name</Label>
                      <Input
                        id="new-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new-role">Role</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger id="new-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="jane@company.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="pr-9"
                      />
                      <button
                        type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {addStatus && (
                    <p
                      className={`text-xs rounded-md px-3 py-2 border ${
                        addStatus.type === "success"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      {addStatus.message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={addingUser}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4" />
                    {addingUser ? "Adding user…" : "Add user"}
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="lg:col-span-2">
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
