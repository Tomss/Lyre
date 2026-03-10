import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Partner {
    id: string;
    name: string;
    logo_url: string;
    description: string;
    website_url: string;
}

const PartnersSection = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const response = await fetch(`${API_URL}/partners`);
                if (response.ok) {
                    const data = await response.json();
                    setPartners(data);
                }
            } catch (error) {
                console.error('Error fetching partners:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPartners();
    }, []);

    if (loading || partners.length === 0) return null;

    return (
        <section id="partenaires" className="scroll-mt-32 py-24 bg-slate-50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-100/50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="font-poppins font-bold text-3xl md:text-4xl text-slate-800 mb-4 tracking-tight">
                        Nos Partenaires
                    </h2>
                    <div className="h-1 w-20 bg-indigo-500 rounded-full mx-auto shadow-sm"></div>
                    <p className="mt-6 text-slate-600 font-inter text-lg">
                        Ils nous soutiennent et contribuent au rayonnement de La Lyre.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 md:gap-12 items-center justify-center">
                    {partners.map((partner) => {
                        const CardContent = (
                            <>
                                {/* Tooltip for Name */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-lg z-20">
                                    {partner.name}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>

                                {/* Logo */}
                                <img
                                    src={partner.logo_url}
                                    alt={partner.name}
                                    className="max-w-full max-h-full object-contain transition-transform duration-300 transform group-hover:scale-110"
                                />

                                {partner.website_url && (
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <ExternalLink className="h-4 w-4 text-indigo-400" />
                                    </div>
                                )}
                            </>
                        );

                        const cardClasses = "group relative flex items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 transition-all duration-300 h-32 md:h-40 w-full cursor-pointer";

                        if (partner.website_url) {
                            return (
                                <a
                                    key={partner.id}
                                    href={partner.website_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={cardClasses}
                                >
                                    {CardContent}
                                </a>
                            );
                        }

                        return (
                            <div key={partner.id} className={cardClasses}>
                                {CardContent}
                            </div>
                        );
                    })}
                </div>

                {/* Call to action for potential partners */}
                <div className="mt-20 flex justify-center">
                    <div className="bg-slate-900 text-white rounded-3xl px-8 py-8 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-500/10 border border-slate-800 w-full max-w-4xl relative overflow-hidden group">
                        {/* Subtile background touches */}
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-transparent to-indigo-500/10 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="absolute -left-16 -top-16 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none"></div>
                        
                        <div className="relative z-10 text-center sm:text-left">
                            <h3 className="text-2xl font-bold font-poppins mb-2 text-white group-hover:text-teal-400 transition-colors">Vous souhaitez devenir partenaire ?</h3>
                            <p className="text-slate-400 text-base">Soutenez l'Harmonie La Lyre et associez votre image à notre ensemble musical.</p>
                        </div>
                        <Link 
                            to="/contact" 
                            className="relative z-10 shrink-0 inline-flex items-center justify-center px-8 py-3 text-sm sm:text-base font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_rgba(45,212,191,0.5)] hover:-translate-y-1"
                        >
                            Contactez-nous
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PartnersSection;
