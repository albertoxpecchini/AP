import { SOCIALS } from "./data";

// Footer minimale condiviso tra home e pagina Bio.
export default function SiteFooter() {
  const now = new Date();
  const currentDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const currentYear = now.getFullYear();

  return (
    <footer className="ap-foot">
      <div className="ap-wrap">
        <div className="ap-foot-top">
          <div>
            <p className="ap-foot-name">Alberto Pecchini</p>
            <p className="ap-foot-role">Designer &amp; Developer · ITT «Carlo d'Arco» — Mantua</p>
          </div>
          <div className="ap-foot-social">
            {SOCIALS.map(({ name, Icon, href }) => (
              <a
                key={name}
                href={href}
                aria-label={name}
                title={name}
                {...(href !== "#" ? { target: "_blank", rel: "noreferrer noopener" } : {})}
              >
                <Icon size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
        <div className="ap-foot-bottom">
          <span>© {currentYear} Alberto Pecchini — All rights reserved</span>
          <span>Updated {currentDate}</span>
        </div>
      </div>
    </footer>
  );
}
