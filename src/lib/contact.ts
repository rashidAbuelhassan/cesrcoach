/** Shared by the contact form (browser) and /api/contact (server). */

export const ENQUIRY_STAGES = [
  "Just finding out about CESR",
  "Building my portfolio",
  "Getting ready to submit",
  "Resubmitting after feedback",
  "Something else",
] as const;

export const ENQUIRY_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  phone: { max: 30 },
  specialty: { max: 80 },
  question: { min: 10, max: 2000 },
} as const;

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface EnquiryInput {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  stage: string;
  question: string;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryInput, string>>;

/** Same rules the database enforces, so people get a friendly message first. */
export function validateEnquiry(v: EnquiryInput): EnquiryErrors {
  const e: EnquiryErrors = {};
  const L = ENQUIRY_LIMITS;
  const name = v.name.trim();
  const email = v.email.trim();
  const question = v.question.trim();

  if (name.length < L.name.min) e.name = "Please tell us your name.";
  else if (name.length > L.name.max) e.name = `Keep your name under ${L.name.max} characters.`;

  if (!EMAIL_PATTERN.test(email) || email.length > L.email.max) {
    e.email = "Enter an email address we can reply to.";
  }
  if (v.phone.trim().length > L.phone.max) e.phone = "That phone number looks too long.";
  if (v.specialty.trim().length > L.specialty.max) {
    e.specialty = `Keep this under ${L.specialty.max} characters.`;
  }
  if (question.length < L.question.min) {
    e.question = "Tell us a little more so we can answer properly.";
  } else if (question.length > L.question.max) {
    e.question = `Please keep your question under ${L.question.max} characters.`;
  }
  return e;
}
