import React from 'react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StorefrontPage } from './components/storefront/StorefrontPage';
import { TabaProvider, useTaba } from './context/TabaContext';

const TabaRouter: React.FC = () => {
  const { currentView } = useTaba();
  return currentView === 'admin' ? <AdminDashboard /> : <StorefrontPage />;
};

export default function App() {
  return (
    <TabaProvider>
      <TabaRouter />
    </TabaProvider>
  );
}
