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
- **Document library** — downloadable templates & guides served from private
  Supabase Storage via short-lived signed URLs.
- **Bookings** — members can book the three session formats:
  1. **Portfolio Clinic** — 30-minute one-to-one; the booking form *requires*
     a portfolio link and the member must acknowledge the **3-week advance
     access rule**. Sessions starting within 21 days can't be booked.
  2. **Portfolio Preparation Session** — group workshops (5+ participants).
  3. **Guidance to the Portfolio Pathway** — 4-hour orientation event.
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
