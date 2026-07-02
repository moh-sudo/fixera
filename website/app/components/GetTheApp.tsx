"use client";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { CUSTOMER_APP_URL, PARTNER_APP_URL } from "../lib/links";

const cards = [
  { tag: "Customer App", url: CUSTOMER_APP_URL },
  { tag: "Partner App", url: PARTNER_APP_URL },
];

export default function GetTheApp() {
  return (
    <section id="get-app" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }} viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="section-label mb-3">Get Started</p>
          <h2 className="section-title text-navy">Scan & Get the Fixera App</h2>
          <p className="section-body text-gray-500 mt-4 max-w-2xl mx-auto">
            Point your phone camera at the right code to open the app made for you.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-10 justify-center items-center">
          {cards.map((c, i) => (
            <motion.a
              key={c.tag}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }} viewport={{ once: true }}
              whileHover={{ y: -8, boxShadow: "0 28px 56px rgba(0,0,0,0.12)" }}
              className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center"
            >
              <div className="bg-white p-4 rounded-2xl border-2 border-navy/10">
                <QRCodeSVG
                  value={c.url}
                  size={190}
                  bgColor="#ffffff"
                  fgColor="#0A1628"
                  level="H"
                  marginSize={1}
                />
              </div>
              <span className="mt-6 bg-navy text-white font-semibold px-6 py-2 rounded-full text-sm">
                {c.tag}
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
