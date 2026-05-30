"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/types";
import { authApi, setToken } from "@/lib/api";

interface AuthState {
  user: SessionUser | null;
  /** Authenticate against the backend; throws ApiError on failure. */
  signIn: (email: string, password: string) => Promise<SessionUser>;
  /** Register a new account; throws ApiError on failure. */
  register: (email: string, password: string, name?: string) => Promise<SessionUser>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      signIn: async (email, password) => {
        const res = await authApi.login(email, password);
        setToken(res.token);
        set({ user: res.user });
        return res.user;
      },

      register: async (email, password, name) => {
        const res = await authApi.register(email, password, name);
        setToken(res.token);
        set({ user: res.user });
        return res.user;
      },

      signOut: () => {
        setToken(null);
        set({ user: null });
      },
    }),
    {
      name: "dtm.auth",
    },
  ),
);
