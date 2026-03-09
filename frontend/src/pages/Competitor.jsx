import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import axios from 'axios'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`
const CAT_COLORS = ['#6c63ff', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6']

export default function Competitor() {
    const [products, setProducts] = useState([])
    const [cat, setCat] = useState('All')
    const [selected, setSelected] = useState(null)
    const [categories, setCategories] = useState([])

    useEffect(() => {
        axios.get('/api/products').then(r => {
            setProducts(r.data)
            const cats = [...new Set(r.data.map(p => p.category))]
            setCategories(['All', ...cats])
            if (r.data.length) setSelected(r.data[0]._id)
        })
    }, [])

    const filtered = cat === 'All' ? products : products.filter(p => p.category === cat)
    const selectedProduct = products.find(p => p._id === selected) || products[0]

    const chartData = selectedProduct ? {
        labels: ['Our AI Price', 'Competitor Price', 'Base Price'],
        datasets: [{
            label: 'Price (₹)',
            data: [selectedProduct.aiPrice, selectedProduct.competitorPrice, selectedProduct.basePrice],
            backgroundColor: ['rgba(108,99,255,0.85)', 'rgba(14,165,233,0.7)', 'rgba(100,116,139,0.5)'],
            borderRadius: 8, borderSkipped: false,
        }]
    } : null

    // Category-level summary
    const catSummary = categories.filter(c => c !== 'All').map((c, i) => {
        const ps = products.filter(p => p.category === c)
        if (!ps.length) return null
        const avgAI = ps.reduce((s, p) => s + p.aiPrice, 0) / ps.length
        const avgComp = ps.reduce((s, p) => s + p.competitorPrice, 0) / ps.length
        const diff = ((avgAI - avgComp) / avgComp * 100).toFixed(1)
        return { cat: c, avgAI, avgComp, diff, color: CAT_COLORS[i % CAT_COLORS.length], count: ps.length }
    }).filter(Boolean)

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">Competitor Price Tracker</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>AI price vs competitor price · market positioning by category</p>
            </div>

            {/* Category summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {catSummary.slice(0, 4).map((s, i) => (
                    <motion.div key={s.cat} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="rounded-2xl p-4" style={{ background: '#0f1224', border: `1px solid ${s.color}25` }}>
                        <div className="text-xs font-semibold truncate mb-2" style={{ color: s.color }}>{s.cat}</div>
                        <div className="font-grotesk font-bold text-lg text-white">{fmt(Math.round(s.avgAI))}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>Avg AI Price</div>
                        <div className="mt-2 text-xs font-semibold"
                            style={{ color: parseFloat(s.diff) <= 0 ? '#10b981' : '#f59e0b' }}>
                            {parseFloat(s.diff) <= 0 ? '✓ Below competitor' : `⚠ ${s.diff}% above competitor`}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Product selector */}
                <div className="lg:col-span-2 rounded-2xl p-4" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    {/* Category filter */}
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {categories.slice(0, 5).map(c => (
                            <button key={c} onClick={() => setCat(c)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                                style={cat === c ? { background: '#6c63ff', color: 'white' } : { background: 'rgba(30,34,64,0.5)', color: '#4a5580' }}>
                                {c === 'All' ? 'All' : c.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                    <div className="font-grotesk font-semibold text-xs text-white mb-2 uppercase tracking-wider" style={{ color: '#4a5580' }}>Select Product</div>
                    <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 320 }}>
                        {filtered.slice(0, 30).map(p => {
                            const diff = ((p.aiPrice - p.competitorPrice) / p.competitorPrice * 100).toFixed(1)
                            const isBelow = parseFloat(diff) <= 0
                            return (
                                <button key={p._id} onClick={() => setSelected(p._id)}
                                    className="w-full text-left p-2.5 rounded-xl transition-all"
                                    style={selected === p._id
                                        ? { background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)' }
                                        : { background: 'rgba(30,34,64,0.3)', border: '1px solid transparent' }}>
                                    <div className="text-xs font-medium text-white truncate">{p.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs" style={{ color: '#6c63ff' }}>AI {fmt(p.aiPrice)}</span>
                                        <span className="text-xs font-bold" style={{ color: isBelow ? '#10b981' : '#f59e0b' }}>
                                            {isBelow ? '✓' : ''}{diff}%
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Chart */}
                <div className="lg:col-span-3 rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    {selectedProduct && (
                        <>
                            <div className="font-grotesk font-bold text-white mb-1">{selectedProduct.name}</div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,99,255,0.1)', color: '#a5b4fc' }}>{selectedProduct.category}</span>
                                {selectedProduct.aiPrice <= selectedProduct.competitorPrice
                                    ? <span className="text-xs font-semibold" style={{ color: '#10b981' }}>✓ Competitive Position: Better</span>
                                    : <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>⚠ {((selectedProduct.aiPrice / selectedProduct.competitorPrice - 1) * 100).toFixed(1)}% above competitor</span>
                                }
                            </div>
                            <div style={{ height: 220 }}>
                                <Bar data={chartData} options={{
                                    responsive: true, maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { ticks: { color: '#4a5580' }, grid: { display: false } },
                                        y: { ticks: { color: '#4a5580', callback: v => '₹' + Number(v).toLocaleString('en-IN') }, grid: { color: '#1e2240' } }
                                    }
                                }} />
                            </div>
                            {/* Detail row */}
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                {[
                                    { label: 'Our AI Price', val: fmt(selectedProduct.aiPrice), color: '#6c63ff' },
                                    { label: 'Competitor Price', val: fmt(selectedProduct.competitorPrice), color: '#0ea5e9' },
                                    { label: 'Base Price', val: fmt(selectedProduct.basePrice), color: '#6b7280' },
                                ].map(d => (
                                    <div key={d.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(30,34,64,0.4)' }}>
                                        <div className="font-grotesk font-bold" style={{ color: d.color }}>{d.val}</div>
                                        <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>{d.label}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Full table */}
            <div className="rounded-2xl p-5 overflow-x-auto" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-bold text-white mb-4">Full Price Comparison Table</div>
                <table className="w-full text-sm" style={{ minWidth: 600 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #1e2240' }}>
                            {['Product', 'Category', 'AI Price', 'Competitor', 'Base Price', 'Position'].map(h => (
                                <th key={h} className="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a5580' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.slice(0, 20).map((p, i) => {
                            const diff = ((p.aiPrice - p.competitorPrice) / p.competitorPrice * 100).toFixed(1)
                            const good = parseFloat(diff) <= 2
                            return (
                                <tr key={p._id} style={{ borderBottom: '1px solid rgba(30,34,64,0.5)' }}>
                                    <td className="py-2.5 text-white font-medium text-xs">{p.name}</td>
                                    <td className="py-2.5"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,99,255,0.1)', color: '#a5b4fc' }}>{p.category}</span></td>
                                    <td className="py-2.5 font-bold" style={{ color: '#6c63ff' }}>{fmt(p.aiPrice)}</td>
                                    <td className="py-2.5" style={{ color: '#94a3b8' }}>{fmt(p.competitorPrice)}</td>
                                    <td className="py-2.5" style={{ color: '#6b7280' }}>{fmt(p.basePrice)}</td>
                                    <td className="py-2.5">
                                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                            style={good ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' } : { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                                            {good ? '✓ Competitive' : `+${diff}%`}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
