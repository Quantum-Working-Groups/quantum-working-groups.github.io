import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import sanitizeHtml from "sanitize-html";
import { WorkingGroupSchema, type WorkingGroup } from "./schema";

const ALLOWED_TAGS = ["br", "strong", "em", "b", "i"];

function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
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
      shortDescription: sanitize(group.shortDescription),
    };
  });
  return groups.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
}
