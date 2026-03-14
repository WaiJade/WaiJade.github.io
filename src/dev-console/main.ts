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
type IconName = "note" | "list" | "search" | "eye" | "eyeSlash";

const featureConfig = [
  {
    key: "showNotes",
    label: "Notes",
    description: "控制导航、搜索和页面路由里的短记功能。",
    icon: "note",
  },
  {
    key: "showToc",
    label: "TOC",
    description: "控制文章页右侧目录是否显示。",
    icon: "list",
  },
  {
    key: "showSearch",
    label: "Search",
    description: "控制顶部搜索入口和 /search.json 输出。",
    icon: "search",
  },
] as const satisfies Array<{
  key: keyof FeatureFlags;
  label: string;
  description: string;
  icon: IconName;
}>;

const appElement = document.getElementById("app");

if (!(appElement instanceof HTMLElement)) {
  throw new Error("控制台挂载点不存在");
}

const app = appElement;

let currentState: ConsoleState | null = null;
let busyKey: string | null = null;
let draftFeatures: FeatureFlags | null = null;
let draftPostVisibility: Record<string, boolean> = {};

const iconPaths: Record<IconName, string> = {
  note: "M88,96a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H96A8,8,0,0,1,88,96Zm8,40h64a8,8,0,0,0,0-16H96a8,8,0,0,0,0,16Zm32,16H96a8,8,0,0,0,0,16h32a8,8,0,0,0,0-16ZM224,48V156.69A15.86,15.86,0,0,1,219.31,168L168,219.31A15.86,15.86,0,0,1,156.69,224H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48ZM48,208H152V160a8,8,0,0,1,8-8h48V48H48Zm120-40v28.7L196.69,168Z",
  list: "M80,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H88A8,8,0,0,1,80,64Zm136,56H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0,64H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM44,52A12,12,0,1,0,56,64,12,12,0,0,0,44,52Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,116Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,180Z",
  search:
    "M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z",
  eye: "M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z",
  eyeSlash:
    "M53.92,34.62A8,8,0,1,0,42.08,45.38L61.32,66.55C25,88.84,9.38,123.2,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208a127.11,127.11,0,0,0,52.07-10.83l22,24.21a8,8,0,1,0,11.84-10.76Zm47.33,75.84,41.67,45.85a32,32,0,0,1-41.67-45.85ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.16,133.16,0,0,1,25,128c4.69-8.79,19.66-33.39,47.35-49.38l18,19.75a48,48,0,0,0,63.66,70l14.73,16.2A112,112,0,0,1,128,192Zm6-95.43a8,8,0,0,1,3-15.72,48.16,48.16,0,0,1,38.77,42.64,8,8,0,0,1-7.22,8.71,6.39,6.39,0,0,1-.75,0,8,8,0,0,1-8-7.26A32.09,32.09,0,0,0,134,96.57Zm113.28,34.69c-.42.94-10.55,23.37-33.36,43.8a8,8,0,1,1-10.67-11.92A132.77,132.77,0,0,0,231.05,128a133.15,133.15,0,0,0-23.12-30.77C185.67,75.19,158.78,64,128,64a118.37,118.37,0,0,0-19.36,1.57A8,8,0,1,1,106,49.79,134,134,0,0,1,128,48c34.88,0,66.57,13.26,91.66,38.35,18.83,18.83,27.3,37.62,27.65,38.41A8,8,0,0,1,247.31,131.26Z",
};

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

function renderIcon(name: IconName, className = "") {
  const classes = className ? ` class="${className}"` : "";
  return `<svg${classes} viewBox="0 0 256 256" aria-hidden="true"><path d="${iconPaths[name]}"></path></svg>`;
}

function getSortedPosts(state: ConsoleState | null) {
  if (!state) {
    return [];
  }

  return [...state.activePosts, ...state.hiddenPosts].sort((left, right) => {
    const leftTime = left.pubDate ? Date.parse(left.pubDate) : 0;
    const rightTime = right.pubDate ? Date.parse(right.pubDate) : 0;
    return rightTime - leftTime || left.title.localeCompare(right.title, "zh-CN");
  });
}

function getPendingFeatures() {
  return draftFeatures ?? currentState?.features ?? null;
}

