import React from 'react';

interface MarkdownViewProps {
  content: string;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold**, `code`, or [label](https://...)
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          dir="ltr"
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(token);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 underline underline-offset-2 hover:text-teal-900"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`${keyPrefix}-list`} className="my-2 list-disc space-y-1.5 pr-5 text-sm leading-relaxed text-slate-700">
        {listItems.map((item, idx) => (
          <li key={idx}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList(`empty-${index}`);
      return;
    }

    if (line.startsWith('### ')) {
      flushList(`h3-${index}`);
      blocks.push(
        <h4 key={`h3-${index}`} className="mt-4 mb-1.5 text-sm font-bold text-slate-900">
          {renderInline(line.slice(4))}
        </h4>
      );
      return;
    }

    if (line.startsWith('## ') || line.startsWith('# ')) {
      flushList(`h2-${index}`);
      const clean = line.replace(/^#{1,2}\s+/, '');
      blocks.push(
        <h3 key={`h2-${index}`} className="mt-4 mb-2 text-base font-bold text-slate-900">
          {renderInline(clean)}
        </h3>
      );
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      listItems.push(line.slice(2));
      return;
    }

    const numberedMatch = /^\d+\.\s+(.+)$/.exec(line);
    if (numberedMatch) {
      listItems.push(numberedMatch[1]);
      return;
    }

    flushList(`p-${index}`);
    blocks.push(
      <p key={`p-${index}`} className="my-1.5 text-sm leading-relaxed text-slate-700">
        {renderInline(line)}
      </p>
    );
  });

  flushList('end');

  return <div className="space-y-1">{blocks}</div>;
};
