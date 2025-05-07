import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  searchTopics,
  generateSingleTopic,
  generateSingleTopicRaw,
  generateMdxFromUrlsRaw,
  generateMdxLlmOnlyRaw,
  refineWithSelectionRaw,
  refineWithCrawlingRaw,
  refineWithUrlsRaw,
  saveMdxContent,
  getSavedTopics
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MDXRenderer } from '@/components/mdxRenderer';
import { Loader2, Search, X, Maximize2, Minimize2, ChevronLeft, ChevronRight, Link } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useLessonPlanStore, UrlInput } from '@/stores/lessonPlanStore';

export const Route = createFileRoute('/_authenticated/lesson-plan')({
  component: LessonPlan,
});

interface Topic {
  topic: string;
  subtopics: string[];
}

interface SavedTopic {
  id: number;
  topic: string;
  mdxContent: string;
  userId?: string;
  axiosWing?: string;
  difficulty?: string;
  createdAt?: string;
  updatedAt?: string;
}

// UrlInput is now imported from the store

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

interface SavedTopicsResponse {
  topics: SavedTopic[];
}

// Type guard function to check if the response is a TopicsResponse
function isTopicsResponse(data: unknown): data is TopicsResponse {
  return data !== null &&
    typeof data === 'object' &&
    'status' in data &&
    'data' in data &&
    data.data !== null &&
    typeof data.data === 'object' &&
    'topics' in data.data;
}

// Type guard function to check if the response is an MdxResponse
function isMdxResponse(data: unknown): data is MdxResponse {
  return data !== null &&
    typeof data === 'object' &&
    'status' in data &&
    'data' in data &&
    data.data !== null &&
    typeof data.data === 'object' &&
    'mdx_content' in data.data;
}

// We're using Zustand for state persistence now

