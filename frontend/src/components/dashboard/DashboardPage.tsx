// src/components/dashboard/DashboardPage.tsx
import { useState } from 'react';
import TurnosExcelView from './TurnosExcelView';
import UserListViewWrapper from './UserListViewWrapper';
import FestivosList from '../festivos/FestivosList';
import MainNav from '../ui/MainNav';
import ReportesPage from '../reportes/ReportesPage';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'turnos' | 'usuarios' | 'festivos' | 'reportes'>('turnos');

  return (
  <div className="min-h-screen">
      <MainNav
        active={activeTab}
        onChange={(tabId) => {
          if (tabId === 'turnos' || tabId === 'usuarios' || tabId === 'festivos' || tabId === 'reportes') setActiveTab(tabId);
        }}
      />
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        {activeTab === 'turnos' && <TurnosExcelView />}
        {activeTab === 'usuarios' && <UserListViewWrapper />}
  {activeTab === 'festivos' && <FestivosList />}
  {activeTab === 'reportes' && <ReportesPage />}
      </main>
    </div>
  );
};
export default DashboardPage;