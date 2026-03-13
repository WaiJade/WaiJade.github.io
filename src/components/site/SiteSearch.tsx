import * as Dialog from "@radix-ui/react-dialog";
import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { SearchIndexItem } from "../../lib/search";

let searchIndexPromise: Promise<SearchIndexItem[]> | null = null;

function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch("/search.json", {
      headers: {
        accept: "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`加载搜索索引失败: ${response.status}`);
        }

        return (await response.json()) as SearchIndexItem[];
      })
      .catch((error) => {
        searchIndexPromise = null;
        throw error;
      });
  }

  return searchIndexPromise;
}

function normalizeSearchValue(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]',
    ),
  );
}

function scoreSearchItem(
  item: SearchIndexItem,
  tokens: string[],
  normalizedQuery: string,
) {
  const title = normalizeSearchValue(item.title);
  const description = normalizeSearchValue(item.description);
  const excerpt = normalizeSearchValue(item.excerpt);
  const tags = item.tags.map(normalizeSearchValue);
  const searchText = normalizeSearchValue(item.searchText);

  let score = 0;

  for (const token of tokens) {
    if (!searchText.includes(token)) {
      return -1;
    }

    if (title.startsWith(token)) {
      score += 160;
    } else if (title.includes(token)) {
      score += 110;
    }

    if (tags.some((tag) => tag === token)) {
      score += 90;
    } else if (tags.some((tag) => tag.includes(token))) {
      score += 70;
    }

    if (description.includes(token)) {
      score += 45;
    }

    if (excerpt.includes(token)) {
      score += 28;
    }
  }

  if (title === normalizedQuery) {
    score += 220;
  }

  return score;
}

function SearchButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label="搜索文章"
      title="搜索文章（Ctrl + K）"
    >
      <span className="topbar__icon-button__inner">
        <svg
          className="topbar__icon-button__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.85"
            d="M11 5.5a5.5 5.5 0 1 0 0 11a5.5 5.5 0 0 0 0-11m4.2 9.7L19 19"
          />
        </svg>
      </span>
    </button>
  );
}

export default function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const normalizedQuery = normalizeSearchValue(deferredQuery);
  const tokens = normalizedQuery ? normalizedQuery.split(" ").filter(Boolean) : [];

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (event.key === "/" && !isEditableTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    if (status === "idle") {
      setStatus("loading");

      void loadSearchIndex()
        .then((searchItems) => {
          setItems(searchItems);
          setStatus("ready");
        })
        .catch(() => {
          setStatus("error");
        });
    }

    return () => window.cancelAnimationFrame(frameId);
  }, [open, status]);

  let panelTitle = "最新文章";
  let panelDescription = "输入标题、摘要、标签或正文片段来搜索。";
  let visibleItems: SearchIndexItem[] = [];

  if (status === "ready") {
    if (!tokens.length) {
      visibleItems = items.slice(0, 8);
    } else {
      const scoredItems = items
        .map((item) => ({
          item,
          score: scoreSearchItem(item, tokens, normalizedQuery),
        }))
        .filter((entry) => entry.score >= 0)
        .sort((left, right) => right.score - left.score);

      visibleItems = scoredItems.slice(0, 10).map((entry) => entry.item);
      panelTitle = `搜索结果 ${scoredItems.length}`;
      panelDescription = `关键词：${query.trim()}`;
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setQuery("");
    }
  }

  return (
    <>
      <div className="topbar__desktop-action">
        <SearchButton
          onClick={() => setOpen(true)}
          className="topbar__icon-button topbar__icon-button--search"
        />
      </div>

      <div className="topbar__mobile-actions">
        <SearchButton
          onClick={() => setOpen(true)}
          className="topbar__icon-button topbar__icon-button--search"
        />
      </div>

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="search-dialog__overlay" />
          <Dialog.Content className="search-dialog__content">
            <div className="search-dialog__header">
              <div>
                <p className="search-dialog__eyebrow">SEARCH</p>
                <Dialog.Title className="search-dialog__title">
                  搜索文章
                </Dialog.Title>
                <Dialog.Description className="search-dialog__description">
                  用标题、摘要、标签或正文片段快速定位内容。
                </Dialog.Description>
              </div>

              <Dialog.Close asChild>
                <button
                  type="button"
                  className="topbar__icon-button topbar__icon-button--menu"
                  aria-label="关闭搜索"
                >
                  <span className="topbar__icon-button__inner">CLOSE</span>
                </button>
              </Dialog.Close>
            </div>

            <label className="search-dialog__field" htmlFor={inputId}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.85"
                  d="M11 5.5a5.5 5.5 0 1 0 0 11a5.5 5.5 0 0 0 0-11m4.2 9.7L19 19"
                />
              </svg>
              <input
                id={inputId}
                ref={inputRef}
                type="search"
                inputMode="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、摘要、标签或正文片段"
                autoComplete="off"
                spellCheck={false}
              />
              <span className="search-dialog__shortcut">Ctrl + K</span>
            </label>

            <div className="search-dialog__meta">
              <div>
                <strong>{panelTitle}</strong>
                <span>{panelDescription}</span>
              </div>
            </div>

            <div className="search-dialog__results" aria-live="polite">
              {status === "loading" && (
                <p className="search-dialog__empty">正在载入搜索索引…</p>
              )}

              {status === "error" && (
                <p className="search-dialog__empty">
                  搜索索引加载失败，请稍后重试。
                </p>
              )}

              {status === "ready" && !visibleItems.length && (
                <p className="search-dialog__empty">
                  没找到匹配内容，试试标题关键词、标签或更短的片段。
                </p>
              )}

              {status === "ready" &&
                visibleItems.map((item) => (
                  <a
                    key={item.url}
                    href={item.url}
                    className="search-dialog__result"
                    onClick={() => handleOpenChange(false)}
                  >
                    <div className="search-dialog__result-head">
                      <h3>{item.title}</h3>
                      <span>{item.pubDate}</span>
                    </div>

                    {(item.description || item.excerpt) && (
                      <p className="search-dialog__result-excerpt">
                        {item.description || item.excerpt}
                      </p>
                    )}

                    {item.tags.length > 0 && (
                      <div className="search-dialog__result-tags">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span key={`${item.url}-${tag}`}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
