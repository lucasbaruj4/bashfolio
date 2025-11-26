export type MarkdownImage = {
  alt: string;
  url: string;
};

export type MarkdownSegment =
  | { type: "text"; content: string }
  | { type: "link"; label: string; url: string };

export type MarkdownRenderResult = {
  text: string;
  images: MarkdownImage[];
  segments: MarkdownSegment[];
};

const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

export function renderMarkdown(markdown: string): MarkdownRenderResult {
  const lines = markdown.split(/\r?\n/);
  const images: MarkdownImage[] = [];
  const segments: MarkdownSegment[] = [];
  const plainTextParts: string[] = [];

  const appendText = (content: string) => {
    if (!content) return;
    segments.push({ type: "text", content });
    plainTextParts.push(content);
  };

  const appendLink = (label: string, url: string) => {
    segments.push({ type: "link", label, url });
    plainTextParts.push(label);
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      appendText("\n");
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      const headingText = line.replace(/^#{1,6}\s*/, "");
      const headingPrefix = line.match(/^#{1,6}/)?.[0] ?? "#";
      appendText(`${headingPrefix} ${headingText.toUpperCase()}\n`);
      continue;
    }

    let processedLine = line.replace(imageRegex, (_, alt, url) => {
      const normalizedAlt = alt || "Image";
      images.push({ alt: normalizedAlt, url });
      return "";
    }).trim();

    if (!processedLine) {
      appendText("\n");
      continue;
    }

    let cursor = 0;
    let match: RegExpExecArray | null;
    linkRegex.lastIndex = 0;

    while ((match = linkRegex.exec(processedLine)) !== null) {
      const [fullMatch, label, url] = match;
      const before = processedLine.slice(cursor, match.index);
      appendText(before);
      appendLink(label, url);
      cursor = match.index + fullMatch.length;
    }

    const remainder = processedLine.slice(cursor);
    appendText(remainder);
    appendText("\n");
  }

  const text = plainTextParts.join("").replace(/\n{3,}/g, "\n\n").trim();

  return { text, images, segments };
}
