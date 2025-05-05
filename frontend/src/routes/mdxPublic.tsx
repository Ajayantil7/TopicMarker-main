import { createFileRoute } from '@tanstack/react-router';
import { MDXRenderer } from '@/components/mdxRenderer';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/mdxPublic')({
  component: MDXPublic,
});

function MDXPublic() {
  const [mdxContent, setMdxContent] = useState('');

  // Load content from localStorage on initial render and set up a listener
  useEffect(() => {
    // Initial load
    const savedContent = localStorage.getItem('mdx-content');
    if (savedContent) {
      setMdxContent(savedContent);
    }

    // Setup storage event listener to update content when changed in another tab/window
    const handleStorageChange = (event: any) => {
      if (event.key === 'mdx-content') {
        setMdxContent(event.newValue || '');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">MDX Public View</h1>

        {mdxContent ? (
          <div className="prose prose-sm sm:prose md:prose-lg lg:prose-xl max-w-none dark:prose-invert mx-auto">
            <MDXRenderer content={mdxContent} />
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
            <h2 className="text-xl md:text-2xl font-medium">No content available</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Edit content in the MDX editor first</p>
            <div className="mt-6">
              <a
                href="/mdx"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to MDX Editor
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}