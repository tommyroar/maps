import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
  photos?: Record<string, string>;
}

export function Markdown({ content, photos }: MarkdownProps) {
  const transformImageUri = (src: string): string => {
    if (!photos) return src;
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return src;
    return photos[src] ?? photos[`./${src}`] ?? src;
  };
  return (
    <ReactMarkdown
      urlTransform={(url, key) => (key === 'src' ? transformImageUri(url) : url)}
    >
      {content}
    </ReactMarkdown>
  );
}
