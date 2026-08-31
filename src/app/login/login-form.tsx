"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "@/app/login/login.module.css";
import { Button, Input } from "@/components/ui";

export function LoginForm({ sessionMessage }: { sessionMessage?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    }).catch(() => null);

    setPending(false);
    if (!response) {
      setError("The Command Center could not be reached. Check your connection and try again.");
      return;
    }
    if (!response.ok) {
      setError("Those credentials were not accepted, or the session has expired.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <svg
            className={styles.mark}
            width="34"
            height="34"
            viewBox="0 0 26 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M13 2.4 22.4 13 13 23.6 3.6 13 13 2.4Z" />
            <path d="M13 7.6 18.4 13 13 18.4 7.6 13 13 7.6Z" opacity="0.55" />
            <path d="M13 2.4v21.2" strokeWidth="0.8" opacity="0.5" />
          </svg>
          <h1 className={styles.wordmark}>SHIVAYONIC</h1>
          <p className={styles.descriptor}>Command Center</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          {sessionMessage && !error ? (
            <p className={styles.notice}>{sessionMessage}</p>
          ) : null}
          {error ? (
            <p className={styles.alert} role="alert">
              {error}
            </p>
          ) : null}

          <Input label="Email" name="email" type="email" autoComplete="email" required />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />

          <Button type="submit" variant="primary" size="lg" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className={styles.footnote}>
          Private platform of Bholenath Productions and Shivayonic Music.
        </p>
      </div>
    </main>
  );
}
