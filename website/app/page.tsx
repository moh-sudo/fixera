"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Wrench, Zap, Sparkles, Paintbrush } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GetTheApp from "./components/GetTheApp";
import { CUSTOMER_APP_URL, PARTNER_APP_URL } from "./lib/links";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

const services = [
  {
    title: "Plumbing",
    desc: "Leaking pipes, blocked drains, installations and full bathroom fits — our certified plumbers arrive fast and fix it right the first time.",
    img: "/images/plumbing.png",
    Icon: Wrench,
  },
  {
    title: "Electrical",
    desc: "From wiring and sockets to full electrical panel upgrades, our licensed electricians handle every job safely and professionally.",
    img: "/images/electrical.png",
    Icon: Zap,
  },
  {
    title: "Cleaning",
    desc: "Deep cleaning, regular home maintenance, move-in/move-out cleans — we leave your space spotless every single time.",
    img: "/images/cleaning.png",
    Icon: Sparkles,
  },
  {
    title: "Painting",
    desc: "Interior and exterior painting, touch-ups and full repaints done by skilled painters with premium materials and clean finishes.",
    img: "/images/painting.png",
    Icon: Paintbrush,
  },
];

const partnerServices = [
  {
    title: "Water Carriers",
    desc: "Reliable clean water delivery to homes and businesses. Never run dry — schedule a delivery and we will be there.",
    img: "/images/water-carriers.png",
    href: "/partners/water-carriers",
  },
  {
    title: "Vendors",
    desc: "We connect you with trusted local vendors — cleaning companies, laundry services, carpet cleaning, hardware stores and more, all near you.",
    img: "/images/vendors2.png",
    href: "/partners/vendors",
  },
  {
    title: "Suppliers",
    desc: "Fixera partners with trusted suppliers and skilled professionals to ensure quality materials, reliable delivery and customer-recommended service every time.",
    img: "/images/suppliers.png",
    href: "/partners/suppliers",
  },
  {
    title: "Riders",
    desc: "Fast, reliable last-mile delivery by our branded Fixera riders. Quick pickups and drop-offs across the city.",
    img: "/images/riders.png",
    href: "/partners/riders",
  },
];

const steps = [
  { step: "01", title: "Book Online or Call", desc: "Choose your service and book in under 2 minutes through our app or by calling us directly." },
  { step: "02", title: "We Send a Pro", desc: "A verified, background-checked Fixera professional is dispatched to your location at your chosen time." },
  { step: "03", title: "Job Done, Guaranteed", desc: "Work is completed to standard and backed by our satisfaction guarantee. Pay only when you are happy." },
];

