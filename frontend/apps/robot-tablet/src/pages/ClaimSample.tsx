import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sampleApi, memberApi, publishRobotCmd } from '@food-reality/shared/api'
import type { Sample, Member } from '@food-reality/shared/types'

const Icon = ({ name, fill, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span className={`material-symbols-outlined ${fill ? 'icon-fill' : ''} ${className}`}>{name}</span>
)

export default function ClaimSample() {
  const navigate = useNavigate()
  const [samples, setSamples] = useState<Sample[]>([])
  const [phone, setPhone] = useState('')
  const [member, setMember] = useState<Member | null>(null)
  const [claimed, setClaimed] = useState(false)
  const [claimedName, setClaimedName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { sampleApi.list().then(r => setSamples(r.data)).catch(() => {}) }, [])

  const handleClaim = async (sample: Sample) => {
    if (!phone || phone.length !== 11) { setError('请先输入11位手机号'); return }
    setError(''); setLoading(true)
    try {
      const mr = await memberApi.register(phone); setMember(mr.data)
      await sampleApi.claim(sample.id, mr.data.id)
      // 领取成功 → 通知机器人打开样品门
      publishRobotCmd('O')
      setClaimedName(sample.product_name); setClaimed(true)
    } catch (e: any) { setError(e.response?.data?.detail || '领取失败') } finally { setLoading(false) }
  }

  // ——— Success state ———
  if (claimed) {
    return (
      <div className="tablet-viewport bg-warm-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center max-w-[440px] w-full mx-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-mint-DEFAULT/10 flex items-center justify-center float">
            <Icon name="celebration" fill className="text-mint-DEFAULT text-[48px]" />
          </div>
          <h2 className="text-2xl font-black font-display mb-2">领取成功！</h2>
          <p className="text-warm-500 text-sm mb-1">{member?.name || member?.phone} 已成功领取</p>
          <p className="text-lg font-black text-mint-DEFAULT mb-8">「{claimedName}」</p>
          <button onClick={() => navigate('/')} className="w-full h-14 rounded-2xl border-2 border-warm-200 font-bold text-base hover:bg-warm-100 transition-colors">
            返回首页
          </button>
        </div>
      </div>
    )
  }

  // ——— Main state ———
  return (
    <div className="tablet-viewport bg-warm-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center px-8 py-5 border-b border-warm-200/60 flex-shrink-0">
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center hover:bg-warm-200 transition-colors">
          <Icon name="arrow_back" className="text-[20px]" />
        </button>
        <h1 className="text-lg font-black font-display ml-4">免费试饮</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[720px] mx-auto">

          {/* Phone input card */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] mb-8">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 grad-mint rounded-2xl flex items-center justify-center flex-shrink-0">
                <Icon name="local_cafe" className="text-white text-[24px]" />
              </div>
              <div>
                <h3 className="font-bold text-base">注册会员即可免费领取</h3>
                <p className="text-warm-500 text-xs mt-0.5">每位会员每种样品限领一次</p>
              </div>
            </div>
            <div className="relative">
              <Icon name="phone_iphone" className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-400 text-[20px]" />
              <input
                type="tel" maxLength={11} placeholder="请输入11位手机号" value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-warm-200 bg-warm-50 text-base font-bold placeholder:text-warm-400 placeholder:font-normal focus:outline-none focus:border-mint-DEFAULT focus:ring-4 focus:ring-mint-glow transition-all"
              />
            </div>
            {error && (
              <div className="mt-4 p-3.5 bg-red-50 rounded-xl text-sm text-red-600 font-medium flex items-center gap-2">
                <Icon name="error" fill className="text-[18px]" /> {error}
              </div>
            )}
          </div>

          {/* Sample list */}
          <div className="flex items-end justify-between mb-4">
            <h3 className="text-lg font-black font-display">可领取样品</h3>
            <p className="text-warm-500 text-xs">{samples.filter(s => s.remaining_count > 0).length} 款可领</p>
          </div>

          <div className="space-y-4">
            {samples.map(item => {
              const pct = item.total_count > 0 ? (item.remaining_count / item.total_count) * 100 : 0
              const out = item.remaining_count <= 0
              return (
                <div key={item.id} className={`bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] flex items-center gap-5 ${out ? 'opacity-60' : ''}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${out ? 'bg-warm-100' : 'bg-mint-DEFAULT/10'}`}>
                    <Icon name="emoji_food_beverage" className={`text-[32px] ${out ? 'text-warm-400' : 'text-mint-DEFAULT'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base">{item.product_name}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-warm-500 flex-shrink-0">
                        剩余 <strong className={out ? 'text-red-500' : 'text-mint-DEFAULT'}>{item.remaining_count}</strong> / {item.total_count}
                      </span>
                      <div className="flex-1 h-2 bg-warm-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${out ? 'bg-warm-300' : 'grad-mint'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={out || loading}
                    onClick={() => handleClaim(item)}
                    className={`px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform flex-shrink-0 flex items-center gap-1.5
                      ${out ? 'bg-warm-100 text-warm-400 cursor-not-allowed' : 'grad-mint text-white shadow-[0_4px_16px_rgba(58,183,149,0.2)]'}`}
                  >
                    <Icon name={out ? 'block' : 'redeem'} className="text-[18px]" />
                    {out ? '已领完' : '免费领取'}
                  </button>
                </div>
              )
            })}
          </div>

        </div>
      </main>
    </div>
  )
}
