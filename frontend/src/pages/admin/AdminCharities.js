import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '', website: '', category: 'General', featured: false, image: '' };

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '', location: '' });
  const [addingEvent, setAddingEvent] = useState(null);

  const load = () => api.get('/charities').then(r => setCharities(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/charities/${editing}`, form);
        setCharities(prev => prev.map(c => c._id === editing ? res.data : c));
        toast.success('Charity updated!');
      } else {
        const res = await api.post('/charities', form);
        setCharities(prev => [res.data, ...prev]);
        toast.success('Charity added!');
      }
      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleEdit = (c) => {
    setEditing(c._id);
    setForm({ name: c.name, description: c.description, website: c.website || '', category: c.category, featured: c.featured, image: c.image || '' });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this charity?')) return;
    await api.delete(`/charities/${id}`);
    setCharities(prev => prev.filter(c => c._id !== id));
    toast.success('Charity deleted');
  };

  const handleAddEvent = async (charityId) => {
    try {
      const charity = charities.find(c => c._id === charityId);
      const events = [...(charity.events || []), newEvent];
      const res = await api.put(`/charities/${charityId}`, { events });
      setCharities(prev => prev.map(c => c._id === charityId ? res.data : c));
      toast.success('Event added!');
      setNewEvent({ title: '', date: '', description: '', location: '' });
      setAddingEvent(null);
    } catch (err) {
      toast.error('Failed to add event');
    }
  };

  return (
    <AdminLayout title="Charities">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div />
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); }}>
          {showForm ? 'Cancel' : '+ Add Charity'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{editing ? 'Edit Charity' : 'Add New Charity'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Charity Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Health, Education" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ resize: 'vertical' }} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Website URL</label>
                <input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://" />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://image-url.com" />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: '#86efac' }}>
              <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} style={{ width: 'auto' }} />
              Feature on homepage
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Charity' : 'Add Charity'}</button>
              <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? <div className="spinner" /> : charities.length === 0 ? (
        <div className="empty card"><h3>No charities yet</h3><p>Add your first charity above</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {charities.map(c => (
            <div key={c._id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1rem' }}>{c.name}</h3>
                    {c.featured && <span className="badge badge-gold">Featured</span>}
                    <span className="badge badge-dim">{c.category}</span>
                    <span className="badge badge-blue">{c.subscriberCount || 0} supporters</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#86efac', lineHeight: 1.5 }}>{c.description?.substring(0, 150)}</p>
                  {c.events?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#4b7a5a' }}>{c.events.length} event(s) · </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setAddingEvent(addingEvent === c._id ? null : c._id)}>+ Event</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>Delete</button>
                </div>
              </div>

              {/* Add Event */}
              {addingEvent === c._id && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #1f3527', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Add Event</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Charity Golf Day" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Golf Club, London" />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddEvent(c._id)}>Add Event</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
