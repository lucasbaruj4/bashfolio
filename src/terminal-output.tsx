import { CommandOutput } from "./commands";
import { MarkdownSegment } from "./markdown";

type TerminalOutputProps = {
  output?: CommandOutput;
};

const linkClasses =
  "text-blue-500 underline underline-offset-4 hover:text-white transition-colors duration-150";

function renderSegments(segments?: MarkdownSegment[], fallbackText?: string) {
  if (segments && segments.length) {
    return segments.map((segment, index) => {
      if (segment.type === "link") {
        return (
          <a
            key={`segment-${index}-${segment.url}`}
            href={segment.url}
            target="_blank"
            rel="noreferrer"
            className={linkClasses}
          >
            {segment.label}
          </a>
        );
      }
      return (
        <span key={`segment-${index}-text`}>
          {segment.content}
        </span>
      );
    });
  }

  return fallbackText;
}

export default function TerminalOutput({ output }: TerminalOutputProps) {
  const text = output?.text ?? "";
  const segments = output?.segments;
  const images = output?.images ?? [];
  const primaryImage = images[0];
  const secondaryImages = images.slice(1);

  const textContent = (
    <div className="flex-1 whitespace-pre-wrap text-2xl px-6 font-[Terminal] text-white">
      {renderSegments(segments, text)}
    </div>
  );

  if (!primaryImage) {
    return (
      <div className="flex flex-col gap-4">
        {textContent}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-6 pr-10 md:flex-row md:items-start">
      <div className="flex flex-col items-center gap-4 w-full md:max-w-md lg:max-w-sm">
        <img
          src={primaryImage.url}
          alt={primaryImage.alt}
          className="w-48 max-w-[60vw] sm:w-56 md:w-64 lg:w-72 rounded-full border border-white bg-black object-cover"
        />
        <p className="text-lg font-[Terminal] text-gray-200 text-center">{primaryImage.alt}</p>
        {secondaryImages.length ? (
          <div className="flex flex-wrap justify-center gap-3">
            {secondaryImages.map((image, index) => (
              <img
                key={`${image.url}-${index}`}
                src={image.url}
                alt={image.alt}
                className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full border border-gray-700 bg-black object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>
      {textContent}
    </div>
  );
}
