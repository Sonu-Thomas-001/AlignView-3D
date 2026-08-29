import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AlignView 3D — Next-Gen Dental STL Previewer & Aligner Simulator',
    short_name: 'AlignView 3D',
    description: 'Web-based 3D dental STL previewer, clear aligner treatment progression simulator, and orthodontic analysis tool.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F6FA',
    theme_color: '#2563EB',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
