import { site } from "@/config/site";

/**
 * Turns a Supabase auth error into something a visitor can act on.
 *
 * When the auth server answers with a gateway error (502/503/504, e.g. it
 * timed out sending the confirmation email) the client library has no message
 * to give and shows the raw text "{}". Other failures get a plain-English
 * version of what the server said.
 */
export function friendlyAuthError(
  error: { message?: string; status?: number; name?: string },
  action: "signup" | "signin" = "signin"
): string {
  const message = (error.message ?? "").trim();
  const status = error.status ?? 0;

  if (/error sending (confirmation|recovery|magic link|invite) email/i.test(message)) {
    return `We couldn't send your confirmation email just now. Please try again in a few minutes, or email us at ${site.contactEmail} and we'll help.`;
  }
  const noReadableMessage = message === "" || /^[{[]\s*[}\]]$/.test(message);
  if (noReadableMessage || status >= 500 || error.name === "AuthRetryableFetchError") {
    return action === "signup"
      ? `We couldn't finish creating your account just now — the service didn't respond. Please try again in a few minutes. If it keeps happening, email us at ${site.contactEmail} and we'll set you up.`
      : "We couldn't reach the sign-in service just now. Please try again in a moment.";
  }
  if (/rate limit|too many requests|after \d+ seconds/i.test(message)) {
    return "Too many attempts in a short time. Please wait a few minutes and try again.";
  }
  if (/already registered|already been registered/i.test(message)) {
    return "An account with this email already exists. Try signing in instead.";
  }
  return message;
}
