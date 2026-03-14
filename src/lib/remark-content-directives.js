import { visit } from "unist-util-visit";

const CALLOUTS = {
  danger: {
    defaultTitle: "警告",
  },
  success: {
    defaultTitle: "成功",
  },
  info: {
    defaultTitle: "信息",
  },
  note: {
    defaultTitle: "注意",
  },
  tip: {
    defaultTitle: "提示",
  },
};

function getStringAttribute(node, key) {
  const value = node?.attributes?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function mergeClassNames(...values) {
  return values.flatMap((value) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (typeof value === "string") {
      return value.split(/\s+/).filter(Boolean);
    }

    return [];
  });
}

function mergeStyle(left, right) {
  return [left, right].filter(Boolean).join("; ");
}

function setDirectiveData(node, tagName, properties) {
  node.data ??= {};
  node.data.hName = tagName;
  node.data.hProperties = {
    ...(node.data.hProperties ?? {}),
    ...properties,
    className: mergeClassNames(node.data.hProperties?.className, properties.className),
    style: mergeStyle(node.data.hProperties?.style, properties.style),
  };
}

function prependCalloutTitle(node, title) {
  const firstChild = Array.isArray(node.children) ? node.children[0] : null;
  const firstChildClassName = firstChild?.data?.hProperties?.className;

  if (mergeClassNames(firstChildClassName).includes("article-directive__title")) {
    return;
  }

  node.children ??= [];
  node.children.unshift({
    type: "paragraph",
    data: {
      hProperties: {
        className: ["article-directive__title"],
      },
    },
    children: [{ type: "text", value: title }],
  });
}

function applyCalloutDirective(node) {
  const callout = CALLOUTS[node.name];
  if (!callout) {
    return;
  }

  const accentColor = getStringAttribute(node, "color");
  const title = getStringAttribute(node, "title") || callout.defaultTitle;

  setDirectiveData(node, "aside", {
    className: ["article-directive", `article-directive--${node.name}`],
    "data-directive": node.name,
    style: accentColor ? `--article-callout-accent: ${accentColor}` : "",
  });
  prependCalloutTitle(node, title);
}

function applyHighlightDirective(node) {
  if (node.name !== "highlight") {
    return;
  }

  const accentColor = getStringAttribute(node, "color");

  setDirectiveData(node, "mark", {
    className: ["article-mark"],
    style: accentColor ? `--article-mark-accent: ${accentColor}` : "",
  });
}

export default function remarkContentDirectives() {
  return function transform(tree) {
    visit(tree, (node) => {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective"
      ) {
        applyCalloutDirective(node);
      }

      if (node.type === "textDirective") {
        applyHighlightDirective(node);
      }
    });
  };
}
