import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import type { NavItem, SocialItem } from "../../config/site";

type MobileNavProps = {
  currentPath: string;
  nav: readonly NavItem[];
  social: readonly SocialItem[];
};

export default function MobileNav({
  currentPath,
  nav,
  social,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="topbar__icon-button topbar__icon-button--menu"
          aria-label="打开菜单"
        >
          菜单
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="mobile-nav__overlay" />
        <Dialog.Content className="mobile-nav__content">
          <div className="mobile-nav__header">
            <div>
              <p className="mobile-nav__eyebrow">WAIJADE</p>
              <Dialog.Title className="mobile-nav__title">站点导航</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="topbar__icon-button topbar__icon-button--menu"
                aria-label="关闭菜单"
              >
                关闭
              </button>
            </Dialog.Close>
          </div>

          <nav className="mobile-nav__list" aria-label="移动端导航">
            {nav.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                className={`mobile-nav__link ${
                  currentPath === item.href ? "is-active" : ""
                }`}
                onClick={() => setOpen(false)}
              >
                <span className="mobile-nav__index">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="mobile-nav__socials">
            {social.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="mobile-nav__social-link"
              >
                {item.label}
              </a>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
