/**
 * Home Page Component
 * Main entry point for the application
 * Renders the dashboard layout with chart configuration and data visualization
 */

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Providers } from '@/components/Providers';

/**
 * HomePage Component
 * Serves as the root page of the application
 * Wraps the DashboardLayout component for data visualization
 */
export default function Home() {
  return (
    <Providers>
      <DashboardLayout />
    </Providers>
  );
}
