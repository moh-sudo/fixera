import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { EMAIL, PHONE_DISPLAY } from "../lib/links";

export const metadata: Metadata = {
  title: "Privacy Policy — Fixera",
  description: "How Fixera collects, uses and protects your personal data in line with Kenya's Data Protection Act, 2019.",
};

const sections = [
  {
    h: "1. Introduction",
    p: [
      "Fixera Home Services (\"Fixera\", \"we\", \"us\" or \"our\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store and protect your personal data when you use our website, mobile applications and services.",
      "We comply with the Data Protection Act, 2019 of Kenya and the regulations issued by the Office of the Data Protection Commissioner (ODPC).",
    ],
  },
  {
    h: "2. Information We Collect",
    p: [
      "We collect information you provide directly to us, including:",
    ],
    list: [
      "Your name, phone number and email address",
      "Your physical or delivery address and location data",
      "Booking and service request details",
      "Payment information processed through secure third-party providers",
      "Communications between you and Fixera or our partners",
      "For partners: business details, identification documents and verification information",
    ],
  },
  {
    h: "3. How We Use Your Information",
    p: ["We use your personal data to:"],
    list: [
      "Connect you with service workers and business partners",
      "Process bookings, payments and deliveries",
      "Verify the identity of partners and service workers",
      "Communicate with you about your bookings and account",
      "Improve our services and customer experience",
      "Comply with legal and regulatory obligations",
    ],
  },
  {
    h: "4. Sharing Your Information",
    p: [
      "We share your information only as necessary to provide our services — for example, sharing your name, location and booking details with the assigned service worker or partner. We do not sell your personal data to third parties.",
      "We may share data with payment processors, technology providers and regulatory authorities where required by law.",
    ],
  },
  {
    h: "5. Data Security",
    p: [
      "We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss or misuse. Access to your data is restricted to authorised personnel only.",
    ],
  },
  {
    h: "6. Your Rights",
    p: ["Under the Data Protection Act, 2019, you have the right to:"],
    list: [
      "Access the personal data we hold about you",
      "Request correction of inaccurate data",
      "Request deletion of your data, subject to legal limits",
      "Object to or restrict certain processing of your data",
      "Withdraw consent at any time",
    ],
  },
  {
    h: "7. Data Retention",
    p: [
      "We retain your personal data only for as long as necessary to provide our services and to comply with legal, accounting and regulatory requirements.",
    ],
  },
  {
    h: "8. Cookies",
    p: [
      "Our website may use cookies and similar technologies to improve your browsing experience and analyse site usage. You can control cookies through your browser settings.",
    ],
  },
  {
    h: "9. Changes to This Policy",
    p: [
      "We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main>
      <Navbar />

      <section className="pt-36 pb-16 bg-navy text-white px-6">
        <div className="max-w-4xl mx-auto">
          <p className="section-label text-gold mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-black">Privacy Policy</h1>
          <p className="text-white/60 mt-4">Last updated: June 2026</p>
        </div>
      </section>

      <section className="py-16 bg-white px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="text-2xl font-bold text-navy mb-3">{s.h}</h2>
              {s.p.map((para, idx) => (
                <p key={idx} className="text-gray-600 text-lg leading-relaxed mb-3">{para}</p>
              ))}
              {s.list && (
                <ul className="space-y-2 mt-2">
                  {s.list.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-600 text-lg">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-navy mb-3">10. Contact Us</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              If you have questions about this Privacy Policy or how we handle your data, contact us at:
            </p>
            <p className="text-gray-600 text-lg mt-3">
              Email: <a href={`mailto:${EMAIL}`} className="text-gold hover:underline">{EMAIL}</a><br />
              Phone: <a href="tel:+254712008361" className="text-gold hover:underline">{PHONE_DISPLAY}</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
