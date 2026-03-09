import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import axios from 'axios'

ChartJS.register(ArcElement, Tooltip, Legend)

const sentimentColor = { positive: '#10b981', neutral: '#f59e0b', negative: '#ef4444' }
const sentimentEmoji = { positive: '😊', neutral: '😐', negative: '😠' }

export default function Sentiment() {
    const [data, setData] = useState(null)
    const [productId, setProductId] = useState('')
    const [products, setProducts] = useState([])

    async function filterByProduct(id) {
        setProductId(id)
        const url = id ? `/api/reviews?productId=${id}` : '/api/reviews'
        const r = await axios.get(url)
        setData(r.data)
    }

    useEffect(() => {
        // On initial load – load all
        axios.get('/api/products').then(r => setProducts(r.data))
        axios.get('/api/reviews').then(r => setData(r.data))
    }, [])

    const chartData = data ? {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
            data: [data.summary.positive, data.summary.neutral, data.summary.negative],
            backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'],
            borderWidth: 0
        }]
    } : null

    const priceImpact = data ? (
        data.summary.score > 70 ? { msg: '↑ Positive sentiment → AI raised price by 3%', color: '#10b981' }
            : data.summary.score > 50 ? { msg: '→ Neutral sentiment → no price change', color: '#f59e0b' }
                : { msg: '↓ Negative sentiment → AI reduced price by 5%', color: '#ef4444' }
    ) : null

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-grotesk font-bold text-xl text-white">Customer Sentiment Analysis</h2>
                    <p className="text-sm mt-1" style={{ color: '#4a5580' }}>NLP-based review classification · pricing impact</p>
                </div>
                <select value={productId} onChange={e => filterByProduct(e.target.value)}
                    className="px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#0f1224', border: '1px solid #1e2240', fontFamily: 'Inter' }}>
                    <option value="">All Products</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
            </div>

            {data && (
                <>
                    {/* Score cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Overall Score', val: `${data.summary.score}%`, color: '#6c63ff', bg: 'rgba(108,99,255,0.1)' },
                            { label: 'Positive', val: data.summary.positive, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                            { label: 'Neutral', val: data.summary.neutral, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                            { label: 'Negative', val: data.summary.negative, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                        ].map((c, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                className="rounded-2xl p-4 text-center" style={{ background: c.bg, border: `1px solid ${c.color}25` }}>
                                <div className="font-grotesk font-bold text-3xl" style={{ color: c.color }}>{c.val}</div>
                                <div className="text-xs mt-1" style={{ color: '#6b7280' }}>{c.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Donut chart */}
                        <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                            <div className="font-grotesk font-semibold text-white mb-4">Sentiment Distribution</div>
                            <div style={{ height: 200 }}>
                                <Doughnut data={chartData} options={{
                                    responsive: true, maintainAspectRatio: false, cutout: '70%',
                                    plugins: { legend: { labels: { color: '#6b7280', font: { size: 11 } } } }
                                }} />
                            </div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                className="mt-4 p-3 rounded-xl text-center text-sm font-semibold"
                                style={{ background: `${priceImpact.color}15`, color: priceImpact.color, border: `1px solid ${priceImpact.color}25` }}>
                                🤖 {priceImpact.msg}
                            </motion.div>
                        </div>

                        {/* Reviews list */}
                        <div className="lg:col-span-2 rounded-2xl p-5 overflow-y-auto" style={{ background: '#0f1224', border: '1px solid #1e2240', maxHeight: 420 }}>
                            <div className="font-grotesk font-semibold text-white mb-4">Customer Reviews</div>
                            {data.reviews.length === 0 ? (
                                <div className="text-center py-8" style={{ color: '#4a5580' }}>No reviews yet for this selection.</div>
                            ) : (
                                <div className="space-y-3">
                                    {data.reviews.map((r, i) => (
                                        <motion.div key={r._id || i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                            className="p-4 rounded-xl" style={{ background: 'rgba(30,34,64,0.3)', border: '1px solid #1e2240' }}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                                                        {(r.user?.name || r.user || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-white">{r.user?.name || r.user || 'Anonymous'}</div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="text-xs" style={{ color: '#4a5580' }}>
                                                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : r.date || ''}
                                                            </div>
                                                            {r.verifiedPurchase && (
                                                                <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>✓ Verified</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1"
                                                        style={{ background: `${sentimentColor[r.sentiment]}15`, color: sentimentColor[r.sentiment] }}>
                                                        {sentimentEmoji[r.sentiment]} {r.sentiment}
                                                    </span>
                                                    <span className="text-xs" style={{ color: '#f59e0b' }}>{'⭐'.repeat(Math.min(r.rating, 5))}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm mt-3" style={{ color: '#94a3b8' }}>{r.reviewText || r.text}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
