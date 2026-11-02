import { useState, useEffect } from 'react';
import { History, Calendar, MapPin, DollarSign, Package, XCircle } from 'lucide-react';
import { api } from '../utils/api';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  total: number;
  address: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  statusHistory?: { status: string; timestamp: string }[];
  createdAt: string;
}

export default function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await api.get('/orders');
        // Sort orders by date descending
        const sorted = data.sort(
          (a: Order, b: Order) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted);
      } catch (err: any) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleCancelOrder = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.patch(`/orders/${id}/cancel`);
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  if (loading) {
    return <div className="text-center" style={{ padding: '40px' }}>Loading order history...</div>;
  }

  if (error) {
    return <div className="no-data-msg">{error}</div>;
  }

  return (
    <div className="orders-container">
      <h2 className="page-title">Your Order History</h2>

      {orders.length === 0 ? (
        <div className="no-data-msg">
          <History size={40} style={{ marginBottom: '12px', color: '#71717a' }} />
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <span className="order-id">{order.id}</span>
                  <div className="order-date" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`order-status ${order.status}`}>
                    {order.status}
                  </span>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase' }}
                    >
                      <XCircle size={12} />
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Order Status Stepper */}
              {order.status !== 'cancelled' && (
                <div style={{ marginTop: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '12px', left: '10%', right: '10%', height: '2px', background: 'var(--glass-border)', zIndex: 0 }}></div>
                  {['pending', 'processing', 'shipped', 'delivered'].map((stepStatus) => {
                    const statusHistory = order.statusHistory || [];
                    const historyItem = statusHistory.find(h => h.status === stepStatus);
                    const isCompleted = !!historyItem ||
                      (order.status === 'processing' && stepStatus === 'pending') ||
                      (order.status === 'shipped' && (stepStatus === 'pending' || stepStatus === 'processing')) ||
                      (order.status === 'delivered' && stepStatus !== 'cancelled') ||
                      (order.status === 'completed' && stepStatus !== 'cancelled');
                    const isActive = order.status === stepStatus;

                    return (
                      <div key={stepStatus} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: isCompleted ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                          border: `2px solid ${isCompleted ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: '8px',
                          color: '#fff',
                          boxShadow: isActive ? '0 0 0 4px rgba(139, 92, 246, 0.2)' : 'none'
                        }}>
                          {isCompleted && <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }}></div>}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: isActive ? 'bold' : 'normal', color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {stepStatus}
                        </span>
                        {historyItem && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {new Date(historyItem.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="order-details-grid">
                {/* Left: list of items */}
                <div>
                  <h4 style={{ fontSize: '13px', color: '#71717a', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Package size={14} />
                    <span>Items Ordered</span>
                  </h4>
                  <div className="order-items-list">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <span>
                          {item.name}{' '}
                          <span style={{ color: '#71717a' }}>x{item.quantity}</span>
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: shipping address */}
                <div>
                  <h4 style={{ fontSize: '13px', color: '#71717a', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} />
                    <span>Delivery Address</span>
                  </h4>
                  <p className="order-address">{order.address}</p>
                </div>
              </div>

              <div className="order-total-price">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={16} />
                  <span>Amount Paid</span>
                </span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
