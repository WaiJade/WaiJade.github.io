import "./styles.css";

type FeatureFlags = {
  showNotes: boolean;
  showToc: boolean;
  showSearch: boolean;
};

type PostItem = {
  id: string;
  fileName: string;
  title: string;
  pubDate: string | null;
  visibility: "active" | "hidden";
};

type ConsoleState = {
  features: FeatureFlags;
  activePosts: PostItem[];
  hiddenPosts: PostItem[];
};

type StatusTone = "default" | "error";

const featureConfig = [
  {
    key: "showNotes",
    label: "Notes",
    description: "控制导航、搜索和页面路由里的短记功能。",
  },
  {
    key: "showToc",
    label: "TOC",
    description: "控制文章页右侧目录是否显示。",
  },
  {
    key: "showSearch",
    label: "Search",
    description: "控制顶部搜索入口和 /search.json 输出。",
  },
] as const satisfies Array<{
  key: keyof FeatureFlags;
  label: string;
  description: string;
}>;

const appElement = document.getElementById("app");

if (!(appElement instanceof HTMLElement)) {
  throw new Error("控制台挂载点不存在");
}

const app = appElement;

let currentState: ConsoleState | null = null;
let status = "正在读取本地控制状态…";
let statusTone: StatusTone = "default";
let busyKey: string | null = null;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPubDate(value: string | null) {
  if (!value) {
    return "未解析日期";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(parsedDate)
    .replace(/\//g, ".");
}

async function readJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || "控制台请求失败");
  }

  return (await response.json()) as T;
}

function renderFeatureList() {
  return featureConfig
    .map((feature) => {
      const checked = currentState?.features[feature.key] ?? false;
      const currentBusyKey = `feature:${feature.key}`;
      const disabled = !currentState || busyKey === currentBusyKey;

      return `<div class="dev-console__feature-item">
        <div class="dev-console__feature-meta">
          <h3 class="dev-console__feature-name">${escapeHtml(feature.label)}</h3>
          <p class="dev-console__feature-desc">${escapeHtml(feature.description)}</p>
        </div>
        <button
          type="button"
          class="dev-console__toggle"
          data-action="toggle-feature"
          data-feature-key="${feature.key}"
          data-checked="${String(checked)}"
          ${disabled ? "disabled" : ""}
        >
          <span class="dev-console__toggle-track" aria-hidden="true">
            <span class="dev-console__toggle-thumb"></span>
          </span>
          <span class="dev-console__toggle-label">${checked ? "开启" : "关闭"}</span>
        </button>
      </div>`;
    })
    .join("");
}

function renderPostList(posts: PostItem[], emptyText: string, action: "hide" | "show") {
  if (posts.length === 0) {
    return `<p class="dev-console__empty">${escapeHtml(emptyText)}</p>`;
  }

  return `<div class="dev-console__post-list">${posts
    .map((post) => {
      const currentBusyKey = `post:${post.fileName}`;
      const disabled = busyKey === currentBusyKey;

      return `<article class="dev-console__post-card">
        <div class="dev-console__post-header">
          <div>
            <h3 class="dev-console__post-title">${escapeHtml(post.title)}</h3>
            <p class="dev-console__post-meta">
              <span>${escapeHtml(formatPubDate(post.pubDate))}</span>
              <span>${escapeHtml(post.fileName)}</span>
            </p>
          </div>
          <button
            type="button"
            class="dev-console__post-action"
            data-action="toggle-post"
            data-post-action="${action}"
            data-file-name="${escapeHtml(post.fileName)}"
            ${disabled ? "disabled" : ""}
          >
            ${action === "hide" ? "隐藏" : "恢复"}
          </button>
        </div>
      </article>`;
    })
    .join("")}</div>`;
}

