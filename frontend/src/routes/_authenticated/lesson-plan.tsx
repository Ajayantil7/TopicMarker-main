import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  searchTopics,
  generateSingleTopic,
  generateSingleTopicRaw,
  generateMdxFromUrls,
  generateMdxFromUrlsRaw
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MDXRenderer } from '@/components/mdxRenderer';
import { Loader2, Search, X, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/_authenticated/lesson-plan')({
  component: LessonPlan,
});

interface Topic {
  topic: string;
  subtopics: string[];
}

interface TopicHierarchy {
  topics: Topic[];
}

interface UrlInput {
  value: string;
  isValid: boolean;
}

function LessonPlan() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [urlInputs, setUrlInputs] = useState<UrlInput[]>([{ value: '', isValid: false }]);
  const [mdxContent, setMdxContent] = useState<string>('');
  const [isGeneratingMdx, setIsGeneratingMdx] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [generationMethod, setGenerationMethod] = useState<'crawl' | 'urls'>('crawl');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Query for searching topics
  const {
    data: topicsData,
    isLoading: isLoadingTopics,
    isError: isTopicsError,
    refetch: refetchTopics,
  } = useQuery({
    queryKey: ['search-topics', searchQuery],
    queryFn: () => searchTopics(searchQuery, 3),
    enabled: false,
  });

  // Query for generating MDX content for a selected topic
  const {
    data: mdxData,
    isLoading: isLoadingMdx,
    isError: isMdxError,
  } = useQuery({
    queryKey: ['generate-mdx', selectedTopic || selectedSubtopic],
    queryFn: () => generateSingleTopic(selectedTopic || selectedSubtopic || '', 2),
    enabled: !!(selectedTopic || selectedSubtopic) && !showRightSidebar && !showEditor,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      refetchTopics();
    }
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setSelectedSubtopic(null);
    setShowRightSidebar(true);
    setShowEditor(false);
    setMdxContent('');
    setGenerationError(null);
  };

  const handleSubtopicSelect = (subtopic: string) => {
    setSelectedSubtopic(subtopic);
    setSelectedTopic(null);
    setShowRightSidebar(true);
    setShowEditor(false);
    setMdxContent('');
    setGenerationError(null);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrlInputs = [...urlInputs];
    const isValid = /^(http|https):\/\/[^ "]+$/.test(value);
    newUrlInputs[index] = { value, isValid };
    setUrlInputs(newUrlInputs);
  };

  const addUrlInput = () => {
    if (urlInputs.length < 4) {
      setUrlInputs([...urlInputs, { value: '', isValid: false }]);
    }
  };

  const removeUrlInput = (index: number) => {
    if (urlInputs.length > 1) {
      const newUrlInputs = urlInputs.filter((_, i) => i !== index);
      setUrlInputs(newUrlInputs);
    }
  };

  const validateUrls = () => {
    // Check if at least one URL is valid
    const validUrls = urlInputs.filter(url => url.isValid);
    return validUrls.length > 0;
  };

  const generateMdxFromCrawling = async () => {
    setIsGeneratingMdx(true);
    setGenerationError(null);
    try {
      const currentTopic = selectedTopic || selectedSubtopic || '';
      const rawMdx = await generateSingleTopicRaw(currentTopic, 3);
      setMdxContent(rawMdx);
      setShowEditor(true);
      setShowRightSidebar(false);
    } catch (error) {
      console.error('Error generating MDX from crawling:', error);
      setGenerationError('Failed to generate MDX content from crawling. Please try again.');
    } finally {
      setIsGeneratingMdx(false);
    }
  };

  const generateMdxFromUrlsList = async () => {
    if (!validateUrls()) {
      setGenerationError('Please enter at least one valid URL');
      return;
    }

    setIsGeneratingMdx(true);
    setGenerationError(null);
    try {
      const currentTopic = selectedTopic || selectedSubtopic || '';
      const validUrls = urlInputs.filter(url => url.isValid).map(url => url.value);

      const rawMdx = await generateMdxFromUrlsRaw(validUrls, currentTopic, true);
      setMdxContent(rawMdx);
      setShowEditor(true);
      setShowRightSidebar(false);
    } catch (error) {
      console.error('Error generating MDX from URLs:', error);
      setGenerationError('Failed to generate MDX content from URLs. Please try again.');
    } finally {
      setIsGeneratingMdx(false);
    }
  };

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

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setMdxContent(newContent);
  };

  // Toggle fullscreen for editor
  const toggleEditorFullscreen = () => {
    setIsEditorFullscreen(!isEditorFullscreen);
    if (!isEditorFullscreen) {
      setIsPreviewFullscreen(false);
    }
    // Keep the right sidebar visible even in fullscreen mode
    setShowRightSidebar(true);
  };

  // Toggle fullscreen for preview
  const togglePreviewFullscreen = () => {
    setIsPreviewFullscreen(!isPreviewFullscreen);
    if (!isPreviewFullscreen) {
      setIsEditorFullscreen(false);
    }
    // Keep the right sidebar visible even in fullscreen mode
    setShowRightSidebar(true);
  };

  // Determine panel widths based on fullscreen states
  const getEditorWidth = () => {
    if (isMobileView) return 'w-full';
    if (isEditorFullscreen) return 'w-full';
    if (isPreviewFullscreen) return 'w-0';
    return 'w-3/5'; // Increased editor width (60%)
  };

  const getPreviewWidth = () => {
    if (isMobileView) return 'w-full';
    if (isPreviewFullscreen) return 'w-full';
    if (isEditorFullscreen) return 'w-0';
    return 'w-2/5'; // Decreased preview width (40%)
  };

  return (
    <div className={`flex flex-col md:flex-row gap-4 w-full ${isEditorFullscreen || isPreviewFullscreen ? 'h-screen overflow-hidden' : ''}`}>
      {/* Left sidebar for topic hierarchy */}
      <div className={`w-full md:w-1/4 lg:w-1/5 ${isEditorFullscreen || isPreviewFullscreen ? 'hidden md:hidden' : ''}`}>
        <Card>
          <CardHeader>
            <CardTitle>Lesson Plan Topics</CardTitle>
            <CardDescription>Search for a topic to generate a lesson plan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
              <Input
                type="text"
                placeholder="Enter a topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoadingTopics}>
                {isLoadingTopics ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>

            {isTopicsError && (
              <div className="text-red-500 text-sm mb-4">Error loading topics. Please try again.</div>
            )}

            {topicsData?.status === 'success' && topicsData.data?.topics && (
              <div className="space-y-4">
                {(() => {
                  try {
                    // Extract the JSON string from the code block
                    const topicsString = topicsData.data.topics;
                    const jsonMatch = topicsString.match(/```json\n([\s\S]*?)\n```/);

                    if (!jsonMatch || !jsonMatch[1]) {
                      return <div className="text-red-500">Error parsing topics data</div>;
                    }

                    // Parse the JSON string
                    const parsedTopics: Topic[] = JSON.parse(jsonMatch[1]);

                    return parsedTopics.map((topic: Topic, index: number) => (
                      <div key={index} className="space-y-2">
                        <div
                          className={`font-medium cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                            selectedTopic === topic.topic ? 'bg-gray-100 dark:bg-gray-800' : ''
                          }`}
                          onClick={() => handleTopicSelect(topic.topic)}
                        >
                          {topic.topic}
                        </div>
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div className="pl-4 space-y-1">
                            {topic.subtopics.map((subtopic, subIndex) => (
                              <div
                                key={subIndex}
                                className={`text-sm cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                  selectedSubtopic === subtopic ? 'bg-gray-100 dark:bg-gray-800' : ''
                                }`}
                                onClick={() => handleSubtopicSelect(subtopic)}
                              >
                                {subtopic}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ));
                  } catch (error) {
                    console.error("Error parsing topics:", error);
                    return <div className="text-red-500">Error parsing topics data</div>;
                  }
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right sidebar for MDX generation options */}
      {showRightSidebar && (
        <div className={`w-full md:w-1/4 lg:w-1/5 ${isEditorFullscreen || isPreviewFullscreen ? 'md:w-1/5 lg:w-1/6' : ''}`}>
          <Card>
            <CardHeader>
              <CardTitle>MDX Generation</CardTitle>
              <CardDescription>
                Generate MDX content for {selectedTopic || selectedSubtopic}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => setGenerationMethod('crawl')}
                    variant={generationMethod === 'crawl' ? 'default' : 'outline'}
                    className="w-full justify-start"
                  >
                    Generate by Crawling
                  </Button>
                  <Button
                    onClick={() => setGenerationMethod('urls')}
                    variant={generationMethod === 'urls' ? 'default' : 'outline'}
                    className="w-full justify-start"
                  >
                    Generate from URLs
                  </Button>
                </div>

                {generationMethod === 'crawl' && (
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      This will generate MDX content by crawling the web for information about the selected topic.
                    </p>
                    <Button
                      onClick={generateMdxFromCrawling}
                      disabled={isGeneratingMdx}
                      className="w-full"
                    >
                      {isGeneratingMdx ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        'Generate MDX'
                      )}
                    </Button>
                  </div>
                )}

                {generationMethod === 'urls' && (
                  <div className="pt-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Enter 1-4 URLs to generate MDX content from. Each URL should be a valid web address.
                    </p>

                    {urlInputs.map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="url"
                          placeholder="https://example.com"
                          value={url.value}
                          onChange={(e) => handleUrlChange(index, e.target.value)}
                          className={`flex-1 ${!url.value || url.isValid ? '' : 'border-red-500'}`}
                        />
                        {urlInputs.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeUrlInput(index)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {urlInputs.length < 4 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addUrlInput}
                        className="w-full"
                      >
                        Add URL
                      </Button>
                    )}

                    <Button
                      onClick={generateMdxFromUrlsList}
                      disabled={isGeneratingMdx || !validateUrls()}
                      className="w-full mt-4"
                    >
                      {isGeneratingMdx ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        'Generate MDX from URLs'
                      )}
                    </Button>
                  </div>
                )}

                {generationError && (
                  <div className="text-red-500 text-sm mt-2">
                    {generationError}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main content area for MDX */}
      {!showEditor && !isEditorFullscreen && !isPreviewFullscreen && (
        <div className={`flex-1 ${showRightSidebar ? 'md:w-1/3' : ''}`}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {selectedTopic || selectedSubtopic || 'Select a topic to view content'}
              </CardTitle>
              <CardDescription>
                {selectedTopic || selectedSubtopic
                  ? showRightSidebar
                    ? 'Select a generation method from the right sidebar'
                    : 'Generated lesson plan content'
                  : 'Content will appear here after selecting a topic'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMdx && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {isMdxError && (
                <div className="text-red-500 p-4">
                  Error generating content. Please try selecting a different topic.
                </div>
              )}

              {mdxData?.status === 'success' && mdxData.data?.mdx_content && (
                <div className="prose dark:prose-invert max-w-none">
                  <MDXRenderer content={mdxData.data.mdx_content} />
                </div>
              )}

              {!selectedTopic && !selectedSubtopic && !isLoadingMdx && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Search for a topic and select it from the sidebar to generate content</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MDX Editor with Preview */}
      {showEditor && (
        <div className={`${isEditorFullscreen || isPreviewFullscreen ? 'w-full h-full flex-grow' : 'flex-1'}`}>
          <div className="flex flex-col md:flex-row h-full border rounded-lg bg-card shadow-sm overflow-hidden">
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
                <h2 className="text-lg font-semibold">
                  MDX Editor: {selectedTopic || selectedSubtopic}
                </h2>
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
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  minHeight: isEditorFullscreen ? 'calc(100vh - 120px)' : '500px'
                }}
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
                    onClick={togglePreviewFullscreen}
                    className="h-8 w-8 p-0"
                    title={isPreviewFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    {isPreviewFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </Button>
                </div>
              </div>
              <div
                className="prose prose-sm sm:prose max-w-none dark:prose-invert p-4 overflow-auto h-[calc(100%-3.5rem)]"
                style={{
                  minHeight: isPreviewFullscreen ? 'calc(100vh - 120px)' : '500px'
                }}
              >
                <MDXRenderer content={mdxContent} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
