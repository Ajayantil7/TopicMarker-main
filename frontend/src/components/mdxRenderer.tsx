import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MDXRendererProps {
    content: string;
}

export function MDXRenderer({ content }: MDXRendererProps) {
    const [error, setError] = useState<string | null>(null);

    // Simple error boundary
    if (error) {
        return (
            <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">
                <h3 className="font-bold">Error rendering MDX:</h3>
                <pre className="mt-2 whitespace-pre-wrap">{error}</pre>
            </div>
        );
    }

    try {
        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
            >
                {content}
            </ReactMarkdown>
        );
    } catch (err) {
        console.error('Error rendering markdown:', err);
        setError(err instanceof Error ? err.message : 'Unknown error rendering markdown');
        return null;
    }
}