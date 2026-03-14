import {
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  type ReactNode,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatches(text: string, tokens: string[]): ReactNode {
  const uniqueTokens = [...new Set(tokens)].filter(Boolean);

  if (!uniqueTokens.length) {
    return text;
  }

  const pattern = new RegExp(
    `(${uniqueTokens
      .slice()
      .sort((left, right) => right.length - left.length)
      .map(escapeRegExp)
      .join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);

  if (parts.length <= 1) {
    return text;
  }

  return parts
    .filter((part) => part.length > 0)
    .map((part, index) => {
      const normalizedPart = normalizeSearchValue(part);

      if (uniqueTokens.some((token) => token === normalizedPart)) {
        return (
          <mark key={`${part}-${index}`} className="search-highlight">
            {part}
          </mark>
        );
      }

      return <span key={`${part}-${index}`}>{part}</span>;
    });
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
        <MagnifyingGlassIcon
          className="topbar__icon-button__icon"
          aria-hidden="true"
          weight="bold"
        />
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
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const inputId = useId();
  const normalizedQuery = normalizeSearchValue(deferredQuery);
  const tokens = normalizedQuery ? normalizedQuery.split(" ").filter(Boolean) : [];
  const hasQuery = tokens.length > 0;

  function openSearch() {
    if (document.activeElement instanceof HTMLElement) {
      lastActiveElementRef.current = document.activeElement;
    }

    setOpen(true);
  }

  function closeSearch(restoreFocus = true) {
    setOpen(false);
    setQuery("");

    if (restoreFocus) {
      const previousElement = lastActiveElementRef.current;

      if (previousElement) {
        window.requestAnimationFrame(() => {
          previousElement.focus();
        });
      }
    }
  }

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        if (open) {
          closeSearch();
        } else {
          openSearch();
        }

        return;
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        closeSearch();
        return;
      }

      if (event.key === "/" && !open && !isEditableTarget(event.target)) {
        event.preventDefault();
        openSearch();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [open]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("search-open", open);
    document.body.classList.toggle("search-open", open);

    return () => {
      document.documentElement.classList.remove("search-open");
      document.body.classList.remove("search-open");
    };
  }, [open]);

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

  let visibleItems: SearchIndexItem[] = [];

  if (status === "ready" && hasQuery) {
    const scoredItems = items
      .map((item) => ({
        item,
        score: scoreSearchItem(item, tokens, normalizedQuery),
      }))
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => right.score - left.score);

    visibleItems = scoredItems.slice(0, 16).map((entry) => entry.item);
  }

  const searchLayer = (
    <section
      className={`search-page ${open ? "search-page--active" : ""}`}
      aria-hidden={!open}
    >
      <div
        className="search-page__veil"
        aria-hidden="true"
        onClick={() => closeSearch()}
      />

      <div
        className={`search-page__main ${
          hasQuery ? "search-page__main--stacked" : ""
        }`}
      >
        <button
          type="button"
          className="topbar__icon-button search-page__close"
          onClick={() => closeSearch()}
          aria-label="关闭搜索"
        >
          <span className="topbar__icon-button__inner">
            <XIcon
              className="topbar__icon-button__icon"
              aria-hidden="true"
              weight="bold"
            />
          </span>
        </button>

        <div className="search-page__core">
          <div className="search-page__intro">
            <p className="search-page__eyebrow">SEARCH</p>
            <h2 className="search-page__title">搜索文章</h2>
          </div>

          <label
            className={`search-page__field ${
              hasQuery ? "search-page__field--prefixed" : ""
            }`}
            htmlFor={inputId}
          >
            {hasQuery && (
              <span className="search-page__field-prefix" aria-hidden="true">
                $ grep
              </span>
            )}
            <input
              id={inputId}
              ref={inputRef}
              type="search"
              inputMode="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={hasQuery ? "" : "$ grep..."}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </div>

        {hasQuery && (
          <div className="search-page__results" aria-live="polite">
            {status === "loading" && (
              <p className="search-page__empty">正在载入搜索索引…</p>
            )}

            {status === "error" && (
              <p className="search-page__empty">搜索索引加载失败，请稍后重试。</p>
            )}

            {status === "ready" && !visibleItems.length && (
              <p className="search-page__empty">
                没找到匹配内容，试试更短的标题关键词、标签或正文片段。
              </p>
            )}

            {status === "ready" &&
              visibleItems.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  className="search-page__result"
                  onClick={() => closeSearch(false)}
                >
                  <div className="search-page__result-head">
                    <h3>{highlightMatches(item.title, tokens)}</h3>
                    <span className="search-page__result-date">{item.pubDate}</span>
                  </div>

                  {item.tags.length > 0 && (
                    <div className="search-page__result-tags">
                      {item.tags.slice(0, 4).map((tag) => (
                        <span key={`${item.url}-${tag}`}>
                          {highlightMatches(tag, tokens)}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
          </div>
        )}
      </div>
    </section>
  );

  return (
    <>
      <div className="topbar__desktop-action">
        <SearchButton
          onClick={openSearch}
          className="topbar__icon-button topbar__icon-button--search"
        />
      </div>

      <div className="topbar__mobile-actions">
        <SearchButton
          onClick={openSearch}
          className="topbar__icon-button topbar__icon-button--search"
        />
      </div>
      {portalTarget ? createPortal(searchLayer, portalTarget) : null}
    </>
  );
}
