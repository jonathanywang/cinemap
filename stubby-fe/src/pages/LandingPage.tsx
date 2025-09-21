import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SplitText from '../components/SplitText';
import ScrollReveal from '../components/ScrollReveal';
import BlurText from '../components/BlurText';

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
            <section className="relative h-screen w-full flex items-center justify-center pt-12 px-2 md:px-4 lg:px-6">
                <div className="relative w-full h-[94%] -translate-y-6 md:-translate-y-10 lg:-translate-y-12 rounded-[28px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55),0_8px_24px_-6px_rgba(0,0,0,0.4)]">
                    {/* Background image now inside container */}
                    <div
                        className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat"
                        style={{ backgroundImage: "url('/hero-section-background.jpg')" }}
                        aria-hidden="true"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/50 pointer-events-none" />

                    {/* Inner content positioning */}
                    <div className="max-w-7xl mx-auto px-6 w-full relative z-10 h-full flex items-center">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
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
                                    text="From stories to branching plots and cinematic arcs, Narratree redefines and accelerates your creative process."
                                    tag="p"
                                    className="text-2xl font-medium text-blue-100 mb-10 leading-relaxed max-w-xl drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)] tracking-wide"
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

                            {/* Right side - Sophisticated Flowchart preview */}
                            <div className="relative">
                                <div className="bg-gradient-to-br from-black/45 via-black/35 to-black/25 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-[0_32px_64px_-8px_rgba(0,0,0,0.4),0_16px_32px_-4px_rgba(0,0,0,0.2)] overflow-hidden hover:shadow-[0_40px_80px_-8px_rgba(0,0,0,0.5),0_20px_40px_-4px_rgba(0,0,0,0.3)] hover:bg-gradient-to-br hover:from-black/50 hover:via-black/40 hover:to-black/30 transition-all duration-500 group">
                                    {/* Ambient glow effect */}
                                    <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    {/* Premium flowchart structure */}
                                    <div className="flex items-center justify-between space-x-4 mb-10 relative z-10">
                                        {/* Act 1 - Refined */}
                                        <div className="flex flex-col items-center space-y-3 flex-1 group/act">
                                            <div className="bg-gradient-to-r from-blue-500/15 to-blue-600/15 text-blue-200 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-1 group-hover/act:from-blue-500/25 group-hover/act:to-blue-600/25 group-hover/act:text-blue-100 transition-all duration-300 border border-blue-400/15 shadow-lg backdrop-blur-sm">
                                                ACT I
                                            </div>
                                            <div className="relative group/node">
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur-sm opacity-0 group-hover/node:opacity-30 transition-opacity duration-300"></div>
                                                <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3.5 rounded-xl text-sm font-semibold shadow-[0_8px_16px_-4px_rgba(59,130,246,0.3)] text-center w-full max-w-[120px] hover:shadow-[0_12px_24px_-4px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-300 cursor-pointer border border-blue-400/20">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                                                    <span className="relative">Opening Scene</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Elegant connection arrow 1 */}
                                        <div className="flex items-center justify-center flex-shrink-0 group/arrow px-2 mt-12">
                                            <div className="relative">
                                                <div className="h-0.5 w-10 bg-gradient-to-r from-slate-400 to-slate-300 group-hover/arrow:from-white group-hover/arrow:to-slate-100 transition-all duration-300 rounded-full shadow-sm"></div>
                                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-slate-300 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent group-hover/arrow:border-l-white transition-colors duration-300"></div>
                                            </div>
                                        </div>

                                        {/* Act 2 - Enhanced branching */}
                                        <div className="flex flex-col items-center space-y-3 flex-1 group/act">
                                            <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-200 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-1 group-hover/act:from-amber-500/25 group-hover/act:to-orange-500/25 group-hover/act:text-amber-100 transition-all duration-300 border border-amber-400/15 shadow-lg backdrop-blur-sm">
                                                ACT II
                                            </div>
                                            <div className="flex flex-col space-y-2.5 w-full">
                                                <div className="relative group/node">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg blur-sm opacity-0 group-hover/node:opacity-30 transition-opacity duration-300"></div>
                                                    <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2.5 rounded-lg text-xs font-semibold shadow-[0_6px_12px_-2px_rgba(245,158,11,0.3)] text-center max-w-[110px] mx-auto hover:shadow-[0_8px_16px_-2px_rgba(245,158,11,0.4)] hover:scale-105 transition-all duration-300 cursor-pointer border border-amber-400/20">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-lg"></div>
                                                        <span className="relative">Rising Action</span>
                                                    </div>
                                                </div>
                                                <div className="relative group/node">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg blur-sm opacity-0 group-hover/node:opacity-30 transition-opacity duration-300"></div>
                                                    <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2.5 rounded-lg text-xs font-semibold shadow-[0_6px_12px_-2px_rgba(245,158,11,0.3)] text-center max-w-[110px] mx-auto hover:shadow-[0_8px_16px_-2px_rgba(245,158,11,0.4)] hover:scale-105 transition-all duration-300 cursor-pointer border border-amber-400/20">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-lg"></div>
                                                        <span className="relative">Plot Twist</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Elegant connection arrow 2 */}
                                        <div className="flex items-center justify-center flex-shrink-0 group/arrow px-2 mt-12">
                                            <div className="relative">
                                                <div className="h-0.5 w-10 bg-gradient-to-r from-slate-400 to-slate-300 group-hover/arrow:from-white group-hover/arrow:to-slate-100 transition-all duration-300 rounded-full shadow-sm"></div>
                                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-slate-300 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent group-hover/arrow:border-l-white transition-colors duration-300"></div>
                                            </div>
                                        </div>

                                        {/* Act 3 - Climactic finish */}
                                        <div className="flex flex-col items-center space-y-3 flex-1 group/act">
                                            <div className="bg-gradient-to-r from-rose-500/15 to-red-600/15 text-rose-200 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-1 group-hover/act:from-rose-500/25 group-hover/act:to-red-600/25 group-hover/act:text-rose-100 transition-all duration-300 border border-rose-400/15 shadow-lg backdrop-blur-sm">
                                                ACT III
                                            </div>
                                            <div className="relative group/node">
                                                <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl blur-sm opacity-0 group-hover/node:opacity-30 transition-opacity duration-300"></div>
                                                <div className="relative bg-gradient-to-r from-rose-500 to-red-600 text-white px-4 py-3.5 rounded-xl text-sm font-semibold shadow-[0_8px_16px_-4px_rgba(244,63,94,0.3)] text-center w-full max-w-[120px] hover:shadow-[0_12px_24px_-4px_rgba(244,63,94,0.4)] hover:scale-105 transition-all duration-300 cursor-pointer border border-rose-400/20">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl"></div>
                                                    <span className="relative">Climax & Resolution</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Premium Characters section */}
                                    <div className="pt-6 border-t border-white/15 relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold text-white/90 tracking-wide">CHARACTER PROFILES</h3>
                                            <div className="h-px w-12 bg-gradient-to-r from-white/20 to-transparent"></div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-4">
                                            {/* Character 1 - David Wang - Enhanced */}
                                            <div className="bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-4 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.3)] hover:bg-gradient-to-b hover:from-white/20 hover:to-white/8 hover:border-white/30 transition-all duration-300 group/char">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <div className="text-center">
                                                        <h4 className="font-bold text-blue-300 text-xs tracking-wide">David Wang</h4>
                                                        <p className="text-[10px] text-blue-200/80 font-medium uppercase tracking-wider">Protagonist</p>
                                                    </div>

                                                    {/* Enhanced radar chart with glow */}
                                                    <div className="relative w-18 h-18">
                                                        <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-md opacity-0 group-hover/char:opacity-100 transition-opacity duration-300"></div>
                                                        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                                                            {/* Elegant background circles */}
                                                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="0.8" />

                                                            {/* Refined pentagon structure */}
                                                            <path d="M50,10 L78.5,27.5 M78.5,27.5 L71.5,65 M71.5,65 L28.5,65 M28.5,65 L21.5,27.5 M21.5,27.5 L50,10"
                                                                stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.6" fill="none" />

                                                            {/* Subtle axis lines */}
                                                            <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="78.5" y2="27.5" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="71.5" y2="65" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="28.5" y2="65" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="21.5" y2="27.5" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />

                                                            {/* Enhanced data visualization */}
                                                            <polygon points="50,18 70,32 65,58 35,58 30,32"
                                                                fill="rgba(59, 130, 246, 0.2)"
                                                                stroke="#3b82f6"
                                                                strokeWidth="2.5" />

                                                            {/* Premium data points */}
                                                            <circle cx="50" cy="18" r="2" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="70" cy="32" r="2" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="65" cy="58" r="2" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="35" cy="58" r="2" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="30" cy="32" r="2" fill="#3b82f6" stroke="white" strokeWidth="0.5" />

                                                            {/* Center point */}
                                                            <circle cx="50" cy="50" r="1.5" fill="rgba(148, 163, 184, 0.6)" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Character 2 - Jonathan Chen - Enhanced */}
                                            <div className="bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-4 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.3)] hover:bg-gradient-to-b hover:from-white/20 hover:to-white/8 hover:border-white/30 transition-all duration-300 group/char">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <div className="text-center">
                                                        <h4 className="font-bold text-emerald-300 text-xs tracking-wide">Jonathan Chen</h4>
                                                        <p className="text-[10px] text-emerald-200/80 font-medium uppercase tracking-wider">Antagonist</p>
                                                    </div>

                                                    <div className="relative w-18 h-18">
                                                        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-md opacity-0 group-hover/char:opacity-100 transition-opacity duration-300"></div>
                                                        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                                                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="0.8" />

                                                            <path d="M50,10 L78.5,27.5 M78.5,27.5 L71.5,65 M71.5,65 L28.5,65 M28.5,65 L21.5,27.5 M21.5,27.5 L50,10"
                                                                stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.6" fill="none" />

                                                            <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="78.5" y2="27.5" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="71.5" y2="65" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="28.5" y2="65" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="21.5" y2="27.5" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />

                                                            <polygon points="50,25 75,35 55,62 40,60 25,35"
                                                                fill="rgba(16, 185, 129, 0.2)"
                                                                stroke="#10b981"
                                                                strokeWidth="2.5" />

                                                            <circle cx="50" cy="25" r="2" fill="#10b981" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="75" cy="35" r="2" fill="#10b981" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="55" cy="62" r="2" fill="#10b981" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="40" cy="60" r="2" fill="#10b981" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="25" cy="35" r="2" fill="#10b981" stroke="white" strokeWidth="0.5" />

                                                            <circle cx="50" cy="50" r="1.5" fill="rgba(148, 163, 184, 0.6)" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Character 3 - Brandon Behner - Enhanced */}
                                            <div className="bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-4 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.3)] hover:bg-gradient-to-b hover:from-white/20 hover:to-white/8 hover:border-white/30 transition-all duration-300 group/char">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <div className="text-center">
                                                        <h4 className="font-bold text-orange-300 text-xs tracking-wide">Brandon Behner</h4>
                                                        <p className="text-[10px] text-orange-200/80 font-medium uppercase tracking-wider">Supporting</p>
                                                    </div>

                                                    <div className="relative w-18 h-18">
                                                        <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-md opacity-0 group-hover/char:opacity-100 transition-opacity duration-300"></div>
                                                        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                                                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="0.8" />

                                                            <path d="M50,10 L78.5,27.5 M78.5,27.5 L71.5,65 M71.5,65 L28.5,65 M28.5,65 L21.5,27.5 M21.5,27.5 L50,10"
                                                                stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.6" fill="none" />

                                                            <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="78.5" y2="27.5" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="71.5" y2="65" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="28.5" y2="65" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="21.5" y2="27.5" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />

                                                            <polygon points="50,15 72,30 68,58 32,60 28,30"
                                                                fill="rgba(249, 115, 22, 0.2)"
                                                                stroke="#f97316"
                                                                strokeWidth="2.5" />

                                                            <circle cx="50" cy="15" r="2" fill="#f97316" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="72" cy="30" r="2" fill="#f97316" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="68" cy="58" r="2" fill="#f97316" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="32" cy="60" r="2" fill="#f97316" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="28" cy="30" r="2" fill="#f97316" stroke="white" strokeWidth="0.5" />

                                                            <circle cx="50" cy="50" r="1.5" fill="rgba(148, 163, 184, 0.6)" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Character 4 - Julius Lau - Enhanced */}
                                            <div className="bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-4 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.3)] hover:bg-gradient-to-b hover:from-white/20 hover:to-white/8 hover:border-white/30 transition-all duration-300 group/char">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <div className="text-center">
                                                        <h4 className="font-bold text-purple-300 text-xs tracking-wide">Julius Lau</h4>
                                                        <p className="text-[10px] text-purple-200/80 font-medium uppercase tracking-wider">Supporting</p>
                                                    </div>

                                                    <div className="relative w-18 h-18">
                                                        <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-md opacity-0 group-hover/char:opacity-100 transition-opacity duration-300"></div>
                                                        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                                                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.8" />
                                                            <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="0.8" />

                                                            <path d="M50,10 L78.5,27.5 M78.5,27.5 L71.5,65 M71.5,65 L28.5,65 M28.5,65 L21.5,27.5 M21.5,27.5 L50,10"
                                                                stroke="rgba(148, 163, 184, 0.3)" strokeWidth="0.6" fill="none" />

                                                            <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="78.5" y2="27.5" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="71.5" y2="65" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="28.5" y2="65" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />
                                                            <line x1="50" y1="50" x2="21.5" y2="27.5" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.6" />

                                                            <polygon points="50,20 68,28 62,55 38,58 32,28"
                                                                fill="rgba(168, 85, 247, 0.2)"
                                                                stroke="#a855f7"
                                                                strokeWidth="2.5" />

                                                            <circle cx="50" cy="20" r="2" fill="#a855f7" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="68" cy="28" r="2" fill="#a855f7" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="62" cy="55" r="2" fill="#a855f7" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="38" cy="58" r="2" fill="#a855f7" stroke="white" strokeWidth="0.5" />
                                                            <circle cx="32" cy="28" r="2" fill="#a855f7" stroke="white" strokeWidth="0.5" />

                                                            <circle cx="50" cy="50" r="1.5" fill="rgba(148, 163, 184, 0.6)" />
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
                </div>
            </section>

            {/* Second Screen - What is Narratree? */}
            <section id="how-it-works" className="relative h-screen flex items-center justify-center bg-white px-4 py-8 overflow-hidden">
                {/* Background flowcharts outside container */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    {/* Top Left Flowchart - Story Development Process */}
                    <div className="absolute top-0 left-52 w-56 h-64">
                        <div className="bg-blue-500 text-white text-xs px-3 py-2 rounded-lg shadow-md mb-2 text-center font-medium">
                            Story Idea
                        </div>
                        <div className="h-px w-6 bg-gray-400 mx-auto mb-2"></div>
                        <div className="bg-yellow-500 text-white text-xs px-3 py-2 rounded-lg shadow-md mb-2 text-center font-medium">
                            Character Development
                        </div>
                        <div className="h-px w-6 bg-gray-400 mx-auto mb-2"></div>
                        <div className="bg-green-500 text-white text-xs px-3 py-2 rounded-lg shadow-md mb-2 text-center font-medium">
                            Plot Structure
                        </div>
                        <div className="h-px w-6 bg-gray-400 mx-auto mb-2"></div>
                        <div className="bg-purple-500 text-white text-xs px-3 py-2 rounded-lg shadow-md mb-2 text-center font-medium">
                            Scene Generation
                        </div>
                        <div className="h-px w-6 bg-gray-400 mx-auto mb-2"></div>
                        <div className="bg-red-500 text-white text-xs px-3 py-2 rounded-lg shadow-md text-center font-medium">
                            Final Story
                        </div>
                    </div>

                    {/* Top Right Process Diagram */}
                    <div className="absolute top-20 right-96 w-64 h-48">
                        <div className="grid grid-cols-3 gap-3 h-full">
                            <div className="flex flex-col space-y-2">
                                <div className="bg-indigo-500 text-white text-xs px-2 py-2 rounded-lg shadow-md text-center font-medium h-12 flex items-center justify-center">
                                    Input Ideas
                                </div>
                                <div className="bg-indigo-600 text-white text-xs px-2 py-2 rounded-lg shadow-md text-center font-medium h-12 flex items-center justify-center">
                                    Define Characters
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="h-px w-full bg-gray-400 mb-1"></div>
                                <div className="w-0 h-0 border-l-3 border-l-gray-400 border-t-1 border-t-transparent border-b-1 border-b-transparent mx-auto"></div>
                                <div className="h-px w-full bg-gray-400 mt-1"></div>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <div className="bg-emerald-500 text-white text-xs px-2 py-2 rounded-lg shadow-md text-center font-medium h-12 flex items-center justify-center">
                                    AI Processing
                                </div>
                                <div className="bg-emerald-600 text-white text-xs px-2 py-2 rounded-lg shadow-md text-center font-medium h-12 flex items-center justify-center">
                                    Story Output
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Left Branching Diagram */}
                    <div className="absolute bottom-16 left-80 w-72 h-52">
                        <div className="bg-orange-500 text-white text-xs px-3 py-2 rounded-lg shadow-md text-center font-medium mb-3 w-28 mx-auto">
                            Story Branch Point
                        </div>
                        <div className="flex justify-center mb-3">
                            <div className="h-px w-12 bg-gray-400"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="bg-rose-500 text-white text-xs px-2 py-2 rounded-lg shadow-md mb-2 font-medium">
                                    Path A
                                </div>
                                <div className="h-px w-6 bg-gray-400 mx-auto mb-2"></div>
                                <div className="bg-rose-600 text-white text-xs px-2 py-2 rounded-lg shadow-md font-medium">
                                    Outcome A
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="bg-cyan-500 text-white text-xs px-2 py-2 rounded-lg shadow-md mb-2 font-medium">
                                    Path B
                                </div>
                                <div className="h-px w-6 bg-gray-400 mx-auto mb-2"></div>
                                <div className="bg-cyan-600 text-white text-xs px-2 py-2 rounded-lg shadow-md font-medium">
                                    Outcome B
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="bg-amber-500 text-white text-xs px-2 py-2 rounded-lg shadow-md mb-2 font-medium">
                                    Path C
                                </div>
                                <div className="h-px w-6 bg-gray-400 mx-auto mb-2"></div>
                                <div className="bg-amber-600 text-white text-xs px-2 py-2 rounded-lg shadow-md font-medium">
                                    Outcome C
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Right Decision Tree */}
                    <div className="absolute bottom-8 right-52 w-56 h-60">
                        <div className="bg-violet-500 text-white text-xs px-3 py-2 rounded-lg shadow-md text-center font-medium mb-3">
                            Character Action
                        </div>
                        <div className="flex justify-center mb-3">
                            <div className="h-px w-10 bg-gray-400"></div>
                        </div>
                        <div className="bg-slate-500 text-white text-xs px-3 py-2 rounded-lg shadow-md text-center font-medium mb-3">
                            Consequences?
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="text-center">
                                <div className="bg-green-500 text-white text-xs px-2 py-2 rounded-lg shadow-md mb-2 font-medium">
                                    Positive
                                </div>
                                <div className="h-px w-5 bg-gray-400 mx-auto mb-2"></div>
                                <div className="bg-green-600 text-white text-xs px-2 py-1 rounded shadow-sm font-medium">
                                    Progress
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="bg-red-500 text-white text-xs px-2 py-2 rounded-lg shadow-md mb-2 font-medium">
                                    Negative
                                </div>
                                <div className="h-px w-5 bg-gray-400 mx-auto mb-2"></div>
                                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-sm font-medium">
                                    Conflict
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-6xl mx-auto relative z-10">
                    <div className="relative rounded-3xl px-12 pt-10 pb-16 md:px-16 md:pt-12 md:pb-20 lg:px-24 lg:pt-14 lg:pb-28 overflow-hidden before:content-[''] before:absolute before:inset-[4px] before:rounded-[1.25rem] before:border before:border-white/15 before:pointer-events-none before:z-10">

                        {/* Custom black border segments that cut off near flowcharts */}
                        {/* Top border - full width */}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-black/80 rounded-full z-30"></div>

                        {/* Bottom border - full width */}
                        <div className="absolute bottom-4 left-4 right-4 h-0.5 bg-black/80 rounded-full z-30"></div>

                        {/* Left border segments - cut off where flowcharts appear */}
                        <div className="absolute top-4 left-4 w-0.5 h-32 bg-black/80 rounded-full z-30"></div>
                        <div className="absolute bottom-4 left-4 w-0.5 h-32 bg-black/80 rounded-full z-30"></div>

                        {/* Right border segments - cut off where flowcharts appear */}
                        <div className="absolute top-4 right-4 w-0.5 h-40 bg-black/80 rounded-full z-30"></div>
                        <div className="absolute bottom-4 right-4 w-0.5 h-24 bg-black/80 rounded-full z-30"></div>

                        {/* Corner connectors */}
                        <div className="absolute top-4 left-4 w-2 h-2 border-l-0.5 border-t-0.5 border-black/80 rounded-tl-sm z-30"></div>
                        <div className="absolute top-4 right-4 w-2 h-2 border-r-0.5 border-t-0.5 border-black/80 rounded-tr-sm z-30"></div>
                        <div className="absolute bottom-4 left-4 w-2 h-2 border-l-0.5 border-b-0.5 border-black/80 rounded-bl-sm z-30"></div>
                        <div className="absolute bottom-4 right-4 w-2 h-2 border-r-0.5 border-b-0.5 border-black/80 rounded-br-sm z-30"></div>

                        <div className="max-w-5xl mx-auto text-center relative z-20">
                            <div className="mb-12">
                                <BlurText
                                    text="What's Narratree?"
                                    delay={90}
                                    animateBy="words"
                                    direction="top"
                                    className="text-4xl md:text-5xl font-black leading-tight text-slate-800 tracking-tight text-center"
                                />
                            </div>
                            <div className="space-y-12 text-2xl md:text-2xl text-gray-600 text-center">
                                <BlurText
                                    text="Narratree is an AI-powered writing assistant that helps you craft compelling narratives through interactive flowcharts and intelligent suggestions. Our platform combines the structure of traditional storytelling with modern AI technology to enhance your creative process."
                                    delay={90}
                                    animateBy="words"
                                    direction="top"
                                    className="text-xl md:text-2xl font-medium text-slate-700 leading-relaxed text-center tracking-wide"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Third Screen - Our Mission (with hero-style inner container) */}
            <section id="our-mission" className="relative h-screen w-full flex items-center justify-center pt-12 px-2 md:px-4 lg:px-6 bg-white">
                <div className="relative w-full h-[94%] -translate-y-6 md:-translate-y-10 lg:-translate-y-12 rounded-[28px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55),0_8px_24px_-6px_rgba(0,0,0,0.4)]">
                    {/* Background image & gradient */}
                    <div
                        className="absolute inset-0 w-full h-full bg-center bg-cover bg-no-repeat"
                        style={{ backgroundImage: "url('/third-section-bg.jpg')" }}
                        aria-hidden="true"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/50 pointer-events-none" />

                    {/* Inner constrained content */}
                    <div className="max-w-4xl mx-auto px-6 w-full relative z-10 h-full flex flex-col justify-center">
                        <div className="mb-12">
                            <ScrollReveal
                                textClassName="text-3xl md:text-4xl font-black text-blue-50 tracking-tight text-center drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]"
                                containerClassName="mb-10"
                                baseOpacity={0.15}
                                baseRotation={4}
                                blurStrength={6}
                                rotationEnd="+=250"
                                wordAnimationEnd="+=250"
                            >
                                Our Mission
                            </ScrollReveal>
                            <div className="space-y-10 text-xl text-gray-200 mb-12">
                                <ScrollReveal
                                    textClassName="sr-inherit text-lg font-light text-blue-50 leading-loose text-center drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)] tracking-wide"
                                    containerClassName="leading-loose"
                                    baseOpacity={0.1}
                                    baseRotation={2}
                                    blurStrength={4}
                                    rotationEnd="+=220"
                                    wordAnimationEnd="+=220"
                                >
                                    Everyone has a story to tell. Narratree is built to make the writing process more intuitive and
                                    accessible through visual storytelling and AI assistance.
                                </ScrollReveal>
                                                                <ScrollReveal
                                    textClassName="sr-inherit text-lg font-light text-blue-50 leading-loose text-center drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)] tracking-wide"
                                    containerClassName="leading-loose"
                                    baseOpacity={0.1}
                                    baseRotation={2}
                                    blurStrength={4}
                                    rotationEnd="+=220"
                                    wordAnimationEnd="+=220"
                                >
                                    Whether you're a professional facing writer's block or an indie creator shaping your first draft, our goal is to help you move past
                                    creative roadblocks, organize your ideas, and accelerate the journey from concept to finished narrative.
                                </ScrollReveal>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="pt-0 pb-16 px-6 bg-white">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-2l font-light text-gray-300 tracking-wide">
                        created at BigRedHacks 2025
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;