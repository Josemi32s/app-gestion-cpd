// src/components/dashboard/DashboardPage.tsx
import { useState } from 'react';
import TabGroup from '../ui/TabGroup';
import TurnosExcelView from './TurnosExcelView';
import UserListViewWrapper from './UserListViewWrapper';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'turnos' | 'usuarios'>('turnos');

  return (
    <div className="pt-10 size-min mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">🛠️ Gestión Operación - CPD</h1>

      <TabGroup
        tabs={[
          { id: 'turnos', label: '📅 Turnos' },
          { id: 'usuarios', label: '👥 Usuarios' }
        ]}
        activeTab={activeTab}
        onTabChange={(tabId: string) => {
          if (tabId === 'turnos' || tabId === 'usuarios') {
            setActiveTab(tabId);
          }
        }}
      />

      <div className="mt-6">
        {activeTab === 'turnos' && <TurnosExcelView />}
        {activeTab === 'usuarios' && <UserListViewWrapper />}
      </div>
    </div>
  );
};

export default DashboardPage;