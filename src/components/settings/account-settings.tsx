"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { validatePasswordStrength } from "@/lib/validation";

export function AccountSettings({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [newEmail, setNewEmail] = useState(email);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [deletePw, setDeletePw] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [delMsg, setDelMsg] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <section className="card space-y-4 p-6">
        <h2 className="text-[16px] font-bold text-bright">Email</h2>
        <div className="flex gap-2">
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="input-grey" aria-label="Email" />
          <button
            type="button"
            disabled={pending || newEmail.trim() === email}
            onClick={() =>
              start(async () => {
                const { error } = await authClient.changeEmail({ newEmail: newEmail.trim() });
                setEmailMsg(error ? { ok: false, text: error.message ?? "Couldn't change email." } : { ok: true, text: "Email updated." });
                if (!error) router.refresh();
              })
            }
            className="btn btn-primary shrink-0"
          >
            Update
          </button>
        </div>
        {emailMsg && <p className={cn("text-[13px] font-semibold", emailMsg.ok ? "text-green" : "text-red")}>{emailMsg.text}</p>}
      </section>

      {hasPassword && (
        <section className="card space-y-4 p-6">
          <h2 className="text-[16px] font-bold text-bright">Change Password</h2>
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" className="input-grey" />
          <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (8+ characters)" className="input-grey" />
          <div className="flex items-center justify-end gap-3">
            {pwMsg && <span className={cn("text-[13px] font-semibold", pwMsg.ok ? "text-green" : "text-red")}>{pwMsg.text}</span>}
            <button
              type="button"
              disabled={pending || !current || !next}
              onClick={() => {
                const check = validatePasswordStrength(next);
                if (!check.valid) {
                  setPwMsg({ ok: false, text: check.error ?? "Password is too simple." });
                  return;
                }
                start(async () => {
                  const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
                  setPwMsg(error ? { ok: false, text: error.message ?? "Couldn't change password." } : { ok: true, text: "Password changed. Other sessions were signed out." });
                  if (!error) {
                    setCurrent("");
                    setNext("");
                  }
                });
              }}
              className="btn btn-primary px-6"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Change Password
            </button>
          </div>
        </section>
      )}

      <section className="card space-y-4 border border-red/30 p-6">
        <h2 className="text-[16px] font-bold text-red">Delete Account</h2>
        <p className="text-[13px] text-text-light">
          This permanently deletes your profile, lists, diary, reviews, activity and everything else. Export your data first if you want a copy.
        </p>
        {hasPassword && (
          <input type="password" autoComplete="current-password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} placeholder="Your password" className="input-grey" />
        )}
        <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder='Type "delete my account" to confirm' className="input-grey" />
        {delMsg && <p className="text-[13px] font-semibold text-red">{delMsg}</p>}
        <div className="flex justify-end">
          <button
            type="button"
            disabled={pending || confirmText.trim().toLowerCase() !== "delete my account" || (hasPassword && !deletePw)}
            onClick={() =>
              start(async () => {
                const { error } = await authClient.deleteUser(hasPassword ? { password: deletePw } : {});
                if (error) return setDelMsg(error.message ?? "Couldn't delete your account.");
                router.push("/");
                router.refresh();
              })
            }
            className="btn btn-danger px-6"
          >
            Delete My Account
          </button>
        </div>
      </section>
    </div>
  );
}
