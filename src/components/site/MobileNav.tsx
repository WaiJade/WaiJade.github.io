import * as Dialog from "@radix-ui/react-dialog";
import { OptionIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { NavItem } from "../../config/site";

type MobileNavProps = {
  currentPath: string;
  nav: readonly NavItem[];
};

export default function MobileNav({ currentPath, nav }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("mobile-nav-open", open);

    return () => {
      document.documentElement.classList.remove("mobile-nav-open");
    };
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="topbar__icon-button topbar__icon-button--menu mobile-nav__trigger"
          aria-label="打开菜单"
        >
          <span className="topbar__icon-button__inner">
            <OptionIcon
              size={18}
              weight="bold"
              className="topbar__icon-button__icon"
              aria-hidden="true"
            />
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="mobile-nav__overlay" />
        <Dialog.Content className="mobile-nav__content">
          <Dialog.Title className="mobile-nav__sr-title">站点菜单</Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              className="topbar__icon-button mobile-nav__close"
              aria-label="关闭菜单"
            >
              <span className="topbar__icon-button__inner">
                <XIcon
                  size={18}
                  weight="bold"
                  className="topbar__icon-button__icon"
                  aria-hidden="true"
                />
              </span>
            </button>
          </Dialog.Close>

          <div className="mobile-nav__inner">
            <nav className="mobile-nav__list" aria-label="移动端导航">
              {nav.map((item) => (
                <Dialog.Close asChild key={item.href}>
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
                </Dialog.Close>
              ))}
            </nav>
          </div>
          <div aria-hidden="true" className="mobile-nav__handle" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
