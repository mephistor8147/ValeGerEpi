/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home } from './views/Home';
import { Employees } from './views/Employees';
import { EmployeeDetails } from './views/EmployeeDetails';
import { Delivery } from './views/Delivery';
import { Return } from './views/Return';
import { Catalog } from './views/Catalog';
import { Reports } from './views/Reports';
import { ReportViewer } from './views/ReportViewer';
import { Alerts } from './views/Alerts';
import { Dashboard } from './views/Dashboard';
import { Settings } from './views/Settings';
import { EpiManagement } from './views/EpiManagement';
import { EmployeeManagement } from './views/EmployeeManagement';
import { SiteManagement } from './views/SiteManagement';
import { RoleManagement } from './views/RoleManagement';
import { BinderCreation } from './views/BinderCreation';
import { AdminManagement } from './views/AdminManagement';
import { Login } from './views/Login';
import { Home as HomeIcon, PackageCheck, Package, LayoutList, LayoutGrid } from 'lucide-react';
import { cn } from './lib/utils';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdminUser(null);
        setLoading(false);
        return;
      }
      
      try {
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');
        const q = query(collection(db, 'admins'), where('authUid', '==', user.uid));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const adminData = snapshot.docs[0].data();
          if (adminData.status === 'Ativo') {
            setAdminUser({ id: snapshot.docs[0].id, ...adminData });
          } else {
            auth.signOut();
          }
        } else {
          // Fallback to email check
          const qByEmail = query(collection(db, 'admins'), where('email', '==', user.email));
          const emailSnapshot = await getDocs(qByEmail);
          if (!emailSnapshot.empty) {
            const adminDoc = emailSnapshot.docs[0];
            const adminData = adminDoc.data();
            if (adminData.status === 'Ativo') {
              const { doc, updateDoc } = await import('firebase/firestore');
              await updateDoc(doc(db, 'admins', adminDoc.id), { authUid: user.uid });
              setAdminUser({ id: adminDoc.id, ...adminData });
            } else {
              auth.signOut();
            }
          } else {
            if (user.email === 'l2xbrasil@gmail.com') {
               const adminData = {
                  funcionarioId: 'seed',
                  nomeFuncionario: user.displayName || 'Administrador L2X',
                  email: user.email,
                  nivel: 'master',
                  status: 'Ativo',
                  contato: '',
                  fotoUrl: user.photoURL || '',
                  authUid: user.uid,
                  createdAt: Date.now()
                };
                const { addDoc } = await import('firebase/firestore');
                const docRef = await addDoc(collection(db, 'admins'), adminData);
                setAdminUser({ id: docRef.id, ...adminData });
                return;
            }
            auth.signOut();
          }
        }
      } catch (err) {
        console.error("Error fetching admin status:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#0B5C36] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!adminUser) {
    return <Login onLoginSuccess={(admin) => setAdminUser(admin)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={setCurrentView} />;
      case 'employees':
        return <Employees onBack={() => setCurrentView('home')} onSelectEmployee={(id) => { setSelectedEmployeeId(id); setCurrentView('employeeDetails'); }} />;
      case 'employeeDetails':
        return <EmployeeDetails employeeId={selectedEmployeeId!} onBack={() => setCurrentView('employees')} />;
      case 'delivery':
        return <Delivery onBack={() => setCurrentView('home')} />;
      case 'return':
        return <Return onBack={() => setCurrentView('home')} />;
      case 'catalog':
        return <Catalog onBack={() => setCurrentView('home')} />;
      case 'reports':
        return <Reports onBack={() => setCurrentView('home')} onNavigateReport={(id) => { setSelectedReportId(id); setCurrentView('reportViewer'); }} />;
      case 'reportViewer':
        return <ReportViewer reportId={selectedReportId!} onBack={() => setCurrentView('reports')} />;
      case 'alerts':
        return <Alerts onBack={() => setCurrentView('home')} />;
      case 'dashboard':
        return <Dashboard onBack={() => setCurrentView('home')} />;
      case 'settings':
        return <Settings onBack={() => setCurrentView('home')} onNavigate={setCurrentView} />;
      case 'epiManagement':
        return <EpiManagement onBack={() => setCurrentView('settings')} />;
      case 'employeeManagement':
        return <EmployeeManagement onBack={() => setCurrentView('settings')} />;
      case 'siteManagement':
        return <SiteManagement onBack={() => setCurrentView('settings')} />;
      case 'roleManagement':
        return <RoleManagement onBack={() => setCurrentView('settings')} />;
      case 'binderCreation':
        return <BinderCreation onBack={() => setCurrentView('settings')} />;
      case 'adminManagement':
        return <AdminManagement onBack={() => setCurrentView('settings')} />;
      default:
        return <Home onNavigate={setCurrentView} />;
    }
  };

  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Início' },
    { id: 'delivery', icon: PackageCheck, label: 'Entregas' },
    { id: 'catalog', icon: Package, label: 'EPIs' },
    { id: 'reports', icon: LayoutList, label: 'Relatórios' },
    { id: 'dashboard', icon: LayoutGrid, label: 'Mais' },
  ];

  const showNav = ['home', 'delivery', 'catalog', 'reports', 'dashboard'].includes(currentView);

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 overflow-hidden w-full">
      {/* Desktop Sidebar */}
      {showNav && (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 z-50">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-[#0B5C36]">EPI Manager</h1>
          </div>
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-colors",
                    isActive ? "bg-green-50 text-[#0B5C36]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden bg-gray-50">
        <div className="flex-1 flex flex-col overflow-y-auto w-full">
           <div className={cn("flex-1 flex flex-col transition-all duration-300", showNav ? "max-md:pb-[80px]" : "")}>
              {renderView()}
           </div>
        </div>

        {/* Mobile Bottom Navigation */}
        {showNav && (
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-6 py-3 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1",
                      isActive ? "text-[#0B5C36]" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

