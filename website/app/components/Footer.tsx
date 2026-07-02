import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 flex-shrink-0 relative">
              <Image
                src="/logo.png"
                alt="Fixera"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-bold text-lg">FIX<span className="text-gold">ERA</span></span>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-5">
            Kenya&apos;s trusted platform for home services and business partners. One call. We fix it all.
          </p>
          <div className="flex gap-3">
            <a href="https://instagram.com/fixera_homeservices" target="_blank" rel="noreferrer"
              className="w-9 h-9 rounded-full border border-white/20 hover:border-gold hover:text-gold flex items-center justify-center text-white/60 transition-all">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-semibold text-gold mb-4 uppercase tracking-wider text-sm">Services</h4>
          <ul className="space-y-2 text-white/60 text-sm">
            {["Plumbing", "Electrical", "Cleaning", "Painting"].map((s) => (
              <li key={s}><a href="#services" className="hover:text-gold transition-colors">{s}</a></li>
            ))}
          </ul>
        </div>

        {/* Business Partners */}
        <div>
          <h4 className="font-semibold text-gold mb-4 uppercase tracking-wider text-sm">Business Partners</h4>
          <ul className="space-y-2 text-white/60 text-sm">
            {["Movers", "Water Carriers", "Vendors", "Suppliers", "Riders"].map((s) => (
              <li key={s}><a href="#partners" className="hover:text-gold transition-colors">{s}</a></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-gold mb-4 uppercase tracking-wider text-sm">Contact</h4>
          <ul className="space-y-3 text-white/60 text-sm">
            <li className="flex gap-2 items-start">
              <span>📞</span>
              <a href="tel:+254712008361" className="hover:text-gold transition-colors">+254 712 008 361</a>
            </li>
            <li className="flex gap-2 items-start">
              <span>✉️</span>
              <a href="mailto:info@fixera.africa" className="hover:text-gold transition-colors">info@fixera.africa</a>
            </li>
            <li className="flex gap-2 items-start">
              <span>🛟</span>
              <a href="mailto:support@fixera.africa" className="hover:text-gold transition-colors">support@fixera.africa</a>
            </li>
            <li className="flex gap-2 items-start">
              <span>📍</span>
              <span>Nairobi, Kenya</span>
            </li>
          </ul>
          <div className="mt-6">
            <Link href="/become-a-partner"
              className="text-sm font-semibold text-gold border border-gold hover:bg-gold hover:text-white px-5 py-2 rounded-full transition-all duration-300 inline-block">
              Become a Partner
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 px-6 text-center text-white/40 text-sm">
        <p>© {new Date().getFullYear()} Fixera Home Services. All rights reserved. &nbsp;·&nbsp;
          <Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
          &nbsp;·&nbsp;
          <Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
        </p>
      </div>
    </footer>
  );
}
