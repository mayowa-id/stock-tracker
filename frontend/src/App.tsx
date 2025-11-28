import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

const SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL']

interface Quote {
  bid: number
  ask: number
  price: number
  change: number
  changePercent: number
  timestamp: number
}

interface ChartPoint {
  time: string
  price: number
}

function App() {
  const [selected, setSelected] = useState('AAPL')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [history, setHistory] = useState<ChartPoint[]>([])
  const [sma50, setSma50] = useState<number | null>(null)
  const ws = useRef<WebSocket | null>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, hRes, aRes] = await Promise.all([
          fetch(`http://localhost:3000/quotes/${selected}`).then(r => r.json()),
          fetch(`http://localhost:3000/historical/${selected}`).then(r => r.json()),
          fetch(`http://localhost:3000/analytics/${selected}`).then(r => r.json()),
        ])

        const lastPrice = qRes.askprice || qRes.bidprice || 0
        const prevClose = hRes.results?.[hRes.results.length - 2]?.c || lastPrice
        const change = lastPrice - prevClose
        const changePercent = prevClose ? (change / prevClose) * 100 : 0

        setQuote({
          bid: qRes.bidprice || 0,
          ask: qRes.askprice || 0,
          price: lastPrice,
          change,
          changePercent,
          timestamp: Date.now(),
        })

        const chartData = (hRes.results || []).map((bar: any) => ({
          time: format(new Date(bar.t), 'MMM dd'),
          price: bar.c,
        }))
        setHistory(chartData)
        setSma50(aRes.sma || null)
      } catch (err) {
        console.error('Failed to fetch data:', err)
      }
    }

    fetchData()
  }, [selected])

  // WebSocket real-time updates
  useEffect(() => {
    if (ws.current) ws.current.close()

    ws.current = new WebSocket(`ws://localhost:3000/ws/${selected}`)

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.ev === 'Q' && data.sym === selected) {
          const price = data.ap || data.bp || quote?.price || 0

          setQuote(prev => prev ? {
            ...prev,
            price,
            bid: data.bp || prev.bid,
            ask: data.ap || prev.ask,
          } : null)

          setHistory(prev => {
            const newPoint = { time: format(new Date(), 'HH:mm'), price }
            return [...prev.slice(-59), newPoint]
          })
        }
      } catch (err) {
        console.error('WS parse error:', err)
      }
    }

    return () => ws.current?.close()
  }, [selected, quote?.price])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Activity className="w-10 h-10 text-emerald-500" />
            Real-Time Stock Tracker
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-3 flex-wrap mb-8">
          {SYMBOLS.map(s => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selected === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Price Cards */}
        {quote && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
              <div className="text-5xl font-bold mb-2">${quote.price.toFixed(2)}</div>
              <div className={`text-2xl font-semibold flex items-center gap-2 ${quote.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {quote.change >= 0 ? <TrendingUp /> : <TrendingDown />}
                {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
              <div className="text-slate-400">Bid / Ask</div>
              <div className="text-3xl font-bold">{quote.bid.toFixed(2)} / {quote.ask.toFixed(2)}</div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
              <div className="text-slate-400">50-Day SMA</div>
              <div className="text-3xl font-bold text-amber-400">
                {sma50 ? `$${sma50.toFixed(2)}` : '—'}
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
          <h2 className="text-2xl font-bold mb-6">{selected} - Price Chart</h2>
          <div className="h-96">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} dot={false} />
                  {sma50 && (
                    <Line
                      type="monotone"
                      data={() => history.map(p => ({ ...p, sma: sma50 }))}
                      dataKey="sma"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="6 6"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Loading chart...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App