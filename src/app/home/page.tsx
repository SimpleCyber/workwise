"use client";

import { Button } from "@/components/ui/button";
import {
  Glasses,
  ArrowRight,
  Menu,
  X,
  MessageSquare,
  ListTodo,
  Users,
  Zap,
  Check,
  Star,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: MessageSquare,
      title: "Team Chat",
      description:
        "Real-time messaging with channels, threads, and rich media sharing.",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: ListTodo,
      title: "Task Management",
      description:
        "Kanban boards, sprints, and AI-powered task breakdown for teams.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Users,
      title: "HR Suite",
      description:
        "Complete workforce management with attendance and performance tracking.",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Zap,
      title: "AI Assistant",
      description: "Smart suggestions and automated workflows powered by AI.",
      gradient: "from-emerald-500 to-teal-500",
    },
  ];

  const testimonials = [
    {
      content:
        "Woodls has completely transformed how our team works. The integration of chat, tasks, and HR in one place is a game-changer.",
      author: "Sarah Chen",
      role: "CTO, TechFlow",
      avatar: "/user1.png",
    },
    {
      content:
        "The AI features alone save us hours every week. Best productivity tool we've ever used.",
      author: "Marcus Rodriguez",
      role: "Product Lead, Scale",
      avatar: "/user2.png",
    },
    {
      content:
        "Finally, a tool that brings everything together. No more switching between apps.",
      author: "Emily Watson",
      role: "Founder, Startly",
      avatar: "/user3.png",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 text-neutral-900 dark:text-white overflow-x-hidden">
      {/* Enhanced gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Primary gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.3),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.25),transparent)]" />

        {/* Decorative orbs - more visible */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-violet-300/50 dark:bg-violet-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-blue-300/40 dark:bg-blue-500/15 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 w-[700px] h-[700px] bg-indigo-300/30 dark:bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-pink-300/30 dark:bg-pink-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Glasses className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">Woodls</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="#testimonials"
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Testimonials
              </Link>
              <Link
                href="#pricing"
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Pricing
              </Link>
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth">
                <Button
                  variant="ghost"
                  className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-sm px-4">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white dark:bg-neutral-950 md:hidden"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                    <Glasses className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold">Woodls</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-col gap-6 mt-12 text-lg">
                <Link
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-600 dark:text-neutral-400"
                >
                  Features
                </Link>
                <Link
                  href="#testimonials"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-600 dark:text-neutral-400"
                >
                  Testimonials
                </Link>
                <Link
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-600 dark:text-neutral-400"
                >
                  Pricing
                </Link>
              </div>
              <div className="mt-auto flex flex-col gap-3">
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div {...fadeIn} className="inline-flex mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                <Sparkles className="w-3 h-3" />
                Now with AI-powered workflows
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeIn}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              The workspace for
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                modern teams
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeIn}
              transition={{ delay: 0.2 }}
              className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-xl mx-auto"
            >
              All your team&apos;s chat, tasks, and HR tools in one beautiful
              platform. Simple, fast, and designed for productivity.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              {...fadeIn}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link href="/auth">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 px-8 h-12 text-base"
                >
                  Start for free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 text-base border-neutral-300 dark:border-neutral-700"
              >
                View demo
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              {...fadeIn}
              transition={{ delay: 0.4 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-500 dark:text-neutral-500"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-950 overflow-hidden"
                    >
                      <Image
                        src={`/user${i}.png`}
                        alt=""
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <span>Trusted by 10,000+ teams</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-1">4.9/5 rating</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-neutral-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl shadow-neutral-900/10 dark:shadow-black/50">
              <Image
                src="/image.png"
                alt="Woodls Dashboard"
                width={1200}
                height={675}
                className="w-full"
                priority
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-4 sm:px-6 bg-neutral-50 dark:bg-neutral-900/50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-3"
            >
              FEATURES
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              Everything you need, nothing you don&apos;t
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto"
            >
              Built for teams who want to move fast without the complexity.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Feature Showcase */}
          <div className="mt-24 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-3">
                COLLABORATION
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                Chat and tasks, unified
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                No more switching between apps. Chat with your team, manage
                tasks, and track progress all in one seamless workspace.
              </p>
              <ul className="space-y-3">
                {[
                  "Real-time messaging with threads",
                  "Kanban boards & sprint planning",
                  "AI-powered task suggestions",
                  "File sharing & search",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg">
                <Image
                  src="/chat.png"
                  alt="Chat feature"
                  width={600}
                  height={400}
                  className="w-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-3"
            >
              TESTIMONIALS
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold"
            >
              Loved by teams everywhere
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{testimonial.author}</p>
                    <p className="text-xs text-neutral-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-24 px-4 sm:px-6 bg-neutral-50 dark:bg-neutral-900/50"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-3"
            >
              PRICING
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-neutral-600 dark:text-neutral-400"
            >
              Start free, upgrade when you&apos;re ready.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
            >
              <h3 className="text-lg font-semibold mb-2">Free</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Perfect for small teams getting started
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-neutral-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 10 team members",
                  "Basic task management",
                  "Team chat",
                  "5GB storage",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/auth">
                <Button
                  variant="outline"
                  className="w-full h-11 border-neutral-300 dark:border-neutral-700"
                >
                  Get started
                </Button>
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 px-2 py-1 rounded text-xs font-medium bg-violet-500 text-white">
                Popular
              </div>
              <h3 className="text-lg font-semibold mb-2">Pro</h3>
              <p className="text-sm text-neutral-400 dark:text-neutral-600 mb-6">
                For growing teams that need more
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$12</span>
                <span className="text-neutral-400 dark:text-neutral-600">
                  /user/month
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited team members",
                  "Advanced analytics",
                  "AI-powered features",
                  "Priority support",
                  "100GB storage",
                  "Custom integrations",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-violet-400 dark:text-violet-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/auth">
                <Button className="w-full h-11 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  Start free trial
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            Ready to transform your workflow?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-neutral-600 dark:text-neutral-400 mb-8"
          >
            Join thousands of teams already using Woodls to work smarter.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href="/auth">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 px-8 h-12"
              >
                Get started for free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 px-8 border-neutral-300 dark:border-neutral-700"
            >
              Talk to sales
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Glasses className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Woodls</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <a
                href="#"
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Twitter
              </a>
              <a
                href="#"
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>

            <p className="text-sm text-neutral-500">
              © {new Date().getFullYear()} Woodls. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
