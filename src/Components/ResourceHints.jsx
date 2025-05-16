import React, { useEffect } from 'react';

/**
 * ResourceHints component for optimizing resource loading
 *
 * This component adds resource hints to the document head
 * to improve performance by preloading, prefetching, and preconnecting
 * to resources that will be needed soon.
 */
const ResourceHints = () => {
  useEffect(() => {
    // Add preconnect hints for external domains
    const preconnectDomains = [
      'https://laravel-api.fly.dev',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    preconnectDomains.forEach(domain => {
      if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });

    // Add DNS prefetch hints for external domains
    const dnsPrefetchDomains = [
      'https://laravel-api.fly.dev',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    dnsPrefetchDomains.forEach(domain => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      }
    });

    // Preload critical resources - only include files that actually exist
    const criticalResources = [
      // Check if these files exist before preloading
      // { href: '/img/logo.png', as: 'image' },
      // { href: '/img/texture-bg.jpg', as: 'image' },
      { href: '/img/interior-moodboard.png', as: 'image' }
    ];

    criticalResources.forEach(resource => {
      if (!document.querySelector(`link[rel="preload"][href="${resource.href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.href;
        link.as = resource.as;

        if (resource.type) {
          link.type = resource.type;
        }

        if (resource.crossOrigin) {
          link.crossOrigin = resource.crossOrigin;
        }

        document.head.appendChild(link);
      }
    });

    // Prefetch likely navigation paths
    const prefetchPaths = [
      '/products',
      '/Produit/AllCat',
      '/marque'
    ];

    prefetchPaths.forEach(path => {
      if (!document.querySelector(`link[rel="prefetch"][href="${path}"]`)) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = path;
        link.as = 'document';
        document.head.appendChild(link);
      }
    });

    // Add preload for web fonts
    const fontPreloads = [
      { href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&display=swap', as: 'style' },
      { href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap', as: 'style' }
    ];

    fontPreloads.forEach(font => {
      if (!document.querySelector(`link[rel="preload"][href="${font.href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = font.href;
        link.as = font.as;
        document.head.appendChild(link);

        // Also add the stylesheet link
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = font.href;
        document.head.appendChild(styleLink);
      }
    });

    return () => {
      // Cleanup function if needed
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default ResourceHints;
