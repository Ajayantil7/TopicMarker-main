import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the interface for URL inputs
export interface UrlInput {
  value: string;
  isValid: boolean;
}

// Define the interface for the lesson plan state
export interface LessonPlanState {
  searchQuery: string;
  selectedTopic: string | null;
  selectedSubtopic: string | null;
  mainTopic: string | null;
  showRightSidebar: boolean;
  mdxContent: string;
  showEditor: boolean;
  generationMethod: 'crawl' | 'urls' | 'llm';
  lastUsedGenerationMethod: 'crawl' | 'urls' | 'llm' | null;
  showGenerationOptions: boolean;
  editorViewMode: 'code' | 'preview' | 'split';
  isLeftSidebarCollapsed: boolean;
  isRightSidebarCollapsed: boolean;
  urlInputs: UrlInput[];
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedTopic: (topic: string | null) => void;
  setSelectedSubtopic: (subtopic: string | null) => void;
  setMainTopic: (topic: string | null) => void;
  setShowRightSidebar: (show: boolean) => void;
  setMdxContent: (content: string) => void;
  setShowEditor: (show: boolean) => void;
  setGenerationMethod: (method: 'crawl' | 'urls' | 'llm') => void;
  setLastUsedGenerationMethod: (method: 'crawl' | 'urls' | 'llm' | null) => void;
  setShowGenerationOptions: (show: boolean) => void;
  setEditorViewMode: (mode: 'code' | 'preview' | 'split') => void;
  setIsLeftSidebarCollapsed: (collapsed: boolean) => void;
  setIsRightSidebarCollapsed: (collapsed: boolean) => void;
  setUrlInputs: (inputs: UrlInput[]) => void;
  
  // Reset state
  resetState: () => void;
}

// Create the store with persistence
export const useLessonPlanStore = create<LessonPlanState>()(
  persist(
    (set) => ({
      // Initial state
      searchQuery: '',
      selectedTopic: null,
      selectedSubtopic: null,
      mainTopic: null,
      showRightSidebar: false,
      mdxContent: '',
      showEditor: false,
      generationMethod: 'crawl',
      lastUsedGenerationMethod: null,
      showGenerationOptions: true,
      editorViewMode: 'code',
      isLeftSidebarCollapsed: false,
      isRightSidebarCollapsed: false,
      urlInputs: [{ value: '', isValid: false }],
      
      // Actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),
      setSelectedSubtopic: (subtopic) => set({ selectedSubtopic: subtopic }),
      setMainTopic: (topic) => set({ mainTopic: topic }),
      setShowRightSidebar: (show) => set({ showRightSidebar: show }),
      setMdxContent: (content) => set({ mdxContent: content }),
      setShowEditor: (show) => set({ showEditor: show }),
      setGenerationMethod: (method) => set({ generationMethod: method }),
      setLastUsedGenerationMethod: (method) => set({ lastUsedGenerationMethod: method }),
      setShowGenerationOptions: (show) => set({ showGenerationOptions: show }),
      setEditorViewMode: (mode) => set({ editorViewMode: mode }),
      setIsLeftSidebarCollapsed: (collapsed) => set({ isLeftSidebarCollapsed: collapsed }),
      setIsRightSidebarCollapsed: (collapsed) => set({ isRightSidebarCollapsed: collapsed }),
      setUrlInputs: (inputs) => set({ urlInputs: inputs }),
      
      // Reset state
      resetState: () => set({
        searchQuery: '',
        selectedTopic: null,
        selectedSubtopic: null,
        mainTopic: null,
        showRightSidebar: false,
        mdxContent: '',
        showEditor: false,
        generationMethod: 'crawl',
        lastUsedGenerationMethod: null,
        showGenerationOptions: true,
        editorViewMode: 'code',
        isLeftSidebarCollapsed: false,
        isRightSidebarCollapsed: false,
        urlInputs: [{ value: '', isValid: false }],
      }),
    }),
    {
      name: 'lesson-plan-storage', // name of the item in storage
    }
  )
);
