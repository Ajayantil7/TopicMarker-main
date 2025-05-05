import { createFileRoute } from '@tanstack/react-router';
import { MDXRenderer } from '@/components/mdxRenderer';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/mdx')({
    component: MDXPage,
});

// Default content to show when no saved content exists
const DEFAULT_CONTENT = '# Hello, MDX!\n\nThis is a sample MDX document.\n\n```js\nconsole.log("Hello world");\n```\n\n## Features\n\n- **Bold text** and *italic text*\n- Lists and code blocks\n- And more!';

function MDXPage() {
    const [mdxContent, setMdxContent] = useState(DEFAULT_CONTENT);
    const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
    const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

    // Check for mobile view and handle resize
    useEffect(() => {
        const checkMobileView = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        // Initial check
        checkMobileView();

        // Add resize listener
        window.addEventListener('resize', checkMobileView);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobileView);
    }, []);

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
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setMdxContent(newContent);
        localStorage.setItem('mdx-content', newContent);
    };

    // Toggle fullscreen for editor
    const toggleEditorFullscreen = () => {
        setIsEditorFullscreen(!isEditorFullscreen);
        if (!isEditorFullscreen) {
            setIsPreviewFullscreen(false);
        }
    };

    // Toggle fullscreen for preview
    const togglePreviewFullscreen = () => {
        setIsPreviewFullscreen(!isPreviewFullscreen);
        if (!isPreviewFullscreen) {
            setIsEditorFullscreen(false);
        }
    };

    // Determine panel widths based on fullscreen states
    const getEditorWidth = () => {
        if (isMobileView) return 'w-full';
        if (isEditorFullscreen) return 'w-full';
        if (isPreviewFullscreen) return 'w-0';
        return 'w-1/2';
    };

    const getPreviewWidth = () => {
        if (isMobileView) return 'w-full';
        if (isPreviewFullscreen) return 'w-full';
        if (isEditorFullscreen) return 'w-0';
        return 'w-1/2';
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
            {/* Mobile Tab Selector */}
            {isMobileView && (
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        className={`flex-1 py-3 px-4 text-center font-medium ${
                            activeTab === 'editor'
                                ? 'bg-slate-100 dark:bg-slate-800 border-b-2 border-primary'
                                : 'bg-transparent'
                        }`}
                        onClick={() => setActiveTab('editor')}
                    >
                        Editor
                    </button>
                    <button
                        className={`flex-1 py-3 px-4 text-center font-medium ${
                            activeTab === 'preview'
                                ? 'bg-slate-100 dark:bg-slate-800 border-b-2 border-primary'
                                : 'bg-transparent'
                        }`}
                        onClick={() => setActiveTab('preview')}
                    >
                        Preview
                    </button>
                </div>
            )}

            {/* Editor Panel */}
            <div
                className={`${getEditorWidth()} h-full border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
                    isMobileView && activeTab !== 'editor' ? 'hidden' : ''
                }`}
            >
                <div className="p-3 h-14 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">MDX Editor</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleEditorFullscreen}
                            className="h-8 w-8 p-0"
                            title={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isEditorFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </Button>
                    </div>
                </div>
                <Textarea
                    className="w-full h-[calc(100%-3.5rem)] p-4 border-none rounded-none resize-none font-mono focus:ring-0 focus:outline-none text-base"
                    value={mdxContent}
                    onChange={handleContentChange}
                    style={{ fontSize: '1rem', lineHeight: '1.5' }}
                />
            </div>

            {/* Preview Panel */}
            <div
                className={`${getPreviewWidth()} h-full overflow-auto transition-all duration-300 ${
                    isMobileView && activeTab !== 'preview' ? 'hidden' : ''
                }`}
            >
                <div className="p-3 h-14 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Preview</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 p-1 flex items-center gap-1"
                        >
                            <a
                                href="/mdxPublic"
                                target="_blank"
                                className="flex items-center"
                            >
                                <span className="text-xs sm:text-sm">Public View</span>
                                <ExternalLink size={14} className="ml-1" />
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={togglePreviewFullscreen}
                            className="h-8 w-8 p-0"
                            title={isPreviewFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isPreviewFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </Button>
                    </div>
                </div>
                <div className="prose prose-sm sm:prose max-w-none dark:prose-invert p-4 overflow-auto h-[calc(100%-3.5rem)]">
                    <MDXRenderer content={mdxContent} />
                </div>
            </div>
        </div>
    );
}