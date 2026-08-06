# CESR Coach — cesrcoach.com

A consultant-led coaching platform for doctors pursuing the **CESR / Portfolio
Pathway** route to the GMC Specialist Register.

Built with **Next.js 16 (App Router) + Tailwind CSS 4 + Supabase**, styled with
a liquid-glass-morphism design system, and installable as a **PWA** (Add to
Home Screen on iOS & Android).

## Features

### Public site
- Animated liquid-glass landing page: hero, the three services, pathway
  steps, consultant team, FAQ, contact CTA.
- Services and team content are pulled live from the database, so admins can
  edit them without deployments.

### Member area (`/members`) — free registration
- **Video library** — pre-recorded presentations (YouTube / Vimeo / Loom /
  MP4 links), filterable by category, played in a glass modal.
- **Document library** — view-only PDFs opened in a protected reader window
  (see *Document protection* below).
- **Bookings** — every session is delivered **online**. Four formats:
  1. **Portfolio Clinic** (£499) — 30-minute one-to-one; the booking form
     *requires* a portfolio link and the member must acknowledge the **3-week
     advance access rule**. Sessions starting within 21 days can't be booked.
  2. **Portfolio Clinic Follow-up** (£100) — 30-minute one-to-one follow-up to
     the main clinic; no new portfolio lead time, since the reviewer already
     knows the portfolio.
  3. **Portfolio Preparation Session** (£250) — group workshops (2+
     participants).
  4. **Guidance to the Portfolio Pathway** (£200) — 4-hour orientation event.

  Prices are per person in GBP and editable in Admin → Settings.
  Capacity is enforced in the database; members can cancel; confirmed
  bookings reveal the meeting link.
- **Profile** — name, phone, specialty, GMC number.

### Admin console (`/admin`) — role-gated
- **Overview** dashboard with live stats and latest bookings.
- **Sessions** — schedule/edit/cancel/delete bookable sessions of each type.
- **Bookings** — confirm / complete / cancel, see portfolio links & member
  notes, keep private admin notes.
- **Videos / Documents** — full CRUD with publish toggles; documents upload
  straight to Supabase Storage.
- **Members** — search members, grant/revoke admin.
- **Settings** — site name, contact email, auto-admin email list, homepage
  consultant cards, and **logo upload** (see below).

### PWA
- Web app manifest + service worker (offline fallback page, cached shell).
- Custom install prompt on Android/desktop and an "Add to Home Screen" hint
  on iOS.

## Changing the logo

Two ways — pick whichever you prefer:

1. **No code:** Admin → Settings → *Upload new logo*. The file is stored in
   Supabase Storage and instantly overrides the default everywhere. One click
   reverts to the default.
2. **In the repo:** replace `public/branding/logo.svg` (header/footer logo)
   and `public/branding/logo-icon.svg` (square mark), then run `npm run icons`
   to regenerate the home-screen icons.

Site name, tagline and contact email live in `src/config/site.ts` (and can
also be overridden from Admin → Settings).

## Document protection

Uploaded documents open in `/reader/[id]` — a standalone window that renders
the PDF to `<canvas>` with pdf.js, so the browser's native PDF toolbar (and
its download/print buttons) never appears. The file itself is streamed through
`/api/documents/[id]/stream`, which re-checks the session on every request and
returns `no-store` — no signed storage URL ever reaches the browser, so there
is no link to copy or share.

Each page is stamped **into the pixels** with the viewer's name, email and the
time it was opened, so any screenshot or photograph identifies who leaked it.
On top of that the reader blocks right-click, copy, drag, Ctrl/Cmd+S and
Ctrl/Cmd+P, blanks itself on print, and blurs whenever the window loses focus.

**Limits, honestly:** no website can prevent a screenshot or a phone camera —
that capability doesn't exist in browsers. A technically capable user can also
recover the bytes from devtools. The watermark is the real control here: it
makes leaks traceable rather than impossible. Files linked as *external URLs*
(Google Drive etc.) bypass all of this — upload files directly to keep them
protected.

`pdfjs-dist` is intentionally pinned to **4.x**; v5/v6 rely on very new JS
APIs that even current Chromium lacks, which breaks the reader for many users.

## Payments (Stripe)

Bookings use a **pay-to-book** flow: booking a priced session creates a
pending booking and redirects to Stripe Checkout. Payment success (via
webhook) auto-confirms the booking; an abandoned/expired checkout releases
the seat. Free sessions (price empty/0) skip checkout and are confirmed
manually. Prices are edited in **Admin → Settings → Session pricing**.
Refunds are issued manually from the Stripe dashboard — the admin bookings
list flags paid-but-cancelled bookings that need one.

Required server env vars (Vercel → Project → Settings → Environment Variables):

| Variable | Where to find it |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys (`sk_test_…` first) |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Developers → Webhooks → endpoint signing secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API |

The webhook endpoint is `https://<your-domain>/api/stripe/webhook` and must
subscribe to `checkout.session.completed` and `checkout.session.expired`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run icons      # regenerate PWA icons after changing logo-icon.svg
```

Supabase credentials default to the production project and can be overridden
via `.env.local` (see `.env.example`).

## Admin access

Emails listed in the **admin emails** setting become admins automatically on
registration (`zemergentologist@gmail.com` is pre-seeded). Existing members
can be promoted from Admin → Members.

## Database

Everything lives in the Supabase project `CESR Coach`
(`wxllqckypgfqlhslhkkw`) in tables prefixed `coach_` (profiles, event types,
events, bookings, videos, documents, consultants, settings) with row-level
security throughout: members see published content and their own bookings;
admins manage everything. Storage buckets: `coach-branding` (public),
`coach-documents` (members, signed URLs), `coach-portfolios` (owner-only).
Booking capacity and role changes are enforced by database triggers.
