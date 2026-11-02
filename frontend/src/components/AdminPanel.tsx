import { useState, useEffect } from 'react';
import { Package, ClipboardList, Tag, TrendingUp, Users, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import AdminStats from './admin/AdminStats';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminProductsTab from './admin/AdminProductsTab';
import AdminOrdersTab from './admin/AdminOrdersTab';
import AdminPromosTab from './admin/AdminPromosTab';

interface AdminPanelProps {
  addToast: (message: string, type: 'success' | 'error') => void;
}

export default function AdminPanel({ addToast }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'products' | 'orders' | 'cancelled_orders' | 'promos'>('overview');

  // Shared Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [promos, setPromos] = useState<any[]>([]);
  const [promosLoading, setPromosLoading] = useState(true);

  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await api.get('/orders/analytics');
      setAnalytics(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to load analytics', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await api.get('/auth/users');
      setUsers(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to load users', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchPromos = async () => {
    setPromosLoading(true);
    try {
      const data = await api.get('/orders/promo');
      setPromos(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to load promo codes', 'error');
    } finally {
      setPromosLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await api.get('/products');
      setProducts(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to load products', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await api.get('/orders');
      const sorted = data.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
    } catch (err: any) {
      addToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'overview') fetchAnalytics();
    else if (activeSubTab === 'users') fetchUsers();
    else if (activeSubTab === 'promos') fetchPromos();
    else if (activeSubTab === 'products') fetchProducts();
    else if (activeSubTab === 'orders' || activeSubTab === 'cancelled_orders') fetchOrders();
  }, [activeSubTab]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <h2 className="page-title" style={{ marginBottom: '24px' }}>Admin Management Center</h2>

      {/* Header Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
        {[
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'products', label: 'Products', icon: Package },
          { key: 'orders', label: 'All Orders', icon: ClipboardList },
          { key: 'cancelled_orders', label: 'Cancelled Orders', icon: XCircle },
          { key: 'users', label: 'User Management', icon: Users },
          { key: 'promos', label: 'Promo Codes', icon: Tag },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                background: isActive ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 0 16px rgba(139, 92, 246, 0.3)' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeSubTab === 'overview' && (
        <AdminStats analytics={analytics} loading={analyticsLoading} />
      )}

      {activeSubTab === 'products' && (
        <AdminProductsTab
          products={products}
          loading={productsLoading}
          onRefresh={fetchProducts}
          addToast={addToast}
        />
      )}

      {activeSubTab === 'orders' && (
        <AdminOrdersTab
          orders={orders}
          loading={ordersLoading}
          showCancelledOnly={false}
          onRefresh={fetchOrders}
          addToast={addToast}
        />
      )}

      {activeSubTab === 'cancelled_orders' && (
        <AdminOrdersTab
          orders={orders}
          loading={ordersLoading}
          showCancelledOnly={true}
          onRefresh={fetchOrders}
          addToast={addToast}
        />
      )}

      {activeSubTab === 'users' && (
        <AdminUsersTab
          users={users}
          loading={usersLoading}
          onRefresh={fetchUsers}
          addToast={addToast}
        />
      )}

      {activeSubTab === 'promos' && (
        <AdminPromosTab
          promos={promos}
          loading={promosLoading}
          onRefresh={fetchPromos}
          addToast={addToast}
        />
      )}
    </div>
  );
}
