"use client";

import * as React from "react";
import Link from "next/link";
import { Github, Mail } from "lucide-react";

/* ============================================
   FOOTER COMPONENT
   Minimal site footer with essential links
   ============================================ */

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-sub transition-all duration-125">
            &copy; {currentYear} gorilla-type
          </p>

          {/* Essential Links */}
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/about"
              className="text-sub hover:text-text transition-all duration-125"
            >
              about
            </Link>
            <Link
              href="/settings"
              className="text-sub hover:text-text transition-all duration-125"
            >
              settings
            </Link>
            <Link
              href="/contact"
              className="text-sub hover:text-text transition-all duration-125"
            >
              contact
            </Link>
          </nav>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/DanilaAnikin/GorillaType/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sub hover:text-text transition-all duration-125"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>
            <Link
              href="/contact"
              className="text-sub hover:text-text transition-all duration-125"
              aria-label="Contact"
            >
              <Mail className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
