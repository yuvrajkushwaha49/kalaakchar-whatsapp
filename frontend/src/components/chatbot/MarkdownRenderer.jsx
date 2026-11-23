import React from 'react';

/**
 * Safe, zero-dependency Markdown renderer for AI chat messages.
 * Prevents raw HTML injection and sanitizes all content.
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];

  lines.forEach((line, index) => {
    // 1. Code Block boundary
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="ai-code-block">
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // 2. Horizontal divider
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={`hr-${index}`} className="my-2 opacity-25" />);
      return;
    }

    // 3. Headings
    if (line.startsWith('### ')) {
      elements.push(<h6 key={`h3-${index}`} className="fw-bold mt-2 mb-1 text-dark">{renderInline(line.replace('### ', ''))}</h6>);
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(<h5 key={`h2-${index}`} className="fw-bold mt-2 mb-1 text-dark">{renderInline(line.replace('## ', ''))}</h5>);
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(<h5 key={`h1-${index}`} className="fw-bold mt-2 mb-1 text-primary">{renderInline(line.replace('# ', ''))}</h5>);
      return;
    }

    // 4. Bullet lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={`li-${index}`} className="ai-list-item ms-3 mb-1">
          {renderInline(line.trim().replace(/^[-*]\s+/, ''))}
        </li>
      );
      return;
    }

    // 5. Numbered lists
    const numMatch = line.trim().match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${index}`} className="d-flex align-items-baseline gap-2 mb-1 ms-1">
          <span className="badge bg-secondary-subtle text-secondary rounded-circle px-2 py-1 small">{numMatch[1]}</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // 6. Regular paragraph or empty line
    if (line.trim().length === 0) {
      elements.push(<div key={`sp-${index}`} className="my-1" />);
      return;
    }

    elements.push(
      <p key={`p-${index}`} className="mb-1">
        {renderInline(line)}
      </p>
    );
  });

  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <pre key="code-final" className="ai-code-block">
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
  }

  return <div className="ai-markdown-content">{elements}</div>;
}

/**
 * Parse inline formatting: bold (**), inline code (`), and italic (*)
 */
function renderInline(text) {
  if (!text) return text;

  // Split on bold, inline code, and backticks
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="fw-bold">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="ai-inline-code">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
