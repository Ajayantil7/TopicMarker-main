import { createFileRoute } from '@tanstack/react-router';
import { MDXRenderer } from '@/components/mdxRenderer';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/_authenticated/mdx')({
    component: MDXPage,
});

// Default content to show when no saved content exists
const DEFAULT_CONTENT = '# Hello, MDX!\n\nThis is a sample MDX document.\n\n```js\nconsole.log("Hello world");\n```\n\n## Features\n\n- **Bold text** and *italic text*\n- Lists and code blocks\n- And more!';

function MDXPage() {
    const [mdxContent, setMdxContent] = useState(DEFAULT_CONTENT);

    // Load content from localStorage on initial render
    useEffect(() => {
        const savedContent = localStorage.getItem('mdx-content');
        if (savedContent) {
            setMdxContent(savedContent);
        } else {
            // If no saved content, save the default content
            localStorage.setItem('mdx-content', DEFAULT_CONTENT);
        }
    }, []);

    // Handle content changes
    const handleContentChange = (e: any) => {
        const newContent = e.target.value;
        setMdxContent(newContent);
        localStorage.setItem('mdx-content', newContent);
    };

    return (
        <div className="flex h-screen">
            {/* Editor Panel - Left Half */}
            <div className="w-1/2 h-full border-r border-slate-200 dark:border-slate-700">
                <div className="p-4 h-16 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">MDX Editor</h2>
                </div>
                <Textarea
                    className="w-full h-[calc(100%-4rem)] p-4 border-none rounded-none resize-none font-mono focus:ring-0 focus:outline-none"
                    value={mdxContent}
                    onChange={handleContentChange}
                />
            </div>

            {/* Preview Panel - Right Half */}
            <div className="w-1/2 h-full overflow-auto">
                <div className="p-4 h-16 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Preview</h2>
                    <a
                        href="/mdxPublic"
                        target="_blank"
                        className="text-blue-600 text-sm hover:underline"
                    >
                        Open Public Preview
                    </a>
                </div>
                <div className="prose max-w-none dark:prose-invert p-4 overflow-auto h-[calc(100%-4rem)]">
                    <MDXRenderer content={mdxContent} />
                </div>
            </div>
        </div>
    );
}