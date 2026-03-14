import { useEffect, useRef } from "react";
import type { GiscusConfig } from "../../config/site";

type Props = {
  config: GiscusConfig;
};

const GISCUS_ORIGIN = "https://giscus.app";

function getThemeUrl(themePath: string, siteUrl: string) {
  const hostname = window.location.hostname;
  const baseUrl =
    hostname === "localhost" || hostname === "127.0.0.1"
      ? window.location.origin
      : siteUrl;

  return new URL(themePath, baseUrl).toString();
}

function getResolvedTheme(config: GiscusConfig) {
  const themePath = document.documentElement.classList.contains("dark")
    ? config.theme.dark
    : config.theme.light;

  return getThemeUrl(themePath, config.siteUrl);
}

function updateGiscusTheme(config: GiscusConfig) {
  const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
  if (!iframe?.contentWindow) return;

  let targetOrigin: string;
  try {
    targetOrigin = new URL(iframe.src, window.location.href).origin;
  } catch {
    return;
  }

  // The iframe is inserted as about:blank first, which inherits the page origin.
  // Only send config once it has navigated to the real giscus origin.
  if (targetOrigin !== GISCUS_ORIGIN) {
    return;
  }

  try {
    iframe.contentWindow.postMessage(
      {
        giscus: {
          setConfig: {
            theme: getResolvedTheme(config),
          },
        },
      },
      targetOrigin,
    );
  } catch (error) {
    console.warn("[giscus] theme sync skipped", error);
  }
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
    script.setAttribute("data-loading", config.loading);

    container.innerHTML = "";
    container.append(script);
  }, [
    config.category,
    config.categoryId,
    config.emitMetadata,
    config.inputPosition,
    config.lang,
    config.loading,
    config.mapping,
    config.reactionsEnabled,
    config.repo,
    config.repoId,
    config.siteUrl,
    config.strict,
    config.theme.dark,
    config.theme.light,
  ]);

  useEffect(() => {
    const root = document.documentElement;
    const container = containerRef.current;
    let currentIframe: HTMLIFrameElement | null = null;

    const syncTheme = () => {
      updateGiscusTheme(config);
    };

    const bindIframeLoad = () => {
      const nextIframe =
        container?.querySelector<HTMLIFrameElement>("iframe.giscus-frame") ?? null;

      if (currentIframe === nextIframe) return;

      if (currentIframe) {
        currentIframe.removeEventListener("load", syncTheme);
      }

      currentIframe = nextIframe;

      if (currentIframe) {
        currentIframe.addEventListener("load", syncTheme);
      }
    };

    const rootObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === "class")) {
        syncTheme();
      }
    });
    rootObserver.observe(root, { attributes: true, attributeFilter: ["class"] });

    const mountObserver = new MutationObserver(() => {
      bindIframeLoad();
      syncTheme();
    });

    if (container) {
      mountObserver.observe(container, { childList: true, subtree: true });
    }

    bindIframeLoad();
    syncTheme();

    return () => {
      currentIframe?.removeEventListener("load", syncTheme);
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
      <div className="article-comments__shell">
        <div className="article-comments__surface">
          <div className="article-comments__embed" ref={containerRef} />
        </div>
      </div>
    </section>
  );
}
