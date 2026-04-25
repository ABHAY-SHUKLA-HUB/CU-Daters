import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-darkBrown to-black text-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section: Brand Story */}
        <div className="mb-16 pb-16 border-b border-gray-700">
          <h3 className="text-2xl font-bold mb-4 gradient-text">SeeU-Daters</h3>
          <p className="text-gray-300 text-base leading-relaxed max-w-2xl mb-6">
            We're building the safest dating platform for college students. Verified profiles. Private conversations. Real connections. By students, for students.
          </p>
          <div className="flex gap-4 flex-wrap">
            <div className="px-4 py-2 rounded-full bg-gray-800 text-sm text-gray-300">
              ✓ Verified by college email
            </div>
            <div className="px-4 py-2 rounded-full bg-gray-800 text-sm text-gray-300">
              🔒 End-to-end encrypted
            </div>
            <div className="px-4 py-2 rounded-full bg-gray-800 text-sm text-gray-300">
              👥 50K+ students
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Product */}
          <div>
            <h4 className="font-bold mb-6 text-white">Product</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><Link to="/" className="hover:text-blushPink transition">Home</Link></li>
              <li><Link to="/features" className="hover:text-blushPink transition">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-blushPink transition">Pricing</Link></li>
              <li><Link to="/security" className="hover:text-blushPink transition">Security</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold mb-6 text-white">Company</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><Link to="/about" className="hover:text-blushPink transition">About Us</Link></li>
              <li><a href="#" className="hover:text-blushPink transition">Blog</a></li>
              <li><Link to="/contact" className="hover:text-blushPink transition">Contact</Link></li>
              <li><a href="#" className="hover:text-blushPink transition">Careers</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-6 text-white">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><Link to="/privacy" className="hover:text-blushPink transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blushPink transition">Terms of Service</Link></li>
              <li><a href="#" className="hover:text-blushPink transition">Safety Guidelines</a></li>
              <li><a href="#" className="hover:text-blushPink transition">Cookie Policy</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold mb-6 text-white">Follow Us</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><a href="#" className="hover:text-blushPink transition">Instagram</a></li>
              <li><a href="#" className="hover:text-blushPink transition">TikTok</a></li>
              <li><a href="#" className="hover:text-blushPink transition">Twitter</a></li>
              <li><a href="#" className="hover:text-blushPink transition">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom: Copyright & Trust */}
        <div className="border-t border-gray-700 pt-12 flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2026 SeeU-Daters. All rights reserved. Made with 💕 by students, for students.
            </p>
          </div>
          <div className="flex gap-6 flex-wrap justify-center md:justify-end">
            <div className="text-xs text-gray-400 px-3 py-1 rounded-full bg-gray-800">
              🔐 GDPR Compliant
            </div>
            <div className="text-xs text-gray-400 px-3 py-1 rounded-full bg-gray-800">
              ✓ SOC 2 Certified
            </div>
            <div className="text-xs text-gray-400 px-3 py-1 rounded-full bg-gray-800">
              🛡️ End-to-End Encrypted
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
