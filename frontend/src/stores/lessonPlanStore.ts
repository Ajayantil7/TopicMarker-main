import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the interface for URL inputs
export interface UrlInput {
  value: string;
  isValid: boolean;
}

// Define the interface for a saved topic in a lesson plan
export interface SavedLessonTopic {
  topic: string;
  mdxContent: string;
  isSubtopic: boolean;
  parentTopic?: string;
  mainTopic?: string; // The main topic (lesson plan name)
}

// Define the interface for a complete lesson plan
export interface LessonPlan {
  id?: number;
  name: string;
  mainTopic: string;
  topics: SavedLessonTopic[];
  createdAt?: string;
  updatedAt?: string;
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
  currentLessonPlan: LessonPlan | null;
  savedTopicsMap: Record<string, string>; // Map of topic name to MDX content
  hasUnsavedChanges: boolean;

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
  setCurrentLessonPlan: (lessonPlan: LessonPlan | null) => void;
  saveMdxToCurrentLesson: (topic: string, mdxContent: string, isSubtopic: boolean, parentTopic?: string) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;

  // Reset state
  resetState: () => void;
}

// Create the store with persistence
export const useLessonPlanStore = create<LessonPlanState>()(
  persist(
    (set, get) => ({
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
      currentLessonPlan: null,
      savedTopicsMap: {},
      hasUnsavedChanges: false,

      // Actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),
      setSelectedSubtopic: (subtopic) => set({ selectedSubtopic: subtopic }),
      setMainTopic: (topic) => set({ mainTopic: topic }),
      setShowRightSidebar: (show) => set({ showRightSidebar: show }),
      setMdxContent: (content) => {
        set((state) => ({
          mdxContent: content,
          hasUnsavedChanges: state.currentLessonPlan !== null
        }));
      },
      setShowEditor: (show) => set({ showEditor: show }),
      setGenerationMethod: (method) => set({ generationMethod: method }),
      setLastUsedGenerationMethod: (method) => set({ lastUsedGenerationMethod: method }),
      setShowGenerationOptions: (show) => set({ showGenerationOptions: show }),
      setEditorViewMode: (mode) => set({ editorViewMode: mode }),
      setIsLeftSidebarCollapsed: (collapsed) => set({ isLeftSidebarCollapsed: collapsed }),
      setIsRightSidebarCollapsed: (collapsed) => set({ isRightSidebarCollapsed: collapsed }),
      setUrlInputs: (inputs) => set({ urlInputs: inputs }),
      setCurrentLessonPlan: (lessonPlan) => set({
        currentLessonPlan: lessonPlan,
        hasUnsavedChanges: false,
        savedTopicsMap: lessonPlan ? lessonPlan.topics.reduce((acc, topic) => {
          acc[topic.topic] = topic.mdxContent;
          return acc;
        }, {} as Record<string, string>) : {}
      }),
      saveMdxToCurrentLesson: (topic, mdxContent, isSubtopic, parentTopic) => {
        set((state) => {
          // Ensure we have a main topic
          const mainTopicValue = state.mainTopic || '';

          // If this is a parent topic (not a subtopic), set its parent to itself
          const finalParentTopic = isSubtopic
            ? (parentTopic || mainTopicValue) // Use provided parent or main topic for subtopics
            : topic; // For parent topics, set parent to itself

          if (!state.currentLessonPlan) {
            // If no current lesson plan, create a new one
            return {
              currentLessonPlan: {
                name: mainTopicValue || 'New Lesson Plan',
                mainTopic: mainTopicValue,
                topics: [{
                  topic,
                  mdxContent,
                  isSubtopic,
                  parentTopic: finalParentTopic,
                  mainTopic: mainTopicValue
                }]
              },
              savedTopicsMap: { [topic]: mdxContent },
              hasUnsavedChanges: true
            };
          }

          // Update existing lesson plan
          const existingTopicIndex = state.currentLessonPlan.topics.findIndex(t => t.topic === topic);
          let updatedTopics;

          if (existingTopicIndex >= 0) {
            // Update existing topic
            updatedTopics = [...state.currentLessonPlan.topics];
            updatedTopics[existingTopicIndex] = {
              ...updatedTopics[existingTopicIndex],
              mdxContent,
              // Update parent topic if needed
              parentTopic: finalParentTopic,
              // Update main topic
              mainTopic: mainTopicValue
            };
          } else {
            // Add new topic
            updatedTopics = [
              ...state.currentLessonPlan.topics,
              {
                topic,
                mdxContent,
                isSubtopic,
                parentTopic: finalParentTopic,
                mainTopic: mainTopicValue
              }
            ];
          }

          return {
            currentLessonPlan: {
              ...state.currentLessonPlan,
              topics: updatedTopics
            },
            savedTopicsMap: {
              ...state.savedTopicsMap,
              [topic]: mdxContent
            },
            hasUnsavedChanges: true
          };
        });
      },
      setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges }),

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
        currentLessonPlan: null,
        savedTopicsMap: {},
        hasUnsavedChanges: false,
      }),
    }),
    {
      name: 'lesson-plan-storage', // name of the item in storage
    }
  )
);
