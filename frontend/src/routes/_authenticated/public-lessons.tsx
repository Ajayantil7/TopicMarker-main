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
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">Public Lessons</h1>
      <p className="text-muted-foreground mb-8">
        Browse lesson plans shared by the community
      </p>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Available Public Lessons</CardTitle>
            <CardDescription>Lesson plans shared by the community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookMarked className="h-8 w-8 text-primary mr-3" />
              {isPublicLessonPlansLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <span className="text-3xl font-bold">{totalPublicLessonPlans}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Public Lesson Plans */}
      <h2 className="text-xl font-semibold mb-4">Browse Public Lesson Plans</h2>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Community Lesson Plans</CardTitle>
          <CardDescription>
            Search and explore lesson plans shared by the community
          </CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search public lesson plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPublicLessonPlansLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLessonPlans.length > 0 ? (
            <div className="space-y-4">
              {filteredLessonPlans.map((plan) => (
                <div key={plan.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                  <div>
                    <h3 className="font-medium">{plan.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(plan.createdAt)}</span>
                      <span className="mx-2">•</span>
                      <User className="h-3 w-3 mr-1" />
                      <span>Created by {plan.userId === user?.id ? 'You' : userMap[plan.userId] || 'Community Member'}</span>
                      <span className="mx-2">•</span>
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {plan.topics.length} {plan.topics.length === 1 ? 'topic' : 'topics'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewCombinedMdx(plan.id)}
                      className="flex items-center hover:bg-primary/10 hover:text-primary"
                      title="View all MDX content combined in one document"
                    >
                      <FileCode className="h-4 w-4 mr-1" />
                      <span>Combined</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleViewLessonPlan(plan.id, plan.userId, plan.isPublic)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              {searchQuery.trim() ? (
                <div>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground mb-4">No public lesson plans found matching "{searchQuery}"</p>
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-4">No public lesson plans available yet</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