const stats = [
  { value: "4", label: "Core Services" },
  { value: "100%", label: "Background-Checked Pros" },
  { value: "24/7", label: "Emergency Support" },
  { value: "M-Pesa", label: "Secure Payments" },
];

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <main className="overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <Image
            src="/images/hero.png"
            alt="Fixera home services"
            fill
            priority
            className="object-cover object-[center_30%]"
          />
          {/* gradient overlay: dark at top for navbar, dark at bottom, lighter in middle to show people clearly */}
          <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/40 to-navy/75" />
        </motion.div>

        <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="section-label text-gold mb-4"
          >
            Kenya&apos;s #1 Home Services Platform
          </motion.p>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-5xl md:text-7xl font-black leading-tight mb-6"
          >
            One Call.<br />
            <span className="text-gold">We Fix It All.</span>
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto"
          >
            Book trusted plumbers, electricians, cleaners, movers and more — in minutes.
          </motion.p>
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              href={CUSTOMER_APP_URL} target="_blank" rel="noopener noreferrer"
              className="btn-primary text-lg px-10 py-4">
              Book a Service
            </motion.a>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link href="/become-a-partner" className="inline-block border-2 border-white text-white hover:bg-white hover:text-navy font-semibold text-lg px-10 py-4 rounded-full transition-all duration-300">
                Become a Partner
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="section-label mb-3">Simple Process</p>
            <h2 className="section-title text-navy">How Fixera Works</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center"
                whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-5xl font-black text-gold/30 mb-4">{s.step}</div>
                <h3 className="text-xl font-bold text-navy mb-3">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-20"
          >
            <p className="section-label mb-3">What We Offer</p>
            <h2 className="section-title text-navy">Professional Home Services</h2>
            <p className="section-body text-gray-500 mt-4 max-w-2xl mx-auto">
              Every Fixera professional is background-checked and trained before they ever take on a job.
            </p>
          </motion.div>

          <div className="space-y-28">
            {services.map((svc, i) => (
              <motion.div
                key={svc.title}
                initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }} viewport={{ once: true, margin: "-80px" }}
                className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-12 items-center`}
              >
                <motion.div
                  className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-xl relative"
                  style={{ aspectRatio: "4/3", minHeight: 300 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                >
                  <Image
                    src={svc.img}
                    alt={svc.title}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 50vw"
                  />
                </motion.div>

                <div className="w-full md:w-1/2">
                  <div className="w-12 h-12 mb-4 rounded-xl bg-gold/10 flex items-center justify-center">
                    <svc.Icon className="w-6 h-6 text-gold" strokeWidth={1.75} />
                  </div>
                  <p className="section-label mb-2">{svc.title}</p>
                  <h3 className="text-3xl font-bold text-navy mb-4">{svc.title} Services</h3>
                  <p className="section-body mb-8">{svc.desc}</p>
                  <motion.a
                    href={CUSTOMER_APP_URL} target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                    className="btn-primary"
                  >
                    Book {svc.title}
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOVERS VIDEO ── */}
      <section id="movers" className="py-24 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #C9A020 0%, transparent 60%)" }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }} viewport={{ once: true }}
              className="w-full md:w-1/2"
            >
              <p className="section-label mb-3">Movers</p>
              <h2 className="section-title text-white mb-6">
                Moving Made <span className="text-gold">Easy</span>
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                Home moves, office relocations, furniture transport — our professional Fixera movers handle everything with care. We pack, load, transport and unload so you do not have to lift a finger.
              </p>
              <ul className="space-y-3 mb-8">
                {["Home & apartment moves", "Office relocations", "Furniture & appliance delivery", "Careful packing & unpacking"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/80">
                    <span className="w-5 h-5 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4 flex-wrap">
                <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} href={CUSTOMER_APP_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Book Movers
                </motion.a>
                <Link href="/partners/movers" className="inline-block border-2 border-white text-white hover:bg-white hover:text-navy font-semibold px-8 py-3 rounded-full transition-all duration-300">
                  Learn More
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }} viewport={{ once: true }}
              className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl"
              whileHover={{ scale: 1.02 }}
            >
              <video
                src="/images/movers-video.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full rounded-3xl"
                style={{ aspectRatio: "16/9" }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BUSINESS PARTNERS ── */}
      <section id="partners" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="section-label mb-3">Business Partners</p>
            <h2 className="section-title text-navy">More Services, One Platform</h2>
            <p className="section-body text-gray-500 mt-4 max-w-2xl mx-auto">
              Beyond home repairs — Fixera connects you with trusted business partners for deliveries, water supply and more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partnerServices.map((p, i) => (
              <motion.div
                key={p.title}
                custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                whileHover={{ y: -8, boxShadow: "0 32px 64px rgba(0,0,0,0.15)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}>
                  <motion.div
                    className="absolute inset-0"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <Image src={p.img} alt={p.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
                  </motion.div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-navy mb-2">{p.title}</h3>
                  <p className="text-gray-500 leading-relaxed mb-4">{p.desc}</p>
                  <Link href={p.href} className="text-gold font-semibold hover:underline text-sm">Learn more →</Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER JOIN CTA ── */}
      <section className="py-24 bg-gold">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }} viewport={{ once: true }}
              className="max-w-xl"
            >
              <p className="text-white/70 font-semibold text-sm uppercase tracking-widest mb-3">Own a Business?</p>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
                Join Fixera as a Business Partner
              </h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Are you a mover, water carrier, vendor, supplier or rider? Partner with Fixera and get discovered by customers across Nairobi looking for your services.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }} viewport={{ once: true }}
              className="flex flex-col gap-4 items-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link href="/become-a-partner"
                  className="bg-navy text-white font-bold px-10 py-4 rounded-full text-lg inline-block hover:bg-navy-light transition-all duration-300">
                  Apply to Join →
                </Link>
              </motion.div>
              <p className="text-white/70 text-sm">Free to join · No monthly fees</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-24 bg-navy">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="section-label mb-3">Built for Trust</p>
            <h2 className="section-title text-white">What Sets Us Apart</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-black text-gold mb-2">{s.value}</div>
                <div className="text-white/60 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GET THE APP / QR CODES ── */}
      <GetTheApp />

      {/* ── FINAL CTA ── */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <p className="section-label mb-3">Get Started Today</p>
            <h2 className="section-title text-navy mb-6">
              Ready to Experience the<br />
              <span className="text-gold">Fixera Difference?</span>
            </h2>
            <p className="section-body text-gray-500 mb-10">
              Join Kenyan families who trust Fixera for all their home service needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} href={CUSTOMER_APP_URL} target="_blank" rel="noopener noreferrer" className="btn-primary text-lg px-10 py-4">
                Book a Service Now
              </motion.a>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link href="/become-a-partner" className="btn-outline text-lg px-10 py-4">
                  Become a Partner
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
