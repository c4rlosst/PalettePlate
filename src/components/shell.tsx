import Link from "next/link";
import {
  House,
  Search,
  BookOpen,
  UserRound,
  Plus,
  Images,
} from "lucide-react";
export function Shell({
  children,
  active = "Today",
}: {
  children: React.ReactNode;
  active?: string;
}) {
  const items = [
    { label: "Today", href: "/", icon: House },
    { label: "Foods", href: "/foods", icon: Search },
    { label: "Feed", href: "/feed", icon: Images },
    { label: "Recipes", href: "/recipes", icon: BookOpen },
  ];
  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <img
              className="brand-logo"
              src="/logo.png"
              alt=""
              width={42}
              height={41}
            />
            <span className="wordmark">
              <strong>Palette</strong>
              <span>Plate</span>
            </span>
          </Link>
          <nav className="top-nav" aria-label="Main navigation">
            {items.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={`nav-link ${active === label ? "active" : ""}`}
                aria-current={active === label ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="top-actions">
            <Link href="/log" className="button button-small">
              <Plus size={17} />
              Log meal
            </Link>
            <Link
              href="/profile"
              className="avatar-link"
              aria-label="Your profile"
              aria-current={active === "Profile" ? "page" : undefined}
            >
              <UserRound size={20} />
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="page-footer">
        Made for everyday Filipino meals. Small choices, more color, your own
        pace.
      </footer>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {[
          items[0],
          items[1],
          { label: "Log meal", href: "/log", icon: Plus },
          items[2],
          items[3],
          { label: "Profile", href: "/profile", icon: UserRound },
        ].map(({ label, href, icon: Icon }) => (
          <Link
            href={href}
            key={label}
            className={label === "Log meal" ? "tab-log" : undefined}
            aria-current={active === label ? "page" : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