function isPostVisible(fileName: string, fallbackVisibility: boolean) {
  return fileName in draftPostVisibility ? draftPostVisibility[fileName] : fallbackVisibility;
}

function hasPendingChanges() {
  if (!currentState) {
    return false;
  }

  const pendingFeatures = getPendingFeatures();

  if (
    pendingFeatures &&
    (pendingFeatures.showNotes !== currentState.features.showNotes ||
      pendingFeatures.showToc !== currentState.features.showToc ||
      pendingFeatures.showSearch !== currentState.features.showSearch)
  ) {
    return true;
  }

  return getSortedPosts(currentState).some((post) => {
    const visible = isPostVisible(post.fileName, post.visibility === "active");
    return visible !== (post.visibility === "active");
  });
}

async function readJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(
      payload?.message ||
        (response.status === 404
          ? "控制台开发接口未加载，请重启一次 npm run dev。"
          : "控制台请求失败"),
    );
  }

  return (await response.json()) as T;
}

function renderFeatureList() {
  const pendingFeatures = getPendingFeatures();

  return featureConfig
    .map((feature) => {
      const checked = pendingFeatures?.[feature.key] ?? false;
      const disabled = !currentState || busyKey === "apply";

      return `<div class="dev-console__item">
        <span class="dev-console__icon" data-kind="feature">${renderIcon(
          feature.icon,
          "dev-console__icon-svg",
        )}</span>
        <div class="dev-console__copy">
          <h3 class="dev-console__item-title">${escapeHtml(feature.label)}</h3>
          <p class="dev-console__item-desc">${escapeHtml(feature.description)}</p>
        </div>
        <div class="dev-console__actions">
          <label class="dev-console__switch" aria-label="${escapeHtml(feature.label)} ${checked ? "已开启" : "已关闭"}">
            <input
              type="checkbox"
              class="dev-console__switch-input"
              data-action="toggle-feature"
              data-feature-key="${feature.key}"
              ${checked ? "checked" : ""}
              ${disabled ? "disabled" : ""}
            />
            <span class="dev-console__switch-track" aria-hidden="true">
              <span class="dev-console__switch-thumb"></span>
            </span>
          </label>
        </div>
      </div>`;
    })
    .join("");
}

