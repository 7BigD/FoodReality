import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { queueApi } from '@food-reality/shared/api'
import type { Queue } from '@food-reality/shared/types'

const Icon = ({ name, fill, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span className={`material-symbols-outlined ${fill ? 'icon-fill' : ''} ${className}`}>{name}</span>
)

export default function TakeNumber() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [queue, setQueue] = useState<Queue | null>(null)

  const handleTakeNumber = async () => {
    setError(''); setLoading(true)
    try {
      const qr = await queueApi.takeNumber()
      setQueue(qr.data)
    } catch (e: any) {
      setError(e.response?.data?.detail || '取号失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // ——— 取号成功 ———
  if (queue) {
    return (
      <div className="tablet-viewport bg-warm-50 flex flex-col">
        <div className="tablet-scroll flex-1 flex items-start justify-center py-8 px-8">
          <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] text-center max-w-[440px] w-full">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-brand/10 flex items-center justify-center float">
              <Icon name="confirmation_number" fill className="text-brand text-[40px]" />
            </div>
            <h2 className="text-2xl font-black font-display mb-1">取号成功！</h2>
            <p className="text-warm-500 text-sm mb-5">请记住您的排队号码，等待叫号</p>

            {/* 号码大展示 */}
            <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-3xl bg-brand/5 border-2 border-brand/20 mb-6">
              <p className="text-[11px] text-brand font-bold uppercase tracking-widest">Your No.</p>
              <p className="text-5xl font-black text-brand font-display leading-none mt-2">{queue.queue_number}</p>
            </div>

            {/* 二维码区域 */}
            <div className="bg-warm-50 rounded-2xl p-4 mb-6 border border-warm-200/60">
              <p className="text-xs text-warm-500 font-medium mb-3">扫码查看排队进度</p>
              <svg className="mx-auto" width="100" height="100" viewBox="0 0 120 120" fill="none">
                <rect width="120" height="120" rx="8" fill="white"/>
                <rect x="8" y="8" width="28" height="28" rx="2" fill="#302e2b"/>
                <rect x="12" y="12" width="20" height="20" rx="1" fill="white"/>
                <rect x="16" y="16" width="12" height="12" rx="1" fill="#302e2b"/>
                <rect x="84" y="8" width="28" height="28" rx="2" fill="#302e2b"/>
                <rect x="88" y="12" width="20" height="20" rx="1" fill="white"/>
                <rect x="92" y="16" width="12" height="12" rx="1" fill="#302e2b"/>
                <rect x="8" y="84" width="28" height="28" rx="2" fill="#302e2b"/>
                <rect x="12" y="88" width="20" height="20" rx="1" fill="white"/>
                <rect x="16" y="92" width="12" height="12" rx="1" fill="#302e2b"/>
                {[
                  [42,8],[50,8],[58,8],[66,8],[74,8],
                  [42,16],[58,16],[74,16],
                  [42,24],[50,24],[66,24],
                  [8,42],[16,42],[24,42],[42,42],[50,42],[58,42],[66,42],[74,42],[84,42],[100,42],
                  [8,50],[24,50],[42,50],[66,50],[84,50],[92,50],
                  [8,58],[16,58],[42,58],[50,58],[58,58],[74,58],[84,58],[100,58],
                  [8,66],[24,66],[50,66],[58,66],[66,66],[84,66],[92,66],[100,66],
                  [8,74],[16,74],[24,74],[42,74],[58,74],[66,74],[84,74],[100,74],
                  [42,84],[58,84],[66,84],[84,84],[92,84],
                  [42,92],[50,92],[74,92],[84,92],[100,92],
                  [42,100],[58,100],[66,100],[84,100],[92,100],[100,100],
                ].map(([x, y], i) => (
                  <rect key={i} x={x} y={y} width="6" height="6" fill="#302e2b"/>
                ))}
              </svg>
              <p className="text-[11px] text-warm-400 mt-2">微信扫一扫，实时查看叫号进度</p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full h-12 rounded-2xl border-2 border-warm-200 font-bold text-base hover:bg-warm-100 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ——— 取号页 ———
  return (
    <div className="tablet-viewport bg-warm-50 flex flex-col">
      <header className="flex items-center px-8 py-5 border-b border-warm-200/60 flex-shrink-0">
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center hover:bg-warm-200 transition-colors">
          <Icon name="arrow_back" className="text-[20px]" />
        </button>
        <h1 className="text-lg font-black font-display ml-4">排队取号</h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-3xl p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center">
            <div className="w-20 h-20 grad-brand rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Icon name="confirmation_number" className="text-white text-[40px]" />
            </div>
            <h2 className="text-2xl font-black font-display mb-2">一键取号</h2>
            <p className="text-warm-500 text-sm mb-8">
              点击按钮获取排队号码<br/>
              <span className="text-xs">店员会在您的号码叫到时为您服务</span>
            </p>

            {error && (
              <div className="mb-6 p-3.5 bg-red-50 rounded-xl text-sm text-red-600 font-medium flex items-center gap-2">
                <Icon name="error" fill className="text-[18px]" /> {error}
              </div>
            )}

            <button
              onClick={handleTakeNumber}
              disabled={loading}
              className="w-full h-16 grad-brand rounded-2xl text-white font-bold text-lg shadow-[0_8px_24px_rgba(253,113,38,0.25)] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading
                ? <><Icon name="progress_activity" className="animate-spin text-[24px]" /> 取号中...</>
                : <><Icon name="add_circle" className="text-[24px]" /> 立即取号</>
              }
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
