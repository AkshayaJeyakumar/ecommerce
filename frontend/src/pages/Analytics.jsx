import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Line, Bar, Radar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, Filler, Tooltip, Legend } from 'chart.js'
import axios from 'axios'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, Filler, Tooltip, Legend)

const opts = (c = '#4a5580') => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: c, font: { size: 11 } } } },
    scales: { x: { ticks: { color: c }, grid: { color: '#1e2240' } }, y: { ticks: { color: c }, grid: { color: '#1e2240' } } }
})

export default function Analytics() {
    const [analytics, setAnalytics] = useState(null)
    const [products, setProducts] = useState([])

    useEffect(() => {
        axios.get('/api/analytics').then(r => setAnalytics(r.data))
        axios.get('/api/products').then(r => setProducts(r.data))
    }, [])

    if (!analytics) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#6c63ff' }} />
        </div>
    )

    const weeks = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const revenueChart = {
        labels: weeks,
        datasets: [
            { label: 'Revenue', data: analytics.weeklyRevenue, borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.08)', fill: true, tension: 0.4, pointRadius: 4 },
            { label: 'Orders×100', data: analytics.weeklyOrders.map(x => x * 100), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.4, pointRadius: 4 },
        ]
    }

    const demandChart = {
        labels: months,
        datasets: [{
            label: 'Demand %', data: analytics.demandTrend,
            backgroundColor: analytics.demandTrend.map(v => v > 75 ? 'rgba(16,185,129,0.7)' : v > 55 ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.7)'),
            borderRadius: 6, borderSkipped: false
        }]
    }

    const aiChangesChart = {
        labels: months,
        datasets: [{
            label: 'AI Price Change %', data: analytics.aiPriceChanges,
            borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.08)', fill: true, tension: 0.4, pointRadius: 3
        }]
    }

    const radarChart = {
        labels: products.map(p => p.name.split(' ')[0]),
        datasets: [
            { label: 'Demand', data: products.map(p => p.demand), borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.15)', pointBackgroundColor: '#6c63ff' },
            { label: 'Sentiment', data: products.map(p => p.sentiment), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', pointBackgroundColor: '#10b981' },
        ]
    }

    const kpis = [
        { label: 'Weekly Revenue', value: '₹36.0L', sub: '↑ 18.4%', color: '#6c63ff' },
        { label: 'Total Orders', value: '2,915', sub: '↑ 12.1%', color: '#10b981' },
        { label: 'Avg AI Adjustment', value: '+2.3%', sub: 'Last 7 days', color: '#f59e0b' },
        { label: 'Conversion Rate', value: '3.7%', sub: '↑ 0.4%', color: '#0ea5e9' },
    ]


    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">Analytics Dashboard</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>Performance metrics · AI pricing impact · Revenue trends</p>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                        <div className="font-grotesk font-bold text-3xl" style={{ color: k.color }}>{k.value}</div>
                        <div className="text-xs mt-2" style={{ color: '#4a5580' }}>{k.label}</div>
                        <div className="text-xs mt-1 font-semibold" style={{ color: k.color }}>{k.sub}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-bold text-white mb-4">📈 Revenue & Orders Trend</div>
                    <div style={{ height: 220 }}><Line data={revenueChart} options={opts()} /></div>
                </div>
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-bold text-white mb-4">📊 Demand by Month</div>
                    <div style={{ height: 220 }}><Bar data={demandChart} options={{ ...opts(), plugins: { legend: { display: false } } }} /></div>
                </div>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-bold text-white mb-4">🤖 AI Price Change History</div>
                    <div style={{ height: 220 }}><Line data={aiChangesChart} options={opts()} /></div>
                </div>
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-bold text-white mb-4">🎯 Demand vs Sentiment (Radar)</div>
                    <div style={{ height: 220 }}>
                        <Radar data={radarChart} options={{
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { labels: { color: '#6b7280', font: { size: 11 } } } },
                            scales: { r: { ticks: { color: '#4a5580', backdropColor: 'transparent' }, grid: { color: '#1e2240' }, pointLabels: { color: '#6b7280', font: { size: 10 } } } }
                        }} />
                    </div>
                </div>
            </div>

            {/* AI Insights */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-bold text-white mb-4">💡 AI Revenue Optimization Tips</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { icon: '💰', title: 'Best Price Window', tip: '4K Gaming Monitor is at peak demand. Maintain elevated price for 48h to maximize revenue.', color: '#6c63ff' },
                        { icon: '🎯', title: 'Discount Strategy', tip: 'Smart Fitness Watch has declining demand. Apply 10% flash discount to re-engage Price-sensitive segment.', color: '#10b981' },
                        { icon: '📦', title: 'Inventory Alert', tip: '4K Gaming Monitor stock at 15 units. Restock soon or apply +5% scarcity premium to limit demand.', color: '#f59e0b' },
                    ].map((tip, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="p-4 rounded-xl" style={{ background: `${tip.color}08`, border: `1px solid ${tip.color}25` }}>
                            <div className="text-2xl mb-2">{tip.icon}</div>
                            <div className="text-sm font-semibold text-white mb-2">{tip.title}</div>
                            <div className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{tip.tip}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
