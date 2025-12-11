import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Sun, Moon, Monitor } from 'lucide-react'
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

const ALL_SYMBOLS = [
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD', 'INTC', 'IBM',
  'ORCL', 'CSCO', 'SPY', 'QQQ', 'DIA', 'NFLX', 'DIS', 'BA', 'CAT', 'JPM', 'V', 'WMT'
]

const BACKEND_URL = 'http://localhost:3000' // Or your deployed URL

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
  const [selected, setSelected] = useState(ALL_SYMBOLS[0])
  const [favorites, setFavorites] = useState<string[]>(ALL_SYMBOLS.slice(0, 4))
  const [quote, setQuote] = useState<Quote | null>(null)
  const [history, setHistory] = useState<ChartPoint[]>([])
  const [sma50, setSma50] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto') // New: theme state
  const ws = useRef<WebSocket | null>(null)

  // Theme management (system + manual)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null
    if (savedTheme) setTheme(savedTheme)

    const applyTheme = (isDark: boolean) => {
      document.documentElement.classList.toggle('dark', isDark)
    }

    if (theme === 'auto') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(media.matches)

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches)
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    } else {
      applyTheme(theme === 'dark')
    }
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
  }

  // Load/save favorites
  useEffect(() => {
    const saved = localStorage.getItem('stockFavorites')
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('stockFavorites', JSON.stringify(favorites))
  }, [favorites])

  // Fetch initial data (unchanged, but here for completeness)
  useEffect(() => {
    setError(null)
    const fetchData = async () => {
      try {
        const [qRes, hRes, aRes] = await Promise.all([
          fetch(`${BACKEND_URL}/quotes/${selected}`).then(r => { if (!r.ok) throw new Error('Quote failed'); return r.json() }),
          fetch(`${BACKEND_URL}/historical/${selected}`).then(r => { if (!r.ok) throw new Error('Historical failed'); return r.json() }),
          fetch(`${BACKEND_URL}/analytics/${selected}`).then(r => { if (!r.ok) throw new Error('Analytics failed'); return r.json() }),
        ])

        const ask = qRes.askprice || 0
        const bid = qRes.bidprice || 0
        const lastPrice = (ask + bid) / 2 || ask || bid || 0
        const prevClose = hRes.results?.[hRes.results.length - 2]?.c || lastPrice
        const change = lastPrice - prevClose
        const changePercent = prevClose ? (change / prevClose) * 100 : 0

        setQuote({
          bid,
          ask,
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
        setError('Failed to load data. Check backend or API key.')
        console.error(err)
      }
    }

    fetchData()
  }, [selected])

  // WebSocket (unchanged)
  useEffect(() => {
    if (ws.current) ws.current.close()

    ws.current = new WebSocket(`${BACKEND_URL.replace('http', 'ws')}/ws/${selected}`)

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.ev === 'Q' && data.sym === selected) {
          const ask = data.ap || quote?.ask || 0
          const bid = data.bp || quote?.bid || 0
          const price = (ask + bid) / 2 || ask || bid || quote?.price || 0

          setQuote(prev => prev ? {
            ...prev,
            price,
            bid,
            ask,
          } : null)

          setHistory(prev => {
            const newPoint = { time: format(new Date(), 'HH:mm'), price }
            return [...prev.slice(-59), newPoint]
          })
        }
      } catch (err) {
        console.error('WS error:', err)
      }
    }

    return () => ws.current?.close()
  }, [selected, quote?.price])

  // Handle favorites
  const handleFavoritesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
    setFavorites(selectedOptions.slice(0, 4))
  }

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-950 text-black dark:text-white transition-colors`}>
      <div className="border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Activity className="w-10 h-10 text-emerald-500" />
            Real-Time Stock Tracker
          </h1>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-full bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'auto' ? <Monitor className="w-5 h-5 text-gray-700 dark:text-gray-300" /> :
             theme === 'light' ? <Sun className="w-5 h-5 text-yellow-500" /> :
             <Moon className="w-5 h-5 text-indigo-400" />}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Favorites Multi-Select Dropdown (Styled) */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Select up to 4 favorites:</label>
          <select
            multiple
            value={favorites}
            onChange={handleFavoritesChange}
            className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-black dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
            size={5}
          >
            {ALL_SYMBOLS.map(s => (
              <option key={s} value={s} className="py-2 px-3 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Quick-Switch Buttons */}
        <div className="flex gap-3 flex-wrap mb-8">
          {favorites.map(s => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selected === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-black dark:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Price Cards */}
        {quote && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-8 border border-gray-200 dark:border-slate-800">
              <div className="text-5xl font-bold mb-2">${quote.price.toFixed(2)}</div>
              <div className={`text-2xl font-semibold flex items-center gap-2 ${quote.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {quote.change >= 0 ? <TrendingUp /> : <TrendingDown />}
                {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-8 border border-gray-200 dark:border-slate-800">
              <div className="text-gray-500 dark:text-slate-400">Bid / Ask</div>
              <div className="text-3xl font-bold text-black dark:text-white">{quote.bid.toFixed(2)} / {quote.ask.toFixed(2)}</div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-8 border border-gray-200 dark:border-slate-800">
              <div className="text-gray-500 dark:text-slate-400">50-Day SMA</div>
              <div className="text-3xl font-bold text-amber-500">
                {sma50 ? `$${sma50.toFixed(2)}` : '—'}
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-8 border border-gray-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">{selected} - Price Chart</h2>
          <div className="h-96">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db dark:#334155" />
                  <XAxis dataKey="time" stroke="#6b7280 dark:#94a3b8" />
                  <YAxis stroke="#6b7280 dark:#94a3b8" />
                  <Tooltip
                    contentStyle={{ background: '#f9fafb dark:#1e293b', border: '1px solid #d1d5db dark:#334155', color: '#000 dark:#e2e8f0' }}
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
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-slate-500">
                {error ? 'No data available' : 'Loading chart...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App