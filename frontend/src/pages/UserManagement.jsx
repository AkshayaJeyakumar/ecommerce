import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`
const sentimentColor = { positive: '#10b981', neutral: '#f59e0b', negative: '#ef4444' }

// ── Customer Detail Panel (purchase + review history) ──
function CustomerDetailPanel({ user, orders, reviews, onClose }) {
    const userOrders = orders.filter(o => (o.user?._id || o.user) === user._id)
    const userReviews = reviews.filter(r => (r.user?._id || r.user) === user._id)
    const [detailTab, setDetailTab] = useState('purchases')

    const totalSpent = userOrders
        .filter(o => o.status === 'delivered')
        .reduce((s, o) => s + (o.totalAmount || 0), 0)

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
                onClick={onClose}>
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-2xl rounded-2xl overflow-hidden"
                    style={{ background: '#0a0d1a', border: '1px solid #1e2240', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1e2240' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                                {(user.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="font-grotesk font-bold text-white">{user.name || user.username}</div>
                                <div className="text-xs" style={{ color: '#4a5580' }}>{user.email}</div>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: '#1e2240', color: 'white' }}>✕</button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 px-5 py-3" style={{ borderBottom: '1px solid #1e2240' }}>
                        {[
                            { label: 'Orders', value: userOrders.length, color: '#6c63ff' },
                            { label: 'Total Spent', value: fmt(totalSpent), color: '#10b981' },
                            { label: 'Reviews', value: userReviews.length, color: '#f59e0b' },
                        ].map(s => (
                            <div key={s.label} className="text-center py-2 rounded-xl" style={{ background: '#0f1224' }}>
                                <div className="font-grotesk font-bold text-lg" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-xs" style={{ color: '#4a5580' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 px-5 pt-3" style={{ borderBottom: '1px solid #1e2240' }}>
                        {[
                            { id: 'purchases', label: '🛒 Purchases' },
                            { id: 'reviews', label: '⭐ Reviews & Ratings' },
                        ].map(t => (
                            <button key={t.id} onClick={() => setDetailTab(t.id)}
                                className="px-4 py-2 text-sm font-semibold"
                                style={{
                                    color: detailTab === t.id ? '#6c63ff' : '#4a5580',
                                    borderBottom: detailTab === t.id ? '2px solid #6c63ff' : '2px solid transparent'
                                }}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                        {detailTab === 'purchases' && (
                            userOrders.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">No orders yet.</div>
                            ) : userOrders.map(order => (
                                <div key={order._id} className="p-4 rounded-xl" style={{ background: 'rgba(30,34,64,0.3)', border: '1px solid #1e2240' }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs font-mono" style={{ color: '#4a5580' }}>
                                            #{(order._id || '').slice(-8).toUpperCase()}
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                                            style={{
                                                background: order.status === 'delivered' ? 'rgba(16,185,129,0.1)'
                                                    : order.status === 'pending' ? 'rgba(245,158,11,0.1)'
                                                        : 'rgba(108,99,255,0.1)',
                                                color: order.status === 'delivered' ? '#10b981'
                                                    : order.status === 'pending' ? '#f59e0b'
                                                        : '#a5b4fc'
                                            }}>
                                            {order.status}
                                        </span>
                                    </div>
                                    {/* Products in order */}
                                    <div className="space-y-2">
                                        {(order.items || []).map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <img src={item.image || `https://picsum.photos/seed/${idx}/40/40`} alt={item.name}
                                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                                    onError={e => { e.target.src = `https://picsum.photos/seed/${idx}/40/40` }} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-white truncate">{item.name || item.product?.name}</div>
                                                    <div className="text-xs" style={{ color: '#4a5580' }}>Qty: {item.quantity} × {fmt(item.price)}</div>
                                                </div>
                                                <div className="text-sm font-semibold" style={{ color: '#6c63ff' }}>
                                                    {fmt((item.price || 0) * (item.quantity || 1))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2" style={{ borderTop: '1px solid #1e2240' }}>
                                        <span className="text-xs" style={{ color: '#4a5580' }}>
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                        </span>
                                        <span className="text-sm font-bold" style={{ color: '#10b981' }}>{fmt(order.totalAmount || 0)}</span>
                                    </div>
                                </div>
                            ))
                        )}

                        {detailTab === 'reviews' && (
                            userReviews.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">No reviews written yet.</div>
                            ) : userReviews.map((r, i) => (
                                <div key={r._id || i} className="p-4 rounded-xl" style={{ background: 'rgba(30,34,64,0.3)', border: '1px solid #1e2240' }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-semibold text-white">
                                            {r.product?.name || 'Product'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Star rating */}
                                            <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                                                {'★'.repeat(Math.min(r.rating || 0, 5))}{'☆'.repeat(Math.max(0, 5 - (r.rating || 0)))}
                                            </span>
                                            <span className="text-xs text-white font-bold">{r.rating?.toFixed(1)}</span>
                                            {r.sentiment && (
                                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                    style={{ background: `${sentimentColor[r.sentiment]}15`, color: sentimentColor[r.sentiment] }}>
                                                    {r.sentiment}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm" style={{ color: '#94a3b8' }}>{r.reviewText || r.text || '—'}</p>
                                    <div className="text-xs mt-2" style={{ color: '#3a4070' }}>
                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// ── Main UserManagement page ────────────────────────────────────────
export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [orders, setOrders] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleTab, setRoleTab] = useState('all')
    const [selectedUser, setSelectedUser] = useState(null)

    useEffect(() => {
        Promise.all([
            axios.get('/api/analytics/users').catch(() => ({ data: [] })),
            axios.get('/api/orders/all').catch(() => ({ data: [] })),
            axios.get('/api/reviews').catch(() => ({ data: { reviews: [] } })),
        ]).then(([u, o, r]) => {
            setUsers(u.data || [])
            setOrders(o.data || [])
            setReviews(r.data.reviews || [])
            setLoading(false)
        })
    }, [])

    function orderCountFor(userId) {
        return orders.filter(o => (o.user?._id || o.user) === userId).length
    }
    function spentBy(userId) {
        return orders.filter(o => (o.user?._id || o.user) === userId && o.status === 'delivered')
            .reduce((s, o) => s + (o.totalAmount || 0), 0)
    }
    function reviewCountFor(userId) {
        return reviews.filter(r => (r.user?._id || r.user) === userId).length
    }

    const filtered = users.filter(u => {
        const q = search.toLowerCase()
        const match = (u.name || u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
        if (roleTab === 'admin') return match && u.role === 'admin'
        if (roleTab === 'customer') return match && u.role !== 'admin'
        return match
    })

    const stat = (label, value, color) => (
        <div className="rounded-2xl p-4 text-center" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
            <div className="font-grotesk font-bold text-2xl" style={{ color }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: '#4a5580' }}>{label}</div>
        </div>
    )

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">User Management</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>
                    Click any customer to view their full purchase history, reviews & ratings
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stat('Total Users', users.length, '#6c63ff')}
                {stat('Customers', users.filter(u => u.role !== 'admin').length, '#10b981')}
                {stat('Admins', users.filter(u => u.role === 'admin').length, '#ef4444')}
                {stat('Total Orders', orders.length, '#f59e0b')}
            </div>

            {/* Filter + Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#0f1224', border: '1px solid #1e2240' }} />
                <div className="flex gap-2">
                    {['all', 'customer', 'admin'].map(t => (
                        <button key={t} onClick={() => setRoleTab(t)}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold capitalize"
                            style={{
                                background: roleTab === t ? 'rgba(108,99,255,0.15)' : '#0f1224',
                                color: roleTab === t ? '#a5b4fc' : '#4a5580',
                                border: `1px solid ${roleTab === t ? 'rgba(108,99,255,0.3)' : '#1e2240'}`
                            }}>
                            {t === 'all' ? 'All Users' : t === 'customer' ? 'Customers' : 'Admins'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <table className="w-full text-left">
                    <thead>
                        <tr style={{ borderBottom: '1px solid #1e2240', background: 'rgba(30,34,64,0.4)' }}>
                            {['User', 'Email', 'Role', 'Orders', 'Reviews', 'Total Spent', 'Action'].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a5580' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-10 text-slate-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10 text-slate-500">No users found.</td></tr>
                        ) : filtered.map((u, i) => {
                            const isAdm = u.role === 'admin'
                            const count = orderCountFor(u._id)
                            const spent = spentBy(u._id)
                            const revCount = reviewCountFor(u._id)
                            return (
                                <motion.tr key={u._id}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                    className="hover:bg-white/2 cursor-pointer transition-colors"
                                    style={{ borderBottom: '1px solid rgba(30,34,64,0.5)' }}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                style={{ background: isAdm ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                                                {(u.name || u.username || 'U')[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-white">{u.name || u.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{u.email || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                                            style={{ background: isAdm ? 'rgba(239,68,68,0.1)' : 'rgba(108,99,255,0.1)', color: isAdm ? '#ef4444' : '#a5b4fc' }}>
                                            {u.role || 'customer'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-400">{count}</td>
                                    <td className="px-4 py-3 text-sm text-slate-400">{revCount}</td>
                                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#10b981' }}>{spent > 0 ? fmt(spent) : '—'}</td>
                                    <td className="px-4 py-3">
                                        {!isAdm && (
                                            <button onClick={() => setSelectedUser(u)}
                                                className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white transition-all"
                                                style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)' }}>
                                                View Details →
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Customer Detail Panel */}
            {selectedUser && (
                <CustomerDetailPanel
                    user={selectedUser}
                    orders={orders}
                    reviews={reviews}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    )
}
