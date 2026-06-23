import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Mail, Phone, Menu, X } from "lucide-react";
import { SiGithub, SiInstagram, SiX } from "react-icons/si";
import { EMAIL, PHONE_DISPLAY, PHONE_HREF, WHATSAPP_HREF, NAV_LINKS, WhatsAppIcon } from "./data";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

// Header chiaro minimale, condiviso tra home e pagina Bio.
// avatarHref: dove punta il marchio (home → "#home"; altrove → "/").
export default function SiteHeader({
  localMode = false,
  avatarHref = "/",
}: {
  localMode?: boolean;
  avatarHref?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`ap-hdr ${scrolled ? "ap-hdr--scrolled" : ""}`}>
      <div className="ap-wrap ap-hdr-inner">
        <a href={avatarHref} className="ap-hdr-brand" aria-label="Alberto Pecchini, back to top">
          <img src="/alberto-pecchini.jpg" alt="" className="ap-hdr-avatar" width={36} height={36} loading="eager" />
          <span className="ap-hdr-name">Alberto Pecchini</span>
          {localMode ? <span className="ap-hdr-local">Local</span> : null}
        </a>

        <nav className="ap-hdr-nav" aria-label="Primary navigation">
          {NAV_LINKS.map((link) =>
            link.route ? (
              <Link key={link.href} className="ap-hdr-link" to={link.href}>
                {link.label}
              </Link>
            ) : (
              <a key={link.href} className="ap-hdr-link" href={link.href}>
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="ap-hdr-right">
          <div className="ap-hdr-social">
            <a href="https://github.com/albertoxpecchini" target="_blank" rel="noreferrer noopener" aria-label="GitHub" title="GitHub">
              <SiGithub size={18} aria-hidden="true" />
            </a>
            <a href="https://www.instagram.com/albertoxpecchini" target="_blank" rel="noreferrer noopener" aria-label="Instagram" title="Instagram">
              <SiInstagram size={18} aria-hidden="true" />
            </a>
            <a href="https://x.com/ygpzk" target="_blank" rel="noreferrer noopener" aria-label="X" title="X">
              <SiX size={18} aria-hidden="true" />
            </a>
          </div>
          <a href="/#contatti" className="ap-hdr-cta">Contact</a>
          <button
            className="ap-hdr-burger"
            type="button"
            aria-controls="ap-drawer"
            aria-expanded={menuOpen}
            aria-label="Open navigation menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      <div className={`ap-drawer ${menuOpen ? "open" : ""}`} id="ap-drawer">
        <div className="ap-drawer-backdrop" onClick={closeMenu} aria-hidden="true" />
        <div className="ap-drawer-panel" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button className="ap-drawer-close" type="button" aria-label="Close menu" onClick={closeMenu}>
            <X size={22} aria-hidden="true" />
          </button>
          <nav className="ap-drawer-nav" aria-label="Navigation">
            {NAV_LINKS.map((link) =>
              link.route ? (
                <Link key={link.href} to={link.href} onClick={closeMenu}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              ),
            )}
          </nav>
          <div className="ap-drawer-contacts">
            <a href={`mailto:${EMAIL}`}>
              <Mail size={18} aria-hidden="true" /> {EMAIL}
            </a>
            <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer noopener">
              <WhatsAppIcon size={16} /> WhatsApp
            </a>
            <a href={PHONE_HREF}>
              <Phone size={18} aria-hidden="true" /> {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
