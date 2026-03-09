import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface PageHeroProps {
    title: React.ReactNode;
    subtitle: string;
    backgroundImage: string;
    anchors?: {
        label: string;
        targetId: string;
        icon?: LucideIcon;
        color?: 'emerald' | 'rose' | 'indigo' | 'cyan' | 'amber' | 'teal';
    }[];
}

const PageHero: React.FC<PageHeroProps> = ({ title, subtitle, backgroundImage, anchors = [] }) => {

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'emerald':
                return {
                    button: 'hover:bg-emerald-900/40 border-emerald-500/30 hover:border-emerald-400',
                    icon: 'text-emerald-400 group-hover:text-emerald-300',
                    gradient: 'from-emerald-600/20'
                };
            case 'rose':
                return {
                    button: 'hover:bg-rose-900/40 border-rose-500/30 hover:border-rose-400',
                    icon: 'text-rose-400 group-hover:text-rose-300',
                    gradient: 'from-rose-600/20'
                };
            case 'indigo':
                return {
                    button: 'hover:bg-indigo-900/40 border-indigo-500/30 hover:border-indigo-400',
                    icon: 'text-indigo-400 group-hover:text-indigo-300',
                    gradient: 'from-indigo-600/20'
                };
            case 'cyan':
                return {
                    button: 'hover:bg-cyan-900/40 border-cyan-500/30 hover:border-cyan-400',
                    icon: 'text-cyan-400 group-hover:text-cyan-300',
                    gradient: 'from-cyan-600/20'
                };
            case 'amber':
                return {
                    button: 'hover:bg-amber-900/40 border-amber-500/30 hover:border-amber-400',
                    icon: 'text-amber-400 group-hover:text-amber-300',
                    gradient: 'from-amber-600/20'
                };
            case 'teal':
                return {
                    button: 'hover:bg-teal-900/40 border-teal-500/30 hover:border-teal-400',
                    icon: 'text-teal-400 group-hover:text-teal-300',
                    gradient: 'from-teal-600/20'
                };
            default: // Default to white/slate styling if no color match or neutral
                return {
                    button: 'hover:bg-white/20 border-white/20 hover:border-white/40',
                    icon: 'text-white group-hover:text-slate-200',
                    gradient: 'from-white/10'
                };
        }
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-gray-900 fixed-bg"
            style={{
                backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.95)), url("${backgroundImage}")`,
                backgroundAttachment: 'fixed'
            }}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 pt-20">

                <div className="flex flex-col items-center mb-12 lg:mb-16">
                    <h1 className="font-poppins font-bold text-5xl md:text-7xl text-white mb-6 drop-shadow-2xl tracking-tight animate-fade-in-up">
                        {title}
                    </h1>
                    
                    <div className="h-1 w-24 md:w-32 bg-gradient-to-r from-transparent via-teal-400 to-transparent mb-6 opacity-80 animate-fade-in-up delay-100"></div>
                    
                    <p className="max-w-3xl mx-auto text-lg md:text-xl text-white/90 animate-fade-in-up delay-200 font-inter font-light tracking-wide leading-relaxed text-center drop-shadow-lg">
                        {subtitle}
                    </p>
                </div>

                {/* Navigation Anchors */}
                {anchors.length > 0 && (
                    <div className="inline-flex flex-col sm:flex-row gap-6 animate-fade-in-up delay-300 justify-center flex-wrap">
                        {anchors.map((anchor, index) => {
                            const colors = getColorClasses(anchor.color || 'white');
                            const Icon = anchor.icon;

                            return (
                                <button
                                    key={index}
                                    onClick={() => scrollToSection(anchor.targetId)}
                                    className={`group relative px-8 py-4 rounded-full bg-black/20 backdrop-blur-md text-white border transition-all duration-300 shadow-xl overflow-hidden hover:scale-105 ${colors.button}`}
                                >
                                    <span className="relative z-10 flex items-center font-bold">
                                        {Icon && <Icon className={`mr-3 h-5 w-5 transition-colors ${colors.icon}`} />}
                                        {anchor.label}
                                    </span>
                                    <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Scroll Indicator */}
            {anchors.length > 0 && (
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50 cursor-pointer hover:text-white transition-colors" onClick={() => scrollToSection(anchors[0].targetId)}>
                    <ArrowRight className="h-6 w-6 rotate-90" />
                </div>
            )}
        </section>
    );
};

export default PageHero;
