import { useEffect, useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { AuthContext } from '../App'

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`
const sentimentColor = { positive: '#10b981', neutral: '#f59e0b', negative: '#ef4444' }

export default function MyReviews() {
    const { user } = useContext(AuthContext)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get('/api/reviews')
            .then(r => {
                const all = r.data.reviews || []
                const myId = user?.id || user?._id
                // Filter only this user's reviews
                const mine = all.filter(rv => {
                    const rId = rv.user?._id || rv.user?.id || rv.user
                    return String(rId) === String(myId)
                })
                setReviews(mine)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [user])

    return (
        <div className="space-y-5 max-w-2xl">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">⭐ My Reviews</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>
                    {reviews.length > 0
                        ? `${reviews.length} review${reviews.length !== 1 ? 's' : ''} you've written`
                        : 'Your reviews will appear here'}
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#6c63ff' }} />
                </div>
            ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
                    style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="text-6xl mb-4">⭐</div>
                    <div className="text-white font-semibold mb-2">No reviews yet</div>
                    <p className="text-sm text-center max-w-xs" style={{ color: '#4a5580' }}>
                        After purchasing and receiving a product, you can write a review from My Dashboard → My Orders.
                    </p>
                </div>
            ) : (
                <AnimatePresence>
                    <div className="space-y-3">
                        {reviews.map((r, i) => (
                            <motion.div key={r._id || i}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-5 rounded-2xl"
                                style={{ background: '#0f1224', border: '1px solid #1e2240' }}>

                                {/* Product info */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={r.product?.image || `https://picsum.photos/seed/${r.product?._id || i}/48/48`}
                                            alt={r.product?.name}
                                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                                            onError={e => { e.target.src = `https://picsum.photos/seed/${i}/48/48` }} />
                                        <div>
                                            <div className="text-sm font-semibold text-white">
                                                {r.product?.name || 'Product'}
                                            </div>
                                            <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>
                                                {r.product?.category || ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {r.sentiment && (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                style={{
                                                    background: `${sentimentColor[r.sentiment]}15`,
                                                    color: sentimentColor[r.sentiment]
                                                }}>
                                                {r.sentiment}
                                            </span>
                                        )}
                                        {r.verifiedPurchase && (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                                ✓ Verified
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Star rating */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <span key={s} className="text-lg"
                                                style={{ color: s <= (r.rating || 0) ? '#f59e0b' : '#1e2240' }}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-white">{r.rating?.toFixed(1) || '—'} / 5</span>
                                </div>

                                {/* Review text */}
                                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                                    {r.reviewText || r.text || 'No comment provided.'}
                                </p>

                                {/* Date */}
                                <div className="text-xs mt-3" style={{ color: '#3a4070' }}>
                                    Reviewed on {r.createdAt
                                        ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : '—'}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            )}
        </div>
    )
}
