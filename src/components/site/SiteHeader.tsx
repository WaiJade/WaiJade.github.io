import { useEffect, useState } from "react";
import { site } from "../../config/site";
import MobileNav from "./MobileNav";
import ThemeToggle from "./ThemeToggle";

type SiteHeaderProps = {
  currentPath: string;
};

export default function SiteHeader({ currentPath }: SiteHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 48);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`topbar ${isVisible ? "is-visible" : ""}`}>
      <div className="topbar__fade" aria-hidden="true" />
      <div className="topbar__inner">
        <a className="topbar__brand" href="/">
          <span className="topbar__brand-mark" aria-hidden="true">
            W
          </span>
          <span>WaiJade</span>
        </a>

        <nav className="topbar__nav-wrap" aria-label="主导航">
          <ul className="topbar__nav">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={currentPath === item.href ? "is-active" : ""}
                  aria-current={currentPath === item.href ? "page" : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="topbar__actions">
          <div className="topbar__desktop-action">
            <ThemeToggle />
          </div>
          <div className="topbar__mobile-action">
            <MobileNav
              currentPath={currentPath}
              nav={site.nav}
              social={site.social}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
