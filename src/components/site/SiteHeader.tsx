import { useEffect, useState } from "react";
import { site } from "../../config/site";
import MobileNav from "./MobileNav";
import ThemeToggle from "./ThemeToggle";

type SiteHeaderProps = {
  currentPath: string;
};

export default function SiteHeader({ currentPath }: SiteHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isElevated, setIsElevated] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    function handleScroll() {
      setIsElevated(window.scrollY > 48);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`topbar ${isVisible ? "is-visible" : ""} ${
        isElevated ? "is-elevated" : ""
      }`}
    >
      <div className="topbar__shell">
        <a className="topbar__brand" href="/">
          <img
            src={site.brand.avatar}
            alt={`${site.brand.name} 头像`}
            width="40"
            height="40"
          />
          <span>{site.brand.name}</span>
        </a>

        <div className="topbar__nav-dock">
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
          <div className="topbar__desktop-action">
            <ThemeToggle />
          </div>
          <div className="topbar__mobile-actions">
            <ThemeToggle />
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
