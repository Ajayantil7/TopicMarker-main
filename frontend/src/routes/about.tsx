import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  Target,
  Lightbulb,
  Code,
  Layers,
  ArrowRight,
  Mail,
  Github,
  Twitter
} from 'lucide-react';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Hero Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Topic Marker</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Empowering educators and content creators with intelligent tools for structured knowledge sharing
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-lg">
                <p>
                  Topic Marker began with a simple observation: creating well-structured educational content is time-consuming and often challenging, especially when trying to maintain consistency and quality across multiple topics.
                </p>
                <p>
                  Our platform was built to address this challenge by combining the power of Retrieval Augmented Generation (RAG) technology with an intuitive interface for organizing and sharing knowledge.
                </p>
                <p>
                  What started as a tool for educators quickly evolved into a comprehensive platform that serves content creators, researchers, and knowledge workers across various domains.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur-xl opacity-50"></div>
              <div className="relative bg-card border rounded-xl p-8 shadow-sm">
                <div className="flex items-center mb-6">
                  <BookOpen className="h-10 w-10 text-primary mr-4" />
                  <h3 className="text-2xl font-semibold">Our Mission</h3>
                </div>
                <p className="text-lg">
                  To democratize knowledge creation and sharing by providing intelligent tools that make it easier to organize, generate, and distribute high-quality educational content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Core Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-muted-foreground">
                We continuously explore new technologies and approaches to improve the way knowledge is created and shared.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Accessibility</h3>
              <p className="text-muted-foreground">
                We believe that powerful tools for knowledge creation should be accessible to everyone, regardless of technical expertise.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality</h3>
              <p className="text-muted-foreground">
                We are committed to helping users create high-quality, accurate, and well-structured content that truly adds value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-lg p-4 border shadow-sm">
                  <Code className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">React</h4>
                  <p className="text-sm text-muted-foreground">Modern UI framework</p>
                </div>
                <div className="bg-card rounded-lg p-4 border shadow-sm">
                  <Layers className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">TanStack Router</h4>
                  <p className="text-sm text-muted-foreground">Type-safe routing</p>
                </div>
                <div className="bg-card rounded-lg p-4 border shadow-sm">
                  <Code className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Hono</h4>
                  <p className="text-sm text-muted-foreground">Backend framework</p>
                </div>
                <div className="bg-card rounded-lg p-4 border shadow-sm">
                  <Layers className="h-8 w-8 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Drizzle ORM</h4>
                  <p className="text-sm text-muted-foreground">Database access</p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-6">Our Technology</h2>
              <div className="space-y-4 text-lg">
                <p>
                  Topic Marker is built on a modern tech stack that combines the best of frontend and backend technologies to deliver a seamless user experience.
                </p>
                <p>
                  At the core of our platform is our proprietary RAG (Retrieval Augmented Generation) system that intelligently generates high-quality MDX content based on topics and subtopics.
                </p>
                <p>
                  We leverage the power of React and TanStack Router for our frontend, with Hono and Drizzle ORM powering our backend services. This combination allows us to deliver a fast, responsive, and reliable platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Meet Our Team</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-sm border text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-12 w-12 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold">Alex Johnson</h3>
              <p className="text-primary mb-2">Founder & CEO</p>
              <p className="text-muted-foreground mb-4">
                Former educator with a passion for making knowledge accessible to everyone.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-12 w-12 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold">Sam Rodriguez</h3>
              <p className="text-primary mb-2">CTO</p>
              <p className="text-muted-foreground mb-4">
                AI researcher specializing in natural language processing and knowledge retrieval systems.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm border text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-12 w-12 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold">Jamie Lee</h3>
              <p className="text-primary mb-2">Head of Product</p>
              <p className="text-muted-foreground mb-4">
                UX specialist focused on creating intuitive interfaces for complex knowledge systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Become part of our growing community of educators, content creators, and knowledge enthusiasts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="text-base px-8">
              <a href="/api/register">
                Sign Up Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <a href="/public-lessons">
                Explore Public Lessons
              </a>
            </Button>
          </div>

          <div className="flex justify-center space-x-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="h-6 w-6" />
            </a>
            <a href="mailto:contact@topicmarker.com" className="text-muted-foreground hover:text-primary transition-colors">
              <Mail className="h-6 w-6" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}