import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/AuthContext';
import { CartProvider } from './state/CartContext';
import { Login } from './screens/Login';
import { Order } from './screens/Order';
import { Cart } from './screens/Cart';
import { Checkout } from './screens/Checkout';
import { Complete } from './screens/Complete';
import { AdminHome } from './screens/admin/AdminHome';
import { ProductList } from './screens/admin/ProductList';
import { ProductEdit } from './screens/admin/ProductEdit';

/** 未ログインなら /login へ。トークン復元前は描画を保留。 */
function Guard({ children }: { children: ReactElement }) {
  const { staff, ready } = useAuth();
  if (!ready) return null;
  if (!staff) return <Navigate to="/login" replace />;
  return children;
}

/** オーナー専用。staff のみのときはレジへ戻す。 */
function OwnerGuard({ children }: { children: ReactElement }) {
  const { staff, ready } = useAuth();
  if (!ready) return null;
  if (!staff) return <Navigate to="/login" replace />;
  if (staff.role !== 'owner') return <Navigate to="/" replace />;
  return children;
}

export function App() {
  return (
    <BrowserRouter basename="/pos">
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Guard><Order /></Guard>} />
            <Route path="/cart" element={<Guard><Cart /></Guard>} />
            <Route path="/checkout" element={<Guard><Checkout /></Guard>} />
            <Route path="/complete" element={<Guard><Complete /></Guard>} />

            {/* 管理（オーナー専用） */}
            <Route path="/admin" element={<OwnerGuard><AdminHome /></OwnerGuard>} />
            <Route path="/admin/products" element={<OwnerGuard><ProductList /></OwnerGuard>} />
            <Route path="/admin/products/:id" element={<OwnerGuard><ProductEdit /></OwnerGuard>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
