import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import sanitizeHtml from "sanitize-html";
import { marked } from "marked";
import { WorkingGroupSchema, type WorkingGroup } from "./schema";

const ALLOWED_TAGS = [
  "br", "strong", "em", "b", "i",
  "p", "ul", "ol", "li", "a",
  "h1", "h2", "h3", "h4", "h5", "h6",
];

function markdownToHtml(md: string): string {
  const html = marked.parse(md) as string;
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "title"] },
  });
}

export function getWorkingGroups(): WorkingGroup[] {
  const dir = path.join(process.cwd(), "data", "working-groups");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml"));
  const groups = files.map((file) => {
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    const group = WorkingGroupSchema.parse(yaml.load(content));
    return {
      ...group,
      shortDescription: markdownToHtml(group.shortDescription),
      longDescription: markdownToHtml(group.longDescription),
      acknowledgements: group.acknowledgements ? markdownToHtml(group.acknowledgements) : undefined,
    };
  });
  return groups.sort((a, b) => {
    const orderDiff = a.order - b.order;
    if (orderDiff !== 0) return orderDiff;
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
  });
}
