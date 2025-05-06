import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  searchTopics,
  generateSingleTopic,
  generateSingleTopicRaw,
  generateMdxFromUrlsRaw,
  generateMdxLlmOnlyRaw,
  refineWithSelectionRaw,
  refineWithCrawlingRaw,
  refineWithUrlsRaw,
  directReplaceSelectedText
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MDXRenderer } from '@/components/mdxRenderer';
import { Loader2, Search, X, Maximize2, Minimize2, ChevronLeft, ChevronRight, Link } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export const Route = createFileRoute('/_authenticated/lesson-plan')({
  component: LessonPlan,
});

interface Topic {
  topic: string;
  subtopics: string[];
}

interface UrlInput {
  value: string;
  isValid: boolean;
}

interface MdxResponse {
  status: string;
  data: {
    mdx_content: string;
    crawled_websites?: string[];
  };
}

interface TopicsResponse {
  status: string;
  data: {
    topics: string;
  };
}

// Type guard function to check if the response is a TopicsResponse
function isTopicsResponse(data: any): data is TopicsResponse {
  return data &&
    typeof data === 'object' &&
    'status' in data &&
    'data' in data &&
    data.data &&
    'topics' in data.data;
}

// Type guard function to check if the response is an MdxResponse
function isMdxResponse(data: any): data is MdxResponse {
  return data &&
    typeof data === 'object' &&
    'status' in data &&
    'data' in data &&
    data.data &&
    'mdx_content' in data.data;
}

