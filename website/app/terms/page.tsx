import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { EMAIL, PHONE_DISPLAY } from "../lib/links";

export const metadata: Metadata = {
  title: "Terms of Service — Fixera",
  description: "The terms and conditions governing your use of the Fixera home services platform.",
};

const sections = [
  {
    h: "1. Agreement to Terms",
    p: [
      "By accessing or using the Fixera platform, website or mobile applications, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
    ],
  },
  {
    h: "2. About Fixera",
    p: [
      "Fixera is a technology platform that connects customers with independent service workers and business partners — including plumbers, electricians, cleaners, painters, movers, water carriers, vendors, suppliers and riders. Fixera facilitates these connections but the services themselves are provided by independent professionals and partners.",
    ],
  },
  {
    h: "3. Use of the Platform",
    p: ["When using Fixera, you agree to:"],
    list: [
      "Provide accurate and complete information",
      "Use the platform only for lawful purposes",
      "Treat service workers and partners with respect",
      "Pay for services as agreed through the platform",
      "Not misuse, disrupt or attempt to compromise the platform",
    ],
  },
  {
    h: "4. Bookings and Payments",
    p: [
      "When you book a service, you enter into an agreement with the service worker or partner providing that service. Prices are displayed before you confirm a booking. Payments are processed securely through our approved payment providers.",
      "Cancellation and refund terms will be communicated at the time of booking and may vary by service type.",
    ],
  },
  {
    h: "5. Partner Responsibilities",
    p: [
      "Service workers and business partners on Fixera are independent contractors, not employees of Fixera. Partners are responsible for delivering services professionally, safely and in line with applicable laws and licensing requirements.",
      "Fixera verifies partners but does not guarantee the outcome of any individual service.",
    ],
  },
  {
    h: "6. Quality and Disputes",
    p: [
      "We strive to maintain high service standards through verification, ratings and reviews. If you experience an issue with a service, please contact us so we can help resolve it. Fixera may mediate disputes but is not liable for the acts or omissions of independent partners.",
    ],
  },
  {
    h: "7. Limitation of Liability",
    p: [
      "To the maximum extent permitted by law, Fixera shall not be liable for any indirect, incidental or consequential damages arising from your use of the platform or from services provided by independent partners.",
    ],
  },
  {
    h: "8. Account Suspension",
    p: [
      "We reserve the right to suspend or terminate any account that violates these terms, engages in fraudulent activity or poses a risk to other users or the platform.",
    ],
  },
  {
    h: "9. Intellectual Property",
    p: [
      "All content, branding, logos and software associated with Fixera are the property of Fixera and may not be used without our written permission.",
    ],
  },
  {
    h: "10. Governing Law",
    p: [
      "These Terms of Service are governed by the laws of the Republic of Kenya. Any disputes shall be subject to the jurisdiction of the Kenyan courts.",
    ],
  },
  {
    h: "11. Changes to These Terms",
    p: [
      "We may update these Terms of Service from time to time. Continued use of the platform after changes are posted constitutes acceptance of the updated terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main>
      <Navbar />

      <section className="pt-36 pb-16 bg-navy text-white px-6">
        <div className="max-w-4xl mx-auto">
          <p className="section-label text-gold mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-black">Terms of Service</h1>
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
            <h2 className="text-2xl font-bold text-navy mb-3">12. Contact Us</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              For questions about these Terms of Service, contact us at:
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
