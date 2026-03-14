const WRITING_TIME_PATTERN =
  /^[（(]\s*\d{4}(?:年\d{1,2}月\d{1,2}日?|[./-]\d{1,2}[./-]\d{1,2})(?:[^）)]*)[）)]$/u;

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function getNodeText(node) {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return node.value ?? "";
  }

  if (!Array.isArray(node.children)) {
    return "";
  }

  return node.children.map(getNodeText).join("");
}

function appendClassName(node, className) {
  node.properties ??= {};

  const existing = node.properties.className;
  const classNames = Array.isArray(existing)
    ? existing
    : typeof existing === "string"
      ? existing.split(/\s+/).filter(Boolean)
      : [];

  if (!classNames.includes(className)) {
    node.properties.className = [...classNames, className];
  }
}

function visit(node) {
  if (!node || !Array.isArray(node.children)) {
    return;
  }

  for (const child of node.children) {
    if (child?.type === "element" && child.tagName === "p") {
      const text = normalizeText(getNodeText(child));

      if (WRITING_TIME_PATTERN.test(text)) {
        appendClassName(child, "content-writing-time");
      }
    }

    visit(child);
  }
}

export default function rehypeWritingTimeMeta() {
  return function transform(tree) {
    visit(tree);
  };
}
