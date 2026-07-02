"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { CUSTOMER_APP_URL } from "../../lib/links";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const } }),
};

export default function MoversPage() {
  return (
    <main>
      <Navbar />

      {/* Hero Image */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/movers-van.png" alt="Fixera Movers" fill priority className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
        </div>
        <div className="relative z-10 px-6 pb-16 max-w-7xl mx-auto w-full">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <p className="section-label text-gold mb-2">Business Partners</p>
            <h1 className="text-5xl md:text-6xl font-black text-white">Fixera Movers</h1>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="space-y-8">

            <p className="text-xl text-gray-600 leading-relaxed">
              Moving homes or offices is one of the most stressful life events — but it doesn&apos;t have to be. Fixera Movers brings you a team of professional, vetted moving specialists who handle every part of your move with care, speed and efficiency.
            </p>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-4">What We Move</h2>
              <ul className="space-y-3 text-gray-600 text-lg">
                {[
                  "Household furniture — sofas, beds, wardrobes, dining sets",
                  "Home appliances — fridges, washing machines, TVs",
                  "Full apartment and house relocations",
                  "Office relocations — desks, filing cabinets, electronics",
                  "Single item and bulky item transport",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 w-5 h-5 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-4">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: "01", title: "Book Your Move", desc: "Tell us where you are moving from, where to, and the date. We give you an instant quote." },
                  { step: "02", title: "We Arrive on Time", desc: "Our team arrives with the right vehicle and equipment — ready to pack, load and go." },
                  { step: "03", title: "Safe Delivery", desc: "Everything is delivered safely and placed exactly where you want it. Job done." },
                ].map((s) => (
                  <div key={s.step} className="bg-gray-50 rounded-2xl p-6">
                    <div className="text-4xl font-black text-gold/30 mb-2">{s.step}</div>
                    <h3 className="font-bold text-navy mb-2">{s.title}</h3>
                    <p className="text-gray-500 text-sm">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-4">Why Choose Fixera Movers</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                All our movers are background-checked, trained and required to carry liability insurance. We use proper moving equipment to protect your belongings. Whether you are moving across town or to a new city, we handle your items like they are our own.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} href={CUSTOMER_APP_URL} target="_blank" rel="noopener noreferrer" className="btn-primary text-lg px-10 py-4 text-center">
                Book Movers Now
              </motion.a>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link href="/become-a-partner" className="btn-outline text-lg px-10 py-4 text-center block">
                  Join as a Mover
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
