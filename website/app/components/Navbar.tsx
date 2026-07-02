"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { CUSTOMER_APP_URL, PARTNER_APP_URL } from "../lib/links";

const links = [
  { label: "Services", href: "#services" },
  { label: "Movers", href: "#movers" },
  { label: "Partners", href: "#partners" },
  { label: "How It Works", href: "#how-it-works" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-navy/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Logo — crop to show only F emblem */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-14 h-14 flex-shrink-0 relative">
            <Image
              src="/logo.png"
              alt="Fixera"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-white font-bold text-xl tracking-wide">
            FIX<span className="text-gold">ERA</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-white/80 hover:text-gold font-medium transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={PARTNER_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-gold font-medium transition-colors duration-200 text-sm"
          >
            Partner Login
          </a>
          <a
            href={CUSTOMER_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold border border-gold hover:bg-gold hover:text-white font-semibold px-5 py-2 rounded-full transition-all duration-300 text-sm"
          >
            Log In
          </a>
          <a
            href={CUSTOMER_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold hover:bg-gold-dark text-white font-semibold px-5 py-2 rounded-full transition-all duration-300 text-sm"
          >
            Book a Service
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <motion.span
            animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            className="block w-6 h-0.5 bg-white"
          />
          <motion.span
            animate={open ? { opacity: 0 } : { opacity: 1 }}
            className="block w-6 h-0.5 bg-white"
          />
          <motion.span
            animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            className="block w-6 h-0.5 bg-white"
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-navy/98 border-t border-white/10 overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-white/80 hover:text-gold font-medium text-lg transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <a href={PARTNER_APP_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="text-white/80 hover:text-gold font-medium text-lg transition-colors">
                  Partner Login
                </a>
                <a href={CUSTOMER_APP_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="btn-outline text-center">
                  Log In
                </a>
                <a href={CUSTOMER_APP_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="btn-primary text-center">
                  Book a Service
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
