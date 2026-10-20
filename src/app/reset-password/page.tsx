"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { resetPasswordWithToken } from "@/actions/auth";
import { Page } from "@/components/ui/basics";

export default function ResetPasswordPage() {
  return (
    <Page className="flex min-h-[70vh] items-center">
      <Suspense fallback={<div className="mx-auto text-center text-text-lighter"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}>
        <ResetPasswordForm />
      </Suspense>
    </Page>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, start] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("No reset token found. Please check your reset link or request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    start(async () => {
      const res = await resetPasswordWithToken(token, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    });
  };

  return (
    <div className="card mx-auto w-full max-w-[440px] p-6 sm:p-10">
      <div className="mb-6 flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <KeyRound className="h-6 w-6" />
        </div>
      </div>

      <h1 className="text-center text-[22px] font-bold text-bright">Reset Password</h1>
      <p className="mt-2 text-center text-[13px] text-text-light">
        Choose a new password for your Omnilist account.
      </p>

      {success ? (
        <div className="mt-6 space-y-4 text-center">
          <div className="flex justify-center text-green">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="text-[15px] font-bold text-bright">Password Updated Successfully!</p>
          <p className="text-[13px] text-text-light">
            Your password has been changed. Redirecting to login…
          </p>
          <div className="pt-2">
            <Link href="/login" className="btn btn-primary inline-flex py-2.5 px-6 text-[13px]">
              Go to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!token && (
            <div className="rounded bg-orange/15 p-3 text-[13px] text-bright">
              Missing reset token. Please check your reset link or{" "}
              <Link href="/forgot-password" className="font-bold underline">
                request a new one
              </Link>
              .
            </div>
          )}

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-text-light">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="input-grey py-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-text-light">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your new password"
              required
              minLength={8}
              className="input-grey py-3"
            />
          </div>

          {error && (
            <p role="alert" className="rounded bg-red/10 px-3 py-2 text-[13px] font-semibold text-red">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !token}
            className="btn btn-primary w-full py-3 text-[14px]"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Set New Password
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-[13px] font-semibold text-text-lighter hover:text-accent"
            >
              Cancel and return to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
