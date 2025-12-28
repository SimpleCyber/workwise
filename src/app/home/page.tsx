"use client";

import { Button } from "@/components/ui/button";
import {
  Glasses,
  ArrowRight,
  Menu,
  Play,
  MessageSquare,
  ListTodo,
  Database,
  Users,
  CheckCircle,
  BarChart,
  Zap,
  Shield,
  Clock,
  Star,
  Sparkles,
  ChevronRight,
  X,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Globe,
  Rocket,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";

// Animated counter component
function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// Floating particles background
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{
            x:
              Math.random() *
              (typeof window !== "undefined" ? window.innerWidth : 1920),
            y:
              Math.random() *
              (typeof window !== "undefined" ? window.innerHeight : 1080),
          }}
          animate={{
            x:
              Math.random() *
              (typeof window !== "undefined" ? window.innerWidth : 1920),
            y:
              Math.random() *
              (typeof window !== "undefined" ? window.innerHeight : 1080),
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Messaging",
      description:
        "Instant team communication with channels, threads, and file sharing.",
      color: "purple",
      image: "/chat.png",
    },
    {
      icon: ListTodo,
      title: "Task Management",
      description:
        "Kanban boards, sprint planning, and AI-powered task breakdown.",
      color: "blue",
      image: "/taskstree.png",
    },
    {
      icon: Database,
      title: "Smart To-Do Lists",
      description:
        "Priority-based organization with reminders and progress tracking.",
      color: "green",
      image: "/todo.png",
    },
    {
      icon: Users,
      title: "HR Management",
      description:
        "Complete workforce management from attendance to performance.",
      color: "orange",
      image: "/miniHRMS.png",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CTO at TechFlow",
      image: "/user1.png",
      content:
        "Woodls transformed how our team collaborates. We've seen a 40% increase in productivity.",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Product Lead at Scale",
      image: "/user2.png",
      content:
        "The AI features are game-changing. Task breakdown and smart suggestions save hours every week.",
      rating: 5,
    },
    {
      name: "Emily Watson",
      role: "Founder at Startly",
      image: "/user3.png",
      content:
        "Finally, a tool that brings everything together. No more switching between 10 different apps.",
      rating: 5,
    },
  ];

  const stats = [
    { value: 50000, suffix: "+", label: "Active Users" },
    { value: 98, suffix: "%", label: "Uptime SLA" },
    { value: 2, suffix: "M+", label: "Tasks Completed" },
    { value: 4.9, suffix: "/5", label: "User Rating" },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for individuals getting started",
      features: [
        "Up to 5 team members",
        "Basic task management",
        "5GB storage",
        "Email support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$12",
      period: "/user/month",
      description: "For growing teams that need more",
      features: [
        "Unlimited team members",
        "Advanced analytics",
        "100GB storage",
        "Priority support",
        "Custom integrations",
        "AI-powered features",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "Unlimited storage",
        "Dedicated account manager",
        "Custom SLA",
        "On-premise option",
        "Advanced security",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#030014] text-white selection:bg-purple-500/30">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/30 rounded-full blur-[150px] animate-pulse" />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/25 rounded-full blur-[130px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-[40%] left-[30%] w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[80px] animate-pulse"
          style={{ animationDelay: "3s" }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Floating particles */}
        <FloatingParticles />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between p-4 md:p-6 max-w-7xl mx-auto sticky top-0 z-50"
        >
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 ring-1 ring-white/20 group-hover:shadow-purple-500/50 transition-shadow">
              <Glasses className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              Woodls
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {["Features", "Testimonials", "Pricing"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all group-hover:w-full" />
              </Link>
            ))}
            <Link href="/auth">
              <Button
                variant="outline"
                className="border-purple-500/50 bg-purple-500/10 text-white hover:bg-purple-500/20 hover:text-white hover:border-purple-400 transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </motion.nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col h-full p-6">
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 space-y-8">
                  {["Features", "Testimonials", "Pricing"].map((item) => (
                    <Link
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-2xl font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-500 text-white px-8"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <div
          ref={targetRef}
          className="relative pt-12 md:pt-20 pb-24 md:pb-32 px-4 md:px-6"
        >
          <motion.div
            style={{ opacity, scale, y }}
            className="max-w-7xl mx-auto"
          >
            <div className="text-center max-w-5xl mx-auto space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-sm text-purple-300 backdrop-blur-sm hover:border-purple-500/40 transition-colors cursor-default"
              >
                <Sparkles className="w-4 h-4" />
                <span>Introducing AI-Powered Workspaces</span>
                <ChevronRight className="w-4 h-4" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
              >
                Your team&apos;s
                <br />
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-gradient">
                    supercharged workspace
                  </span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
              >
                Consolidate chat, tasks, documents, and HR tools into one
                beautiful platform. Built with AI to help your team work
                smarter, not harder.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              >
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 h-14 text-lg rounded-full shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_-10px_rgba(168,85,247,0.6)] transition-all hover:scale-105 border-0"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-white/20 bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </motion.div>
            </div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-16 relative max-w-6xl mx-auto px-4 md:px-12"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-3xl blur-3xl" />

              <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-2 shadow-2xl">
                {/* Browser mockup header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-black/40 rounded-t-xl border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-white/5 rounded-lg text-xs text-gray-500 flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      woodls.app/dashboard
                    </div>
                  </div>
                </div>

                <div className="aspect-[16/9] rounded-b-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black relative">
                  <img
                    src="/image.png"
                    alt="Dashboard Interface"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                  className="absolute right-4 md:right-8 top-16 md:top-24 p-3 md:p-4 rounded-xl bg-gray-900/95 border border-white/20 backdrop-blur-xl shadow-2xl z-10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Productivity</div>
                      <div className="text-lg font-bold text-white">+245%</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute left-4 md:left-8 bottom-20 md:bottom-28 p-3 md:p-4 rounded-xl bg-gray-900/95 border border-white/20 backdrop-blur-xl shadow-2xl z-10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-gray-900 relative overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400"
                        >
                          <Image
                            src={`/user${i}.png`}
                            alt={`User ${i}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        12 online
                      </div>
                      <div className="text-xs text-gray-500">Team active</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 6,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute right-10 md:right-20 bottom-10 md:bottom-20 p-3 rounded-xl bg-gradient-to-br from-purple-600/90 to-pink-600/90 border border-white/20 backdrop-blur-xl shadow-2xl"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-white" />
                    <span className="text-sm font-medium text-white">
                      AI Ready
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <section className="py-16 px-4 md:px-6 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-3xl bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 border border-white/5"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    <AnimatedCounter
                      target={
                        typeof stat.value === "number"
                          ? stat.value
                          : parseFloat(String(stat.value))
                      }
                      suffix={stat.suffix}
                    />
                  </div>
                  <div className="text-gray-500 mt-2 text-sm md:text-base">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section - Bento Grid */}
        <section id="features" className="py-24 px-4 md:px-6 relative">
          <div className="max-w-7xl mx-auto space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto space-y-4"
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400"
              >
                <Rocket className="w-4 h-4" />
                Powerful Features
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
                Everything you need to succeed
              </h2>
              <p className="text-gray-400 text-lg">
                One platform with all the tools your team needs to collaborate,
                communicate, and deliver.
              </p>
            </motion.div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Large Card - Chat */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-2 group relative rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/5 to-transparent p-6 hover:border-purple-500/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4">
                        <MessageSquare className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">
                        Real-time Messaging
                      </h3>
                      <p className="text-gray-400 max-w-md">
                        Instant team communication with channels, threads,
                        reactions, and seamless file sharing.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl border border-white/10 overflow-hidden bg-black/30">
                    <Image
                      src="/chat.png"
                      alt="Chat Interface"
                      width={800}
                      height={400}
                      className="w-full h-auto transform group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Small Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-transparent p-6 hover:border-blue-500/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">AI-Powered</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Smart suggestions, automated task breakdown, and intelligent
                    search powered by cutting-edge AI.
                  </p>

                  {/* AI Visual Elements */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-gray-400">
                        AI analyzing tasks...
                      </span>
                      <span className="ml-auto text-xs text-green-400">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                          initial={{ width: "0%" }}
                          whileInView={{ width: "85%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">85%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:gap-3 transition-all">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>

              {/* Task Management */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-green-500/5 to-transparent p-6 hover:border-green-500/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-4">
                    <ListTodo className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Task Management</h3>
                  <p className="text-gray-400 text-sm">
                    Kanban boards, sprints, and visual project tracking.
                  </p>
                  <div className="mt-4 rounded-xl border border-white/10 overflow-hidden">
                    <Image
                      src="/taskmanagemet.png"
                      alt="Tasks"
                      width={400}
                      height={200}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Security Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-orange-500/5 to-transparent p-6 hover:border-orange-500/30 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    Enterprise Security
                  </h3>
                  <p className="text-gray-400 text-sm">
                    SOC 2 compliant, end-to-end encryption, and SSO support.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-orange-400 text-sm font-medium group-hover:gap-3 transition-all">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>

              {/* Large Card - HR Management */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="md:col-span-2 group relative rounded-3xl border border-white/10 bg-gradient-to-br from-orange-500/5 to-transparent p-6 hover:border-orange-500/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-orange-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      Complete HR Suite
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Manage attendance, leaves, performance reviews, and
                      more—all in one place.
                    </p>
                    <div className="space-y-3">
                      {[
                        "Attendance tracking",
                        "Leave management",
                        "Performance reviews",
                        "Team analytics",
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-gray-300"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl border border-white/10 overflow-hidden">
                    <Image
                      src="/miniHRMS.png"
                      alt="HR Management"
                      width={500}
                      height={300}
                      className="w-full h-full object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          id="testimonials"
          className="py-24 px-4 md:px-6 relative bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"
        >
          <div className="max-w-7xl mx-auto space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto space-y-4"
            >
              <motion.div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400">
                <Star className="w-4 h-4" />
                Customer Stories
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
                Loved by teams worldwide
              </h2>
              <p className="text-gray-400 text-lg">
                See what our customers have to say about their experience with
                Woodls.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 hover:border-purple-500/30 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                  <div className="relative z-10">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 text-yellow-500 fill-yellow-500"
                        />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-4 md:px-6 relative">
          <div className="max-w-7xl mx-auto space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto space-y-4"
            >
              <motion.div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                <Target className="w-4 h-4" />
                Simple Pricing
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
                Choose your plan
              </h2>
              <p className="text-gray-400 text-lg">
                Start free and scale as you grow. No hidden fees.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-3xl border p-8 ${
                    plan.popular
                      ? "border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10 scale-105"
                      : "border-white/10 bg-white/5"
                  } transition-all hover:scale-[1.02]`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-sm font-medium text-white">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-500 text-sm">{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-500">{plan.period}</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-gray-300"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full h-12 rounded-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 md:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="relative rounded-3xl overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-blue-600/30" />
              <div className="absolute inset-0 backdrop-blur-xl" />

              <div className="relative z-10 p-8 md:p-16 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <h2 className="text-3xl md:text-5xl font-bold">
                    Ready to transform your workflow?
                  </h2>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Join thousands of teams already using Woodls to work smarter
                    and faster.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link href="/auth">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto bg-white hover:bg-gray-100 text-black px-8 h-14 text-lg rounded-full transition-all hover:scale-105"
                      >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-white/30 bg-white/10 hover:bg-white/20 transition-all"
                    >
                      Talk to Sales
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-black/50 backdrop-blur-xl py-16 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
              {/* Brand */}
              <div className="col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Glasses className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold text-xl">Woodls</span>
                </div>
                <p className="text-gray-500 text-sm mb-6 max-w-xs">
                  The all-in-one workspace for modern teams. Chat, tasks, docs,
                  and HR—unified.
                </p>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <Twitter className="w-4 h-4 text-gray-400" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <Github className="w-4 h-4 text-gray-400" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-gray-400" />
                  </a>
                </div>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Integrations
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Changelog
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Security
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Status
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Woodls Inc. All rights reserved.
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Globe className="w-4 h-4" />
                <span>English (US)</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Styles for animations */}
      <style jsx global>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
