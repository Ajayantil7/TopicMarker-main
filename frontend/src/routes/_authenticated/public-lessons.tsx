import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPublicLessonPlans, checkIfLessonPlanIsPublic, getPublicLessonPlanById, getUserById, userByIdQueryOptions } from '@/lib/api';
import { useNavigate } from '@tanstack/react-router';
import { useLessonPlanStore } from '@/stores/lessonPlanStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookMarked, Calendar, Search, User, FileCode, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export const Route = createFileRoute('/_authenticated/public-lessons')({
  component: PublicLessons,
});

function PublicLessons() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const setLessonPlanToLoad = useLessonPlanStore((state) => state.setLessonPlanToLoad);
  const setIsReadOnly = useLessonPlanStore((state) => state.setIsReadOnly);

  // Fetch public lesson plans
  const {
    data: publicLessonPlansData,
    isLoading: isPublicLessonPlansLoading,
    error: publicLessonPlansError,
    refetch: refetchPublicLessonPlans
  } = useQuery({
    queryKey: ['public-lesson-plans'],
    queryFn: getPublicLessonPlans,
  });

  // Log the public lesson plans data when it changes
  useEffect(() => {
    if (publicLessonPlansData) {
      console.log('Public lesson plans data:', {
        count: publicLessonPlansData.lessonPlans?.length || 0,
        plans: publicLessonPlansData.lessonPlans?.map(plan => ({
          id: plan.id,
          name: plan.name,
          isPublic: plan.isPublic,
          userId: plan.userId
        }))
      });
    }
  }, [publicLessonPlansData]);

  // Show error toast if data fetch fails
  useEffect(() => {
    if (publicLessonPlansError) {
      toast.error('Failed to load public lesson plans');
    }
  }, [publicLessonPlansError]);

  const publicLessonPlans = publicLessonPlansData?.lessonPlans || [];
  const totalPublicLessonPlans = publicLessonPlans.length;

  // Fetch user information for each lesson plan creator
  const userQueries = useQueries({
    queries: publicLessonPlans.map(plan => ({
      ...userByIdQueryOptions(plan.userId),
      staleTime: Infinity, // Cache user data indefinitely for this session
    })),
  });

  // Create a map of user IDs to user names
  const userMap = publicLessonPlans.reduce((map, plan, index) => {
    const userData = userQueries[index].data;
    if (userData) {
      const fullName = userData.given_name && userData.family_name
        ? `${userData.given_name} ${userData.family_name}`
        : userData.given_name || 'Community Member';
      map[plan.userId] = fullName;
    }
    return map;
  }, {} as Record<string, string>);

  // Filter lesson plans based on search query
  const filteredLessonPlans = publicLessonPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Function to handle viewing combined MDX content
  const handleViewCombinedMdx = (id: number) => {
    // Open the combined MDX page in a new tab with the lesson plan ID
    window.open(`/combined-mdx?id=${id}`, '_blank');
  };

  // Handle viewing a lesson plan
  const handleViewLessonPlan = (id: number, ownerId: string, isPublicPlan: boolean) => {
    // Set read-only mode if the lesson plan belongs to another user
    const isOwnLessonPlan = ownerId === user?.id;
    setIsReadOnly(!isOwnLessonPlan);

    // If it's not the user's own lesson plan, we need to load it as a public lesson
    // But only if it's actually marked as public
    const isPublic = !isOwnLessonPlan && isPublicPlan;

    console.log('Viewing lesson plan:', {
      id,
      ownerId,
      isOwnLessonPlan,
      isPublic,
      isPublicPlan,
      currentUserId: user?.id
    });

    // If it's not public and not the user's own, show an error
    if (!isOwnLessonPlan && !isPublicPlan) {
      toast.error('This lesson plan is not public and does not belong to you');
      return;
    }

    // Set the isLoadingPublicLesson flag in the store if needed
    if (isPublic) {
      useLessonPlanStore.setState({ isLoadingPublicLesson: true });
    }

    // Set the lesson plan to load and navigate to the lesson plan page
    setLessonPlanToLoad(id);
    navigate({
      to: '/lesson-plan',
      state: {
        lessonPlanId: id,
        isPublic: isPublic,
        fromDashboard: true
      }
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Public Lessons</h1>
      <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
        Browse lesson plans shared by the community
      </p>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-medium">Available Public Lessons</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Lesson plans shared by the community</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex items-center">
              <BookMarked className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2 sm:mr-3" />
              {isPublicLessonPlansLoading ? (
                <Skeleton className="h-8 sm:h-10 w-16 sm:w-20" />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold">{totalPublicLessonPlans}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Public Lesson Plans */}
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Browse Public Lesson Plans</h2>
      <Card>
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Community Lesson Plans</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Search and explore lesson plans shared by the community
          </CardDescription>
          <div className="flex items-center space-x-2 mt-3 sm:mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search public lesson plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {isPublicLessonPlansLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLessonPlans.length > 0 ? (
            <div className="space-y-4">
              {filteredLessonPlans.map((plan) => (
                <div key={plan.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b pb-3 last:border-0 gap-3 sm:gap-2">
                  <div>
                    <h3 className="font-medium text-sm sm:text-base">{plan.name}</h3>
                    <div className="flex flex-wrap items-center text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-0">
                      <div className="flex items-center mr-2">
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>{formatDate(plan.createdAt)}</span>
                      </div>
                      <div className="flex items-center mr-2">
                        <User className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[150px] sm:max-w-none">
                          {plan.userId === user?.id ? 'You' : userMap[plan.userId] || 'Community Member'}
                        </span>
                      </div>
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full inline-flex items-center">
                        {plan.topics.length} {plan.topics.length === 1 ? 'topic' : 'topics'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-start mt-1 sm:mt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewCombinedMdx(plan.id)}
                      className="flex items-center hover:bg-primary/10 hover:text-primary h-8 px-2 sm:px-3"
                      title="View all MDX content combined in one document"
                    >
                      <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Combined</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleViewLessonPlan(plan.id, plan.userId, plan.isPublic)}
                      className="h-8"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 sm:py-6">
              {searchQuery.trim() ? (
                <div>
                  <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-20" />
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm">No public lesson plans found matching "{searchQuery}"</p>
                  <Button variant="outline" onClick={() => setSearchQuery('')} size="sm" className="text-xs sm:text-sm">
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm">No public lesson plans available yet</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
