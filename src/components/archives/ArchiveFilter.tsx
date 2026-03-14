import { startTransition, useEffect, useState } from "react";

type ArchivePost = {
  title: string;
  url: string;
  date: string;
  dateTime: string;
  tags: string[];
};

type ArchiveGroup = {
  year: string;
  posts: ArchivePost[];
};

type ArchiveTag = {
  tag: string;
  count: number;
};

type Props = {
  groups: ArchiveGroup[];
  tags: ArchiveTag[];
};

function getFilteredGroups(groups: ArchiveGroup[], activeTag: string) {
  if (!activeTag) {
    return groups;
  }

  return groups
    .map((group) => ({
      ...group,
      posts: group.posts.filter((post) => post.tags.includes(activeTag)),
    }))
    .filter((group) => group.posts.length > 0);
}

export default function ArchiveFilter({ groups, tags }: Props) {
  const [activeTag, setActiveTag] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const tagFromQuery = url.searchParams.get("tag") ?? "";

    if (tagFromQuery && tags.some((item) => item.tag === tagFromQuery)) {
      setActiveTag(tagFromQuery);
    }
  }, [tags]);

  const filteredGroups = getFilteredGroups(groups, activeTag);
  const visiblePostCount = filteredGroups.reduce(
    (count, group) => count + group.posts.length,
    0,
  );

  function applyTagFilter(tag: string) {
    startTransition(() => {
      setActiveTag(tag);
    });

    const url = new URL(window.location.href);

    if (tag) {
      url.searchParams.set("tag", tag);
    } else {
      url.searchParams.delete("tag");
    }

    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <div className="archive-browser">
      <div className="archive-filter" aria-label="归档标签筛选">
        <button
          type="button"
          className={`archive-filter__tag archive-filter__tag--all ${
            !activeTag ? "is-active" : ""
          }`}
          aria-pressed={!activeTag}
          onClick={() => applyTagFilter("")}
        >
          Show All
          <sup>{groups.reduce((count, group) => count + group.posts.length, 0)}</sup>
        </button>

        {tags.map((item) => (
          <button
            key={item.tag}
            type="button"
            className={`archive-filter__tag ${activeTag === item.tag ? "is-active" : ""}`}
            aria-pressed={activeTag === item.tag}
            onClick={() => applyTagFilter(item.tag)}
          >
            {item.tag}
            <sup>{item.count}</sup>
          </button>
        ))}
      </div>

      <div className="archive-browser__status" aria-live="polite">
        {activeTag ? (
          <p>
            当前筛选: <strong>{activeTag}</strong>
            <span>{visiblePostCount} 篇</span>
          </p>
        ) : (
          <p>
            全部文章
            <span>{visiblePostCount} 篇</span>
          </p>
        )}
      </div>

      <div className="archives-page__groups">
        {filteredGroups.map((group) => (
          <section key={group.year} className="archive-year">
            <div className="archive-year__label">
              <span>{group.year}</span>
              <small>{group.posts.length} 篇</small>
            </div>
            <div className="archive-year__list">
              {group.posts.map((post) => (
                <a key={post.url} className="archive-item" href={post.url}>
                  <div className="archive-item__main">
                    <h2 className="archive-item__title">{post.title}</h2>
                  </div>
                  <div className="archive-item__meta">
                    <time dateTime={post.dateTime}>{post.date}</time>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
