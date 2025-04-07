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
      <div className="max-w-5xl mx-auto px-4 py-8">
        {mdxContent ? (
          <div className="prose max-w-none dark:prose-invert">
            <MDXRenderer content={mdxContent} />
          </div>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-xl font-medium">No content available</h2>
            <p className="text-gray-500 mt-2">Edit content in the MDX editor first</p>
          </div>
        )}
      </div>
    </div>
  );
}