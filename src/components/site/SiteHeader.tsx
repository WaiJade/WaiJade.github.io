import { useEffect, useRef, useState } from "react";
import { site } from "../../config/site";
import MobileNav from "./MobileNav";
import SiteSearch from "./SiteSearch";

type SiteHeaderProps = {
  currentPath: string;
};

export default function SiteHeader({ currentPath }: SiteHeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isElevated, setIsElevated] = useState(false);
  const lastScrollY = useRef(0);
  const directionAnchorY = useRef(0);
  const scrollDirection = useRef<"up" | "down">("up");
  const isTicking = useRef(false);
  const normalizedCurrentPath =
    currentPath !== "/" && currentPath.endsWith("/")
      ? currentPath.slice(0, -1)
      : currentPath;

  useEffect(() => {
    const topRevealOffset = 24;
    const elevationOffset = 48;
    const hideTriggerOffset = 96;
    const hideTravelThreshold = 18;

    function updateHeader() {
      const currentScrollY = Math.max(window.scrollY, 0);
      const delta = currentScrollY - lastScrollY.current;
      const nextElevated = currentScrollY > elevationOffset;

      setIsElevated((prev) => (prev === nextElevated ? prev : nextElevated));

      if (currentScrollY <= topRevealOffset) {
        setIsVisible(true);
        scrollDirection.current = "up";
        directionAnchorY.current = currentScrollY;
        lastScrollY.current = currentScrollY;
        isTicking.current = false;
        return;
      }

      if (Math.abs(delta) < 1) {
        lastScrollY.current = currentScrollY;
        isTicking.current = false;
        return;
      }

      const nextDirection = delta > 0 ? "down" : "up";

      if (nextDirection !== scrollDirection.current) {
        scrollDirection.current = nextDirection;
        directionAnchorY.current = currentScrollY;
      }

      if (nextDirection === "up") {
        setIsVisible(true);
        directionAnchorY.current = currentScrollY;
      } else if (
        currentScrollY > hideTriggerOffset &&
        currentScrollY - directionAnchorY.current >= hideTravelThreshold
      ) {
        setIsVisible(false);
        directionAnchorY.current = currentScrollY;
      }

      lastScrollY.current = currentScrollY;
      isTicking.current = false;
    }

    function handleScroll() {
      if (isTicking.current) return;

      isTicking.current = true;
      window.requestAnimationFrame(updateHeader);
    }

    lastScrollY.current = window.scrollY;
    directionAnchorY.current = window.scrollY;
    updateHeader();
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

        <SiteSearch />

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
