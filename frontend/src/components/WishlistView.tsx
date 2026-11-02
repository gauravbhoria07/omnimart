import { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { api } from '../utils/api';

interface WishlistViewProps {
  user: any;
  onAddToCart: (product: any) => void;
  onRemoveWishlist: (product: any, e: React.MouseEvent) => void;
  onProductClick: (product: any) => void;
}

export default function WishlistView({ user, onAddToCart, onRemoveWishlist, onProductClick }: WishlistViewProps) {
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      if (!user?.wishlist || user.wishlist.length === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }
      try {
        const ids = user.wishlist.join(',');
        const { data } = await api.get(`/products?ids=${ids}`);
        setWishlistProducts(data);
      } catch (err) {
        console.error('Failed to fetch wishlist products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user?.wishlist]);

  if (loading) {
    return <div className="text-center" style={{ padding: '40px' }}>Loading wishlist...</div>;
  }

  if (!user?.wishlist || user.wishlist.length === 0 || wishlistProducts.length === 0) {
    return (
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          padding: '48px',
          borderRadius: 'var(--border-radius-lg)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)',
          marginTop: '40px'
        }}
      >
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <Heart size={32} className="text-red-500" />
        </div>
        <h3 style={{ fontSize: '22px' }}>Your Wishlist is Empty</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '14px', lineHeight: '1.6' }}>
          Explore our catalog and add items you love to your wishlist to save them for later!
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '32px' }}>
      <h2 className="page-title" style={{ marginBottom: '24px' }}>My Wishlist</h2>
      <div className="products-grid">
        {wishlistProducts.map((product) => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => onProductClick(product)}
            style={{ cursor: 'pointer' }}
          >
            <div className="product-image-container" style={{ position: 'relative' }}>
              <img
                src={product.image}
                alt={product.name}
                className="product-image"
              />
              <span className="product-price-tag">
                ${Number(product.price).toFixed(2)}
              </span>
              <button
                onClick={(e) => onRemoveWishlist(product, e)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(4px)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ef4444',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Heart size={18} fill="currentColor" />
              </button>
            </div>

            <div className="product-details">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 className="product-title" style={{ margin: 0 }}>{product.name}</h3>
                {product.reviews && product.reviews.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '13px', flexShrink: 0 }}>
                    <Star size={12} fill="currentColor" />
                    <span style={{ fontWeight: 'bold' }}>
                      {(product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <p className="product-desc">{product.description}</p>
              <button
                className="btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product);
                }}
              >
                <ShoppingCart size={16} />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
