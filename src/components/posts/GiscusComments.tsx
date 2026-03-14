import { useEffect, useRef } from "react";
import type { GiscusConfig } from "../../config/site";

type Props = {
  config: GiscusConfig;
};

function getThemeUrl(themePath: string) {
  return new URL(themePath, window.location.origin).toString();
}

function getResolvedTheme(config: GiscusConfig) {
  const themePath = document.documentElement.classList.contains("dark")
    ? config.theme.dark
    : config.theme.light;

  return getThemeUrl(themePath);
}

function updateGiscusTheme(config: GiscusConfig) {
  const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
  if (!iframe?.contentWindow) return;

  iframe.contentWindow.postMessage(
    {
      giscus: {
        setConfig: {
          theme: getResolvedTheme(config),
        },
      },
    },
    "https://giscus.app",
  );
}

export default function GiscusComments({ config }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.childElementCount > 0) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", config.repo);
    script.setAttribute("data-repo-id", config.repoId);
    script.setAttribute("data-category", config.category);
    script.setAttribute("data-category-id", config.categoryId);
    script.setAttribute("data-mapping", config.mapping);
    script.setAttribute("data-strict", config.strict ? "1" : "0");
    script.setAttribute("data-reactions-enabled", config.reactionsEnabled ? "1" : "0");
    script.setAttribute("data-emit-metadata", config.emitMetadata ? "1" : "0");
    script.setAttribute("data-input-position", config.inputPosition);
    script.setAttribute("data-theme", getResolvedTheme(config));
    script.setAttribute("data-lang", config.lang);

    container.innerHTML = "";
    container.append(script);
  }, [
    config.category,
    config.categoryId,
    config.emitMetadata,
    config.inputPosition,
    config.lang,
    config.mapping,
    config.reactionsEnabled,
    config.repo,
    config.repoId,
    config.strict,
    config.theme.dark,
    config.theme.light,
  ]);

  useEffect(() => {
    const root = document.documentElement;
    const container = containerRef.current;

    const syncTheme = () => {
      updateGiscusTheme(config);
    };

    const rootObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === "class")) {
        syncTheme();
      }
    });
    rootObserver.observe(root, { attributes: true, attributeFilter: ["class"] });

    const mountObserver = new MutationObserver(() => {
      syncTheme();
    });

    if (container) {
      mountObserver.observe(container, { childList: true, subtree: true });
    }

    syncTheme();

    return () => {
      rootObserver.disconnect();
      mountObserver.disconnect();
    };
  }, [config]);

  return (
    <section className="article-comments" aria-labelledby="article-comments-title">
      <div className="article-comments__intro">
        <p className="article-comments__eyebrow">COMMENTS</p>
        <h2 id="article-comments-title" className="article-comments__title">
          评论
        </h2>
      </div>
      <div className="article-comments__embed" ref={containerRef} />
    </section>
  );
}
