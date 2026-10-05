import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { getBranding } from "@/lib/settings";
import { legal, site } from "@/config/site";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How CESR Coach collects, uses and protects your personal data, and your rights under UK and EU GDPR.",
};

export default async function PrivacyPage() {
  const branding = await getBranding();
  const email = legal.privacyEmail || branding.contactEmail;
  const entity = legal.entity || site.name;
  const mailto = `mailto:${email}?subject=${encodeURIComponent("Privacy request")}`;

  const sections: LegalSection[] = [
    {
      id: "who-we-are",
      title: "Who we are",
      body: (
        <>
          <p>
            This policy explains how <strong>{entity}</strong>{" "}(&ldquo;we&rdquo;,
            &ldquo;us&rdquo;), trading as {site.name}, looks after your personal data
            when you use {site.url.replace("https://", "")}{" "}and our member area. We
            are the &ldquo;controller&rdquo; of that data, which means we decide how
            and why it is used.
          </p>
          <ul>
            {legal.companyNumber && <li>Company number: {legal.companyNumber}</li>}
            {legal.address && <li>Address: {legal.address}</li>}
            {!legal.address && <li>Based in the United Kingdom</li>}
            <li>
              Privacy contact: <a href={mailto}>{email}</a>
            </li>
          </ul>
          <p>
            We follow the UK GDPR, the Data Protection Act 2018 and the Privacy and
            Electronic Communications Regulations (PECR). Where you are in the
            European Economic Area, the EU GDPR applies in the same way. We do not
            have a Data Protection Officer, because the law does not require one for
            an organisation of our kind; the contact above handles all data
            questions.
          </p>
          <p>
            This policy covers this website only. Our sister app{" "}
            <a href="https://cesrcompanion.co.uk" target="_blank" rel="noopener noreferrer">
              CESR Companion
            </a>{" "}
            is a separate service with its own privacy notice.
          </p>
        </>
      ),
    },
    {
      id: "what-we-collect",
      title: "What we collect",
      body: (
        <>
          <p>We collect only what we need, and only from the places listed here.</p>
          <h3>When you send us a question (the &ldquo;Talk to us first&rdquo; form)</h3>
          <ul>
            <li>Your name, email address and your question.</li>
            <li>
              Optionally: phone number, specialty and where you are in the CESR
              process.
            </li>
          </ul>
          <h3>When you create an account</h3>
          <ul>
            <li>Your name and email address, and a password.</li>
            <li>
              Your password is handled by our authentication provider and stored
              only in scrambled (hashed) form. We cannot read it.
            </li>
            <li>
              Optional profile details you choose to add: phone number, specialty,
              GMC number, a link to your portfolio, a note about it, and your
              planned GMC submission date.
            </li>
          </ul>
          <h3>When you book a session</h3>
          <ul>
            <li>
              Which session you booked, its status, any notes you add, and the
              portfolio link you share with your reviewer.
            </li>
            <li>
              The written feedback your reviewer leaves for you, and private
              administrative notes our team keeps about the booking.
            </li>
            <li>
              Payment details: the amount, any discount code used, payment status
              and Stripe reference numbers. <strong>Your card details go straight to
              Stripe. We never see or store them.</strong>
            </li>
          </ul>
          <h3>When you simply visit</h3>
          <ul>
            <li>
              <strong>Anonymous visit counting.</strong>{" "}We count visits without
              cookies. Each time a page loads, our server combines your IP address
              and browser details with a secret code that is replaced every day, and
              turns the result into a one-way code. The IP address and browser
              details are not stored, and because the secret changes daily, the code
              cannot be used to recognise you on another day. We keep the code, the
              date and the page visited, nothing else. We do not count visits made
              with Do Not Track or Global Privacy Control switched on, or by our own
              administrators when signed in.
            </li>
            <li>
              Our hosting provider keeps routine technical logs (such as IP address
              and browser type) for security and to keep the site running.
            </li>
          </ul>
          <h3>What we do not collect</h3>
          <p>
            We do not ask for health information, patient information, your
            immigration status, or any payment card number. Please see section 11
            about what to leave out of portfolio material.
          </p>
        </>
      ),
    },
    {
      id: "why-and-basis",
      title: "Why we use your data, and our legal basis",
      body: (
        <>
          <p>
            The law requires us to have a valid reason (a &ldquo;lawful basis&rdquo;)
            for each use of your data. These are ours:
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>What we do</th>
                  <th>Data involved</th>
                  <th>Lawful basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Answer your question before you book</td>
                  <td>Enquiry form details</td>
                  <td>
                    Taking steps at your request before a contract (Art. 6(1)(b));
                    our legitimate interest in replying (Art. 6(1)(f))
                  </td>
                </tr>
                <tr>
                  <td>Create and run your account; give you access to videos,
                    documents and your dashboard</td>
                  <td>Account and profile data</td>
                  <td>Performing our contract with you (Art. 6(1)(b))</td>
                </tr>
                <tr>
                  <td>Take bookings and payment, run sessions, share reviewer
                    feedback</td>
                  <td>Booking, portfolio link, payment and feedback data</td>
                  <td>Performing our contract with you (Art. 6(1)(b))</td>
                </tr>
                <tr>
                  <td>Send service emails: sign-up confirmation, password reset,
                    booking confirmations and changes</td>
                  <td>Name, email, booking details</td>
                  <td>Performing our contract with you (Art. 6(1)(b))</td>
                </tr>
                <tr>
                  <td>Keep accounting and tax records</td>
                  <td>Payment and booking records</td>
                  <td>Legal obligation (Art. 6(1)(c))</td>
                </tr>
                <tr>
                  <td>Keep the service secure, prevent spam and abuse, and fix
                    faults</td>
                  <td>Technical logs, enquiry email address (to limit repeat
                    messages)</td>
                  <td>Legitimate interests (Art. 6(1)(f)): running a safe service</td>
                </tr>
                <tr>
                  <td>Understand how many people use the site</td>
                  <td>Anonymous daily codes and page names</td>
                  <td>
                    Legitimate interests (Art. 6(1)(f)). This does not involve
                    cookies or information that identifies you.
                  </td>
                </tr>
                <tr>
                  <td>Respond to legal claims or requests from authorities</td>
                  <td>Whatever is relevant</td>
                  <td>Legal obligation or legitimate interests</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            We do <strong>not</strong>{" "}send marketing emails, we do not add anyone to
            a mailing list, and we do not sell or rent personal data. If that ever
            changes, we will ask for your consent first and you will be able to
            withdraw it at any time.
          </p>
          <p>
            Where we rely on legitimate interests, we have weighed them against your
            rights and expectations. You can object at any time (see section 9).
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies and similar technologies",
      body: (
        <>
          <p>
            We use only what is strictly necessary to provide the service you ask
            for. Under PECR this does not need a consent banner, so we do not show
            one. We do <strong>not</strong>{" "}use advertising, tracking or analytics
            cookies.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Purpose</th>
                  <th>How long</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sign-in cookies (set by our authentication provider, named
                    like <code>sb-…-auth-token</code>)</td>
                  <td>Keep you signed in and protect your account. Only set after
                    you sign in.</td>
                  <td>Until you sign out, or for the session lifetime</td>
                </tr>
                <tr>
                  <td>Browser storage item <code>cesr-a2hs-dismissed</code></td>
                  <td>Remembers that you closed the &ldquo;add to home screen&rdquo;
                    suggestion</td>
                  <td>Until you clear site data</td>
                </tr>
                <tr>
                  <td>Service worker and cache</td>
                  <td>Lets the site load faster and show an offline page. Contains
                    no personal data.</td>
                  <td>Until you clear site data</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            You can delete these at any time in your browser settings. Blocking the
            sign-in cookies means you will not be able to stay signed in.
          </p>
        </>
      ),
    },
    {
      id: "sharing",
      title: "Who we share data with",
      body: (
        <>
          <p>
            We share personal data only with the people and companies that need it to
            run the service, and only for that purpose. They act on our instructions
            (as &ldquo;processors&rdquo;) except where stated.
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> — our database, sign-in system and file
              storage. Our project is hosted in the EU (Frankfurt, Germany).
            </li>
            <li>
              <strong>Hostinger</strong> — hosts the website and sends the emails
              our site generates (such as account confirmations).
            </li>
            <li>
              <strong>Stripe</strong> — takes card payments. Stripe is also a
              controller in its own right for fraud prevention and its legal
              duties; see{" "}
              <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer">
                Stripe&apos;s privacy policy
              </a>
              .
            </li>
            <li>
              <strong>Our consultants and reviewers</strong> — see your name, the
              portfolio link and notes you give for sessions they deliver, so that
              they can prepare and give you feedback.
            </li>
            <li>
              <strong>Professional advisers, insurers and authorities</strong>{" "}(such
              as accountants, HMRC, regulators or the police) — only where the law
              requires it or to protect legal rights.
            </li>
          </ul>
          <p>
            If our business were ever sold or reorganised, your data could be passed
            to the new owner, who would have to honour this policy.
          </p>
        </>
      ),
    },
    {
      id: "transfers",
      title: "Transfers outside the UK",
      body: (
        <>
          <p>
            Our main database is in the EU, which the UK recognises as providing
            adequate protection. Some providers (for example Stripe) may process
            data in other countries, including the United States. When that
            happens we make sure a lawful safeguard applies, such as a UK adequacy
            decision, the UK&apos;s International Data Transfer Addendum or standard
            contractual clauses. You can ask us for details using the contact
            above.
          </p>
        </>
      ),
    },
    {
      id: "retention",
      title: "How long we keep data",
      body: (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Kept for</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Enquiries (name, email, question)</td>
                  <td>Up to 12 months after our last reply, unless you go on to
                    create an account</td>
                </tr>
                <tr>
                  <td>Account, profile, portfolio link and reviewer feedback</td>
                  <td>While your account is open. If you ask us to delete it we do so
                    within 30 days, except for records we must keep by law.</td>
                </tr>
                <tr>
                  <td>Payment and booking records</td>
                  <td>6 years from the end of the financial year, as UK tax and
                    accounting rules require</td>
                </tr>
                <tr>
                  <td>Anonymous visit counts</td>
                  <td>Kept as anonymous statistics; they cannot be linked back to
                    you</td>
                </tr>
                <tr>
                  <td>Hosting and security logs</td>
                  <td>A short period set by our hosting provider</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            After these periods we delete the data or remove everything that could
            identify you.
          </p>
        </>
      ),
    },
    {
      id: "security",
      title: "How we protect your data",
      body: (
        <>
          <ul>
            <li>The whole site is served over HTTPS (encrypted in transit).</li>
            <li>
              Access rules in the database mean members can see only their own
              bookings and profile; administrator access is limited to our team.
            </li>
            <li>
              Passwords are never stored in readable form, and card details never
              reach our systems.
            </li>
            <li>
              Documents in the member library are shown in a protected viewer and
              are not available to the public.
            </li>
          </ul>
          <p>
            No system is perfectly secure. If a breach is likely to put your rights
            at risk, we will tell you and the Information Commissioner&apos;s Office
            (ICO) without undue delay, as the law requires.
          </p>
        </>
      ),
    },
    {
      id: "your-rights",
      title: "Your rights",
      body: (
        <>
          <p>You have the right to:</p>
          <ul>
            <li><strong>be informed</strong>{" "}about how we use your data (this policy);</li>
            <li><strong>access</strong>{" "}a copy of the personal data we hold about you;</li>
            <li><strong>correct</strong>{" "}anything that is wrong or incomplete (you can edit most of it yourself in your profile);</li>
            <li><strong>erase</strong>{" "}your data, in many cases;</li>
            <li><strong>restrict</strong>{" "}how we use your data while a dispute is looked into;</li>
            <li><strong>data portability</strong>: receive the data you gave us in a common, machine-readable format;</li>
            <li><strong>object</strong>{" "}to uses based on legitimate interests;</li>
            <li><strong>withdraw consent</strong>{" "}where we rely on it, at any time.</li>
          </ul>
          <p>
            We do not make decisions about you using solely automated processing or
            profiling that has legal or similarly significant effects.
          </p>
          <p>
            To use any of these rights, email <a href={mailto}>{email}</a>. There is
            no charge. We will reply within one month (we may extend this by up to
            two further months for complex requests, and will tell you if so). We
            may need to confirm your identity first, to avoid giving your data to
            someone else.
          </p>
          <h3>Complaints</h3>
          <p>
            We would like the chance to put things right first, so please contact us.
            You also have the right to complain to the UK Information
            Commissioner&apos;s Office:{" "}
            <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">
              ico.org.uk/make-a-complaint
            </a>
            , telephone 0303 123 1113. If you are in the EU/EEA you can instead
            contact your local data protection authority.
          </p>
        </>
      ),
    },
    {
      id: "requirements",
      title: "Providing your data",
      body: (
        <p>
          You do not have to give us any personal data, but we cannot answer an
          enquiry without a name and email address, or run an account or booking
          without the details marked as required. Phone number, specialty, GMC
          number and portfolio notes are optional unless a particular session
          needs your portfolio link (our portfolio clinics do).
        </p>
      ),
    },
    {
      id: "portfolio-content",
      title: "Portfolio material and patient information",
      body: (
        <>
          <p>
            Portfolios often contain case descriptions. Please make sure anything
            you share with us or a reviewer is <strong>fully anonymised</strong>:
            no patient names, dates of birth, NHS numbers, addresses, or details
            that could identify a patient, colleague or employer. You remain
            responsible for meeting your professional duties of confidentiality
            (for example under GMC guidance). If you accidentally share identifiable
            information, tell us straight away so that we can remove it.
          </p>
          <p>
            The portfolio link you share is used only so your reviewer can read it
            for your session. We do not copy it or keep a copy of its contents.
          </p>
        </>
      ),
    },
    {
      id: "children",
      title: "Children",
      body: (
        <p>
          Our services are for doctors and other adults. We do not knowingly collect
          data from anyone under 18. If you think a child has given us personal
          data, contact us and we will delete it.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: (
        <p>
          We will update this page when our practices change and show the date at
          the top. If a change affects how we use your data in a significant way, we
          will tell you by email or a notice on the site before it takes effect.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      title="Privacy Policy"
      intro="What we collect, why, who sees it, how long we keep it and what your rights are. Written to be read, not skimmed past."
      path="/privacy"
      otherPage={{ href: "/terms", label: "Terms of Service" }}
      summary={
        <ul>
          <li>We collect what you tell us (enquiries, account, bookings) and nothing more.</li>
          <li>Card details go to Stripe; we never see them.</li>
          <li>No advertising or tracking cookies. Visit counting is anonymous and cookie-free.</li>
          <li>We never sell your data or add you to marketing lists.</li>
          <li>
            You can ask for a copy, a correction or deletion any time:{" "}
            <a href={mailto}>{email}</a>.
          </li>
          <li>
            Questions about the sign-up or booking terms? See the{" "}
            <Link href="/terms">Terms of Service</Link>.
          </li>
        </ul>
      }
      sections={sections}
    />
  );
}