function renderLoadingGroup(count: number) {
  return `<div class="dev-console__group dev-console__group--loading" role="status" aria-live="polite">
    ${Array.from({ length: count }, () => {
      return `<div class="dev-console__item is-loading">
        <span class="dev-console__loading-icon" aria-hidden="true"></span>
        <div class="dev-console__copy">
          <span class="dev-console__loading-bar dev-console__loading-bar--title" aria-hidden="true"></span>
          <span class="dev-console__loading-bar dev-console__loading-bar--desc" aria-hidden="true"></span>
        </div>
        <div class="dev-console__actions">
          <span class="dev-console__loading-switch" aria-hidden="true"></span>
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function renderPostVisibilityList(posts: PostItem[]) {
  if (posts.length === 0) {
    return `<div class="dev-console__group"><p class="dev-console__empty">当前没有文章。</p></div>`;
  }

  return `<div class="dev-console__group">${posts
    .map((post) => {
      const visible = isPostVisible(post.fileName, post.visibility === "active");
      const disabled = busyKey === "apply";

      return `<article class="dev-console__item ${visible ? "" : "is-hidden"}">
        <span class="dev-console__icon" data-kind="post">${renderIcon(
          "note",
          "dev-console__icon-svg",
        )}</span>
        <div class="dev-console__copy">
          <h3 class="dev-console__item-title">${escapeHtml(post.title)}</h3>
          <p class="dev-console__item-desc">${escapeHtml(formatPubDate(post.pubDate))} · ${escapeHtml(
            post.fileName,
          )}</p>
        </div>
        <div class="dev-console__actions">
          <label class="dev-console__switch" aria-label="${escapeHtml(post.title)} ${visible ? "显示中" : "已隐藏"}">
            <input
              type="checkbox"
              class="dev-console__switch-input"
              data-action="toggle-post-visibility"
              data-file-name="${escapeHtml(post.fileName)}"
              ${visible ? "checked" : ""}
              ${disabled ? "disabled" : ""}
            />
            <span class="dev-console__switch-track" aria-hidden="true">
              <span class="dev-console__switch-thumb"></span>
            </span>
          </label>
        </div>
      </article>`;
    })
    .join("")}</div>`;
}

function render() {
  const isLoading = currentState === null;
  const allPosts = getSortedPosts(currentState);
  const dirty = hasPendingChanges();

  app.innerHTML = `<main class="dev-console">
    <header class="dev-console__intro">
      <p class="page-panel__eyebrow">CONSOLE</p>
      <h1 class="page-panel__title">控制台</h1>
      <p class="page-panel__text">
        开发环境下可用的文章与功能控制面板。文章隐藏通过直接移动文件完成，生产构建不会继续解析被隐藏的正文文件。
      </p>
    </header>

    <div class="dev-console__sections">
      <section class="dev-console__section">
        <p class="dev-console__section-title">网站功能</p>
        ${
          isLoading
            ? renderLoadingGroup(featureConfig.length)
            : `<div class="dev-console__group">${renderFeatureList()}</div>`
        }
      </section>

      <section class="dev-console__section">
        <p class="dev-console__section-title">文章显示${isLoading ? "" : ` · ${String(allPosts.length)}`}</p>
        ${isLoading ? renderLoadingGroup(5) : renderPostVisibilityList(allPosts)}
      </section>
    </div>

    <div class="dev-console__floating-actions" data-visible="${String(!isLoading && dirty)}">
      <button
        type="button"
        class="dev-console__floating-button dev-console__floating-button--secondary"
        data-action="reset-draft"
        ${!dirty || busyKey === "apply" ? "disabled" : ""}
      >
        撤销
      </button>
      <button
        type="button"
        class="dev-console__floating-button dev-console__floating-button--primary"
        data-action="apply-draft"
        ${!dirty || busyKey === "apply" ? "disabled" : ""}
      >
        ${busyKey === "apply" ? "保存中" : "保存"}
      </button>
    </div>
  </main>`;
}

async function refreshState() {
  currentState = await readJson<ConsoleState>("/__console/state");
  draftFeatures = { ...currentState.features };
  draftPostVisibility = Object.fromEntries(
    getSortedPosts(currentState).map((post) => [post.fileName, post.visibility === "active"]),
  );
  render();
}

function handleToggleFeature(featureKey: keyof FeatureFlags, checked: boolean) {
  if (!currentState) {
    return;
  }

  draftFeatures = {
    ...(getPendingFeatures() ?? currentState.features),
    [featureKey]: checked,
  };
  render();
}

function handleTogglePostVisibility(fileName: string, visible: boolean) {
  if (!currentState) {
    return;
  }

  const currentPost = getSortedPosts(currentState).find((post) => post.fileName === fileName);

  if (!currentPost) {
    return;
  }

  draftPostVisibility = {
    ...draftPostVisibility,
    [fileName]: visible,
  };
  render();
}

function handleResetDraft() {
  if (!currentState) {
    return;
  }

  draftFeatures = { ...currentState.features };
  draftPostVisibility = Object.fromEntries(
    getSortedPosts(currentState).map((post) => [post.fileName, post.visibility === "active"]),
  );
  render();
}

async function handleApplyDraft() {
  if (!currentState || !draftFeatures) {
    return;
  }

  busyKey = "apply";
  render();

  try {
    await readJson<{ ok: boolean }>("/__console/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        features: draftFeatures,
        postVisibility: draftPostVisibility,
      }),
    });
  } catch (error) {
    busyKey = null;
    console.error(error);
    render();
  }
}

app.addEventListener("change", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const action = target.dataset.action;

  if (action === "toggle-feature") {
    const featureKey = target.dataset.featureKey as keyof FeatureFlags | undefined;

    if (featureKey) {
      handleToggleFeature(featureKey, target.checked);
    }

    return;
  }

  if (action === "toggle-post-visibility") {
    const fileName = target.dataset.fileName;

    if (fileName) {
      handleTogglePostVisibility(fileName, target.checked);
    }
  }
});

app.addEventListener("click", (event) => {
  const target = event.target instanceof HTMLElement ? event.target.closest("button") : null;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const action = target.dataset.action;

  if (action === "reset-draft") {
    handleResetDraft();
    return;
  }

  if (action === "apply-draft") {
    void handleApplyDraft();
  }
});

render();
void refreshState();
