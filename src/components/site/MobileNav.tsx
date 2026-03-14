import { Drawer } from "vaul";
import { useState } from "react";
import type { NavItem } from "../../config/site";

type MobileNavProps = {
  currentPath: string;
  nav: readonly NavItem[];
};

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <span className={`mobile-nav__toggle-icon ${open ? "is-open" : ""}`} aria-hidden="true">
      <span className="mobile-nav__toggle-line mobile-nav__toggle-line--top" />
      <span className="mobile-nav__toggle-line mobile-nav__toggle-line--bottom" />
    </span>
  );
}

export default function MobileNav({ currentPath, nav }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={setOpen}
      shouldScaleBackground
      disablePreventScroll={false}
      direction="top"
    >
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="topbar__icon-button topbar__icon-button--menu mobile-nav__trigger"
          aria-label="打开菜单"
        >
          <span className="topbar__icon-button__inner">
            <MenuGlyph open={open} />
          </span>
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="mobile-nav__overlay" />
        <Drawer.Content className="mobile-nav__content">
          <Drawer.Title className="mobile-nav__sr-title">站点菜单</Drawer.Title>
          <Drawer.Close asChild>
            <button
              type="button"
              className="topbar__icon-button topbar__icon-button--menu mobile-nav__close"
              aria-label="关闭菜单"
            >
              <span className="topbar__icon-button__inner">
                <MenuGlyph open={true} />
              </span>
            </button>
          </Drawer.Close>

          <div className="mobile-nav__inner">
            <nav className="mobile-nav__list" aria-label="移动端导航">
              {nav.map((item) => (
                <Drawer.Close asChild key={item.href}>
                  <a
                    href={item.href}
                    className={`mobile-nav__link ${
                      currentPath === item.href ? "is-active" : ""
                    }`}
                    aria-current={currentPath === item.href ? "page" : undefined}
                  >
                    <img
                      src="/slash.svg"
                      alt=""
                      aria-hidden="true"
                      className="mobile-nav__slash"
                    />
                    <span className="mobile-nav__label">{item.label}</span>
                  </a>
                </Drawer.Close>
              ))}
            </nav>
          </div>
          <div aria-hidden="true" className="mobile-nav__handle" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
