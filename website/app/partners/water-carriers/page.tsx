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

export default function WaterCarriersPage() {
  return (
    <main>
      <Navbar />

      {/* Hero Image */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/water-carriers.png" alt="Fixera Water Carriers" fill priority className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
        </div>
        <div className="relative z-10 px-6 pb-16 max-w-7xl mx-auto w-full">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <p className="section-label text-gold mb-2">Business Partners</p>
            <h1 className="text-5xl md:text-6xl font-black text-white">Water Carriers</h1>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="space-y-8">

            <p className="text-xl text-gray-600 leading-relaxed">
              Access to clean water is essential — and Fixera makes it simple. Our water carrier partners deliver clean water directly to homes, apartments, offices and construction sites across the city. Reliable, fast and affordable.
            </p>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-4">What We Deliver</h2>
              <ul className="space-y-3 text-gray-600 text-lg">
                {[
                  "Clean drinking water for households and families",
                  "Bulk water for construction sites",
                  "Water delivery for offices and commercial buildings",
                  "Emergency water supply when your supply is cut",
                  "Scheduled regular deliveries — daily, weekly or monthly",
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
                  { step: "01", title: "Place Your Order", desc: "Tell us how much water you need and your location. We confirm your booking instantly." },
                  { step: "02", title: "Fast Dispatch", desc: "A Fixera water carrier is dispatched to your location at your chosen time." },
                  { step: "03", title: "Delivered to Your Door", desc: "Clean water delivered and pumped into your tank or storage. No hassle, no delays." },
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
              <h2 className="text-2xl font-bold text-navy mb-4">Why Choose Fixera Water Carriers</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Every water carrier on our platform is verified and their vehicles are regularly inspected for cleanliness and safety. You never have to worry about water quality — we only work with partners who meet our strict hygiene and delivery standards.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} href={CUSTOMER_APP_URL} target="_blank" rel="noopener noreferrer" className="btn-primary text-lg px-10 py-4 text-center">
                Order Water Now
              </motion.a>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link href="/become-a-partner" className="btn-outline text-lg px-10 py-4 text-center block">
                  Join as a Water Carrier
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
