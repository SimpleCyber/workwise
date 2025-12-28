"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function HomePage() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black text-white selection:bg-purple-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[80px] mix-blend-screen animate-pulse delay-2000" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between p-6 max-w-7xl mx-auto backdrop-blur-md bg-black/20 sticky top-0 z-50 border-b border-white/5"
        >
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/20">
              <Glasses className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              Woodls
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {["Features", "Testimonials", "Pricing"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
              </Link>
            ))}
            <Link href="/auth">
              <Button
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:text-white transition-all hover:scale-105"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden text-white">
            <Menu className="w-5 h-5" />
          </Button>
        </motion.nav>

        {/* Hero Section */}
        <div ref={targetRef} className="relative pt-20 pb-32 px-6">
          <motion.div
            style={{ opacity, scale }}
            className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-8 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm md:text-base text-purple-300 backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                v2.0 is now live
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
              >
                Work smarter, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-gradient-x">
                  not harder.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                The all-in-one workspace that consolidates your team's tools
                into a single, intuitive platform. Built for high-performance
                teams.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 h-14 text-lg rounded-full shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_-15px_rgba(168,85,247,0.6)] transition-all hover:scale-105"
                >
                  Start Building
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <div className="flex items-center gap-4 px-6 h-14 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3 h-3 text-white fill-current" />
                  </div>
                  <span className="font-medium">Watch Demo</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="pt-8 flex items-center justify-center lg:justify-start gap-8"
              >
                {/* Social Proof / Trusted By logos (simulated with text for now) */}
                <div className="text-sm text-gray-500 font-mono">
                  TRUSTED BY TEAMS AT
                </div>
                <div className="flex gap-6 opacity-50 grayscale hover:grayscale-0 transition-all">
                  {/* Placeholders for logos */}
                  <div className="h-6 w-20 bg-white/20 rounded" />
                  <div className="h-6 w-20 bg-white/20 rounded" />
                  <div className="h-6 w-20 bg-white/20 rounded" />
                </div>
              </motion.div>
            </div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 to-blue-500/30 blur-3xl rounded-full" />
              <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-2 shadow-2xl transform hover:rotate-1 transition-transform duration-500">
                {/* Fallback or Generated Image */}
                <div className="aspect-[15/8.5] rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black relative">
                  {/* Attempt to load generated image, fallback to CSS art */}
                  <img
                    src="/image.png"
                    alt="Dashboard Interface"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement?.classList.add(
                        "flex",
                        "items-center",
                        "justify-center",
                      );
                      const fallback = document.createElement("div");
                      fallback.innerText = "Modern Dashboard Preview";
                      fallback.className = "text-gray-500 font-bold text-2xl";
                      e.currentTarget.parentElement?.appendChild(fallback);
                    }}
                  />
                </div>

                {/* Floating Elements (Parallax) */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut",
                  }}
                  className="absolute -right-8 top-12 p-4 rounded-xl bg-gray-900/90 border border-white/20 backdrop-blur-md shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <BarChart className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Growth</div>
                      <div className="text-lg font-bold text-white">+245%</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 20, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 6,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute -left-8 bottom-20 p-4 rounded-xl bg-gray-900/90 border border-white/20 backdrop-blur-md shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-gray-900 relative overflow-hidden bg-gray-700"
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
                    <div className="text-sm font-medium text-white">
                      Team active
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Feature Showcase Section */}
        <section id="features" className="py-24 px-6 relative bg-white/5">
          <div className="max-w-7xl mx-auto space-y-32">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                Powerful features, beautiful interface.
              </h2>
              <p className="text-gray-400 text-lg">
                Experience a workspace that looks as good as it performs.
              </p>
            </div>

            {/* Feature 1: Chat */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6 order-2 lg:order-1"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-3xl font-bold">Real-time Messaging</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Chat with your team in real-time. Share files, code snippets,
                  and ideas without leaving your workspace. Includes thread
                  support and emoji reactions.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Channels", "Direct Messages", "File Sharing"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative order-1 lg:order-2"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl">
                  <Image
                    src="/chat.png"
                    alt="Chat Interface"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                </div>
              </motion.div>
            </div>

            {/* Feature 2: Task Management */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl">
                  <Image
                    src="/taskstree.png"
                    alt="Task Management"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <ListTodo className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold">Advanced Task Tracking</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Keep your projects on track with our powerful task manager.
                  Create sub-tasks, set due dates, and assign team members with
                  ease.
                </p>
                {/* Mini visual of Todo */}
                <div className="mt-8 rounded-xl border border-white/10 overflow-hidden">
                  <Image
                    src="/taskmanagemet.png"
                    alt="Todo List"
                    width={400}
                    height={200}
                    className="w-full h-auto"
                  />
                </div>
              </motion.div>
            </div>

            {/* Feature 3: Todo Management */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group relative order-2 lg:order-1"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl">
                  <Image
                    src="/todo.png"
                    alt="Todo Management"
                    width={800}
                    height={600}
                    className="w-full h-auto transform transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6 order-1 lg:order-2"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-3xl font-bold">Smart To-Do Lists</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Organize your personal daily goals with an intuitive to-do
                  system. Prioritize tasks, set reminders, and never miss a
                  deadline again.
                </p>
                <ul className="space-y-3 pt-4">
                  {[
                    "Priority tags (High, Medium, Low)",
                    "Drag and drop organization",
                    "Daily progress visualization",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-gray-300"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Feature 4: Team Management */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-3xl font-bold">Complete HR Solution</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Manage your workforce efficiently. From attendance tracking to
                  performance reviews, everything you need to build a happy
                  team.
                </p>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mt-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                      98%
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        Team Satisfaction
                      </div>
                      <div className="text-xs text-gray-500">
                        Based on internal surveys
                      </div>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "98%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl">
                  <Image
                    src="/miniHRMS.png"
                    alt="HR Management"
                    width={800}
                    height={600}
                    className="w-full h-auto transform transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-black/50 backdrop-blur-xl py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                <Glasses className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">Woodls</span>
            </div>

            <div className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Woodls Inc. All rights reserved.
            </div>

            <div className="flex space-x-8 text-sm text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Twitter
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
