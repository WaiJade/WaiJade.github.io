import { toHast } from "mdast-util-to-hast";
import { visit } from "unist-util-visit";

const CALLOUTS = {
  danger: {
    defaultTitle: "警告",
    iconPath:
      "M227.31,80.23,175.77,28.69A16.13,16.13,0,0,0,164.45,24H91.55a16.13,16.13,0,0,0-11.32,4.69L28.69,80.23A16.13,16.13,0,0,0,24,91.55v72.9a16.13,16.13,0,0,0,4.69,11.32l51.54,51.54A16.13,16.13,0,0,0,91.55,232h72.9a16.13,16.13,0,0,0,11.32-4.69l51.54-51.54A16.13,16.13,0,0,0,232,164.45V91.55A16.13,16.13,0,0,0,227.31,80.23ZM120,80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z",
  },
  success: {
    defaultTitle: "成功",
    iconPath:
      "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z",
  },
  info: {
    defaultTitle: "信息",
    iconPath:
      "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z",
  },
  note: {
    defaultTitle: "备注",
    iconPath:
      "M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H156.69A15.86,15.86,0,0,0,168,219.31L219.31,168A15.86,15.86,0,0,0,224,156.69V48A16,16,0,0,0,208,32ZM160,204.69V160h44.69Z",
  },
  tip: {
    defaultTitle: "提示",
    iconPath:
      "M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Zm-50.34,2.34a8,8,0,0,0-11.32,0L128,132.69l-26.34-26.35a8,8,0,0,0-11.32,11.32L120,147.31V184a8,8,0,0,0,16,0V147.31l29.66-29.65A8,8,0,0,0,165.66,106.34Z",
  },
};

const COLLAPSIBLE_BLOCKS = {
  ai: {
    defaultTitle: "AI 总结",
    className: ["details", "ai-container", "custom-block"],
    summaryClassName: ["custom-block-title"],
  },
  details: {
    defaultTitle: "展开查看更多",
    className: ["details", "article-details"],
    summaryClassName: ["article-details__summary"],
  },
};

function getStringAttribute(node, key) {
  const value = node?.attributes?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function getBooleanAttribute(node, key) {
  const value = node?.attributes?.[key];
  return value === true || value === "" || value === "true";
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

function getDirectiveBodyChildren(node) {
  const bodyRoot = { type: "root", children: node.children ?? [] };
  const bodyHast = toHast(bodyRoot, { allowDangerousHtml: true });
  return Array.isArray(bodyHast?.children) ? bodyHast.children : [];
}

function buildCalloutChildren(node, callout, title) {
  const bodyChildren = getDirectiveBodyChildren(node);

  return [
    {
      type: "element",
      tagName: "div",
      properties: {
        className: ["article-directive__header"],
      },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["article-directive__icon"],
            "aria-hidden": "true",
          },
          children: [
            {
              type: "element",
              tagName: "svg",
              properties: {
                width: 18,
                height: 18,
                viewBox: "0 0 256 256",
                xmlns: "http://www.w3.org/2000/svg",
                fill: "currentColor",
              },
              children: [
                {
                  type: "element",
                  tagName: "path",
                  properties: {
                    d: callout.iconPath,
                  },
                },
              ],
            },
          ],
        },
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["article-directive__title"],
          },
          children: [{ type: "text", value: title }],
        },
      ],
    },
    {
      type: "element",
      tagName: "div",
      properties: {
        className: ["article-directive__body"],
      },
      children: bodyChildren,
    },
  ];
}

function buildCollapsibleChildren(node, title, summaryClassName) {
  return [
    {
      type: "element",
      tagName: "summary",
      properties: {
        className: summaryClassName,
      },
      children: [{ type: "text", value: title }],
    },
    ...getDirectiveBodyChildren(node),
  ];
}

function applyCollapsibleDirective(node) {
  const block = COLLAPSIBLE_BLOCKS[node.name];
  if (!block) {
    return false;
  }

  const title = getStringAttribute(node, "title") || block.defaultTitle;
  const isOpen = getBooleanAttribute(node, "open");

  setDirectiveData(node, "details", {
    className: block.className,
    ...(isOpen ? { open: true } : {}),
  });
  node.data.hChildren = buildCollapsibleChildren(node, title, block.summaryClassName);
  node.children = [];
  return true;
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
  node.data.hChildren = buildCalloutChildren(node, callout, title);
  node.children = [];
}

function applyHighlightDirective(node) {
  if (node.name !== "highlight") {
    return;
  }

  const accentColor = getStringAttribute(node, "color");

  setDirectiveData(node, "span", {
    className: ["article-mark"],
    style: accentColor ? `--article-mark-accent: ${accentColor}` : "",
  });
}

function wrapTables(tree) {
  visit(tree, "table", (node, index, parent) => {
    if (!parent || typeof index !== "number") {
      return;
    }

    parent.children.splice(index, 1, {
      type: "containerDirective",
      name: "tableWrapper",
      attributes: {},
      children: [node],
      data: {
        hName: "div",
        hProperties: {
          className: ["article-table-wrap"],
        },
      },
    });
  });
}

export default function remarkContentDirectives() {
  return function transform(tree) {
    wrapTables(tree);

    visit(tree, (node) => {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective"
      ) {
        if (applyCollapsibleDirective(node)) {
          return;
        }

        applyCalloutDirective(node);
      }

      if (node.type === "textDirective") {
        applyHighlightDirective(node);
      }
    });
  };
}
