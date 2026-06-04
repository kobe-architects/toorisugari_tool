import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/AuthContext';
import { Login } from './screens/Login';
import { Layout } from './components/Layout';
import { SalesAdminPage } from './views/SalesAdminPage';
import { CustomerView } from './views/CustomerView';
import { RegisterView } from './views/RegisterView';

/** 未ログインなら /login へ。トークン復元前は描画を保留。 */
function Guard({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <BrowserRouter basename="/pc">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Guard><Layout /></Guard>}>
            <Route path="/" element={<SalesAdminPage />} />
            <Route path="/customer" element={<CustomerView />} />
            <Route path="/register" element={<RegisterView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
