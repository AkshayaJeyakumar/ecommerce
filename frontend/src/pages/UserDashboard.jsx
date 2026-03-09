import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { AuthContext } from '../App'

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

const STATUS_META = {
    pending: { label: 'Pending', color: '#f59e0b', icon: '⏳', step: 0 },
    accepted: { label: 'Accepted', color: '#0ea5e9', icon: '✅', step: 1 },
    rejected: { label: 'Rejected', color: '#ef4444', icon: '❌', step: -1 },
    shipped: { label: 'Shipped', color: '#6c63ff', icon: '📦', step: 2 },
    out_for_delivery: { label: 'Out for Delivery', color: '#8b5cf6', icon: '🚚', step: 3 },
    delivered: { label: 'Delivered', color: '#10b981', icon: '🎉', step: 4 },
    return_requested: { label: 'Return Requested', color: '#f59e0b', icon: '↩️', step: 5 },
    returned: { label: 'Returned', color: '#6b7280', icon: '↩️', step: 6 },
    exchange_requested: { label: 'Exchange Requested', color: '#f59e0b', icon: '🔄', step: 5 },
    exchanged: { label: 'Exchanged', color: '#10b981', icon: '🔄', step: 6 },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: '🚫', step: -1 },
}

const TIMELINE_STEPS = [
    { key: 'pending', label: 'Ordered' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
]

function OrderTimeline({ status }) {
    const currentStep = STATUS_META[status]?.step ?? 0
    if (currentStep < 0) return null
    return (
        <div className="flex items-center gap-0 mt-3 mb-1">
            {TIMELINE_STEPS.map((s, i) => {
                const done = i <= currentStep
                const active = i === currentStep
                return (
                    <div key={s.key} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                                style={{
                                    background: done ? '#6c63ff' : '#1e2240',
                                    color: done ? 'white' : '#4a5580',
                                    border: active ? '2px solid #6c63ff' : '2px solid transparent',
                                    boxShadow: active ? '0 0 8px rgba(108,99,255,0.6)' : 'none',
                                }}>
                                {done ? '✓' : i + 1}
                            </div>
                            <div className="text-xs mt-1 whitespace-nowrap" style={{ color: done ? '#6c63ff' : '#4a5580', fontSize: '9px' }}>
                                {s.label}
                            </div>
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                            <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all"
                                style={{ background: i < currentStep ? '#6c63ff' : '#1e2240' }} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function OrderCard({ order, onAction }) {
    const meta = STATUS_META[order.status] || STATUS_META.pending
    const [showReturn, setShowReturn] = useState(false)
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    async function action(type, extra = {}) {
        setLoading(true)
        try {
            await axios.put(`/api/orders/${order._id}/${type}`, extra)
            onAction()
        } catch (e) { alert(e.response?.data?.message || 'Action failed') }
        setLoading(false)
    }

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>

            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div>
                    <div className="text-xs font-mono" style={{ color: '#4a5580' }}>#{order._id?.slice(-8).toUpperCase()}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-grotesk font-bold text-white text-base">{fmt(order.totalAmount)}</div>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold mt-1"
                        style={{ background: `${meta.color}18`, color: meta.color }}>
                        {meta.icon} {meta.label}
                    </span>
                </div>
            </div>

            {/* Status timeline */}
            <OrderTimeline status={order.status} />

            {/* Items */}
            <div className="flex flex-wrap gap-2 mt-3">
                {order.items?.map((item, j) => (
                    <div key={j} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
                        style={{ background: 'rgba(30,34,64,0.6)', border: '1px solid #1e2240' }}>
                        <span className="text-slate-200 font-medium">{item.name}</span>
                        <span style={{ color: '#6c63ff' }}>× {item.quantity}</span>
                        {item.price > 0 && <span style={{ color: '#4a5580' }}>· {fmt(item.price)}</span>}
                    </div>
                ))}
            </div>

            {/* Address */}
            {order.address?.city && (
                <div className="mt-2 text-xs" style={{ color: '#4a5580' }}>
                    📍 {[order.address.street, order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(', ')}
                </div>
            )}

            {/* Admin note */}
            {order.adminNote && (
                <div className="mt-2 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(249,115,22,0.08)', color: '#f97316' }}>
                    📋 Admin: {order.adminNote}
                </div>
            )}

            {/* Action buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
                {order.status === 'out_for_delivery' && (
                    <motion.button onClick={() => action('confirm-delivery')} disabled={loading}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
                        🎉 Confirm Delivery
                    </motion.button>
                )}

                {order.status === 'shipped' && (
                    <div className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(108,99,255,0.1)', color: '#6c63ff' }}>
                        📦 Your order is on the way! Awaiting delivery confirmation.
                    </div>
                )}

                {order.status === 'delivered' && !showReturn && (
                    <>
                        <motion.button onClick={() => setShowReturn('return')}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            className="px-4 py-2 rounded-xl text-sm font-semibold"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            ↩️ Return
                        </motion.button>
                        <motion.button onClick={() => setShowReturn('exchange')}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            className="px-4 py-2 rounded-xl text-sm font-semibold"
                            style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}>
                            🔄 Exchange
                        </motion.button>
                    </>
                )}

                {order.status === 'delivered' && showReturn && (
                    <div className="w-full space-y-2">
                        <textarea value={reason} onChange={e => setReason(e.target.value)}
                            placeholder={`Please describe your ${showReturn} reason...`} rows={2}
                            className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                            style={{ background: '#1a1e38', border: '1px solid #1e2240' }} />
                        <div className="flex gap-2">
                            <motion.button onClick={() => action(showReturn, { reason })} disabled={loading}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                                style={{ background: showReturn === 'return' ? '#ef4444' : '#f97316' }}>
                                Submit {showReturn === 'return' ? '↩️ Return' : '🔄 Exchange'}
                            </motion.button>
                            <button onClick={() => { setShowReturn(false); setReason('') }}
                                className="px-4 py-2 rounded-xl text-sm font-semibold"
                                style={{ color: '#6b7280' }}>Cancel</button>
                        </div>
                    </div>
                )}

                {['return_requested', 'exchange_requested'].includes(order.status) && (
                    <div className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(249,115,22,0.08)', color: '#f97316' }}>
                        ⏳ Your {order.status === 'return_requested' ? 'return' : 'exchange'} request is being processed by the admin.
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export default function UserDashboard() {
    const { user } = useContext(AuthContext)
    const [tab, setTab] = useState('orders')
    const [orders, setOrders] = useState([])
    const [wishlist, setWishlist] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    function loadData() {
        Promise.all([
            axios.get('/api/orders/my'),
            axios.get('/api/orders/wishlist'),
            axios.get('/api/reviews'),
        ]).then(([o, w, r]) => {
            setOrders(o.data)
            setWishlist(w.data)
            const myId = user?.id || user?._id
            const allReviews = r.data.reviews || []
            setReviews(allReviews.filter(rv => {
                const rId = rv.user?._id || rv.user?.id || rv.user
                return rId === myId
            }))
            setLoading(false)
        }).catch(() => setLoading(false))
    }

    useEffect(() => { loadData() }, [user])

    const totalSpent = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalAmount || 0), 0)

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">My Dashboard</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>Welcome back, {user?.name} 👋</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Orders', value: orders.length, icon: '🛒', color: '#6c63ff' },
                    { label: 'Total Spent', value: fmt(totalSpent), icon: '💰', color: '#10b981' },
                    { label: 'Wishlist Items', value: wishlist.length, icon: '❤️', color: '#f43f5e' },
                    { label: 'My Reviews', value: reviews.length, icon: '⭐', color: '#f59e0b' },
                ].map((s, i) => (
                    <motion.div key={s.label}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="rounded-2xl p-4" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                        <div className="text-2xl mb-2">{s.icon}</div>
                        <div className="font-grotesk font-bold text-2xl" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-xs mt-1" style={{ color: '#4a5580' }}>{s.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b" style={{ borderColor: '#1e2240' }}>
                {[
                    { key: 'orders', label: '🛒 My Orders' },
                    { key: 'wishlist', label: '❤️ Wishlist' },
                    { key: 'reviews', label: '⭐ My Reviews' },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className="px-4 py-2.5 text-sm font-semibold transition-all"
                        style={{
                            color: tab === t.key ? '#6c63ff' : '#4a5580',
                            borderBottom: tab === t.key ? '2px solid #6c63ff' : '2px solid transparent'
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#6c63ff' }} />
                </div>
            ) : (
                <AnimatePresence mode="wait">

                    {/* ── ORDERS ── */}
                    {tab === 'orders' && (
                        <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            {orders.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-5xl mb-3">🛍️</div>
                                    <div className="text-slate-400 mb-4">No orders yet. Start exploring products!</div>
                                    <a href="/products" className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                                        🛒 Browse Products
                                    </a>
                                </div>
                            ) : orders.map(order => (
                                <OrderCard key={order._id} order={order} onAction={loadData} />
                            ))}
                        </motion.div>
                    )}

                    {/* ── WISHLIST ── */}
                    {tab === 'wishlist' && (
                        <motion.div key="wishlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {wishlist.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">Your wishlist is empty. Browse products to add items!</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {wishlist.map((p, i) => (
                                        <motion.div key={p._id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                            className="rounded-2xl p-4 flex gap-3" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                                            <img src={`https://picsum.photos/seed/${encodeURIComponent(p.name)}/80/80`}
                                                alt={p.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white truncate">{p.name}</div>
                                                <div className="font-grotesk font-bold" style={{ color: '#6c63ff' }}>{fmt(p.aiPrice)}</div>
                                                <div className="text-xs" style={{ color: '#4a5580' }}>{p.category}</div>
                                                <a href="/products" className="text-xs mt-1 inline-block" style={{ color: '#6c63ff' }}>🛒 Buy now →</a>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── REVIEWS ── */}
                    {tab === 'reviews' && (
                        <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            {reviews.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">No reviews yet. Purchase products to write reviews!</div>
                            ) : reviews.map((r, i) => (
                                <motion.div key={r._id}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                    className="rounded-2xl p-4" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-white">{r.product?.name || 'Product'}</div>
                                            <div className="text-yellow-400 text-sm mt-0.5">{'⭐'.repeat(r.rating)}</div>
                                        </div>
                                        {r.verifiedPurchase && (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>✓ Verified</span>
                                        )}
                                    </div>
                                    <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>{r.reviewText || r.text}</p>
                                    <div className="text-xs mt-2" style={{ color: '#4a5580' }}>
                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : ''}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                </AnimatePresence>
            )}
        </div>
    )
}
