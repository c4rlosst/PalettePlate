import Link from "next/link";
import { Leaf, House, Search, BookOpen, UserRound, Plus } from "lucide-react";
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
    { label: "Recipes", href: "/recipes", icon: BookOpen },
  ];
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-symbol">
            <Leaf size={23} />
          </span>
          PalettePlate<span className="brand-period">.</span>
        </Link>
        <p className="brand-note">A little colour, every day.</p>
        <nav aria-label="Main navigation">
          {items.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className={`nav-link ${active === label ? "active" : ""}`}
              aria-current={active === label ? "page" : undefined}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <span className="status-dot" /> Made for everyday Filipino meals
          </div>
          <Link
            className={`nav-link ${active === "Profile" ? "active" : ""}`}
            href="/profile"
          >
            <UserRound size={19} />
            Your profile
          </Link>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>Your everyday plate</span>
          <Link href="/log" className="button button-small">
            <Plus size={17} />
            Log meal
          </Link>
        </header>
        <main id="main-content">{children}</main>
        <footer className="page-footer">
          Small choices. More colour. Your own pace.
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {[
          ...items,
          { label: "Profile", href: "/profile", icon: UserRound },
        ].map(({ label, href, icon: Icon }) => (
          <Link
            href={href}
            key={label}
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
