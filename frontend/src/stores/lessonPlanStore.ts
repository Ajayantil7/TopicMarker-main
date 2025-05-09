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
  order?: number; // Optional order field to preserve hierarchy ordering
}

// Define the interface for a complete lesson plan
export interface LessonPlan {
  id?: number;
  name: string;
  mainTopic: string;
  topics: SavedLessonTopic[];
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Define interface for topic hierarchy
export interface TopicHierarchy {
  topic: string;
  subtopics: string[];
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
  savedTopics: string[]; // List of topic names that have been saved
  hasUnsavedChanges: boolean;
  lessonPlanToLoad: number | null; // ID of the lesson plan to load
  topicsHierarchy: TopicHierarchy[]; // Store the topics hierarchy
  isReadOnly: boolean; // Flag to indicate if the lesson plan is in read-only mode
  isLoadingPublicLesson: boolean; // Flag to indicate if we're loading a public lesson
  usingSavedHierarchy: boolean; // Flag to indicate we're using a saved hierarchy
  hasValidHierarchy: boolean; // Flag to indicate we have a valid hierarchy

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
  setLessonPlanToLoad: (id: number | null) => void;
  setTopicsHierarchy: (hierarchy: TopicHierarchy[]) => void; // Add action to set the hierarchy
  toggleLessonPlanPublicStatus: (isPublic: boolean) => void; // Toggle public status of current lesson plan
  setIsReadOnly: (isReadOnly: boolean) => void; // Set read-only mode
  setIsLoadingPublicLesson: (isLoadingPublicLesson: boolean) => void; // Set loading public lesson flag

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
      savedTopics: [],
      hasUnsavedChanges: false,
      lessonPlanToLoad: null,
      topicsHierarchy: [] as TopicHierarchy[],
      isReadOnly: false,
      isLoadingPublicLesson: false,
      usingSavedHierarchy: false,
      hasValidHierarchy: false,

      // Actions
      setSearchQuery: (query) => set((state) => ({ searchQuery: query })),
      setSelectedTopic: (topic) => set((state) => ({ selectedTopic: topic })),
      setSelectedSubtopic: (subtopic) => set((state) => ({ selectedSubtopic: subtopic })),
      setMainTopic: (topic) => set((state) => ({ mainTopic: topic })),
      setShowRightSidebar: (show) => set((state) => ({ showRightSidebar: show })),
      setMdxContent: (content) => {
        set((state) => ({
          mdxContent: content,
          hasUnsavedChanges: state.currentLessonPlan !== null
        }));
      },
      setShowEditor: (show) => set((state) => ({ showEditor: show })),
      setGenerationMethod: (method) => set((state) => ({ generationMethod: method })),
      setLastUsedGenerationMethod: (method) => set((state) => ({ lastUsedGenerationMethod: method })),
      setShowGenerationOptions: (show) => set((state) => ({ showGenerationOptions: show })),
      setEditorViewMode: (mode) => set((state) => ({ editorViewMode: mode })),
      setIsLeftSidebarCollapsed: (collapsed) => set((state) => ({ isLeftSidebarCollapsed: collapsed })),
      setIsRightSidebarCollapsed: (collapsed) => set((state) => ({ isRightSidebarCollapsed: collapsed })),
      setUrlInputs: (inputs) => set((state) => ({ urlInputs: inputs })),
      setCurrentLessonPlan: (lessonPlan) => set((state) => ({
        currentLessonPlan: lessonPlan,
        hasUnsavedChanges: false, // Always reset unsaved changes when setting a new lesson plan
        savedTopicsMap: lessonPlan ? lessonPlan.topics.reduce((acc, topic) => {
          acc[topic.topic] = topic.mdxContent;
          return acc;
        }, {} as Record<string, string>) : {},
        // Initialize savedTopics from all lesson plan topics, not just those with MDX content
        // This ensures the entire hierarchy is preserved
        savedTopics: lessonPlan ? lessonPlan.topics.map(topic => topic.topic) : []
      })),
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
              // Only add to savedTopics if it has actual content
              savedTopics: mdxContent && mdxContent.trim() !== '' ? [topic] : [],
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

          // Add the topic to savedTopics if it's not already there, regardless of content
          let updatedSavedTopics = state.savedTopics;

          // Always add to savedTopics, even if it doesn't have content
          updatedSavedTopics = state.savedTopics.includes(topic)
            ? state.savedTopics
            : [...state.savedTopics, topic];

          return {
            currentLessonPlan: {
              ...state.currentLessonPlan,
              topics: updatedTopics
            },
            savedTopicsMap: {
              ...state.savedTopicsMap,
              [topic]: mdxContent
            },
            savedTopics: updatedSavedTopics,
            hasUnsavedChanges: true
          };
        });
      },
      setHasUnsavedChanges: (hasChanges) => set((state) => ({ hasUnsavedChanges: hasChanges })),

      // Set the lesson plan to load
      setLessonPlanToLoad: (id) => set((state) => ({ lessonPlanToLoad: id })),

      // Set the topics hierarchy
      setTopicsHierarchy: (hierarchy) => set((state) => ({ topicsHierarchy: hierarchy })),

      // Toggle the public status of the current lesson plan
      toggleLessonPlanPublicStatus: (isPublic) => set((state) => {
        if (!state.currentLessonPlan) return state;

        return {
          currentLessonPlan: {
            ...state.currentLessonPlan,
            isPublic
          },
          hasUnsavedChanges: true
        };
      }),

      // Set read-only mode
      setIsReadOnly: (isReadOnly) => set((state) => ({ isReadOnly })),

      // Set loading public lesson flag
      setIsLoadingPublicLesson: (isLoadingPublicLesson) => set((state) => ({ isLoadingPublicLesson })),

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
        savedTopics: [],
        hasUnsavedChanges: false,
        lessonPlanToLoad: null,
        topicsHierarchy: [] as TopicHierarchy[],
        isReadOnly: false,
        isLoadingPublicLesson: false,
        usingSavedHierarchy: false,
        hasValidHierarchy: false,
      }),
    }),
    {
      name: 'lesson-plan-storage', // name of the item in storage
      partialize: (state) => ({
        // Only persist these specific parts of the state
        searchQuery: state.searchQuery,
        mainTopic: state.mainTopic,
        topicsHierarchy: state.topicsHierarchy,
        currentLessonPlan: state.currentLessonPlan,
        savedTopics: state.savedTopics,
        savedTopicsMap: state.savedTopicsMap,
        mdxContent: state.mdxContent,
        selectedTopic: state.selectedTopic,
        selectedSubtopic: state.selectedSubtopic,
        showEditor: state.showEditor,
        hasUnsavedChanges: state.hasUnsavedChanges,
        isReadOnly: state.isReadOnly,
        isLoadingPublicLesson: state.isLoadingPublicLesson,
        usingSavedHierarchy: state.usingSavedHierarchy,
        hasValidHierarchy: state.hasValidHierarchy,
      }),
    }
  )
);
