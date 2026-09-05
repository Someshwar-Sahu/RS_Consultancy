import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/employee/', '/candidate/dashboard/'],
    },
    sitemap: 'https://rs-consultancy-seven.vercel.app/sitemap.xml',
  };
}
