// src/components/dashboard/DashboardPage.tsx
import { useState } from 'react';
import TabGroup from '../ui/TabGroup';
import TurnosExcelView from './TurnosExcelView';
import UserListViewWrapper from './UserListViewWrapper';
import FestivosList from '../festivos/FestivosList';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'turnos' | 'usuarios' | 'festivos'>('turnos');

  return (
    <div className="p-10 size-min mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">🛠️ Gestión Operación - CPD</h1>

      <TabGroup
        tabs={[
          { id: 'turnos', label: '📅 Turnos' },
          { id: 'usuarios', label: '👥 Usuarios' },
          { id: 'festivos', label: '🎉 Festivos' }
        ]}
        activeTab={activeTab}
        onTabChange={(tabId: string) => {
          if (tabId === 'turnos' || tabId === 'usuarios' || tabId === 'festivos') {
            setActiveTab(tabId);
          }
        }}
      />

      <div className="mt-6">
        {activeTab === 'turnos' && <TurnosExcelView />}
        {activeTab === 'usuarios' && <UserListViewWrapper />}
         {activeTab === 'festivos' && <FestivosList />}
      </div>
    </div>
  );
};

export default DashboardPage;