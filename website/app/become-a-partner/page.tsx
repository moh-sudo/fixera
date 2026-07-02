"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Truck, Droplets, Package, Bike, Wrench, TrendingUp, Wallet, ShieldCheck, Smartphone, Gift, Handshake } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PARTNER_APP_URL } from "../lib/links";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const categories = [
  { Icon: Truck, title: "Movers", desc: "Home & office relocation services" },
  { Icon: Droplets, title: "Water Carriers", desc: "Clean water delivery trucks" },
  { Icon: Package, title: "Vendors & Suppliers", desc: "Carpet, dry cleaning & supplies" },
  { Icon: Bike, title: "Riders", desc: "Last-mile delivery riders" },
  { Icon: Wrench, title: "Service Workers", desc: "Plumbers, electricians, cleaners, painters" },
];

const benefits = [
  { Icon: TrendingUp, title: "More Customers", desc: "Get discovered by customers across Nairobi searching for your services." },
  { Icon: Wallet, title: "More Earnings", desc: "Boost your monthly income with a steady stream of verified job requests." },
  { Icon: ShieldCheck, title: "Built on Trust", desc: "Every partner is background-checked and verified before going live on the platform." },
  { Icon: Smartphone, title: "Easy Management", desc: "Manage all your jobs, payments and schedule in one simple app." },
  { Icon: Gift, title: "Free to Join", desc: "No monthly fees. You only earn when you complete jobs." },
  { Icon: Handshake, title: "Dedicated Support", desc: "Our team supports you every step of the way." },
];

const howToStart = [
  { step: "01", title: "Apply Online", desc: "Fill out the short partner application form." },
  { step: "02", title: "Verification", desc: "We verify your business and credentials — usually within 48 hours." },
  { step: "03", title: "Onboarding", desc: "Get set up on the Fixera Partner app with full training." },
  { step: "04", title: "Start Earning", desc: "Accept jobs, complete them and get paid directly." },
];

export default function BecomeAPartner() {
  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-24 bg-navy text-white text-center px-6">
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <p className="section-label text-gold mb-4">Partner With Us</p>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Grow Your Business<br />
            <span className="text-gold">With Fixera</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            Join Fixera, Kenya&apos;s newest home services platform, and get discovered by customers across Nairobi who need your services.
          </p>
          <motion.a
            href="#apply"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            className="btn-primary text-lg px-12 py-4"
          >
            Apply Now — It&apos;s Free
          </motion.a>
        </motion.div>
      </section>

      {/* Who Can Join */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="section-label mb-3">Who Can Join</p>
            <h2 className="section-title text-navy">We Welcome All Business Types</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((c, i) => (
              <motion.div
                key={c.title}
                custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100"
                whileHover={{ y: -4, borderColor: "#C9A020" }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 mb-3 mx-auto rounded-xl bg-gold/10 flex items-center justify-center">
                  <c.Icon className="w-6 h-6 text-gold" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-navy mb-1">{c.title}</h3>
                <p className="text-gray-500 text-sm">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="section-label mb-3">Why Join</p>
            <h2 className="section-title text-navy">Benefits of Being a Fixera Partner</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm"
                whileHover={{ y: -4, boxShadow: "0 16px 32px rgba(0,0,0,0.08)" }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-11 h-11 mb-3 rounded-xl bg-gold/10 flex items-center justify-center">
                  <b.Icon className="w-5 h-5 text-gold" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-navy text-lg mb-2">{b.title}</h3>
                <p className="text-gray-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How To Start */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="section-label mb-3">Getting Started</p>
            <h2 className="section-title text-navy">How It Works</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howToStart.map((h, i) => (
              <motion.div
                key={h.step}
                custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-6xl font-black text-gold/20 mb-3">{h.step}</div>
                <h3 className="font-bold text-navy text-lg mb-2">{h.title}</h3>
                <p className="text-gray-500">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section id="apply" className="py-24 bg-navy text-center px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <p className="section-label text-gold mb-3">Ready to Start?</p>
          <h2 className="section-title text-white mb-6">Apply to Become a Partner Today</h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Be among the first businesses to grow with Fixera. The application takes less than 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href={PARTNER_APP_URL}
              target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="btn-primary text-lg px-12 py-4"
            >
              Sign Up on Partner App
            </motion.a>
            <motion.a
              href="tel:+254712008361"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="inline-block border-2 border-white text-white hover:bg-white hover:text-navy font-semibold text-lg px-10 py-4 rounded-full transition-all duration-300"
            >
              Call Us Now
            </motion.a>
          </div>
          <p className="text-white/40 text-sm mt-6">+254 712 008 361 · info@fixera.africa</p>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
