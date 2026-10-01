"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { USERNAME_PATTERN } from "@/lib/validation";

type Mode = "login" | "signup";

export function AuthForm({ mode, providers }: { mode: Mode; providers: ("google" | "discord")[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const identifier = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setLoading(true);
    try {
      if (mode === "signup") {
        const username = String(form.get("username") ?? "").trim();
        const confirm = String(form.get("confirm") ?? "");
        if (!USERNAME_PATTERN.test(username)) {
          setError("Usernames are 3–20 characters: letters, numbers and underscores.");
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          return;
        }
        if (password !== confirm) {
          setError("Passwords don't match.");
          return;
        }
        const { error } = await authClient.signUp.email({
          email: identifier,
          password,
          name: username,
          username,
          displayUsername: username,
        });
        if (error) {
          setError(error.message ?? "Couldn't create your account.");
          return;
        }
      } else {
        const result = identifier.includes("@")
          ? await authClient.signIn.email({ email: identifier, password })
          : await authClient.signIn.username({ username: identifier, password });
        if (result.error) {
          setError(result.error.message ?? "Invalid login.");
          return;
        }
      }
      router.push(mode === "signup" ? "/?welcome=1" : next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function social(provider: "google" | "discord") {
    setLoading(true);
    await authClient.signIn.social({ provider, callbackURL: next });
  }

  return (
    <div className="card mx-auto w-full max-w-[440px] px-6 py-10 sm:px-10">
      <h1 className="mb-8 text-center text-[22px] font-bold text-bright">{mode === "login" ? "Login" : "Sign up to tvlist"}</h1>
      {/* method="post" so a submit before hydration never puts credentials in the URL. */}
      <form onSubmit={onSubmit} method="post" className="space-y-4" noValidate>
        {mode === "signup" && (
          <input
            name="username"
            autoComplete="username"
            placeholder="Username"
            required
            minLength={3}
            maxLength={20}
            className="input-grey py-3"
            aria-label="Username"
          />
        )}
        <input
          name="identifier"
          type={mode === "signup" ? "email" : "text"}
          autoComplete={mode === "signup" ? "email" : "username"}
          placeholder={mode === "signup" ? "Email" : "Email or username"}
          required
          className="input-grey py-3"
          aria-label={mode === "signup" ? "Email" : "Email or username"}
        />
        <input
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="Password"
          required
          minLength={8}
          className="input-grey py-3"
          aria-label="Password"
        />
        {mode === "signup" && (
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            required
            className="input-grey py-3"
            aria-label="Confirm password"
          />
        )}
        {error && (
          <p role="alert" className="rounded bg-red/10 px-3 py-2 text-[13px] font-semibold text-red">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-[14px]">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Login" : "Sign Up"}
        </button>
      </form>

      {providers.length > 0 && (
        <>
          <div className="my-6 flex items-center gap-3 text-[12px] text-text-lighter">
            <span className="h-px flex-1 bg-fg-grey-dark" /> or <span className="h-px flex-1 bg-fg-grey-dark" />
          </div>
          <div className="grid gap-2">
            {providers.map((p) => (
              <button key={p} type="button" disabled={loading} onClick={() => social(p)} className="btn btn-secondary w-full py-3 capitalize">
                Continue with {p}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="mt-8 text-center text-[13px] text-text-lighter">
        {mode === "login" ? (
          <>
            Not registered?{" "}
            <Link href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-accent">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent">
              Login
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

/** Only allow same-site relative redirects after login. */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
