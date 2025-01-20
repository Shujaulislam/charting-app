/**
 * Root Layout Component
 * Provides the base HTML structure and global providers for the application
 * Includes metadata configuration and global styles
 */

import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';

// Load Inter font with Latin subset for better performance
const inter = Inter({ subsets: ['latin'] });

/**
 * Metadata configuration for the application
 * Used by Next.js for SEO and page metadata
 */
export const metadata = {
  title: 'Data Visualization Dashboard',
  description: 'Interactive dashboard for visualizing data with customizable charts',
};

/**
 * Props for the RootLayout component
 */
interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * RootLayout Component
 * Wraps the entire application with necessary providers and styles
 * Sets up the basic HTML structure and font configuration
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