function LessonPlan() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [mainTopic, setMainTopic] = useState<string | null>(null); // Track the main topic separately
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [urlInputs, setUrlInputs] = useState<UrlInput[]>([{ value: '', isValid: false }]);
  const [mdxContent, setMdxContent] = useState<string>('');
  const [isGeneratingMdx, setIsGeneratingMdx] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [generationMethod, setGenerationMethod] = useState<'crawl' | 'urls' | 'llm'>('crawl');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  // Content refinement states
  const [refinementMethod, setRefinementMethod] = useState<'selection' | 'crawling' | 'urls' | 'direct'>('selection');
  const [refinementQuestion, setRefinementQuestion] = useState('');
  const [selectedEditorText, setSelectedEditorText] = useState('');
  const [replacementText, setReplacementText] = useState('');
  const [refinementUrlInputs, setRefinementUrlInputs] = useState<UrlInput[]>([{ value: '', isValid: false }]);
  const [isRefiningMdx, setIsRefiningMdx] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);

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
    queryKey: ['generate-mdx', selectedTopic || selectedSubtopic, mainTopic],
    queryFn: () => {
      const selectedTopicValue = selectedTopic || selectedSubtopic || '';
      // Use the tracked mainTopic state
      const mainTopicValue = mainTopic || '';
      console.log('Auto-generating MDX with:', {
        selected_topic: selectedTopicValue,
        main_topic: mainTopicValue
      });
      return generateSingleTopic(selectedTopicValue, mainTopicValue, 2);
    },
    enabled: !!(selectedTopic || selectedSubtopic) && !showRightSidebar && !showEditor,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Store the search query as the main topic
      const searchTerm = searchQuery.trim();
      console.log('Setting main topic to search query:', searchTerm);
      setMainTopic(searchTerm);
      refetchTopics();
    }
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setSelectedSubtopic(null);
    // Keep the search query as the main topic instead of setting it to the selected topic
    // setMainTopic(topic);
    setShowRightSidebar(true);
    setShowEditor(false);
    setMdxContent('');
    setGenerationError(null);
  };

  const handleSubtopicSelect = (subtopic: string, _parentTopic: string) => {
    setSelectedSubtopic(subtopic);
    setSelectedTopic(null);
    // Keep the search query as the main topic instead of setting it to the parent topic
    // setMainTopic(_parentTopic);
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
      const selectedTopicValue = selectedTopic || selectedSubtopic || '';
      // Use the tracked mainTopic state
      const mainTopicValue = mainTopic || '';

      console.log('Generating MDX with:', {
        selected_topic: selectedTopicValue,
        main_topic: mainTopicValue,
        search_query: searchQuery
      });

      const rawMdx = await generateSingleTopicRaw(selectedTopicValue, mainTopicValue, 3);
      setMdxContent(rawMdx);
      setShowEditor(true);
      // Keep the right sidebar visible
      setShowRightSidebar(true);
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
      const selectedTopicValue = selectedTopic || selectedSubtopic || '';
      // Use the tracked mainTopic state
      const mainTopicValue = mainTopic || '';
      const validUrls = urlInputs.filter(url => url.isValid).map(url => url.value);

      console.log('Generating MDX from URLs with:', {
        urls: validUrls,
        selected_topic: selectedTopicValue,
        main_topic: mainTopicValue
      });

      const rawMdx = await generateMdxFromUrlsRaw(validUrls, selectedTopicValue, mainTopicValue, undefined, true);
      setMdxContent(rawMdx);
      setShowEditor(true);
      // Keep the right sidebar visible
      setShowRightSidebar(true);
    } catch (error) {
      console.error('Error generating MDX from URLs:', error);
      setGenerationError('Failed to generate MDX content from URLs. Please try again.');
    } finally {
      setIsGeneratingMdx(false);
    }
  };

  const generateMdxFromLlmOnly = async () => {
    setIsGeneratingMdx(true);
    setGenerationError(null);
    try {
      const selectedTopicValue = selectedTopic || selectedSubtopic || '';
      // Use the tracked mainTopic state
      const mainTopicValue = mainTopic || '';

      console.log('Generating MDX with LLM only:', {
        selected_topic: selectedTopicValue,
        main_topic: mainTopicValue
      });

      const rawMdx = await generateMdxLlmOnlyRaw(selectedTopicValue, mainTopicValue);
      setMdxContent(rawMdx);
      setShowEditor(true);
      // Keep the right sidebar visible
      setShowRightSidebar(true);
    } catch (error) {
      console.error('Error generating MDX using LLM only:', error);
      setGenerationError('Failed to generate MDX content using LLM only. Please try again.');
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

  // Handle text selection in the editor
  const handleEditorSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const selectedText = target.value.substring(target.selectionStart, target.selectionEnd);
    if (selectedText) {
      setSelectedEditorText(selectedText);
    }
  };

  // Handle refinement URL changes
  const handleRefinementUrlChange = (index: number, value: string) => {
    const newUrlInputs = [...refinementUrlInputs];
    const isValid = /^(http|https):\/\/[^ "]+$/.test(value);
    newUrlInputs[index] = { value, isValid };
    setRefinementUrlInputs(newUrlInputs);
  };

  // Add refinement URL input
  const addRefinementUrlInput = () => {
    if (refinementUrlInputs.length < 4) {
      setRefinementUrlInputs([...refinementUrlInputs, { value: '', isValid: false }]);
    }
  };

  // Remove refinement URL input
  const removeRefinementUrlInput = (index: number) => {
    if (refinementUrlInputs.length > 1) {
      const newUrlInputs = refinementUrlInputs.filter((_, i) => i !== index);
      setRefinementUrlInputs(newUrlInputs);
    }
  };

  // Validate refinement URLs
  const validateRefinementUrls = () => {
    // Check if at least one URL is valid
    const validUrls = refinementUrlInputs.filter(url => url.isValid);
    return validUrls.length > 0;
  };

  // Refine content with selection
  const refineWithSelection = async () => {
    if (!selectedEditorText) {
      setRefinementError('Please select some text in the editor to refine');
      return;
    }

    if (!refinementQuestion.trim()) {
      setRefinementError('Please enter a question or prompt for refinement');
      return;
    }

    setIsRefiningMdx(true);
    setRefinementError(null);

    try {
      const selectedTopicValue = selectedTopic || selectedSubtopic || '';
      const mainTopicValue = mainTopic || '';

      console.log('Refining content with selection:', {
        selected_text: selectedEditorText,
        question: refinementQuestion,
        selected_topic: selectedTopicValue,
        main_topic: mainTopicValue
      });

      const refinedMdx = await refineWithSelectionRaw(
        mdxContent,
        refinementQuestion,
        selectedEditorText,
        selectedTopicValue,
        mainTopicValue
      );

      setMdxContent(refinedMdx);
    } catch (error) {
      console.error('Error refining content with selection:', error);
      setRefinementError('Failed to refine content. Please try again.');
    } finally {
      setIsRefiningMdx(false);
    }
  };

  // Direct replacement of selected text
  const replaceSelectedText = async () => {
    if (!selectedEditorText) {
      setRefinementError('Please select some text in the editor to replace');
      return;
    }

    if (!replacementText.trim()) {
      setRefinementError('Please enter the replacement text');
      return;
    }

    setIsRefiningMdx(true);
    setRefinementError(null);

    try {
      const selectedTopicValue = selectedTopic || selectedSubtopic || '';

      console.log('Replacing selected text:', {
        selected_text: selectedEditorText,
        replacement_text: replacementText,
        topic: selectedTopicValue
      });

      const updatedMdx = await directReplaceSelectedText(
        mdxContent,
        selectedEditorText,
        replacementText,
        selectedTopicValue
      );

      setMdxContent(updatedMdx);
    } catch (error) {
      console.error('Error replacing selected text:', error);
      setRefinementError('Failed to replace selected text. Please try again.');
    } finally {
      setIsRefiningMdx(false);
    }
  };

  // Refine content with crawling
  const refineWithCrawl = async () => {
    if (!selectedEditorText) {
      setRefinementError('Please select some text in the editor to refine');
      return;
    }

    if (!refinementQuestion.trim()) {
      setRefinementError('Please enter a question or prompt for refinement');
      return;
    }

    setIsRefiningMdx(true);
    setRefinementError(null);

    try {
      const selectedTopicValue = selectedTopic || selectedSubtopic || '';
      const mainTopicValue = mainTopic || '';

      console.log('Refining content with crawling:', {
        selected_text: selectedEditorText,
        question: refinementQuestion,
        selected_topic: selectedTopicValue,
        main_topic: mainTopicValue
      });

      const refinedMdx = await refineWithCrawlingRaw(
        mdxContent,
        refinementQuestion,
        selectedEditorText,
        selectedTopicValue,
        mainTopicValue,
        2 // Default number of results
      );

      setMdxContent(refinedMdx);
    } catch (error) {
      console.error('Error refining content with crawling:', error);
      setRefinementError('Failed to refine content with crawling. Please try again.');
    } finally {
      setIsRefiningMdx(false);
    }
  };

  // Refine content with URLs
  const refineWithUrlsList = async () => {
    if (!selectedEditorText) {
      setRefinementError('Please select some text in the editor to refine');
      return;
    }

    if (!refinementQuestion.trim()) {
      setRefinementError('Please enter a question or prompt for refinement');
      return;
    }

    if (!validateRefinementUrls()) {
      setRefinementError('Please enter at least one valid URL');
      return;
    }

    setIsRefiningMdx(true);
    setRefinementError(null);

    try {
      const selectedTopicValue = selectedTopic || selectedSubtopic || '';
      const mainTopicValue = mainTopic || '';
      const validUrls = refinementUrlInputs.filter(url => url.isValid).map(url => url.value);

      console.log('Refining content with URLs:', {
        selected_text: selectedEditorText,
        question: refinementQuestion,
        selected_topic: selectedTopicValue,
        main_topic: mainTopicValue,
        urls: validUrls
      });

      const refinedMdx = await refineWithUrlsRaw(
        mdxContent,
        refinementQuestion,
        selectedEditorText,
        selectedTopicValue,
        mainTopicValue,
        validUrls
      );

      setMdxContent(refinedMdx);
    } catch (error) {
      console.error('Error refining content with URLs:', error);
      setRefinementError('Failed to refine content with URLs. Please try again.');
    } finally {
      setIsRefiningMdx(false);
    }
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
    const newState = !isPreviewFullscreen;
    setIsPreviewFullscreen(newState);
    if (newState) {
      // When entering fullscreen, ensure editor is hidden
      setIsEditorFullscreen(false);
      // Force a reflow to ensure the layout updates correctly
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        // Force another reflow after a bit more time to ensure content is centered
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }, 50);
    }
    // Keep the right sidebar visible even in fullscreen mode
    setShowRightSidebar(true);
  };

  // Toggle left sidebar collapse
  const toggleLeftSidebar = () => {
    setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed);
  };

  // Toggle right sidebar collapse
  const toggleRightSidebar = () => {
    setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
  };

  // Determine panel widths based on fullscreen states
  const getEditorWidth = () => {
    if (isMobileView) return 'w-full';
    if (isEditorFullscreen) return 'w-full';
    if (isPreviewFullscreen) return 'w-0 hidden';
    return 'w-2/3'; // Increased editor width (67%)
  };

  const getPreviewWidth = () => {
    if (isMobileView) return 'w-full';
    if (isPreviewFullscreen) return 'w-full';
    if (isEditorFullscreen) return 'w-0 hidden';
    return 'w-1/3'; // Decreased preview width (33%)
  };

  return (
    <div className={`flex flex-col md:flex-row gap-4 w-full ${isEditorFullscreen || isPreviewFullscreen ? 'h-screen overflow-hidden' : ''}`}>
      {/* Left sidebar for topic hierarchy */}
      <div className={`${isLeftSidebarCollapsed ? 'w-14' : 'w-full md:w-1/5 lg:w-1/6'} ${isEditorFullscreen || isPreviewFullscreen ? 'hidden md:hidden' : ''} transition-all duration-300`}>
        <Card className="h-full overflow-hidden border-border">
          <div className="border-b border-border flex items-center justify-between p-2 bg-muted/30">
            {!isLeftSidebarCollapsed && (
              <div className="font-medium text-sm flex items-center">
                <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5">Hierarchy</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLeftSidebar}
              className={`h-8 w-8 p-0 hover:bg-muted ${isLeftSidebarCollapsed ? 'mx-auto' : 'mr-0 ml-auto'}`}
              title={isLeftSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isLeftSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {!isLeftSidebarCollapsed ? (
            <div className="flex flex-col h-[calc(100%-40px)]">
              <CardHeader className="py-3 pb-1">
                <CardTitle className="text-lg font-semibold">Lesson Plan Hierarchy</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Search for a topic to generate a lesson plan
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-auto flex-1 pt-2">
                <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
                  <Input
                    type="text"
                    placeholder="Enter a topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoadingTopics} size="icon" className="h-9 w-9">
                    {isLoadingTopics ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </form>

                {isTopicsError && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
                    Error loading topics. Please try again.
                  </div>
                )}

                {topicsData && isTopicsResponse(topicsData) && topicsData.status === 'success' &&
                 topicsData.data?.topics && (
                  <div className="space-y-2">
                    {(() => {
                      try {
                        // Extract the JSON string from the code block
                        const topicsString = topicsData.data.topics;
                        const jsonMatch = topicsString.match(/```json\n([\s\S]*?)\n```/);

                        if (!jsonMatch || !jsonMatch[1]) {
                          return <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">Error parsing topics data</div>;
                        }

                        // Parse the JSON string
                        const parsedTopics: Topic[] = JSON.parse(jsonMatch[1]);

                        return parsedTopics.map((topic: Topic, index: number) => (
                          <div key={index} className="space-y-1 mb-3">
                            <div
                              className={`font-medium cursor-pointer p-2 rounded-md transition-colors ${
                                selectedTopic === topic.topic
                                  ? 'bg-primary/10 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => handleTopicSelect(topic.topic)}
                            >
                              {topic.topic}
                            </div>
                            {topic.subtopics && topic.subtopics.length > 0 && (
                              <div className="pl-4 space-y-1 mt-1">
                                {topic.subtopics.map((subtopic, subIndex) => (
                                  <div
                                    key={subIndex}
                                    className={`text-sm cursor-pointer p-1.5 rounded-md transition-colors ${
                                      selectedSubtopic === subtopic
                                        ? 'bg-secondary/50 text-secondary-foreground'
                                        : 'hover:bg-muted'
                                    }`}
                                    onClick={() => handleSubtopicSelect(subtopic, topic.topic)}
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
                        return <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">Error parsing topics data</div>;
                      }
                    })()}
                  </div>
                )}

                {!topicsData && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Search className="h-10 w-10 mb-4 opacity-20" />
                    <p className="text-center text-sm">Search for a topic to begin</p>
                  </div>
                )}
              </CardContent>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-start h-[calc(100%-40px)] pt-4">
              <div className="bg-primary/10 text-primary rounded-full p-1.5 mb-4">
                <Search className="h-4 w-4" />
              </div>
              <div className="text-xs text-center px-1 font-medium rotate-90 whitespace-nowrap mt-4">
                {searchQuery ? (searchQuery.length > 15 ? `${searchQuery.substring(0, 15)}...` : searchQuery) : "Hierarchy"}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right sidebar for MDX generation options */}
      {showRightSidebar && (
        <div className={`${isRightSidebarCollapsed ? 'w-14' : 'w-full md:w-1/5 lg:w-1/6'} ${isEditorFullscreen || isPreviewFullscreen ? 'md:w-1/6 lg:w-1/7' : ''} transition-all duration-300`}>
          <Card className="h-full overflow-hidden border-border">
            <div className="border-b border-border flex items-center justify-between p-2 bg-muted/30">
              {!isRightSidebarCollapsed && (
                <div className="font-medium text-sm flex items-center">
                  <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5">Mode</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRightSidebar}
                className={`h-8 w-8 p-0 hover:bg-muted ${isRightSidebarCollapsed ? 'mx-auto' : 'mr-0 ml-auto'}`}
                title={isRightSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isRightSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            {!isRightSidebarCollapsed ? (
              <div className="flex flex-col h-[calc(100%-40px)]">
                <CardHeader className="py-3 pb-1">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <span className="mr-2">{showEditor ? 'Content Refinement' : 'Generation Mode'}</span>
                    {selectedTopic || selectedSubtopic ? (
                      <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded-full">
                        {(selectedTopic || selectedSubtopic || '').length > 15
                          ? `${(selectedTopic || selectedSubtopic || '').substring(0, 15)}...`
                          : (selectedTopic || selectedSubtopic)}
                      </span>
                    ) : null}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {showEditor
                      ? 'Refine your content with AI assistance'
                      : 'Choose a mdx generation method below'}
                  </CardDescription>
                </CardHeader>

                {!showEditor ? (
                  <>
                    <div className="px-4 py-2">
                      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                        <Button
                          onClick={() => setGenerationMethod('crawl')}
                          variant="ghost"
                          size="sm"
                          className={`flex-1 ${generationMethod === 'crawl'
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/80'}`}
                        >
                          Crawl
                        </Button>
                        <Button
                          onClick={() => setGenerationMethod('urls')}
                          variant="ghost"
                          size="sm"
                          className={`flex-1 ${generationMethod === 'urls'
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/80'}`}
                        >
                          URLs
                        </Button>
                        <Button
                          onClick={() => setGenerationMethod('llm')}
                          variant="ghost"
                          size="sm"
                          className={`flex-1 ${generationMethod === 'llm'
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/80'}`}
                        >
                          LLM Only
                        </Button>
                      </div>
                    </div>

                    <CardContent className="overflow-auto flex-1 pt-2">
                      <div className="space-y-4">
                        {generationMethod === 'crawl' && (
                          <div className="space-y-4">
                            <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                              <p>
                                This will generate MDX content by crawling the web for information about the selected topic.
                              </p>
                            </div>
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
                          <div className="space-y-4">
                            <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                              <p>
                                Enter 1-4 URLs to generate MDX content from. Each URL should be a valid web address.
                              </p>
                            </div>

                            <div className="space-y-2">
                              {urlInputs.map((url, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={url.value}
                                    onChange={(e) => handleUrlChange(index, e.target.value)}
                                    className={`flex-1 text-xs ${!url.value || url.isValid ? '' : 'border-red-500'}`}
                                  />
                                  {urlInputs.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeUrlInput(index)}
                                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {urlInputs.length < 4 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addUrlInput}
                                className="w-full text-xs"
                              >
                                + Add URL
                              </Button>
                            )}

                            <Button
                              onClick={generateMdxFromUrlsList}
                              disabled={isGeneratingMdx || !validateUrls()}
                              className="w-full mt-2"
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

                        {generationMethod === 'llm' && (
                          <div className="space-y-4">
                            <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                              <p>
                                This will generate MDX content using only the LLM's knowledge without web crawling.
                              </p>
                              <p className="mt-2">
                                Use this option when you want faster generation or when the topic is well-known.
                              </p>
                            </div>
                            <Button
                              onClick={generateMdxFromLlmOnly}
                              disabled={isGeneratingMdx}
                              className="w-full"
                            >
                              {isGeneratingMdx ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Generating...
                                </>
                              ) : (
                                'Generate MDX using LLM Only'
                              )}
                            </Button>
                          </div>
                        )}

                        {generationError && (
                          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mt-4">
                            {generationError}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2">
                      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                        <Button
                          onClick={() => setRefinementMethod('selection')}
                          variant="ghost"
                          size="sm"
                          className={`flex-1 ${refinementMethod === 'selection'
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/80'}`}
                        >
                          Selection
                        </Button>
                        <Button
                          onClick={() => setRefinementMethod('crawling')}
                          variant="ghost"
                          size="sm"
                          className={`flex-1 ${refinementMethod === 'crawling'
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/80'}`}
                        >
                          Crawling
                        </Button>
                        <Button
                          onClick={() => setRefinementMethod('urls')}
                          variant="ghost"
                          size="sm"
                          className={`flex-1 ${refinementMethod === 'urls'
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/80'}`}
                        >
                          URLs
                        </Button>
                      </div>
                      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg mt-1">
                        <Button
                          onClick={() => setRefinementMethod('direct')}
                          variant="ghost"
                          size="sm"
                          className={`flex-1 ${refinementMethod === 'direct'
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/80'}`}
                        >
                          Direct Replace
                        </Button>
                      </div>
                    </div>

                    <CardContent className="overflow-auto flex-1 pt-2">
                      <div className="space-y-4">
                        {refinementMethod !== 'direct' ? (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Refinement Question/Prompt:
                            </label>
                            <Textarea
                              placeholder="Ask a question or provide instructions for refining the selected text..."
                              value={refinementQuestion}
                              onChange={(e) => setRefinementQuestion(e.target.value)}
                              className="min-h-[80px] text-sm"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Replacement Text:
                            </label>
                            <Textarea
                              placeholder="Enter the text that will replace the selected text..."
                              value={replacementText}
                              onChange={(e) => setReplacementText(e.target.value)}
                              className="min-h-[80px] text-sm"
                            />
                          </div>
                        )}

                        <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                          <p>
                            {refinementMethod === 'selection'
                              ? 'Refine the selected text using the LLM\'s knowledge.'
                              : refinementMethod === 'crawling'
                                ? 'Refine the selected text by crawling the web for additional information.'
                                : refinementMethod === 'urls'
                                  ? 'Refine the selected text using specific URLs as references.'
                                  : 'Directly replace the selected text with your own content.'}
                          </p>
                          <p className="mt-2 text-xs">
                            {refinementMethod === 'direct'
                              ? 'Select text in the editor and enter the replacement text above.'
                              : 'Select text in the editor and enter a question or prompt above.'}
                          </p>
                        </div>

                        {refinementMethod === 'urls' && (
                          <div className="space-y-2 mt-4">
                            <label className="text-sm font-medium">Reference URLs:</label>
                            <div className="space-y-2">
                              {refinementUrlInputs.map((url, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={url.value}
                                    onChange={(e) => handleRefinementUrlChange(index, e.target.value)}
                                    className={`flex-1 text-xs ${!url.value || url.isValid ? '' : 'border-red-500'}`}
                                  />
                                  {refinementUrlInputs.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeRefinementUrlInput(index)}
                                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {refinementUrlInputs.length < 4 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addRefinementUrlInput}
                                className="w-full text-xs"
                              >
                                + Add URL
                              </Button>
                            )}
                          </div>
                        )}

                        <Button
                          onClick={
                            refinementMethod === 'selection'
                              ? refineWithSelection
                              : refinementMethod === 'crawling'
                                ? refineWithCrawl
                                : refinementMethod === 'urls'
                                  ? refineWithUrlsList
                                  : replaceSelectedText
                          }
                          disabled={
                            isRefiningMdx ||
                            !selectedEditorText ||
                            (refinementMethod !== 'direct' && !refinementQuestion.trim()) ||
                            (refinementMethod === 'direct' && !replacementText.trim()) ||
                            (refinementMethod === 'urls' && !validateRefinementUrls())
                          }
                          className="w-full mt-2"
                        >
                          {isRefiningMdx ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              {refinementMethod === 'direct' ? 'Replacing...' : 'Refining...'}
                            </>
                          ) : (
                            refinementMethod === 'direct' ? 'Replace Text' : 'Refine Content'
                          )}
                        </Button>

                        {refinementError && (
                          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mt-4">
                            {refinementError}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-start h-[calc(100%-40px)] pt-4">
                <div className="bg-primary/10 text-primary rounded-full p-1.5 mb-4">
                  <span className="sr-only">{showEditor ? 'Content Refinement' : 'MDX Generation'}</span>
                  {showEditor ? (
                    refinementMethod === 'selection' ? (
                      <span className="h-4 w-4 flex items-center justify-center text-xs font-bold">AI</span>
                    ) : refinementMethod === 'crawling' ? (
                      <Search className="h-4 w-4" />
                    ) : (
                      <Link className="h-4 w-4" />
                    )
                  ) : (
                    generationMethod === 'crawl' ? (
                      <Search className="h-4 w-4" />
                    ) : generationMethod === 'urls' ? (
                      <Link className="h-4 w-4" />
                    ) : (
                      <span className="h-4 w-4 flex items-center justify-center text-xs font-bold">AI</span>
                    )
                  )}
                </div>
                <div className="text-xs text-center px-1 font-medium rotate-90 whitespace-nowrap mt-4">
                  {showEditor ? (
                    refinementMethod === 'selection'
                      ? 'Selection Mode'
                      : refinementMethod === 'crawling'
                        ? 'Crawling Mode'
                        : 'URLs Mode'
                  ) : (
                    generationMethod === 'crawl'
                      ? 'Crawl Mode'
                      : generationMethod === 'urls'
                        ? 'URLs Mode'
                        : 'LLM Mode'
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Main content area for MDX */}
      {!showEditor && !isEditorFullscreen && !isPreviewFullscreen && (
        <div className="flex-1">
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

              {mdxData && isMdxResponse(mdxData) && mdxData.status === 'success' &&
               mdxData.data?.mdx_content && (
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
                (isMobileView && activeTab !== 'editor') || isPreviewFullscreen ? 'hidden' : ''
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
                onSelect={handleEditorSelect}
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
              } ${isPreviewFullscreen ? 'w-full' : ''}`}
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
                className={`overflow-auto h-[calc(100%-3.5rem)] w-full ${isPreviewFullscreen ? 'p-6' : 'p-4'}`}
                style={{
                  minHeight: isPreviewFullscreen ? 'calc(100vh - 120px)' : '500px'
                }}
              >
                <div className="prose prose-sm sm:prose dark:prose-invert w-full max-w-none prose-headings:text-inherit prose-p:text-inherit prose-a:text-blue-600 prose-strong:font-bold prose-em:italic prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded prose-pre:overflow-auto prose-code:text-red-500 prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-img:max-w-full">
                  <MDXRenderer content={mdxContent} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
