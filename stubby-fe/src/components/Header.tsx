import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

interface HeaderProps {
    variant?: 'landing' | 'app';
}

const Header: React.FC<HeaderProps> = ({ variant = 'app' }) => {
    const navigate = useNavigate();

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div className="flex items-center justify-center pt-4">
                <div className="bg-black/65 backdrop-blur-sm rounded-full px-6 py-3 flex items-center space-x-8 shadow-lg">
                    {/* Logo */}
                    <div 
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => navigate('/')}
                    >
                        <Logo className="text-white hover:text-gray-200 w-[100px]" />
                    </div>
                    
                    {/* Navigation items - show only on landing page variant */}
                    {variant === 'landing' && (
                        <>
                            <button
                                onClick={() => scrollToSection('how-it-works')}
                                className="text-white hover:text-gray-300 font-medium text-sm transition-colors duration-200"
                            >
                                How it Works
                            </button>
                            
                            <button
                                onClick={() => scrollToSection('our-mission')}
                                className="text-white hover:text-gray-300 font-medium text-sm transition-colors duration-200"
                            >
                                Our Mission
                            </button>
                            
                            <button
                                onClick={() => scrollToSection('join-storyflow')}
                                className="text-white hover:text-gray-300 font-medium text-sm transition-colors duration-200"
                            >
                                Get Started
                            </button>
                            
                            <div className="w-px h-4 bg-gray-600" />
                            
                            <button
                                onClick={() => navigate('/app')}
                                className="text-white hover:text-gray-300 font-medium pl-2 pr-4 py-2 rounded-full text-sm transition-colors duration-200"
                            >
                                Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;