function LessonPlan() {
  // Get state and actions from Zustand store
  const {
    searchQuery, setSearchQuery,
    selectedTopic, setSelectedTopic,
    selectedSubtopic, setSelectedSubtopic,
    mainTopic, setMainTopic,
    showRightSidebar, setShowRightSidebar,
    urlInputs, setUrlInputs,
    mdxContent, setMdxContent,
    showEditor, setShowEditor,
    generationMethod, setGenerationMethod,
    lastUsedGenerationMethod, setLastUsedGenerationMethod,
    showGenerationOptions, setShowGenerationOptions,
    editorViewMode, setEditorViewMode,
    isLeftSidebarCollapsed, setIsLeftSidebarCollapsed,
    isRightSidebarCollapsed, setIsRightSidebarCollapsed
  } = useLessonPlanStore();

  // Local state for UI that doesn't need to persist
  const [isGeneratingMdx, setIsGeneratingMdx] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isSavingMdx, setIsSavingMdx] = useState(false);
  const [savedTopics, setSavedTopics] = useState<{id: number, topic: string, mdxContent: string}[]>([]);
  const [hasSavedContent, setHasSavedContent] = useState(false);

  // Content refinement states
  const [refinementMethod, setRefinementMethod] = useState<'selection' | 'crawling' | 'urls'>('selection');
  const [refinementQuestion, setRefinementQuestion] = useState('');
  const [selectedEditorText, setSelectedEditorText] = useState('');
  const [originalSelectedText, setOriginalSelectedText] = useState('');
  const [refinedText, setRefinedText] = useState('');
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isTextRefined, setIsTextRefined] = useState(false);
  const [refinementUrlInputs, setRefinementUrlInputs] = useState<UrlInput[]>([{ value: '', isValid: false }]);
  const [isRefiningMdx, setIsRefiningMdx] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

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

  // Query for fetching saved topics
  const {
    data: savedTopicsData,
    isLoading: isLoadingSavedTopics,
    refetch: refetchSavedTopics,
  } = useQuery({
    queryKey: ['saved-topics'],
    queryFn: () => getSavedTopics(),
    enabled: true, // Fetch on component mount
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

  // Function to check if there's saved content for a topic
  const checkForSavedContent = useCallback((topicName: string) => {
    if (savedTopicsData?.topics && Array.isArray(savedTopicsData.topics)) {
      const savedTopic = savedTopicsData.topics.find(
        (topic: SavedTopic) => topic.topic === topicName
      );

      if (savedTopic) {
        setHasSavedContent(true);
        // If there's saved content, use it
        setMdxContent(savedTopic.mdxContent);
        setShowEditor(true);
        return true;
      }
    }

    setHasSavedContent(false);
    return false;
  }, [savedTopicsData, setHasSavedContent, setMdxContent, setShowEditor]);

  // Function to save MDX content
  const handleSaveMdx = async () => {
    if (!mdxContent.trim()) {
      toast.error('Cannot save empty content');
      return;
    }

    const selectedTopicValue = selectedTopic || selectedSubtopic || '';
    const mainTopicValue = mainTopic || '';

    if (!selectedTopicValue || !mainTopicValue) {
      toast.error('Topic information is missing');
      return;
    }

    setIsSavingMdx(true);

    try {
      console.log('Attempting to save MDX content for topic:', selectedTopicValue);
      const result = await saveMdxContent(selectedTopicValue, mainTopicValue, mdxContent);
      console.log('Save result:', result);
      toast.success('MDX content saved successfully');
      refetchSavedTopics();
      setHasSavedContent(true);
    } catch (error) {
      console.error('Error saving MDX content:', error);
      // Show a more detailed error message
      if (error instanceof Error) {
        toast.error(`Failed to save MDX content: ${error.message}`);
      } else {
        toast.error('Failed to save MDX content');
      }
    } finally {
      setIsSavingMdx(false);
    }
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setSelectedSubtopic(null);
    // Keep the search query as the main topic instead of setting it to the selected topic
    // setMainTopic(topic);
    setShowRightSidebar(true);

    // Check if there's saved content for this topic
    const hasSaved = checkForSavedContent(topic);

    if (!hasSaved) {
      setShowEditor(false);
      setMdxContent('');
    }

    setGenerationError(null);
    setShowGenerationOptions(true);
    setLastUsedGenerationMethod(null);

    // State is automatically persisted by Zustand
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubtopicSelect = (subtopic: string, parentTopic: string) => {
    setSelectedSubtopic(subtopic);
    setSelectedTopic(null);
    // Keep the search query as the main topic instead of setting it to the parent topic
    // We're not using parentTopic here, but keeping the parameter for future use
    setShowRightSidebar(true);

    // Check if there's saved content for this subtopic
    const hasSaved = checkForSavedContent(subtopic);

    if (!hasSaved) {
      setShowEditor(false);
      setMdxContent('');
    }

    setGenerationError(null);
    setShowGenerationOptions(true);
    setLastUsedGenerationMethod(null);

    // State is automatically persisted by Zustand
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
      // Store the generation method used
      setLastUsedGenerationMethod('crawl');
      // Keep showing generation options
      setShowGenerationOptions(true);

      // State is automatically persisted by Zustand
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
      // Store the generation method used
      setLastUsedGenerationMethod('urls');
      // Keep showing generation options
      setShowGenerationOptions(true);

      // State is automatically persisted by Zustand
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
      // Store the generation method used
      setLastUsedGenerationMethod('llm');
      // Keep showing generation options
      setShowGenerationOptions(true);

      // State is automatically persisted by Zustand
    } catch (error) {
      console.error('Error generating MDX using LLM only:', error);
      setGenerationError('Failed to generate MDX content using LLM only. Please try again.');
    } finally {
      setIsGeneratingMdx(false);
    }
  };

  // No need for localStorage functions since we're using Zustand with persist middleware

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

  // Update saved topics when data changes
  useEffect(() => {
    if (savedTopicsData?.topics && Array.isArray(savedTopicsData.topics)) {
      // Update the saved topics state
      setSavedTopics(savedTopicsData.topics.map((topic: SavedTopic) => ({
        id: topic.id,
        topic: topic.topic,
        mdxContent: topic.mdxContent
      })));

      // If a topic is selected, check if it has saved content
      if (selectedTopic) {
        checkForSavedContent(selectedTopic);
      } else if (selectedSubtopic) {
        checkForSavedContent(selectedSubtopic);
      }
    }
  }, [savedTopicsData, selectedTopic, selectedSubtopic, checkForSavedContent]);

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setMdxContent(newContent);

    // If the content has been saved and is now being edited, update the state
    if (hasSavedContent) {
      // Check if the saved content matches the current content
      const currentTopic = selectedTopic || selectedSubtopic || '';
      const savedTopic = savedTopics.find(topic => topic.topic === currentTopic);

      if (savedTopic && savedTopic.mdxContent !== newContent) {
        // Content has been modified from the saved version
        setHasSavedContent(false);
      }
    }

    // If the user manually edits the content, reset the refinement state
    if (isTextRefined) {
      setIsTextRefined(false);
      setRefinedText('');
      setOriginalSelectedText('');
      setSelectionStart(null);
      setSelectionEnd(null);
    }

    // State is automatically persisted by Zustand
  };

  // Handle text selection in the editor
  const handleEditorSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const selectedText = target.value.substring(target.selectionStart, target.selectionEnd);
    if (selectedText) {
      // Reset any previous refinement state when new text is selected
      if (isTextRefined) {
        setIsTextRefined(false);
        setRefinedText('');
      }

      setSelectedEditorText(selectedText);
      setOriginalSelectedText(selectedText);
      setSelectionStart(target.selectionStart);
      setSelectionEnd(target.selectionEnd);
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

    if (selectionStart === null || selectionEnd === null) {
      setRefinementError('Invalid text selection');
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

      // Get the refined text from the API
      const response = await refineWithSelectionRaw(
        mdxContent,
        refinementQuestion,
        selectedEditorText,
        selectedTopicValue,
        mainTopicValue
      );

      // Extract the refined text (the API returns the full document with the selected text replaced)
      const refinedText = response.substring(selectionStart, response.length - (mdxContent.length - selectionEnd));
      setRefinedText(refinedText);

      // Update the content
      const newContent = mdxContent.substring(0, selectionStart) +
                         refinedText +
                         mdxContent.substring(selectionEnd);

      setMdxContent(newContent);
      setIsTextRefined(true);

      // Update the selection end to account for the new text length
      setSelectionEnd(selectionStart + refinedText.length);

      // Restore the selection to highlight the refined text
      if (editorRef.current) {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.setSelectionRange(selectionStart, selectionStart + refinedText.length);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error refining content with selection:', error);
      setRefinementError('Failed to refine content. Please try again.');
    } finally {
      setIsRefiningMdx(false);
    }
  };

  // Revert refined text to original
  const revertRefinedText = () => {
    if (!isTextRefined || !originalSelectedText || selectionStart === null || selectionEnd === null) {
      return;
    }

    try {
      // Replace the refined text with the original text
      const newContent = mdxContent.substring(0, selectionStart) +
                         originalSelectedText +
                         mdxContent.substring(selectionEnd);

      setMdxContent(newContent);
      setIsTextRefined(false);
      setRefinedText('');

      // Restore the selection
      if (editorRef.current) {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.setSelectionRange(selectionStart, selectionStart + originalSelectedText.length);
          }
        }, 0);
      }

      toast.success('Changes reverted');
    } catch (error) {
      console.error('Error reverting text:', error);
      toast.error('Failed to revert changes');
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

    if (selectionStart === null || selectionEnd === null) {
      setRefinementError('Invalid text selection');
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

      // Get the refined text from the API
      const response = await refineWithCrawlingRaw(
        mdxContent,
        refinementQuestion,
        selectedEditorText,
        selectedTopicValue,
        mainTopicValue,
        2 // Default number of results
      );

      // Extract the refined text (the API returns the full document with the selected text replaced)
      const refinedText = response.substring(selectionStart, response.length - (mdxContent.length - selectionEnd));
      setRefinedText(refinedText);

      // Update the content
      const newContent = mdxContent.substring(0, selectionStart) +
                         refinedText +
                         mdxContent.substring(selectionEnd);

      // Force a reflow to ensure the layout updates correctly
      setTimeout(() => {
        setMdxContent(newContent);
        setIsTextRefined(true);

        // Force another reflow to ensure content is properly laid out
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }, 50);

      // Update the selection end to account for the new text length
      setSelectionEnd(selectionStart + refinedText.length);

      // Restore the selection to highlight the refined text
      if (editorRef.current) {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.setSelectionRange(selectionStart, selectionStart + refinedText.length);
          }
        }, 0);
      }
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

    if (selectionStart === null || selectionEnd === null) {
      setRefinementError('Invalid text selection');
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

      // Get the refined text from the API
      const response = await refineWithUrlsRaw(
        mdxContent,
        refinementQuestion,
        selectedEditorText,
        selectedTopicValue,
        mainTopicValue,
        validUrls
      );

      // Extract the refined text (the API returns the full document with the selected text replaced)
      const refinedText = response.substring(selectionStart, response.length - (mdxContent.length - selectionEnd));
      setRefinedText(refinedText);

      // Update the content
      const newContent = mdxContent.substring(0, selectionStart) +
                         refinedText +
                         mdxContent.substring(selectionEnd);

      // Force a reflow to ensure the layout updates correctly
      setTimeout(() => {
        setMdxContent(newContent);
        setIsTextRefined(true);

        // Force another reflow to ensure content is properly laid out
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }, 50);

      // Update the selection end to account for the new text length
      setSelectionEnd(selectionStart + refinedText.length);

      // Restore the selection to highlight the refined text
      if (editorRef.current) {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.setSelectionRange(selectionStart, selectionStart + refinedText.length);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error refining content with URLs:', error);
      setRefinementError('Failed to refine content with URLs. Please try again.');
    } finally {
      setIsRefiningMdx(false);
    }
  };

  // Toggle fullscreen for editor
  const toggleEditorFullscreen = () => {
    const newState = !isEditorFullscreen;
    setIsEditorFullscreen(newState);

    if (newState) {
      // When entering fullscreen, ensure preview is hidden and set view mode to code
      setIsPreviewFullscreen(false);
      setEditorViewMode('code');
    }

    // Keep the right sidebar visible even in fullscreen mode
    setShowRightSidebar(true);
  };

  // Toggle fullscreen for preview
  const togglePreviewFullscreen = () => {
    const newState = !isPreviewFullscreen;
    setIsPreviewFullscreen(newState);

    if (newState) {
      // When entering fullscreen, ensure editor is hidden and set view mode to preview
      setIsEditorFullscreen(false);
      setEditorViewMode('preview');

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

  // Determine panel widths based on fullscreen states and view mode
  const getEditorWidth = () => {
    if (isMobileView) return 'w-full';
    if (isEditorFullscreen) return 'w-full';
    if (isPreviewFullscreen) return 'w-0 hidden';

    // Handle different view modes
    if (editorViewMode === 'code') return 'w-full';
    if (editorViewMode === 'preview') return 'w-0 hidden';
    return 'w-1/2'; // Split view (50/50)
  };

  const getPreviewWidth = () => {
    if (isMobileView) return 'w-full';
    if (isPreviewFullscreen) return 'w-full';
    if (isEditorFullscreen) return 'w-0 hidden';

    // Handle different view modes
    if (editorViewMode === 'code') return 'w-0 hidden';
    if (editorViewMode === 'preview') return 'w-full';
    return 'w-1/2'; // Split view (50/50)
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
                    <span className="mr-2">{showGenerationOptions ? 'Generation Mode' : 'Content Refinement'}</span>
                    {selectedTopic || selectedSubtopic ? (
                      <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded-full">
                        {(selectedTopic || selectedSubtopic || '').length > 15
                          ? `${(selectedTopic || selectedSubtopic || '').substring(0, 15)}...`
                          : (selectedTopic || selectedSubtopic)}
                      </span>
                    ) : null}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {showGenerationOptions
                      ? 'Choose a mdx generation method below'
                      : 'Refine your content with AI assistance'}
                  </CardDescription>
                </CardHeader>

                {showGenerationOptions ? (
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
                                mdxContent ? 'Regenerate MDX' : 'Generate MDX'
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
                                mdxContent ? 'Regenerate MDX from URLs' : 'Generate MDX from URLs'
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
                                mdxContent ? 'Regenerate MDX using LLM Only' : 'Generate MDX using LLM Only'
                              )}
                            </Button>
                          </div>
                        )}

                        {generationError && (
                          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mt-4">
                            {generationError}
                          </div>
                        )}



                        {showEditor && (
                          <div className="mt-4 pt-4 border-t border-border space-y-2">
                            <Button
                              onClick={handleSaveMdx}
                              disabled={isSavingMdx || !mdxContent.trim()}
                              className="w-full"
                              variant="default"
                            >
                              {isSavingMdx ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Saving...
                                </>
                              ) : (
                                hasSavedContent ? 'Update Saved MDX' : 'Save MDX'
                              )}
                            </Button>

                            <Button
                              onClick={() => setShowGenerationOptions(false)}
                              variant="secondary"
                              className="w-full"
                            >
                              Switch to Refinement Mode
                            </Button>
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
                    </div>

                    <CardContent className="overflow-auto flex-1 pt-2">
                      <div className="space-y-4">
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

                        <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                          <p>
                            {refinementMethod === 'selection'
                              ? 'Refine the selected text using the LLM\'s knowledge.'
                              : refinementMethod === 'crawling'
                                ? 'Refine the selected text by crawling the web for additional information.'
                                : 'Refine the selected text using specific URLs as references.'}
                          </p>
                          <p className="mt-2 text-xs">
                            Select text in the editor and enter a question or prompt above.
                            {isTextRefined && ' The refined text will remain highlighted until you accept or revert the changes.'}
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

                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={
                              refinementMethod === 'selection'
                                ? refineWithSelection
                                : refinementMethod === 'crawling'
                                  ? refineWithCrawl
                                  : refineWithUrlsList
                            }
                            disabled={
                              isRefiningMdx ||
                              !selectedEditorText ||
                              !refinementQuestion.trim() ||
                              (refinementMethod === 'urls' && !validateRefinementUrls())
                            }
                            className="flex-1"
                          >
                            {isRefiningMdx ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Refining...
                              </>
                            ) : (
                              'Refine Content'
                            )}
                          </Button>

                          {isTextRefined && (
                            <Button
                              onClick={revertRefinedText}
                              variant="outline"
                              className="flex-1"
                            >
                              Revert Changes
                            </Button>
                          )}
                        </div>

                        {refinementError && (
                          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mt-4">
                            {refinementError}
                          </div>
                        )}

                        {showEditor && lastUsedGenerationMethod && (
                          <div className="mt-4 pt-4 border-t border-border space-y-2">
                            <Button
                              onClick={handleSaveMdx}
                              disabled={isSavingMdx || !mdxContent.trim()}
                              className="w-full"
                              variant="default"
                            >
                              {isSavingMdx ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Saving...
                                </>
                              ) : (
                                hasSavedContent ? 'Update Saved MDX' : 'Save MDX'
                              )}
                            </Button>

                            <Button
                              onClick={() => setShowGenerationOptions(true)}
                              variant="secondary"
                              className="w-full"
                            >
                              Switch to Generation Mode
                            </Button>
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
                  <span className="sr-only">{showGenerationOptions ? 'MDX Generation' : 'Content Refinement'}</span>
                  {!showGenerationOptions ? (
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
                  {!showGenerationOptions ? (
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
          <div className="flex flex-col h-full border rounded-lg bg-card shadow-sm overflow-hidden">
            {/* View Mode Selector - Hidden in fullscreen */}
            {!isEditorFullscreen && !isPreviewFullscreen && (
              <div className="flex w-full border-b border-slate-200 dark:border-slate-700 bg-muted/30">
                <button
                  className={`flex-1 py-3 px-6 text-center font-medium transition-all duration-200 ${
                    editorViewMode === 'code'
                      ? 'bg-background shadow-sm border-b-2 border-primary text-primary'
                      : 'bg-transparent hover:bg-background/50'
                  }`}
                  onClick={() => setEditorViewMode('code')}
                >
                  MDX Code
                </button>
                <button
                  className={`flex-1 py-3 px-6 text-center font-medium transition-all duration-200 ${
                    editorViewMode === 'preview'
                      ? 'bg-background shadow-sm border-b-2 border-primary text-primary'
                      : 'bg-transparent hover:bg-background/50'
                  }`}
                  onClick={() => setEditorViewMode('preview')}
                >
                  Preview
                </button>
                <button
                  className={`flex-1 py-3 px-6 text-center font-medium transition-all duration-200 ${
                    editorViewMode === 'split'
                      ? 'bg-background shadow-sm border-b-2 border-primary text-primary'
                      : 'bg-transparent hover:bg-background/50'
                  }`}
                  onClick={() => setEditorViewMode('split')}
                >
                  Split
                </button>
              </div>
            )}
            <div className="flex flex-row h-full w-full overflow-hidden" style={{ maxWidth: '100%' }}>

            {/* Editor Panel */}
            <div
              className={`${getEditorWidth()} h-full border-r border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-hidden ${
                editorViewMode === 'preview' || isPreviewFullscreen ? 'hidden' : ''
              }`}
              style={{ maxWidth: editorViewMode === 'split' ? '50%' : '100%' }}
            >
              <div className="p-3 h-14 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold">
                    MDX Editor: {selectedTopic || selectedSubtopic}
                  </h2>
                </div>
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
                ref={editorRef}
                className={`w-full h-[calc(100%-3.5rem)] border-none rounded-none resize-none font-mono focus:ring-0 focus:outline-none text-base ${isTextRefined ? 'selection:bg-green-200 dark:selection:bg-green-800 selection:text-black dark:selection:text-white' : ''}`}
                value={mdxContent}
                onChange={handleContentChange}
                onSelect={handleEditorSelect}
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  minHeight: isEditorFullscreen ? 'calc(100vh - 120px)' : '500px',
                  padding: '1rem 1.5rem',
                  tabSize: '2',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word'
                }}
              />
            </div>

            {/* Preview Panel */}
            <div
              className={`${getPreviewWidth()} h-full overflow-hidden transition-all duration-300 ${
                editorViewMode === 'code' && !isPreviewFullscreen ? 'hidden' : ''
              } ${isPreviewFullscreen ? 'w-full' : ''}`}
              style={{ maxWidth: editorViewMode === 'split' ? '50%' : '100%' }}
            >
              <div className="p-3 h-14 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold">Preview</h2>
                </div>
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
                className={`overflow-auto h-[calc(100%-3.5rem)] w-full`}
                style={{
                  minHeight: isPreviewFullscreen ? 'calc(100vh - 120px)' : '500px',
                  padding: '1rem 1.5rem',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                {/* <div className="prose prose-sm sm:prose dark:prose-invert w-full max-w-none prose-headings:text-inherit prose-p:text-inherit prose-a:text-blue-600 prose-strong:font-bold prose-em:italic prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded prose-pre:overflow-auto prose-code:text-red-500 prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-img:max-w-full bg-red-500"> */}
                  <MDXRenderer content={mdxContent} />
                {/* </div> */}
              </div>
            </div>
            </div> {/* Close the flex-row div */}
          </div>
        </div>
      )}
    </div>
  );
}
