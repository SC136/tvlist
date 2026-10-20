"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { requestPasswordReset } from "@/actions/auth";
import { Page } from "@/components/ui/basics";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await requestPasswordReset(identifier);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSubmitted(true);
      if (res.data?.resetUrl) {
        setDevResetUrl(res.data.resetUrl);
      }
    });
  };

  return (
    <Page className="flex min-h-[70vh] items-center">
      <div className="card mx-auto w-full max-w-[440px] p-6 sm:p-10">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <KeyRound className="h-6 w-6" />
          </div>
        </div>

        <h1 className="text-center text-[22px] font-bold text-bright">Forgot Password</h1>
        <p className="mt-2 text-center text-[13px] text-text-light">
          Enter your email address or username and we&apos;ll send you a link to reset your password.
        </p>

        {submitted ? (
          <div className="mt-6 space-y-4 text-center">
            <div className="flex justify-center text-green">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-[14px] font-semibold text-bright">Password Reset Link Prepared</p>
            <p className="text-[13px] text-text-light">
              If an account with that username or email exists, a password reset link has been issued.
            </p>

            {devResetUrl && (
              <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 p-4 text-left">
                <p className="text-[12px] font-bold text-accent uppercase tracking-wider">
                  Direct Reset Link (Local Development)
                </p>
                <p className="mt-1 text-[12px] text-text-light">
                  Click below to proceed directly to set a new password:
                </p>
                <Link
                  href={devResetUrl}
                  className="btn btn-primary mt-3 flex w-full justify-center py-2 text-[13px]"
                >
                  Proceed to Reset Password →
                </Link>
              </div>
            )}

            <div className="pt-4">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or username"
                required
                className="input-grey py-3"
                aria-label="Email or username"
              />
            </div>

            {error && (
              <p role="alert" className="rounded bg-red/10 px-3 py-2 text-[13px] font-semibold text-red">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary w-full py-3 text-[14px]">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Reset Link
            </button>

            <div className="pt-2 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-lighter hover:text-accent">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </Page>
  );
}
