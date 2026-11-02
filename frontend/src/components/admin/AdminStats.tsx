import { TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';

interface AdminStatsProps {
  analytics: any;
  loading: boolean;
}

export default function AdminStats({ analytics, loading }: AdminStatsProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
        Loading dashboard analytics...
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '24px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Revenue</p>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>${analytics.totalRevenue?.toFixed(2) || '0.00'}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '24px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Orders</p>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{analytics.totalOrders || 0}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '24px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236, 48, 153, 0.1)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(236, 48, 153, 0.2)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Average Order Value</p>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>${analytics.averageOrderValue?.toFixed(2) || '0.00'}</h3>
          </div>
        </div>
      </div>

      {/* Top Products */}
      {analytics.topProducts && analytics.topProducts.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '24px', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px' }}>Top Performing Products</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.topProducts.map((p: any, idx: number) => (
              <div key={idx} style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{p.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.quantity} units sold</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '14px' }}>${p.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
