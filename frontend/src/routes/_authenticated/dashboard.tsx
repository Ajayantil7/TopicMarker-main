import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { api, getLessonPlans, deleteLessonPlan } from '@/lib/api';
import { useLessonPlanStore } from '@/stores/lessonPlanStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  FileText,
  BookOpen,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  BookMarked,
  Bookmark,
  Trash2,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
});

// Function to fetch user's saved topics
async function fetchUserTopics() {
  try {
    const res = await api.topics.$get();
    if (!res.ok) {
      throw new Error('Failed to fetch topics');
    }
    const data = await res.json();
    return data.topics;
  } catch (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }
}

function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [lessonPlanToDelete, setLessonPlanToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get the setLessonPlanToLoad function from the store
  const { setLessonPlanToLoad } = useLessonPlanStore();

  // Fetch user's saved topics
  const {
    data: topics,
    isLoading: isTopicsLoading,
    error: topicsError,
  } = useQuery({
    queryKey: ['user-topics'],
    queryFn: fetchUserTopics,
    enabled: !!user,
  });

  // Fetch user's lesson plans
  const {
    data: lessonPlansData,
    isLoading: isLessonPlansLoading,
    error: lessonPlansError,
  } = useQuery({
    queryKey: ['user-lesson-plans'],
    queryFn: getLessonPlans,
    enabled: !!user,
  });

  // Update last active timestamp
  useEffect(() => {
    const lastActiveTime = localStorage.getItem('lastActiveTime');
    setLastActive(lastActiveTime);

    // Update last active time
    const now = new Date().toISOString();
    localStorage.setItem('lastActiveTime', now);
  }, []);

  // Show error toast if data fetch fails
  useEffect(() => {
    if (topicsError) {
      toast.error('Failed to load your topics');
    }
    if (lessonPlansError) {
      toast.error('Failed to load your lesson plans');
    }
  }, [topicsError, lessonPlansError]);

  // Calculate statistics
  const totalTopics = topics?.length || 0;
  const lessonPlans = lessonPlansData?.lessonPlans || [];
  const totalLessonPlans = lessonPlans.length;
  const recentLessonPlans = lessonPlans.slice(0, 5);

  const topicsByDifficulty = {
    Beginner: topics?.filter(topic => topic.difficulty === 'Beginner').length || 0,
    Intermediate: topics?.filter(topic => topic.difficulty === 'Intermediate').length || 0,
    Advanced: topics?.filter(topic => topic.difficulty === 'Advanced').length || 0,
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (lessonPlanId: number) => {
    setLessonPlanToDelete(lessonPlanId);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirming the deletion
  const handleConfirmDelete = async () => {
    if (!lessonPlanToDelete) return;

    setIsDeleting(true);
    try {
      await deleteLessonPlan(lessonPlanToDelete);
      // Invalidate the lesson plans query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['user-lesson-plans'] });
      toast.success('Lesson plan deleted successfully');
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      toast.error('Failed to delete lesson plan');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setLessonPlanToDelete(null);
    }
  };

  // Handle viewing a lesson plan
  const handleViewLessonPlan = (lessonPlanId: number) => {
    console.log(`Opening lesson plan with ID: ${lessonPlanId}`);

    // Store the lesson plan ID in the store
    setLessonPlanToLoad(lessonPlanId);

    // Navigate to the lesson plan page with both fromDashboard flag and lessonPlanId
    navigate({
      to: '/lesson-plan',
      state: {
        fromDashboard: true,
        lessonPlanId: lessonPlanId
      }
    });
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back, {user?.given_name || 'User'}! Here's an overview of your activity.
      </p>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Lesson Plans</CardTitle>
            <CardDescription>Your saved lesson plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookMarked className="h-8 w-8 text-primary mr-3" />
              {isLessonPlansLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <span className="text-3xl font-bold">{totalLessonPlans}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Last Active</CardTitle>
            <CardDescription>Your previous session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-primary mr-3" />
              <span className="text-lg">
                {lastActive ? formatDate(lastActive) : 'First session'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Topic Breakdown</CardTitle>
            <CardDescription>By difficulty level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <BarChart className="h-8 w-8 text-primary" />
              {isTopicsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="flex flex-col w-full">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Beginner</span>
                    <span className="text-sm font-medium">{topicsByDifficulty.Beginner}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Intermediate</span>
                    <span className="text-sm font-medium">{topicsByDifficulty.Intermediate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Advanced</span>
                    <span className="text-sm font-medium">{topicsByDifficulty.Advanced}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Button asChild variant="outline" className="h-auto py-6 justify-start">
          <Link to="/mdx" className="flex flex-col items-start">
            <div className="flex items-center w-full">
              <FileText className="h-5 w-5 mr-2" />
              <span className="font-medium">MDX Editor</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </div>
            <span className="text-sm text-muted-foreground mt-1">Create and edit MDX content</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-auto py-6 justify-start">
          <Link to="/lesson-plan" className="flex flex-col items-start">
            <div className="flex items-center w-full">
              <BookOpen className="h-5 w-5 mr-2" />
              <span className="font-medium">Lesson Plan</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </div>
            <span className="text-sm text-muted-foreground mt-1">Generate lesson plans with AI</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-auto py-6 justify-start">
          <Link to="/profile" className="flex flex-col items-start">
            <div className="flex items-center w-full">
              <Layers className="h-5 w-5 mr-2" />
              <span className="font-medium">Profile Settings</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </div>
            <span className="text-sm text-muted-foreground mt-1">Manage your account</span>
          </Link>
        </Button>
      </div>

      {/* Recent Lesson Plans */}
      <h2 className="text-xl font-semibold mb-4">Recent Lesson Plans</h2>
      <Card>
        <CardHeader>
          <CardTitle>Your Lesson Plans</CardTitle>
          <CardDescription>
            The last {Math.min(5, totalLessonPlans)} lesson plans you've created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLessonPlansLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentLessonPlans.length > 0 ? (
            <div className="space-y-4">
              {recentLessonPlans.map((plan) => (
                <div key={plan.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                  <div>
                    <h3 className="font-medium">{plan.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(plan.createdAt)}</span>
                      <span className="mx-2">•</span>
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {plan.topics.length} {plan.topics.length === 1 ? 'topic' : 'topics'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewLessonPlan(plan.id)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteClick(plan.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">You haven't created any lesson plans yet</p>
              <Button asChild>
                <Link to="/lesson-plan">Create Your First Lesson Plan</Link>
              </Button>
            </div>
          )}
        </CardContent>
        {recentLessonPlans.length > 0 && (
          <CardFooter className="border-t pt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/lesson-plan">Create New Lesson Plan</Link>
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lesson plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
