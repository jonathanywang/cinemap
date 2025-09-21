import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SplitText from '../components/SplitText';
import ScrollReveal from '../components/ScrollReveal';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const handleStartWriting = () => {
        navigate('/app');
    };

    const handleTitleAnimationComplete = () => {
        console.log('Title animation completed!');
    };

    const handleSubtitleAnimationComplete = () => {
        console.log('Subtitle animation completed!');
    };

    return (
        <div className="min-h-screen bg-white">
            <Header variant="landing" />

            {/* First Screen - Power your creative mind */}
            <section className="relative h-screen w-full flex items-center justify-center pt-16 overflow-hidden">
                {/* Background image */}
                <div
                    className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat"
                    style={{ backgroundImage: "url('/hero-section-background.jpg')" }}
                    aria-hidden="true"
                />
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/50 pointer-events-none" />

                {/* Content layer */}
                <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left side - Text content with animations */}
                        <div className="text-left">
                            <SplitText
                                text="Your Next Great Story Starts Here"
                                tag="h1"
                                className="text-5xl font-bold text-white mb-6 tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
                                delay={50}
                                duration={0.8}
                                ease="power3.out"
                                splitType="words"
                                from={{ opacity: 0, y: 60, rotationX: -90 }}
                                to={{ opacity: 1, y: 0, rotationX: 0 }}
                                threshold={0.1}
                                rootMargin="-50px"
                                textAlign="left"
                                onLetterAnimationComplete={handleTitleAnimationComplete}
                            />

                            <SplitText
                                text="From stories to branching plots to cinematic arcs, Stubby refines and accelerates your creative process."
                                tag="p"
                                className="text-xl text-gray-200 mb-10 leading-relaxed max-w-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                                delay={30}
                                duration={0.6}
                                ease="power2.out"
                                splitType="words"
                                from={{ opacity: 0, y: 30 }}
                                to={{ opacity: 1, y: 0 }}
                                threshold={0.2}
                                rootMargin="-100px"
                                textAlign="left"
                                onLetterAnimationComplete={handleSubtitleAnimationComplete}
                            />

                            <button
                                onClick={handleStartWriting}
                                className="bg-blue-600/90 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-200 text-lg backdrop-blur-sm shadow-lg hover:shadow-xl"
                            >
                                Create Now
                            </button>
                        </div>

                        {/* Right side - Horizontal Flowchart preview */}
                        <div className="relative">
                            <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                                {/* Horizontal flowchart mockup - BETTER FITTING */}
                                <div className="flex items-center justify-between space-x-3 mb-8">
                                    {/* Act 1 */}
                                    <div className="flex flex-col items-center space-y-2 flex-1 group">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-1 group-hover:bg-blue-200 transition-colors duration-200">
                                            Act I
                                        </span>
                                        <div className="bg-blue-500 text-white px-3 py-3 rounded-lg text-sm font-medium shadow-md text-center w-full max-w-[110px] hover:bg-blue-600 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                                            Opening Scene
                                        </div>
                                    </div>

                                    {/* Connection arrow 1 */}
                                    <div className="flex items-center justify-center flex-shrink-0 group">
                                        <div className="h-px w-8 bg-gray-400 group-hover:bg-gray-600 transition-colors duration-200"></div>
                                        <div className="w-0 h-0 border-l-4 border-l-gray-400 border-t-2 border-t-transparent border-b-2 border-b-transparent group-hover:border-l-gray-600 transition-colors duration-200"></div>
                                    </div>

                                    {/* Act 2 - Branching */}
                                    <div className="flex flex-col items-center space-y-2 flex-1 group">
                                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium mb-1 group-hover:bg-yellow-200 transition-colors duration-200">
                                            Act II
                                        </span>
                                        <div className="flex flex-col space-y-2 w-full">
                                            <div className="bg-yellow-500 text-white px-2 py-2 rounded-lg text-xs font-medium shadow-md text-center max-w-[100px] mx-auto hover:bg-yellow-600 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                                                First Challenge
                                            </div>
                                            <div className="bg-yellow-500 text-white px-2 py-2 rounded-lg text-xs font-medium shadow-md text-center max-w-[100px] mx-auto hover:bg-yellow-600 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                                                Plot Twist
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connection arrow 2 */}
                                    <div className="flex items-center justify-center flex-shrink-0 group">
                                        <div className="h-px w-8 bg-gray-400 group-hover:bg-gray-600 transition-colors duration-200"></div>
                                        <div className="w-0 h-0 border-l-4 border-l-gray-400 border-t-2 border-t-transparent border-b-2 border-b-transparent group-hover:border-l-gray-600 transition-colors duration-200"></div>
                                    </div>

                                    {/* Act 3 */}
                                    <div className="flex flex-col items-center space-y-2 flex-1 group">
                                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium mb-1 group-hover:bg-red-200 transition-colors duration-200">
                                            Act III
                                        </span>
                                        <div className="bg-red-500 text-white px-3 py-3 rounded-lg text-sm font-medium shadow-md text-center w-full max-w-[110px] hover:bg-red-600 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                                            Climax & Resolution
                                        </div>
                                    </div>
                                </div>

                                {/* Characters section - SMALLER */}
                                <div className="pt-4 border-t border-gray-300">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-semibold text-gray-700">Character Profiles</h3>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        {/* Character 1 - David Wang */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg transition-all duration-200">
                                            <div className="flex flex-col items-center space-y-2">
                                                {/* Character name and role */}
                                                <div className="text-center mb-1">
                                                    <h4 className="font-semibold text-gray-900 text-xs">David Wang</h4>
                                                    <p className="text-[10px] text-blue-600 font-medium">Protagonist</p>
                                                </div>

                                                {/* Smaller radar chart */}
                                                <div className="relative w-16 h-16">
                                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                                        {/* Background circles */}
                                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f8fafc" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="30" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="10" fill="none" stroke="#cbd5e1" strokeWidth="1" />

                                                        {/* Pentagon outline */}
                                                        <path d="M50,10 L78.5,27.5 M78.5,27.5 L71.5,65 M71.5,65 L28.5,65 M28.5,65 L21.5,27.5 M21.5,27.5 L50,10"
                                                            stroke="#cbd5e1" strokeWidth="0.5" fill="none" />

                                                        {/* Axis lines */}
                                                        <line x1="50" y1="50" x2="50" y2="10" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="78.5" y2="27.5" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="71.5" y2="65" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="28.5" y2="65" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="21.5" y2="27.5" stroke="#e2e8f0" strokeWidth="0.5" />

                                                        {/* Data shape */}
                                                        <polygon points="50,18 70,32 65,58 35,58 30,32"
                                                            fill="rgba(59, 130, 246, 0.15)"
                                                            stroke="#3b82f6"
                                                            strokeWidth="2" />

                                                        {/* Data points */}
                                                        <circle cx="50" cy="18" r="1.5" fill="#3b82f6" />
                                                        <circle cx="70" cy="32" r="1.5" fill="#3b82f6" />
                                                        <circle cx="65" cy="58" r="1.5" fill="#3b82f6" />
                                                        <circle cx="35" cy="58" r="1.5" fill="#3b82f6" />
                                                        <circle cx="30" cy="32" r="1.5" fill="#3b82f6" />

                                                        {/* Center dot */}
                                                        <circle cx="50" cy="50" r="1" fill="#6b7280" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Character 2 - Jonathan Chen */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg transition-all duration-200">
                                            <div className="flex flex-col items-center space-y-2">
                                                <div className="text-center mb-1">
                                                    <h4 className="font-semibold text-gray-900 text-xs">Jonathan Chen</h4>
                                                    <p className="text-[10px] text-emerald-600 font-medium">Antagonist</p>
                                                </div>

                                                <div className="relative w-16 h-16">
                                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f8fafc" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="30" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="10" fill="none" stroke="#cbd5e1" strokeWidth="1" />

                                                        <path d="M50,10 L78.5,27.5 M78.5,27.5 L71.5,65 M71.5,65 L28.5,65 M28.5,65 L21.5,27.5 M21.5,27.5 L50,10"
                                                            stroke="#cbd5e1" strokeWidth="0.5" fill="none" />

                                                        <line x1="50" y1="50" x2="50" y2="10" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="78.5" y2="27.5" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="71.5" y2="65" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="28.5" y2="65" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="21.5" y2="27.5" stroke="#e2e8f0" strokeWidth="0.5" />

                                                        <polygon points="50,25 75,35 55,62 40,60 25,35"
                                                            fill="rgba(16, 185, 129, 0.15)"
                                                            stroke="#10b981"
                                                            strokeWidth="2" />

                                                        <circle cx="50" cy="25" r="1.5" fill="#10b981" />
                                                        <circle cx="75" cy="35" r="1.5" fill="#10b981" />
                                                        <circle cx="55" cy="62" r="1.5" fill="#10b981" />
                                                        <circle cx="40" cy="60" r="1.5" fill="#10b981" />
                                                        <circle cx="25" cy="35" r="1.5" fill="#10b981" />

                                                        <circle cx="50" cy="50" r="1" fill="#6b7280" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Character 3 - Brandon Behner */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg transition-all duration-200">
                                            <div className="flex flex-col items-center space-y-2">
                                                <div className="text-center mb-1">
                                                    <h4 className="font-semibold text-gray-900 text-xs">Brandon Behner</h4>
                                                    <p className="text-[10px] text-orange-600 font-medium">Supporting</p>
                                                </div>

                                                <div className="relative w-16 h-16">
                                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f8fafc" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="30" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="10" fill="none" stroke="#cbd5e1" strokeWidth="1" />

                                                        <path d="M50,10 L78.5,27.5 M78.5,27.5 L71.5,65 M71.5,65 L28.5,65 M28.5,65 L21.5,27.5 M21.5,27.5 L50,10"
                                                            stroke="#cbd5e1" strokeWidth="0.5" fill="none" />

                                                        <line x1="50" y1="50" x2="50" y2="10" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="78.5" y2="27.5" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="71.5" y2="65" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="28.5" y2="65" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="21.5" y2="27.5" stroke="#e2e8f0" strokeWidth="0.5" />

                                                        <polygon points="50,15 72,30 68,58 32,60 28,30"
                                                            fill="rgba(249, 115, 22, 0.15)"
                                                            stroke="#f97316"
                                                            strokeWidth="2" />

                                                        <circle cx="50" cy="15" r="1.5" fill="#f97316" />
                                                        <circle cx="72" cy="30" r="1.5" fill="#f97316" />
                                                        <circle cx="68" cy="58" r="1.5" fill="#f97316" />
                                                        <circle cx="32" cy="60" r="1.5" fill="#f97316" />
                                                        <circle cx="28" cy="30" r="1.5" fill="#f97316" />

                                                        <circle cx="50" cy="50" r="1" fill="#6b7280" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Character 4 - Julius Lau */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg transition-all duration-200">
                                            <div className="flex flex-col items-center space-y-2">
                                                <div className="text-center mb-1">
                                                    <h4 className="font-semibold text-gray-900 text-xs">Julius Lau</h4>
                                                    <p className="text-[10px] text-purple-600 font-medium">Supporting</p>
                                                </div>

                                                <div className="relative w-16 h-16">
                                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f8fafc" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="30" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                                        <circle cx="50" cy="50" r="10" fill="none" stroke="#cbd5e1" strokeWidth="1" />

                                                        <path d="M50,10 L78.5,27.5 M78.5,27.5 L71.5,65 M71.5,65 L28.5,65 M28.5,65 L21.5,27.5 M21.5,27.5 L50,10"
                                                            stroke="#cbd5e1" strokeWidth="0.5" fill="none" />

                                                        <line x1="50" y1="50" x2="50" y2="10" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="78.5" y2="27.5" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="71.5" y2="65" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="28.5" y2="65" stroke="#e2e8f0" strokeWidth="0.5" />
                                                        <line x1="50" y1="50" x2="21.5" y2="27.5" stroke="#e2e8f0" strokeWidth="0.5" />

                                                        <polygon points="50,20 68,28 62,55 38,58 32,28"
                                                            fill="rgba(168, 85, 247, 0.15)"
                                                            stroke="#a855f7"
                                                            strokeWidth="2" />

                                                        <circle cx="50" cy="20" r="1.5" fill="#a855f7" />
                                                        <circle cx="68" cy="28" r="1.5" fill="#a855f7" />
                                                        <circle cx="62" cy="55" r="1.5" fill="#a855f7" />
                                                        <circle cx="38" cy="58" r="1.5" fill="#a855f7" />
                                                        <circle cx="32" cy="28" r="1.5" fill="#a855f7" />

                                                        <circle cx="50" cy="50" r="1" fill="#6b7280" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Second Screen - What is StoryFlow? */}
            <section id="how-it-works" className="h-screen flex items-center justify-center bg-white border border-gray-100">
                <div className="max-w-5xl mx-auto px-8 text-center">
                    <ScrollReveal
                        textClassName="text-5xl md:text-6xl font-bold leading-tight text-gray-900 tracking-tight"
                        containerClassName="mb-12"
                        baseOpacity={0.15}
                        baseRotation={4}
                        blurStrength={6}
                        rotationEnd="+=300"
                        wordAnimationEnd="+=300"
                    >
                        What is StoryFlow?
                    </ScrollReveal>
                    <div className="space-y-12 text-2xl md:text-2xl text-gray-600">
                        <ScrollReveal
                            textClassName="sr-inherit text-2xl md:text-2xl text-gray-600 leading-loose"
                            containerClassName="leading-loose"
                            baseOpacity={0.1}
                            baseRotation={2}
                            blurStrength={4}
                            rotationEnd="+=250"
                            wordAnimationEnd="+=250"
                        >
                            StoryFlow is an AI-powered writing assistant that helps you craft compelling narratives through interactive flowcharts and intelligent suggestions.
                        </ScrollReveal>
                        <ScrollReveal
                            textClassName="sr-inherit text-2xl md:text-2xl text-gray-600 leading-loose"
                            containerClassName="leading-loose"
                            baseOpacity={0.1}
                            baseRotation={2}
                            blurStrength={4}
                            rotationEnd="+=250"
                            wordAnimationEnd="+=250"
                        >
                            Our platform combines the structure of traditional storytelling with modern AI technology to enhance your creative process.
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* Third Screen - Our Mission */}
            <section id="our-mission" className="h-screen flex items-center justify-center bg-white border border-gray-100">
                <div className="max-w-4xl mx-auto px-6">
                    <ScrollReveal
                        textClassName="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight text-center"
                        containerClassName="mb-10"
                        baseOpacity={0.15}
                        baseRotation={4}
                        blurStrength={6}
                        rotationEnd="+=250"
                        wordAnimationEnd="+=250"
                    >
                        Our Mission
                    </ScrollReveal>
                    <div className="space-y-10 text-xl text-gray-600 mb-16">
                        <ScrollReveal
                            textClassName="sr-inherit text-xl text-gray-600 leading-relaxed text-center"
                            containerClassName="leading-relaxed"
                            baseOpacity={0.1}
                            baseRotation={2}
                            blurStrength={4}
                            rotationEnd="+=220"
                            wordAnimationEnd="+=220"
                        >
                            We believe that everyone has a story to tell. Our mission is to make the writing process more intuitive and accessible through visual storytelling and AI assistance.
                        </ScrollReveal>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center space-y-3">
                            <ScrollReveal
                                textClassName="sr-inherit text-2xl font-semibold text-gray-900"
                                containerClassName=""
                                baseOpacity={0.1}
                                baseRotation={3}
                                blurStrength={5}
                                rotationEnd="+=180"
                                wordAnimationEnd="+=180"
                            >
                                Visualize
                            </ScrollReveal>
                            <ScrollReveal
                                textClassName="sr-inherit text-gray-600"
                                containerClassName=""
                                baseOpacity={0.1}
                                baseRotation={2}
                                blurStrength={4}
                                rotationEnd="+=160"
                                wordAnimationEnd="+=160"
                            >
                                See your story structure come to life with interactive flowcharts
                            </ScrollReveal>
                        </div>
                        <div className="text-center space-y-3">
                            <ScrollReveal
                                textClassName="sr-inherit text-2xl font-semibold text-gray-900"
                                containerClassName=""
                                baseOpacity={0.1}
                                baseRotation={3}
                                blurStrength={5}
                                rotationEnd="+=180"
                                wordAnimationEnd="+=180"
                            >
                                Create
                            </ScrollReveal>
                            <ScrollReveal
                                textClassName="sr-inherit text-gray-600"
                                containerClassName=""
                                baseOpacity={0.1}
                                baseRotation={2}
                                blurStrength={4}
                                rotationEnd="+=160"
                                wordAnimationEnd="+=160"
                            >
                                Craft compelling narratives with AI-powered assistance
                            </ScrollReveal>
                        </div>
                        <div className="text-center space-y-3">
                            <ScrollReveal
                                textClassName="sr-inherit text-2xl font-semibold text-gray-900"
                                containerClassName=""
                                baseOpacity={0.1}
                                baseRotation={3}
                                blurStrength={5}
                                rotationEnd="+=180"
                                wordAnimationEnd="+=180"
                            >
                                Share
                            </ScrollReveal>
                            <ScrollReveal
                                textClassName="sr-inherit text-gray-600"
                                containerClassName=""
                                baseOpacity={0.1}
                                baseRotation={2}
                                blurStrength={4}
                                rotationEnd="+=160"
                                wordAnimationEnd="+=160"
                            >
                                Export and share your stories in multiple formats
                            </ScrollReveal>
                        </div>
                    </div>
                </div>
            </section>

            {/* Fourth Screen - Join StoryFlow */}
            <section id="join-storyflow" className="h-screen flex items-center justify-center bg-white border border-gray-100">
                <div className="text-center max-w-3xl mx-auto px-6">
                    <ScrollReveal
                        textClassName="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight"
                        containerClassName="mb-8"
                        baseOpacity={0.15}
                        baseRotation={4}
                        blurStrength={6}
                        rotationEnd="+=240"
                        wordAnimationEnd="+=240"
                    >
                        Join StoryFlow
                    </ScrollReveal>
                    <ScrollReveal
                        textClassName="sr-inherit text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto"
                        containerClassName="mb-10 leading-relaxed"
                        baseOpacity={0.1}
                        baseRotation={2}
                        blurStrength={4}
                        rotationEnd="+=200"
                        wordAnimationEnd="+=200"
                    >
                        Start crafting your story today with our intuitive tools and AI assistance.
                    </ScrollReveal>
                    <button
                        onClick={handleStartWriting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 rounded-full text-lg transition-colors duration-200"
                    >
                        Start Writing
                    </button>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;