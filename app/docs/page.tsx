'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Zap, MessageSquare, Layout,
    Settings, HelpCircle, ChevronRight,
    FileText, Play, Star, AlertCircle,
    CheckCircle, Clock, Shield
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('introduction');

    const sections = [
        { id: 'introduction', title: 'Introduction', icon: BookOpen },
        { id: 'getting-started', title: 'Getting Started', icon: Play },
        { id: 'mock-tests', title: 'Mock Tests', icon: Zap },
        { id: 'ai-tools', title: 'AI Tools', icon: MessageSquare },
        { id: 'notes', title: 'Notes', icon: FileText },
        { id: 'pdf-viewer', title: 'PDF Viewer', icon: Layout },
        { id: 'dashboard', title: 'Dashboard', icon: Layout },
        { id: 'settings', title: 'Settings', icon: Settings },
        { id: 'support', title: 'Support', icon: HelpCircle },
    ];

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-primary/30 relative pt-32 pb-20 px-4 md:px-8">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[600px]">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className="sticky top-32 space-y-1">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-4">
                            Documentation
                        </h3>
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${activeSection === section.id
                                        ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,240,255,0.2)] border border-primary/20'
                                        : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                            >
                                <section.icon size={16} />
                                {section.title}
                                {activeSection === section.id && (
                                    <motion.div layoutId="active-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="min-h-[400px]"
                        >
                            {activeSection === 'introduction' && (
                                <ContentSection title="Introduction" icon={BookOpen}>
                                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                        Nebula Mind is an advanced AI-powered notebook application designed to revolutionize how you learn and organize information. By combining traditional note-taking with cutting-edge AI, we provide a seamless environment for studying, researching, and mastering new topics.
                                    </p>

                                    <h3 className="text-xl font-bold mb-4 text-white">Core Philosophy</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <GlassCard className="p-5">
                                            <Zap className="text-yellow-400 mb-3" size={24} />
                                            <h4 className="font-bold mb-2">Speed</h4>
                                            <p className="text-sm text-muted-foreground">Instant analysis of documents and rapid generation of study materials.</p>
                                        </GlassCard>
                                        <GlassCard className="p-5">
                                            <BookOpen className="text-blue-400 mb-3" size={24} />
                                            <h4 className="font-bold mb-2">Intelligence</h4>
                                            <p className="text-sm text-muted-foreground">Powered by advanced LLMs to understand context and nuance.</p>
                                        </GlassCard>
                                        <GlassCard className="p-5">
                                            <Layout className="text-purple-400 mb-3" size={24} />
                                            <h4 className="font-bold mb-2">Design</h4>
                                            <p className="text-sm text-muted-foreground">A futuristic, distraction-free interface built for focus.</p>
                                        </GlassCard>
                                    </div>

                                    <h3 className="text-xl font-bold mb-4 text-white">Key Features</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FeatureCard title="Mock Tests" desc="Generate quizzes from your notes instantly with AI scoring." />
                                        <FeatureCard title="AI Chat" desc="Ask questions and get answers cited directly from your content." />
                                        <FeatureCard title="Smart Notes" desc="Auto-summarize, expand, and fix grammar in your writing." />
                                        <FeatureCard title="PDF Viewer" desc="Read, annotate, and analyze documents side-by-side." />
                                    </div>
                                </ContentSection>
                            )}

                            {activeSection === 'getting-started' && (
                                <ContentSection title="Getting Started" icon={Play}>
                                    <div className="space-y-8">
                                        <Step number={1} title="Create an Account">
                                            <p className="mb-4">
                                                Sign up using your email or Google account. Your account serves as a secure vault for all your notebooks, ensuring they are synced across devices.
                                            </p>
                                            <div className="flex gap-2 text-sm text-muted-foreground bg-white/5 p-3 rounded-lg border border-white/10">
                                                <Shield size={16} className="text-green-400 shrink-0" />
                                                Your data is encrypted and stored securely. We prioritize your privacy.
                                            </div>
                                        </Step>

                                        <Step number={2} title="Explore the Dashboard">
                                            <p className="mb-4">
                                                The Dashboard is your command center. Here you can:
                                            </p>
                                            <ul className="space-y-2 ml-4">
                                                <ListItem>View your <strong>Learning Curve</strong> to track progress.</ListItem>
                                                <ListItem>Check your <strong>Study Consistency</strong> heatmap.</ListItem>
                                                <ListItem>Access <strong>Recommended Content</strong> tailored to you.</ListItem>
                                            </ul>
                                        </Step>

                                        <Step number={3} title="Create a Notebook">
                                            <p className="mb-4">
                                                Click the "New Notebook" button in the navbar. You have two options:
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <GlassCard className="p-4">
                                                    <h5 className="font-bold mb-2">Upload PDF</h5>
                                                    <p className="text-xs text-muted-foreground">Upload documents directly from your device. (Max 50MB)</p>
                                                </GlassCard>
                                                <GlassCard className="p-4">
                                                    <h5 className="font-bold mb-2">Paste URL</h5>
                                                    <p className="text-xs text-muted-foreground">Link to online PDFs or web pages for instant analysis.</p>
                                                </GlassCard>
                                            </div>
                                        </Step>
                                    </div>
                                </ContentSection>
                            )}

                            {activeSection === 'mock-tests' && (
                                <ContentSection title="Mock Tests" icon={Zap}>
                                    <p className="mb-8 text-muted-foreground text-lg">
                                        Test your knowledge with AI-generated quizzes tailored to your content. Our system analyzes your documents to create relevant, challenging questions.
                                    </p>

                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-xl font-bold mb-4 text-white">Question Types</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <GlassCard className="p-4">
                                                    <div className="flex items-center gap-2 mb-2 font-bold text-green-400">
                                                        <CheckCircle size={16} /> True/False
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Rapid-fire questions to test basic comprehension and fact recall.</p>
                                                </GlassCard>
                                                <GlassCard className="p-4">
                                                    <div className="flex items-center gap-2 mb-2 font-bold text-blue-400">
                                                        <Layout size={16} /> Multiple Choice
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Standard 4-option questions to test ability to distinguish concepts.</p>
                                                </GlassCard>
                                                <GlassCard className="p-4">
                                                    <div className="flex items-center gap-2 mb-2 font-bold text-purple-400">
                                                        <FileText size={16} /> Short Answer
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Type out responses. AI grades them on semantic accuracy.</p>
                                                </GlassCard>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <GlassCard className="p-6">
                                                <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                                    <Clock size={18} className="text-primary" /> Timers & Pacing
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    You can set custom time limits per question (e.g., 30s, 1m). The timer auto-submits the current question when it runs out, simulating real exam pressure.
                                                </p>
                                                <div className="text-xs bg-white/5 p-2 rounded border border-white/10">
                                                    <strong>Note:</strong> You can pause the test at any time if you need a break.
                                                </div>
                                            </GlassCard>

                                            <GlassCard className="p-6">
                                                <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                                                    <Star size={18} className="text-yellow-400" /> AI Scoring Logic
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    For Short Answer questions, our AI compares your response with the source text.
                                                </p>
                                                <ul className="space-y-2 text-xs text-muted-foreground">
                                                    <li className="flex justify-between"><span>Exact Match</span> <span className="text-green-400">10/10</span></li>
                                                    <li className="flex justify-between"><span>Conceptually Correct</span> <span className="text-green-400">8-9/10</span></li>
                                                    <li className="flex justify-between"><span>Partially Correct</span> <span className="text-yellow-400">4-7/10</span></li>
                                                    <li className="flex justify-between"><span>Incorrect/Irrelevant</span> <span className="text-red-400">0-3/10</span></li>
                                                </ul>
                                            </GlassCard>
                                        </div>
                                    </div>
                                </ContentSection>
                            )}

                            {activeSection === 'ai-tools' && (
                                <ContentSection title="AI Tools" icon={MessageSquare}>
                                    <p className="mb-8 text-muted-foreground text-lg">
                                        Interact with your documents using our advanced AI chat interface. It's like having a tutor who has memorized your textbooks.
                                    </p>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                        <GlassCard className="p-6">
                                            <h4 className="text-lg font-bold mb-4 text-white">Chat Capabilities</h4>
                                            <ul className="space-y-3">
                                                <ListItem><strong>Summarization:</strong> Ask for a brief summary of specific chapters.</ListItem>
                                                <ListItem><strong>Explanation:</strong> "Explain quantum entanglement like I'm 5."</ListItem>
                                                <ListItem><strong>Extraction:</strong> "List all dates and events mentioned in the text."</ListItem>
                                                <ListItem><strong>Translation:</strong> Translate complex paragraphs into other languages.</ListItem>
                                            </ul>
                                        </GlassCard>

                                        <GlassCard className="p-6">
                                            <h4 className="text-lg font-bold mb-4 text-white">Model Selection</h4>
                                            <div className="space-y-4">
                                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                                    <div className="font-bold text-primary mb-1">Gemini Pro</div>
                                                    <p className="text-xs text-muted-foreground">Best for general reasoning and fast responses. Balanced performance.</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                                    <div className="font-bold text-purple-400 mb-1">GPT-4 (Enterprise)</div>
                                                    <p className="text-xs text-muted-foreground">Superior for complex logic and creative writing tasks. Slower but more precise.</p>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </div>

                                    <GlassCard className="p-4 bg-primary/5 border-primary/20">
                                        <div className="flex items-center gap-2 text-primary font-bold mb-2">
                                            <Zap size={16} /> Pro Tip: Contextual Q&A
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            The AI is strictly grounded in your uploaded documents. If you ask a question outside the scope of your notes, it will inform you that the information isn't present in the source material.
                                        </p>
                                    </GlassCard>
                                </ContentSection>
                            )}

                            {activeSection === 'notes' && (
                                <ContentSection title="Notes" icon={FileText}>
                                    <p className="mb-8 text-muted-foreground text-lg">
                                        A powerful rich-text editor for your personal thoughts and summaries. It's integrated directly with the AI.
                                    </p>

                                    <div className="space-y-6">
                                        <GlassCard className="p-8">
                                            <h3 className="text-xl font-bold mb-4">Editor Features</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                <ul className="space-y-2">
                                                    <ListItem>Rich Text (Bold, Italic, Underline)</ListItem>
                                                    <ListItem>Bullet & Numbered Lists</ListItem>
                                                    <ListItem>Code Blocks with Syntax Highlighting</ListItem>
                                                </ul>
                                                <ul className="space-y-2">
                                                    <ListItem>Headers (H1, H2, H3)</ListItem>
                                                    <ListItem>Blockquotes</ListItem>
                                                    <ListItem>Auto-save functionality</ListItem>
                                                </ul>
                                            </div>
                                        </GlassCard>

                                        <GlassCard className="p-8 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <Sparkles size={100} />
                                            </div>
                                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                <Sparkles size={20} className="text-primary" /> AI Enhance
                                            </h3>
                                            <p className="text-muted-foreground mb-4">
                                                Select any text in your note and click the "AI Enhance" button to access these tools:
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                                                    <div className="font-bold text-white mb-1">Fix Grammar</div>
                                                    <p className="text-xs text-muted-foreground">Corrects typos and sentence structure.</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                                                    <div className="font-bold text-white mb-1">Make Longer</div>
                                                    <p className="text-xs text-muted-foreground">Expands on your points with more detail.</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                                                    <div className="font-bold text-white mb-1">Summarize</div>
                                                    <p className="text-xs text-muted-foreground">Condenses long paragraphs into bullets.</p>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </div>
                                </ContentSection>
                            )}

                            {activeSection === 'pdf-viewer' && (
                                <ContentSection title="PDF Viewer" icon={Layout}>
                                    <p className="mb-8 text-muted-foreground text-lg">
                                        Our custom-built PDF reader ensures you never have to switch tabs while studying.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold mb-4">Navigation Controls</h3>
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">H</div>
                                                <div>
                                                    <h5 className="font-bold">Toggle Visibility</h5>
                                                    <p className="text-xs text-muted-foreground">Press <kbd className="bg-white/10 px-1 rounded">Ctrl+H</kbd> to hide/show the PDF panel.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">Z</div>
                                                <div>
                                                    <h5 className="font-bold">Zoom Controls</h5>
                                                    <p className="text-xs text-muted-foreground">Use +/- buttons or scroll wheel to adjust zoom level.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <GlassCard className="p-6 flex flex-col justify-center">
                                            <h3 className="text-xl font-bold mb-4">Split-Screen Workflow</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                The viewer is designed to sit alongside your Chat and Notes. This allows you to:
                                            </p>
                                            <ul className="space-y-2">
                                                <ListItem>Reference diagrams while asking AI questions.</ListItem>
                                                <ListItem>Copy text from PDF directly into your notes.</ListItem>
                                                <ListItem>Verify AI answers by checking the source page.</ListItem>
                                            </ul>
                                        </GlassCard>
                                    </div>
                                </ContentSection>
                            )}

                            {activeSection === 'dashboard' && (
                                <ContentSection title="Dashboard" icon={Layout}>
                                    <p className="mb-8 text-muted-foreground text-lg">
                                        Your personal analytics hub. Track your progress and manage your learning journey efficiently.
                                    </p>

                                    <div className="space-y-6">
                                        <GlassCard className="p-6">
                                            <h3 className="text-lg font-bold mb-4 text-white">Visual Analytics</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <h5 className="font-bold text-primary mb-2">Knowledge Growth</h5>
                                                    <p className="text-sm text-muted-foreground">
                                                        A line chart that tracks your XP gained from quizzes and reading over time. Watch your curve go up!
                                                    </p>
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-secondary mb-2">Subject Mastery</h5>
                                                    <p className="text-sm text-muted-foreground">
                                                        A radar chart showing your strengths across different subjects (e.g., Physics, History, Math).
                                                    </p>
                                                </div>
                                            </div>
                                        </GlassCard>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <GlassCard className="p-6 text-center">
                                                <Zap size={32} className="mx-auto mb-4 text-yellow-400" />
                                                <h4 className="font-bold mb-2">Study Streak</h4>
                                                <p className="text-xs text-muted-foreground">Consecutive days you've logged in and studied.</p>
                                            </GlassCard>
                                            <GlassCard className="p-6 text-center">
                                                <Layout size={32} className="mx-auto mb-4 text-blue-400" />
                                                <h4 className="font-bold mb-2">History</h4>
                                                <p className="text-xs text-muted-foreground">Access a log of all your past mock tests and scores.</p>
                                            </GlassCard>
                                            <GlassCard className="p-6 text-center">
                                                <BookOpen size={32} className="mx-auto mb-4 text-purple-400" />
                                                <h4 className="font-bold mb-2">Resume</h4>
                                                <p className="text-xs text-muted-foreground">One-click access to your most recently opened notebook.</p>
                                            </GlassCard>
                                        </div>
                                    </div>
                                </ContentSection>
                            )}

                            {activeSection === 'settings' && (
                                <ContentSection title="Settings" icon={Settings}>
                                    <p className="mb-8 text-muted-foreground text-lg">
                                        Customize Nebula Mind to fit your workflow. Access these options from the user dropdown.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <GlassCard className="p-6">
                                            <h4 className="font-bold mb-4 text-lg flex items-center gap-2">
                                                <Layout size={18} /> Appearance
                                            </h4>
                                            <ul className="space-y-3">
                                                <li className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Theme</span>
                                                    <span className="px-2 py-1 rounded bg-white/10 text-white text-xs">Dark / Light</span>
                                                </li>
                                                <li className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Accent Color</span>
                                                    <div className="flex gap-1">
                                                        <div className="w-3 h-3 rounded-full bg-primary" />
                                                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                                                    </div>
                                                </li>
                                                <li className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Reduced Motion</span>
                                                    <span className="text-xs">Off</span>
                                                </li>
                                            </ul>
                                        </GlassCard>
                                        <GlassCard className="p-6">
                                            <h4 className="font-bold mb-4 text-lg flex items-center gap-2">
                                                <Shield size={18} /> Account & Data
                                            </h4>
                                            <ul className="space-y-3">
                                                <li className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Subscription</span>
                                                    <span className="text-primary text-xs font-bold">PRO</span>
                                                </li>
                                                <li className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Data Export</span>
                                                    <span className="text-xs underline cursor-pointer">Download</span>
                                                </li>
                                                <li className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Delete Account</span>
                                                    <span className="text-xs text-red-400 cursor-pointer">Danger</span>
                                                </li>
                                            </ul>
                                        </GlassCard>
                                    </div>
                                </ContentSection>
                            )}

                            {activeSection === 'support' && (
                                <ContentSection title="Support" icon={HelpCircle}>
                                    <p className="mb-8 text-muted-foreground text-lg">
                                        Need help? We're here for you. Check our FAQs or reach out directly.
                                    </p>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-xl mb-4">Frequently Asked Questions</h3>
                                            <GlassCard className="p-4">
                                                <h5 className="font-bold text-sm mb-2 text-white">Is my data private?</h5>
                                                <p className="text-xs text-muted-foreground">Yes, all uploaded documents are encrypted and only accessible by you.</p>
                                            </GlassCard>
                                            <GlassCard className="p-4">
                                                <h5 className="font-bold text-sm mb-2 text-white">Can I use it offline?</h5>
                                                <p className="text-xs text-muted-foreground">Currently, an internet connection is required for AI features.</p>
                                            </GlassCard>
                                            <GlassCard className="p-4">
                                                <h5 className="font-bold text-sm mb-2 text-white">What file types are supported?</h5>
                                                <p className="text-xs text-muted-foreground">We support PDF files up to 50MB. Word and Text support coming soon.</p>
                                            </GlassCard>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-bold text-xl mb-4">Contact Us</h3>
                                            <div className="flex items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                                                <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                                                    <MessageSquare size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg">Email Support</h4>
                                                    <p className="text-sm text-muted-foreground">support@nebulamind.com</p>
                                                </div>
                                                <ChevronRight className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </div>
                                            <div className="flex items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                                                <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                                                    <AlertCircle size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg">Report a Bug</h4>
                                                    <p className="text-sm text-muted-foreground">Help us improve the app.</p>
                                                </div>
                                                <ChevronRight className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </ContentSection>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}

function ContentSection({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 text-primary shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                    <Icon size={32} />
                </div>
                <h2 className="text-4xl font-bold">{title}</h2>
            </div>
            <div>
                {children}
            </div>
        </div>
    );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
            <h4 className="font-bold mb-2 text-white group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    );
}

function Step({ number, title, children }: { number: number, title: string, children: React.ReactNode }) {
    return (
        <div className="flex gap-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center font-bold text-xl shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                {number}
            </div>
            <div>
                <h4 className="font-bold text-xl mb-2 text-white">{title}</h4>
                <div className="text-muted-foreground leading-relaxed">{children}</div>
            </div>
        </div>
    );
}

function ListItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-3 text-muted-foreground">
            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_5px_rgba(0,240,255,0.5)]" />
            <span className="leading-relaxed">{children}</span>
        </li>
    );
}

function Sparkles({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" />
        </svg>
    );
}
