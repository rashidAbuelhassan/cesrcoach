"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ENQUIRY_LIMITS,
  ENQUIRY_STAGES,
  validateEnquiry,
  type EnquiryErrors,
  type EnquiryInput,
} from "@/lib/contact";

const empty: EnquiryInput = {
  name: "",
  email: "",
  phone: "",
  specialty: "",
  stage: "",
  question: "",
};

export default function ContactForm({ contactEmail }: { contactEmail: string }) {
  const [values, setValues] = useState<EnquiryInput>(empty);
  const [trap, setTrap] = useState("");
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  const openedAt = useRef<number | null>(null);

  const set = (key: keyof EnquiryInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    openedAt.current ??= Date.now();
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const found = validateEnquiry(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      // take people to the first thing to fix
      const first = Object.keys(found)[0];
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          website: trap,
          elapsed: openedAt.current ? Date.now() - openedAt.current : 0,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setServerError(data.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }
      setSentTo(values.email.trim());
      setValues(empty);
      setStatus("sent");
    } catch {
      setServerError("We couldn't reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="glass rounded-3xl p-8 text-center sm:p-10" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl">
          ✓
        </span>
        <h2 className="mt-5 text-2xl font-bold">Thanks, we&apos;ve got your question</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-mist/84">
          We&apos;ll reply to <strong className="text-mist">{sentTo}</strong>. If
          nothing arrives, check your spam folder or write to{" "}
          <a className="underline underline-offset-2 hover:text-white" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-ghost px-6 py-2.5 text-sm">
            Back to the homepage
          </Link>
          <Link href="/register" className="btn-liquid px-6 py-2.5 text-sm">
            Create a free account
          </Link>
        </div>
      </div>
    );
  }

  const L = ENQUIRY_LIMITS;
  const fieldError = (key: keyof EnquiryInput) =>
    errors[key] ? (
      <p id={`contact-${key}-error`} className="mt-1.5 text-xs font-medium text-white">
        ⚠ {errors[key]}
      </p>
    ) : null;
  const aria = (key: keyof EnquiryInput) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `contact-${key}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="glass space-y-5 rounded-3xl p-6 sm:p-8">
      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-medium"
        >
          {serverError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact-name">
            Your name <span aria-hidden>*</span>
          </label>
          <input
            id="contact-name"
            className="field"
            autoComplete="name"
            maxLength={L.name.max}
            value={values.name}
            onChange={set("name")}
            {...aria("name")}
          />
          {fieldError("name")}
        </div>
        <div>
          <label className="label" htmlFor="contact-email">
            Email address <span aria-hidden>*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            inputMode="email"
            className="field"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={L.email.max}
            value={values.email}
            onChange={set("email")}
            {...aria("email")}
          />
          {fieldError("email")}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact-phone">
            Phone <span className="font-normal text-mist/77">(optional)</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            className="field"
            autoComplete="tel"
            maxLength={L.phone.max}
            value={values.phone}
            onChange={set("phone")}
            {...aria("phone")}
          />
          {fieldError("phone")}
        </div>
        <div>
          <label className="label" htmlFor="contact-specialty">
            Specialty <span className="font-normal text-mist/77">(optional)</span>
          </label>
          <input
            id="contact-specialty"
            className="field"
            placeholder="e.g. Emergency Medicine"
            maxLength={L.specialty.max}
            value={values.specialty}
            onChange={set("specialty")}
            {...aria("specialty")}
          />
          {fieldError("specialty")}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="contact-stage">
          Where are you at? <span className="font-normal text-mist/77">(optional)</span>
        </label>
        <select
          id="contact-stage"
          className="field"
          value={values.stage}
          onChange={set("stage")}
        >
          <option value="">Choose one…</option>
          {ENQUIRY_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="contact-question">
          Your question <span aria-hidden>*</span>
        </label>
        <textarea
          id="contact-question"
          rows={6}
          className="field resize-y"
          placeholder="What would you like to know?"
          maxLength={L.question.max}
          value={values.question}
          onChange={set("question")}
          {...aria("question")}
        />
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <div>{fieldError("question")}</div>
          <span className="shrink-0 text-xs tabular-nums text-mist/77">
            {values.question.length}/{L.question.max}
          </span>
        </div>
      </div>

      {/* Trap for bots: people never see or fill this. */}
      <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Leave this empty</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-liquid w-full py-3 text-sm sm:w-auto sm:px-10"
        >
          {status === "sending" ? "Sending…" : "Send my question"}
        </button>
        <p className="text-xs leading-relaxed text-mist/80">
          We use your details only to answer your question. Nothing is shared or
          added to a mailing list. See our{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
