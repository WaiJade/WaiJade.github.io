import { useEffect, useRef, useState } from "react";
import { site } from "../../config/site";
import MobileNav from "./MobileNav";

type SiteHeaderProps = {
  currentPath: string;
};

export default function SiteHeader({ currentPath }: SiteHeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isElevated, setIsElevated] = useState(false);
  const lastScrollY = useRef(0);
  const normalizedCurrentPath =
    currentPath !== "/" && currentPath.endsWith("/")
      ? currentPath.slice(0, -1)
      : currentPath;

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      setIsElevated(currentScrollY > 48);

      if (currentScrollY <= 24) {
        setIsVisible(true);
      } else if (Math.abs(delta) > 4) {
        setIsVisible(delta < 0);
      }

      lastScrollY.current = currentScrollY;
    }

    lastScrollY.current = window.scrollY;
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
      <div className="topbar__fade" aria-hidden="true" />
      <div className="topbar__shell">
        <a className="topbar__brand" href="/">
          <img
            src={site.brand.avatar}
            alt={`${site.brand.name} 头像`}
            width="40"
            height="40"
          />
          <span>{site.brand.name}&apos;s BLOG</span>
        </a>

        <nav className="topbar__nav-wrap topbar__nav-wrap--desktop" aria-label="主导航">
          <ul className="topbar__nav">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={normalizedCurrentPath === item.href ? "is-active" : ""}
                  aria-current={normalizedCurrentPath === item.href ? "page" : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="topbar__mobile-menu" aria-label="移动端导航">
          <MobileNav
            currentPath={normalizedCurrentPath}
            nav={site.nav}
            social={site.social}
          />
        </div>
      </div>
    </header>
  );
}
