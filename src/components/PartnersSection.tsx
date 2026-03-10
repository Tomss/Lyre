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
        <section id="partenaires" className="scroll-mt-20 py-24 bg-slate-50 relative overflow-hidden">
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
                <div className="mt-16 text-center">
                    <p className="text-slate-600 text-lg font-medium mb-4">
                        Vous souhaitez devenir partenaire ?
                    </p>
                    <Link 
                        to="/contact" 
                        className="inline-flex items-center text-teal-600 font-bold hover:text-teal-500 transition-colors"
                    >
                        Contactez-nous
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default PartnersSection;
