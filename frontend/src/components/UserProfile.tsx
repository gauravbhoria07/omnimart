import { useState } from 'react';
import { User, Phone, MapPin, Edit2, Check, Plus, Trash2 } from 'lucide-react';
import { api } from '../utils/api';

interface UserType {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  addresses: string[];
  phone?: string;
}

interface UserProfileProps {
  user: UserType;
  onUpdateUser: (updatedUser: UserType) => void;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export default function UserProfile({ user, onUpdateUser, addToast }: UserProfileProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newAddress, setNewAddress] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [editAddressValue, setEditAddressValue] = useState('');

  const handleStartEditAddress = (idx: number, currentAddress: string) => {
    setEditingAddressIndex(idx);
    setEditAddressValue(currentAddress);
  };

  const handleSaveEditAddress = async (idx: number) => {
    if (!editAddressValue.trim()) return;
    try {
      const updatedAddresses = [...user.addresses];
      updatedAddresses[idx] = editAddressValue.trim();
      const updated = await api.patch('/auth/profile', { addresses: updatedAddresses });
      onUpdateUser(updated);
      addToast('Address updated successfully', 'success');
      setEditingAddressIndex(null);
      setEditAddressValue('');
    } catch (err: any) {
      addToast(err.message || 'Failed to update address', 'error');
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await api.patch('/auth/profile', { name, phone });
      onUpdateUser(updated);
      addToast('Profile updated successfully', 'success');
      setIsEditingProfile(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) return;
    try {
      const updatedAddresses = [...user.addresses, newAddress.trim()];
      const updated = await api.patch('/auth/profile', { addresses: updatedAddresses });
      onUpdateUser(updated);
      addToast('Address added successfully', 'success');
      setNewAddress('');
      setIsAddingAddress(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to add address', 'error');
    }
  };

  const handleRemoveAddress = async (index: number) => {
    try {
      const updatedAddresses = user.addresses.filter((_, i) => i !== index);
      const updated = await api.patch('/auth/profile', { addresses: updatedAddresses });
      onUpdateUser(updated);
      addToast('Address removed', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to remove address', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      <h2 className="page-title">My Account Profile</h2>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '32px', display: 'flex', flexDirection: 'column' }}>
        {/* Personal Details Section */}
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '32px', borderRadius: 'var(--border-radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User className="text-violet-500" />
              <span>Personal Details</span>
            </h3>
            {!isEditingProfile ? (
              <button className="btn-secondary" onClick={() => setIsEditingProfile(true)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                <Edit2 size={14} />
                <span>Edit Profile</span>
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Full Name</label>
              {isEditingProfile ? (
                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} />
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  {user.name}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                {user.email} <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>(Cannot be changed)</span>
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              {isEditingProfile ? (
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                  <input type="tel" className="form-input" style={{ paddingLeft: '40px' }} placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  {user.phone || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No phone number provided</span>}
                </div>
              )}
            </div>
          </div>

          {isEditingProfile && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
                <Check size={16} />
                <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button className="btn-secondary" onClick={() => { setIsEditingProfile(false); setName(user.name); setPhone(user.phone || ''); }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Addresses Section */}
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '32px', borderRadius: 'var(--border-radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin className="text-violet-500" />
              <span>Saved Addresses</span>
            </h3>
            {!isAddingAddress && (
              <button className="btn-primary" onClick={() => setIsAddingAddress(true)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                <Plus size={14} />
                <span>Add Address</span>
              </button>
            )}
          </div>

          {isAddingAddress && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>New Address</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="123 Main St, City, Country, ZIP"
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button className="btn-primary" onClick={handleAddAddress}>Save Address</button>
                <button className="btn-secondary" onClick={() => setIsAddingAddress(false)}>Cancel</button>
              </div>
            </div>
          )}

          {user.addresses.length === 0 ? (
            <div className="no-data-msg">No saved addresses yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {user.addresses.map((address, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  {editingAddressIndex === idx ? (
                    <div style={{ flex: 1, marginRight: '16px' }}>
                      <textarea
                        className="form-input"
                        rows={3}
                        value={editAddressValue}
                        onChange={e => setEditAddressValue(e.target.value)}
                        style={{ width: '100%', resize: 'vertical', marginBottom: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-primary" onClick={() => handleSaveEditAddress(idx)} style={{ padding: '6px 12px', fontSize: '12px' }}>Save</button>
                        <button className="btn-secondary" onClick={() => setEditingAddressIndex(null)} style={{ padding: '6px 12px', fontSize: '12px' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{ margin: 0, lineHeight: 1.5, flex: 1 }}>{address}</p>
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                        <button className="btn-secondary" onClick={() => handleStartEditAddress(idx, address)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button className="btn-danger" onClick={() => handleRemoveAddress(idx)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
