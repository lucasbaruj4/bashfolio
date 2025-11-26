export type MarkdownImage = {
  alt: string;
  url: string;
};

export type MarkdownRenderResult = {
  text: string;
  images: MarkdownImage[];
};

export function renderMarkdown(markdown: string): MarkdownRenderResult {
  const lines = markdown.split(/\r?\n/);
  const outputLines: string[] = [];
  const images: MarkdownImage[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length) {
      outputLines.push(paragraphBuffer.join(" "));
      paragraphBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      if (outputLines[outputLines.length - 1] !== "") {
        outputLines.push("");
      }
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      flushParagraph();
      const headingText = line.replace(/^#{1,6}\s*/, "");
      const headingPrefix = line.match(/^#{1,6}/)?.[0] ?? "#";
      outputLines.push(`${headingPrefix} ${headingText.toUpperCase()}`);
      continue;
    }

    const lineWithInline = line
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
        const normalizedAlt = alt || "Image";
        images.push({ alt: normalizedAlt, url });
        return `[Image: ${normalizedAlt} -> ${url}]`;
      })
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `${label} (${url})`);

    paragraphBuffer.push(lineWithInline);
  }

  flushParagraph();

  const text = outputLines.join("\n").trim();

  return { text, images };
}
