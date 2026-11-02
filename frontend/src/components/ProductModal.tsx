import { useState } from 'react';
import { X, ShoppingCart, ShieldAlert, Star, Heart } from 'lucide-react';
import { api } from '../utils/api';

interface ProductModalProps {
  product: any;
  user: any;
  onClose: () => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist?: (product: any, e: React.MouseEvent) => void;
}

export default function ProductModal({ product, user, onClose, onAddToCart, onToggleWishlist }: ProductModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addedReviews, setAddedReviews] = useState<any[]>([]);

  if (!product) return null;

  const reviews = addedReviews.length > 0 ? addedReviews : (product.reviews || []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const updatedProduct = await api.post(`/products/${product.id}/reviews`, { rating, comment });
      setAddedReviews(updatedProduct.reviews || []);
      setComment('');
      setRating(5);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        style={{ maxWidth: '800px', width: '90%', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'row' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="auth-close"
          onClick={onClose}
          aria-label="Close Product View"
          style={{ zIndex: 10, background: 'var(--bg-tertiary)' }}
        >
          <X size={20} />
        </button>

        {/* Left Side: Large Image */}
        <div style={{ flex: '1', minHeight: '400px', background: 'var(--bg-primary)' }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Right Side: Details */}
        <div style={{ flex: '1', padding: '40px', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', overflowY: 'auto', maxHeight: '85vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>
              {product.name}
            </h2>
            {onToggleWishlist && (
              <button
                onClick={(e) => onToggleWishlist(product, e)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: user?.wishlist?.includes(product.id) ? '#ef4444' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  marginLeft: '16px'
                }}
                title="Toggle Wishlist"
              >
                <Heart size={20} fill={user?.wishlist?.includes(product.id) ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              ${Number(product.price).toFixed(2)}
            </span>
            {averageRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '14px', background: 'rgba(255, 215, 0, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                <Star size={14} fill="currentColor" />
                <span style={{ fontWeight: 'bold' }}>{averageRating}</span>
                <span style={{ color: 'var(--text-muted)' }}>({reviews.length})</span>
              </div>
            )}
          </div>

          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '15px', marginBottom: '32px' }}>
            {product.description}
          </p>

          <div style={{ marginTop: 'auto' }}>
            {user && user.role === 'admin' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  fontSize: '13px',
                  color: 'var(--error)',
                  marginBottom: '24px'
                }}
              >
                <ShieldAlert size={18} />
                <span>Admin browsing mode (buying disabled)</span>
              </div>
            ) : (
              <button
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  marginBottom: '32px',
                  background: product.stockQuantity !== undefined && product.stockQuantity <= 0 ? 'var(--bg-tertiary)' : undefined,
                  color: product.stockQuantity !== undefined && product.stockQuantity <= 0 ? 'var(--text-muted)' : undefined,
                  cursor: product.stockQuantity !== undefined && product.stockQuantity <= 0 ? 'not-allowed' : undefined,
                }}
                disabled={product.stockQuantity !== undefined && product.stockQuantity <= 0}
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
              >
                <ShoppingCart size={20} />
                <span>{product.stockQuantity !== undefined && product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
            )}
          </div>

          {/* Reviews Section */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>Reviews</h3>

            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>No reviews yet. Be the first!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {reviews.map((rev: any, i: number) => (
                  <div key={i} style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{rev.userName}</span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            size={12}
                            fill={j < rev.rating ? "#FFD700" : "none"}
                            color={j < rev.rating ? "#FFD700" : "#52525b"}
                          />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {user ? (
              <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Write a Review</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button type="button" key={i} onClick={() => setRating(i + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Star
                        size={24}
                        fill={i < rating ? "#FFD700" : "none"}
                        color={i < rating ? "#FFD700" : "#52525b"}
                        style={{ transition: 'all 0.2s' }}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  required
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
                <button type="submit" className="btn-secondary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sign in to write a review.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