function render() {
  app.innerHTML = `<main class="dev-console">
    <header class="dev-console__header">
      <p class="dev-console__eyebrow">Local Dev Console</p>
      <h1 class="dev-console__title">本地控制台</h1>
      <p class="dev-console__text">
        这里只在 <code>npm run dev</code> 时存在。文章隐藏通过直接移动文件完成，生产构建不会继续解析被隐藏的正文文件。
      </p>
      <div class="dev-console__status" data-tone="${statusTone}">${escapeHtml(status)}</div>
    </header>

    <div class="dev-console__grid">
      <section class="dev-console__panel">
        <div class="dev-console__panel-inner">
          <div class="dev-console__panel-header">
            <div>
              <h2 class="dev-console__panel-title">网站功能</h2>
              <p class="dev-console__panel-text">这些开关会写回仓库里的站点控制配置。</p>
            </div>
          </div>

          <div class="dev-console__feature-list">${renderFeatureList()}</div>
        </div>
      </section>

      <div class="dev-console__columns">
        <section class="dev-console__panel">
          <div class="dev-console__panel-inner dev-console__column">
            <div class="dev-console__panel-header">
              <div>
                <h2 class="dev-console__panel-title">显示中</h2>
                <p class="dev-console__panel-text">
                  当前位于 <code>src/content/posts/</code> 的文章。
                </p>
              </div>
            </div>

            ${renderPostList(currentState?.activePosts ?? [], "当前没有公开文章。", "hide")}
          </div>
        </section>

        <section class="dev-console__panel">
          <div class="dev-console__panel-inner dev-console__column">
            <div class="dev-console__panel-header">
              <div>
                <h2 class="dev-console__panel-title">已隐藏</h2>
                <p class="dev-console__panel-text">
                  当前位于 <code>src/content/posts-hidden/</code> 的文章。
                </p>
              </div>
            </div>

            ${renderPostList(currentState?.hiddenPosts ?? [], "当前没有被隐藏的文章。", "show")}
          </div>
        </section>
      </div>
    </div>
  </main>`;
}

async function refreshState(nextStatus?: string) {
  currentState = await readJson<ConsoleState>("/__console/state");
  status = nextStatus || "控制项已更新。";
  statusTone = "default";
  render();
}

async function handleToggleFeature(featureKey: keyof FeatureFlags) {
  if (!currentState) {
    return;
  }

  const nextFeatures = {
    ...currentState.features,
    [featureKey]: !currentState.features[featureKey],
  };

  busyKey = `feature:${featureKey}`;
  status = "正在写入功能开关…";
  statusTone = "default";
  render();

  try {
    await readJson<{ ok: boolean; features: FeatureFlags }>("/__console/features", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ features: nextFeatures }),
    });
    busyKey = null;
    await refreshState("功能开关已更新。");
  } catch (error) {
    busyKey = null;
    status = error instanceof Error ? error.message : "功能开关写入失败";
    statusTone = "error";
    render();
  }
}

async function handleTogglePost(fileName: string, action: "hide" | "show") {
  busyKey = `post:${fileName}`;
  status = action === "hide" ? "正在隐藏文章…" : "正在恢复文章…";
  statusTone = "default";
  render();

  try {
    await readJson<{ ok: boolean }>("/__console/posts/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName, action }),
    });
    busyKey = null;
    await refreshState(action === "hide" ? "文章已隐藏。" : "文章已恢复。");
  } catch (error) {
    busyKey = null;
    status = error instanceof Error ? error.message : "文章状态更新失败";
    statusTone = "error";
    render();
  }
}

app.addEventListener("click", (event) => {
  const target = event.target instanceof HTMLElement ? event.target.closest("button") : null;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const action = target.dataset.action;

  if (action === "toggle-feature") {
    const featureKey = target.dataset.featureKey as keyof FeatureFlags | undefined;

    if (featureKey) {
      void handleToggleFeature(featureKey);
    }

    return;
  }

  if (action === "toggle-post") {
    const fileName = target.dataset.fileName;
    const postAction = target.dataset.postAction as "hide" | "show" | undefined;

    if (fileName && postAction) {
      void handleTogglePost(fileName, postAction);
    }
  }
});

render();
void refreshState(
  "当前是本地开发控制台。这里的更改会直接写回仓库配置和文章文件位置。",
);
