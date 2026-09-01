import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  url?: string;
}

export function useSEO({ title, description, url }: SEOProps) {
  useEffect(() => {
    // 1. Update Title
    const fullTitle = title.includes('La Lyre') ? title : `${title} | La Lyre - Chalindrey`;
    document.title = fullTitle;

    // 2. Helper to set or create meta tag
    const setMeta = (nameAttr: string, nameValue: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${nameValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, nameValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (description) {
      setMeta('name', 'description', description);
      setMeta('name', 'title', fullTitle);
      setMeta('property', 'og:title', fullTitle);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:title', fullTitle);
      setMeta('name', 'twitter:description', description);
    }

    if (url) {
      const fullUrl = url.startsWith('http') ? url : `https://lalyre.fr${url}`;
      setMeta('property', 'og:url', fullUrl);
      setMeta('name', 'twitter:url', fullUrl);
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', fullUrl);
      }
    }
  }, [title, description, url]);
}
