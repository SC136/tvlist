"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center pt-[100px] text-center">
      <p className="text-[48px] font-extrabold text-red">Oops</p>
      <h1 className="mt-2 text-[20px] font-bold text-bright">Something went wrong.</h1>
      <p className="mt-2 max-w-md text-[14px] text-text-lighter">
        It might be a hiccup talking to TMDB or the database. Try again in a moment.
        {error.digest && <span className="mt-1 block text-[11px]">Error ID: {error.digest}</span>}
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
