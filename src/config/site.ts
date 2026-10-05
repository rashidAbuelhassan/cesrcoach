/**
 * Central site configuration — edit this file to rebrand the site.
 *
 * LOGO: to change the logo, either
 *   1. Replace the files in `public/branding/` (logo.svg = full logo,
 *      logo-icon.svg = square mark used for PWA icons), then run
 *      `npm run icons` to regenerate the home-screen icons, OR
 *   2. Upload a new logo from the Admin → Settings page — it overrides
 *      the file below without touching the code.
 */
export const site = {
  name: "CESR Coach",
  tagline: "Your route to the Specialist Register",
  description:
    "A group of experienced consultants guiding doctors through the CESR / Portfolio Pathway route to the GMC Specialist Register. Portfolio clinics, preparation sessions and pathway guidance events.",
  url: "https://cesrcoach.com",
  logo: "/branding/logo.svg",
  logoIcon: "/branding/logo-icon.svg",
  contactEmail: "hello@cesrcoach.com",
};

/**
 * Who is legally behind the site. Shown in the Privacy Policy and Terms.
 * UK law expects an online trader to publish its legal name and a postal
 * address — fill `entity`, `companyNumber` and `address` in once known; any
 * line left empty is simply not shown.
 */
export const legal = {
  /** e.g. "CESR Coach Ltd" — falls back to the trading name when empty. */
  entity: "",
  /** Companies House number, if registered. */
  companyNumber: "",
  /** Registered / correspondence address. */
  address: "",
  /** Shown as "Last updated" on both pages. */
  updated: "5 October 2026",
  /** Where privacy requests go; defaults to the general contact address. */
  privacyEmail: "",
};

/** Our sister app for day-to-day portfolio tracking. */
export const companion = {
  name: "CESR Companion",
  url: "https://cesrcompanion.co.uk",
  blurb:
    "Track your evidence, logbook and curriculum checklists day to day, between your coaching sessions.",
};
