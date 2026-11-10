import katex from "katex";

const MATH = /\$([^$]+)\$/g;

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Text with `$...$` spans rendered by KaTeX. The result is safe to inject as HTML. */
export function latexToHtml(text: string): string {
  let html = "";
  let last = 0;
  for (const m of text.matchAll(MATH)) {
    html += escapeHtml(text.slice(last, m.index));
    html += katex.renderToString(m[1], { throwOnError: true, strict: "ignore" });
    last = m.index + m[0].length;
  }
  return html + escapeHtml(text.slice(last));
}

/** Text with `$...$` spans reduced to their symbols, for labels and plain lists. */
export function latexToText(text: string): string {
  return text.replace(MATH, (_, tex: string) =>
    katex
      .renderToString(tex, { output: "mathml", throwOnError: true, strict: "ignore" })
      .replace(/<annotation[\s\S]*?<\/annotation>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&"),
  );
}
