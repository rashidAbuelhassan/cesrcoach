import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";
import { getBranding } from "@/lib/settings";
import { legal, site } from "@/config/site";

export const metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you use CESR Coach, create an account or book a session.",
};

export default async function TermsPage() {
  const branding = await getBranding();
  const email = branding.contactEmail;
  const entity = legal.entity || site.name;

  const sections: LegalSection[] = [
    {
      id: "about",
      title: "About these terms",
      body: (
        <>
          <p>
            These terms are an agreement between you and <strong>{entity}</strong>{" "}
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;), trading as {site.name}, based in the
            United Kingdom. They apply when you use{" "}
            {site.url.replace("https://", "")}, create an account, or book a session.
          </p>
          <ul>
            {legal.companyNumber && <li>Company number: {legal.companyNumber}</li>}
            {legal.address && <li>Address: {legal.address}</li>}
            <li>
              Email: <a href={`mailto:${email}`}>{email}</a>
            </li>
          </ul>
          <p>
            By creating an account, booking a session or ticking the box to accept
            them, you agree to these terms and to our{" "}
            <Link href="/privacy">Privacy Policy</Link>. If you do not agree, please
            do not use the service. If you book as a consumer, nothing here takes
            away rights you have by law.
          </p>
        </>
      ),
    },
    {
      id: "services",
      title: "What we provide",
      body: (
        <>
          <p>
            We offer coaching for doctors working towards entry to the GMC Specialist
            Register through the CESR (now called the Portfolio Pathway) route. This
            includes online portfolio clinics, follow-up sessions, preparation
            sessions, pathway guidance events, and a members&apos; library of videos
            and documents. The current sessions, what each includes, how long it
            lasts and its price are shown on our website when you book.
          </p>
          <p>
            Sessions are led by experienced consultants. We give guidance based on
            their knowledge and experience. We are an independent service. We are{" "}
            <strong>not</strong>{" "}the General Medical Council and we are not
            connected to it. Our advice is not legal, immigration or clinical advice.
          </p>
          <p>
            <strong>No guarantee of outcome.</strong>{" "}Applications are decided by the
            GMC, not by us. We cannot promise that an application will succeed, how
            long it will take, or that a reviewer&apos;s opinion matches the
            GMC&apos;s. You stay responsible for your application and for the
            accuracy of everything in it.
          </p>
        </>
      ),
    },
    {
      id: "account",
      title: "Your account",
      body: (
        <ul>
          <li>You must be at least 18 to register.</li>
          <li>
            Give accurate details and keep them up to date. Registration is free.
          </li>
          <li>
            Keep your password private. You are responsible for activity on your
            account, so tell us quickly if you think someone else has accessed it.
          </li>
          <li>
            One account per person. Do not share your login, because members&apos;
            content is licensed to you personally.
          </li>
          <li>
            You can close your account at any time by emailing us. We may suspend or
            close an account that breaks these terms (see section 8), and will tell
            you why when we can.
          </li>
        </ul>
      ),
    },
    {
      id: "booking",
      title: "Booking and paying",
      body: (
        <>
          <ul>
            <li>
              <strong>When a contract exists.</strong>{" "}Choosing a session and paying
              (or, for a free session, submitting the request) is your offer to book.
              For paid sessions, the booking is confirmed when your payment succeeds
              and the confirmation appears in your account. For free sessions, a
              place is pending until we confirm it.
            </li>
            <li>
              <strong>Prices</strong>{" "}are in pounds sterling and include VAT where
              VAT applies. The price you see at checkout is the price you pay. If we
              spot an obvious pricing error, we will tell you before taking payment
              and you can choose whether to go ahead.
            </li>
            <li>
              <strong>Payment</strong>{" "}is taken securely by Stripe. We never see
              your card details.
            </li>
            <li>
              <strong>Discount codes</strong>{" "}apply as described when you enter
              them. They have no cash value and can be withdrawn if issued in error.
            </li>
            <li>
              <strong>Portfolio clinics.</strong>{" "}Our reviewer needs time to read
              your portfolio. You must give working access to it at least the
              lead time stated for that session (currently 21 days for a Portfolio
              Clinic) before it takes place. If the link does not work, or access is
              not given in time, we may not be able to hold the session in full.
            </li>
            <li>
              <strong>Group sessions</strong>{" "}need a minimum number of attendees
              (shown on the session). If it is not reached we may cancel or move
              the session, and you can then choose a full refund or another date.
            </li>
            <li>
              <strong>Availability.</strong>{" "}Places are limited and are held for you
              only once your booking is confirmed.
            </li>
          </ul>
          <p>
            Sessions take place online. You are responsible for a suitable device
            and internet connection.
          </p>
        </>
      ),
    },
    {
      id: "cancellations",
      title: "Cancellations, changes and refunds",
      body: (
        <>
          <h3>Your legal right to cancel (consumers)</h3>
          <p>
            If you are a consumer, you have 14 days from the day your booking is
            confirmed to cancel it without giving a reason and receive a full refund.
            Because sessions are delivered on a set date, if the session is due to
            take place within those 14 days, we will only begin it once you ask us
            to, and you will acknowledge that you lose your right to cancel once the
            session has been fully delivered. If you cancel after asking us to
            begin, you pay for what has already been provided. To cancel, email us
            with your name and the booking; you may use any clear statement.
          </p>
          <h3>Cancelling or moving a booking after that</h3>
          <p>
            You can cancel a booking in your member area to release your place, and
            you can email us to ask to move it to another date. Please give us as
            much notice as you can. Outside your legal right above, we will consider
            reasonable requests for a refund or new date made in good time before the
            session, and we may decline them when the request is made at short
            notice or after the session has been delivered. Cancelling in the member
            area releases your place, but a refund is not automatic: ask us.
          </p>
          <h3>If we change or cancel</h3>
          <p>
            If we have to cancel or reschedule a session (for example, because a
            consultant is unwell), we will tell you as soon as we can and offer
            you another date or a full refund. If you do not attend a session
            without telling us, we are not obliged to refund it.
          </p>
          <h3>How refunds are paid</h3>
          <p>
            We refund to the card or method used to pay, without undue delay and
            within 14 days of agreeing that you are due a refund.
          </p>
        </>
      ),
    },
    {
      id: "content",
      title: "Members’ library and our content",
      body: (
        <>
          <p>
            The videos, documents, templates and everything else on the site belong
            to us or to the consultants who created them, and are protected by
            copyright. When you are signed in we give you a personal, non-transferable
            licence to view them for your own study.
          </p>
          <p>You must not:</p>
          <ul>
            <li>download, copy, print, screenshot, record or redistribute library material;</li>
            <li>share your account, or the material, with anyone else;</li>
            <li>try to get around the protections on documents and videos;</li>
            <li>use the material to build or train a competing service or an AI tool.</li>
          </ul>
          <p>
            Documents are view-only in a protected viewer. They are guides and
            templates, not a substitute for the GMC&apos;s own current guidance, which
            you should always check.
          </p>
        </>
      ),
    },
    {
      id: "your-material",
      title: "Material you share with us",
      body: (
        <>
          <p>
            You keep ownership of your portfolio and anything else you give us. You
            allow us and the relevant reviewer to read and use it only to deliver
            your session and feedback and to run the service.
          </p>
          <p>
            You confirm that what you share is yours to share and is{" "}
            <strong>anonymised</strong>: it must not contain patient-identifiable
            information or confidential information about colleagues or employers
            (see our <Link href="/privacy#portfolio-content">Privacy Policy</Link>).
            Do not share links to anything unlawful or harmful.
          </p>
        </>
      ),
    },
    {
      id: "conduct",
      title: "Acceptable use",
      body: (
        <>
          <p>Please:</p>
          <ul>
            <li>treat our consultants and other attendees with courtesy and respect;</li>
            <li>keep what you hear in group sessions confidential;</li>
            <li>
              not record any session unless everyone present agrees. We will not
              record a session without telling you first;
            </li>
            <li>
              not use the site unlawfully, to send spam or harmful code, to probe or
              overload it, or to impersonate anyone.
            </li>
          </ul>
          <p>
            If you seriously or repeatedly break these rules, we may suspend your
            account or refuse a booking. If that happens after you have paid for a
            session we have not delivered, we will refund the unused part.
          </p>
        </>
      ),
    },
    {
      id: "liability",
      title: "Our responsibility to you",
      body: (
        <>
          <p>
            We will provide our services with reasonable skill and care. Nothing in
            these terms limits or excludes our liability for death or personal injury
            caused by our negligence, for fraud or fraudulent misrepresentation, or
            for anything else that cannot be limited by law, and your statutory
            consumer rights are not affected.
          </p>
          <p>Subject to that:</p>
          <ul>
            <li>
              We are responsible for losses that are a foreseeable result of our
              breaking these terms or our negligence. We are not responsible for
              losses that were not foreseeable when you booked.
            </li>
            <li>
              Because the GMC decides applications, we are not responsible for the
              outcome of your application, or for fees, delays or career
              consequences that follow from a decision, so long as we provided our
              service with reasonable skill and care.
            </li>
            <li>
              If you are using the service for business purposes, we are not liable
              for lost profit, revenue or opportunity, and our total liability for any
              booking is limited to the fees you paid for it.
            </li>
          </ul>
          <p>
            We work to keep the website available but cannot promise it will always
            run without interruption or error. We may change, pause or withdraw
            features for maintenance or other reasons.
          </p>
        </>
      ),
    },
    {
      id: "third-parties",
      title: "Other websites and services",
      body: (
        <p>
          The site links to other services, including our sister app CESR
          Companion, the GMC and Stripe. Those are run by other people or by a
          separate service with its own terms, and we are not responsible for their
          content or practices.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to these terms",
      body: (
        <p>
          We may update these terms, for example when our services or the law
          change. The version in force on the day you book applies to that booking.
          New terms apply to bookings and use of the site after the date shown at the
          top of the page. If a change significantly affects you, we will tell you
          in advance.
        </p>
      ),
    },
    {
      id: "complaints",
      title: "Complaints",
      body: (
        <p>
          If something goes wrong, please tell us at{" "}
          <a href={`mailto:${email}`}>{email}</a>. We aim to reply within 5 working
          days and to resolve the matter within 14 days. If we cannot, you keep
          any right you have to use an alternative dispute resolution scheme or go
          to court.
        </p>
      ),
    },
    {
      id: "general",
      title: "General",
      body: (
        <ul>
          <li>
            <strong>Our agreement.</strong>{" "}These terms and the Privacy Policy are
            the whole agreement between us about the service.
          </li>
          <li>
            <strong>If part is unenforceable,</strong>{" "}the rest still applies.
          </li>
          <li>
            <strong>No waiver.</strong>{" "}If we do not enforce a right straight away,
            we can still do so later.
          </li>
          <li>
            <strong>Transfers.</strong>{" "}We may transfer our rights and duties to
            another organisation if it will look after you equally well. You may not
            transfer yours without our agreement.
          </li>
          <li>
            <strong>Third parties.</strong>{" "}Nobody else has rights to enforce these
            terms under the Contracts (Rights of Third Parties) Act 1999.
          </li>
          <li>
            <strong>Law and courts.</strong>{" "}These terms are governed by the law of
            England and Wales, and its courts have jurisdiction. If you live in
            Scotland or Northern Ireland you may bring a claim in the courts of
            your home nation, and if you are a consumer in another country you keep
            the protection of its mandatory consumer laws.
          </li>
        </ul>
      ),
    },
  ];

  return (
    <LegalPage
      title="Terms of Service"
      intro="The rules for using the site, booking sessions and paying, in plain English."
      path="/terms"
      otherPage={{ href: "/privacy", label: "Privacy Policy" }}
      summary={
        <ul>
          <li>We coach, we don&apos;t decide: the GMC decides applications, so we can&apos;t promise an outcome.</li>
          <li>Consumers have 14 days to cancel a booking for a full refund (with the usual exception once a session has been delivered).</li>
          <li>Library material is for your own study only. No copying, sharing or recording.</li>
          <li>Anonymise everything you share, with no patient-identifiable details.</li>
          <li>
            Your data is handled as described in the{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </li>
        </ul>
      }
      sections={sections}
    />
  );
}
