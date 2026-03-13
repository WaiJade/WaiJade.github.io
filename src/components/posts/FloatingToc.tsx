import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

type TocHeading = {
  depth: number;
  slug: string;
  text: string;
};

type FloatingTocProps = {
  headings: TocHeading[];
};

export default function FloatingToc({ headings }: FloatingTocProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (headings.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={`article-toc-desktop ${collapsed ? "is-collapsed" : ""}`}
        aria-label="文章目录"
      >
        {!collapsed ? (
          <div className="article-toc__inner article-toc__inner--desktop">
            <div className="article-toc-desktop__header">
              <p className="article-toc__eyebrow">Contents</p>
              <button
                type="button"
                className="article-toc-desktop__toggle"
                aria-label="隐藏目录"
                onClick={() => setCollapsed(true)}
              >
                HIDE
              </button>
            </div>
            <ol className="article-toc__list">
              {headings.map((heading) => (
                <li
                  key={heading.slug}
                  className={`article-toc__item is-depth-${heading.depth}`}
                >
                  <a href={`#${heading.slug}`}>{heading.text}</a>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <button
            type="button"
            className="article-toc-desktop__reveal"
            aria-label="显示目录"
            onClick={() => setCollapsed(false)}
          >
            CONTENTS
          </button>
        )}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="article-toc-fab"
            aria-label="打开目录"
          >
            CONTENTS
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="article-toc-sheet__overlay" />
          <Dialog.Content className="article-toc-sheet">
            <div className="article-toc-sheet__header">
              <div>
                <p className="article-toc__eyebrow">Contents</p>
                <Dialog.Title className="article-toc-sheet__title">
                  文章目录
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="topbar__icon-button topbar__icon-button--menu"
                  aria-label="关闭目录"
                >
                  CLOSE
                </button>
              </Dialog.Close>
            </div>

            <ol className="article-toc__list article-toc__list--sheet">
              {headings.map((heading) => (
                <li
                  key={heading.slug}
                  className={`article-toc__item is-depth-${heading.depth}`}
                >
                  <a href={`#${heading.slug}`} onClick={() => setOpen(false)}>
                    {heading.text}
                  </a>
                </li>
              ))}
            </ol>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
