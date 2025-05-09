import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Share2,
  Code,
  Search,
  CheckCircle2,
  Layers,
  FileText,
  Globe,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // We'll handle redirects in the component to show a loading state
    return {};
  },
  component: Home,
});

function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // If authentication is still loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show the landing page for all users, whether authenticated or not
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-b from-background to-background/80">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  Topic Marker
                </h1>
                <p className="text-3xl font-semibold mb-6">
                  Create, Organize, and Share Knowledge
                </p>
                <p className="text-xl text-muted-foreground mb-8 max-w-xl">
                  The intelligent platform for creating structured lesson plans with rich MDX content,
                  powered by advanced RAG technology.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <>
                    <Button asChild size="lg" className="text-base px-8">
                      <a href="/dashboard">Go to Dashboard</a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="text-base">
                      <a href="/lesson-plan">Create Lesson Plan</a>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="text-base px-8">
                      <a href="/api/register">Get Started</a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="text-base">
                      <a href="/api/login">Sign In</a>
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-primary" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-primary" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-xl blur-xl opacity-30"></div>
              <div className="relative bg-background/90 border border-border/40 rounded-xl shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-muted-foreground">Topic Marker Editor</div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-8 bg-muted/50 rounded w-3/4"></div>
                    <div className="h-4 bg-muted/50 rounded w-full"></div>
                    <div className="h-4 bg-muted/50 rounded w-5/6"></div>
                    <div className="h-4 bg-muted/50 rounded w-4/5"></div>
                    <div className="h-20 bg-muted/30 rounded w-full border border-border/40 p-3">
                      <div className="h-3 bg-primary/20 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-primary/20 rounded w-3/4"></div>
                    </div>
                    <div className="h-4 bg-muted/50 rounded w-5/6"></div>
                    <div className="h-4 bg-muted/50 rounded w-full"></div>
                    <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, organize, and share your knowledge effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hierarchical Lesson Plans</h3>
              <p className="text-muted-foreground">
                Create structured lesson plans with topics and subtopics organized in a clear hierarchy
              </p>
            </div>

            <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rich MDX Content</h3>
              <p className="text-muted-foreground">
                Create beautiful content with Markdown, JSX, code blocks, and more using our MDX editor
              </p>
            </div>

            <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">RAG Technology</h3>
              <p className="text-muted-foreground">
                Leverage Retrieval Augmented Generation to create high-quality content automatically
              </p>
            </div>

            <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Content Refinement</h3>
              <p className="text-muted-foreground">
                Refine your content with intelligent suggestions and improvements
              </p>
            </div>

            <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share Your Knowledge</h3>
              <p className="text-muted-foreground">
                Publish your lesson plans to share with the community or keep them private
              </p>
            </div>

            <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:border-primary/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Learning</h3>
              <p className="text-muted-foreground">
                Browse and learn from lesson plans shared by other community members
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create comprehensive lesson plans in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                <span className="text-2xl font-bold text-primary">1</span>
                <div className="absolute h-full w-full rounded-full border-2 border-primary/20 animate-ping opacity-20"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create a Topic Hierarchy</h3>
              <p className="text-muted-foreground">
                Search for a main topic and build a structured hierarchy of subtopics
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Generate MDX Content</h3>
              <p className="text-muted-foreground">
                Use our RAG technology to automatically generate rich content for each topic
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Save and Share</h3>
              <p className="text-muted-foreground">
                Save your lesson plan and optionally publish it for others to learn from
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {isAuthenticated
              ? "Continue Your Learning Journey"
              : "Ready to Create Your First Lesson Plan?"}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {isAuthenticated
              ? "Create new lesson plans or explore content shared by the community."
              : "Join Topic Marker today and start creating structured, high-quality lesson plans with our powerful tools."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Button asChild size="lg" className="text-base px-8">
                  <a href="/lesson-plan">
                    Create New Lesson Plan
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <a href="/public-lessons">
                    Browse Public Lessons
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </a>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="text-base px-8">
                  <a href="/api/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <a href="/mdxPublic">
                    Explore Public Content
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-xl font-bold">Topic Marker</p>
              <p className="text-sm text-muted-foreground">Create, organize, and share knowledge</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
              <a href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <a href="/mdxPublic" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Public Content
              </a>
              <div className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Topic Marker
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
