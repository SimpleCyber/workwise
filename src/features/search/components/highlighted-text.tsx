"use client";

interface HighlightedTextProps {
  text: string;
  highlights: { start: number; end: number }[];
  className?: string;
}

export const HighlightedText = ({
  text,
  highlights,
  className = "",
}: HighlightedTextProps) => {
  if (!highlights.length) {
    return <span className={className}>{text}</span>;
  }

  const parts: { text: string; highlighted: boolean }[] = [];
  let lastIndex = 0;

  // Sort highlights by start position
  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

  for (const highlight of sortedHighlights) {
    // Add text before highlight
    if (highlight.start > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, highlight.start),
        highlighted: false,
      });
    }

    // Add highlighted text
    parts.push({
      text: text.slice(highlight.start, highlight.end),
      highlighted: true,
    });

    lastIndex = highlight.end;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      highlighted: false,
    });
  }

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <span
          key={index}
          className={
            part.highlighted ? "bg-pink-200 text-pink-900 rounded px-0.5" : ""
          }
        >
          {part.text}
        </span>
      ))}
    </span>
  );
};
