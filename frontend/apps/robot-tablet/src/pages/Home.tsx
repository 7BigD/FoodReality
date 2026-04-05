import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { storeApi, productApi, queueApi, sampleApi } from '@food-reality/shared/api'
import type { Store, Product, QueueStatus, Sample } from '@food-reality/shared/types'

/* ——— Reusable icon helper ——— */
const Icon = ({ name, fill, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span className={`material-symbols-outlined ${fill ? 'icon-fill' : ''} ${className}`}>{name}</span>
)

export default function Home() {
  const navigate = useNavigate()
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [hotProducts, setHotProducts] = useState<Product[]>([])
  const [queue, setQueue] = useState<QueueStatus | null>(null)
  const [samples, setSamples] = useState<Sample[]>([])

  useEffect(() => {
    storeApi.get().then(r => setStore(r.data)).catch(() => {})
    productApi.list().then(r => setProducts(r.data)).catch(() => {})
    productApi.list(true).then(r => setHotProducts(r.data)).catch(() => {})
    queueApi.status().then(r => setQueue(r.data)).catch(() => {})
    sampleApi.list().then(r => setSamples(r.data)).catch(() => {})
    const t = setInterval(() => queueApi.status().then(r => setQueue(r.data)).catch(() => {}), 8000)
    return () => clearInterval(t)
  }, [])

  const availableSamples = samples.filter(s => s.remaining_count > 0)

  return (
    <div className="tablet-viewport bg-warm-50">
      <div className="tablet-scroll">

        {/* ============================================================
            HERO — Full-bleed cover image with overlay
            ============================================================ */}
        <section className="relative h-[320px] overflow-hidden">
          {/* Background image */}
          <img
            src={store?.cover_url || 'https://picsum.photos/seed/cover/1024/600'}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 grad-hero" />
          {/* Decorative shimmer */}
          <div className="absolute inset-0 shimmer pointer-events-none" />

          {/* Top bar: logo + store info */}
          <div className="relative z-10 flex items-center justify-between px-8 pt-6">
            <div className="flex items-center gap-3">
              {store?.logo_url && (
                <img src={store.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/20" />
              )}
              <div>
                <h1 className="text-white text-xl font-bold tracking-tight font-display">{store?.name}</h1>
                <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                  <Icon name="location_on" className="text-[13px]" />
                  {store?.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white/50 text-xs">
              <span className="flex items-center gap-1"><Icon name="schedule" className="text-[15px]" />{store?.business_hours}</span>
              <span className="flex items-center gap-1"><Icon name="call" className="text-[15px]" />{store?.phone}</span>
            </div>
          </div>

          {/* Hero CTA — the most important action on screen */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-8 pb-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">Queue Now</p>
                <h2 className="text-white text-3xl font-black font-display leading-none">排队取号</h2>
                <p className="text-white/60 text-sm mt-1.5">注册会员 · 领取AR眼镜 · 边玩边等</p>
              </div>
              <div className="flex items-center gap-5">
                {/* Live queue count */}
                <div className="text-right">
                  <p className="text-5xl font-black text-white font-display count-enter" key={queue?.total_waiting}>
                    {queue?.total_waiting ?? 0}
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">人等待中 · 约{queue?.estimated_wait_minutes ?? 0}分钟</p>
                </div>
                {/* CTA Button */}
                <button
                  onClick={() => navigate('/take-number')}
                  className="cta-pulse grad-brand text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-[0_8px_32px_rgba(253,113,38,0.35)] active:scale-95 transition-transform flex items-center gap-2"
                >
                  <Icon name="confirmation_number" fill className="text-[22px]" />
                  立即取号
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            INFO STRIP — 门店速览 + 免费试饮入口
            ============================================================ */}
        <section className="px-8 -mt-1">
          <div className="grid grid-cols-3 gap-4">
            {/* 等待时间 */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-light/10 flex items-center justify-center flex-shrink-0">
                <Icon name="hourglass_top" fill className="text-amber-DEFAULT text-[22px]" />
              </div>
              <div>
                <p className="text-[11px] text-warm-500 font-medium">预计等待</p>
                <p className="text-xl font-black text-amber-DEFAULT font-display leading-none mt-0.5">{queue?.estimated_wait_minutes ?? 0}<span className="text-xs font-bold ml-0.5">min</span></p>
              </div>
            </div>

            {/* 营业状态 */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-mint-DEFAULT/10 flex items-center justify-center flex-shrink-0">
                <Icon name="storefront" fill className="text-mint-DEFAULT text-[22px]" />
              </div>
              <div>
                <p className="text-[11px] text-warm-500 font-medium">营业状态</p>
                <p className="text-sm font-bold text-mint-DEFAULT leading-tight mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-mint-light mr-1 animate-pulse" />
                  营业中
                </p>
              </div>
            </div>

            {/* 免费试饮 */}
            <button
              onClick={() => navigate('/sample')}
              className="bg-white rounded-2xl p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] flex items-center gap-3 text-left hover:shadow-[0_8px_32px_rgba(58,183,149,0.1)] transition-shadow group"
            >
              <div className="w-11 h-11 rounded-xl grad-mint flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Icon name="local_cafe" className="text-white text-[22px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-warm-500 font-medium">免费试饮</p>
                <p className="text-sm font-bold text-mint-DEFAULT leading-tight mt-0.5 truncate">
                  {availableSamples.length > 0 ? `${availableSamples.length}款可领` : '暂无'}
                </p>
              </div>
              <Icon name="chevron_right" className="text-warm-400 ml-auto text-[20px] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </section>

        {/* ============================================================
            HOT PICKS — 热销推荐 (大卡片横向展示)
            ============================================================ */}
        <section className="mt-8 px-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-amber-DEFAULT font-bold text-[10px] tracking-[0.2em] uppercase">Popular Choice</p>
              <h2 className="text-xl font-black font-display mt-0.5">热销推荐</h2>
            </div>
            <p className="text-warm-500 text-xs">根据近7天销量排行</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {hotProducts.slice(0, 3).map((item, idx) => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all group">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  {/* Rank badge */}
                  <div className="absolute top-3 left-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-md ${idx === 0 ? 'grad-brand' : idx === 1 ? 'grad-amber' : 'bg-warm-500'}`}>
                      {idx + 1}
                    </div>
                  </div>
                  {/* Sales badge */}
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Icon name="local_fire_department" fill className="text-[12px] text-amber-light" />
                    {item.sales_7d}份
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <h4 className="font-bold text-base truncate">{item.name}</h4>
                  <p className="text-warm-500 text-xs mt-1 leading-relaxed line-clamp-1">{item.description}</p>
                  <div className="flex items-baseline gap-1.5 mt-3">
                    <span className="text-brand font-black text-xl font-display">¥{item.sale_price}</span>
                    {item.price !== item.sale_price && (
                      <span className="text-warm-400 text-xs line-through">¥{item.price}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            FULL MENU — 全部菜品 (紧凑列表)
            ============================================================ */}
        <section className="mt-8 px-8 pb-24">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-warm-500 font-bold text-[10px] tracking-[0.2em] uppercase">Full Menu</p>
              <h2 className="text-xl font-black font-display mt-0.5">全部菜品</h2>
            </div>
            <p className="text-warm-500 text-xs">{products.length} 款美味</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {products.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-[0_1px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-all">
                <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                    {item.is_hot && (
                      <span className="flex-shrink-0 text-[9px] font-bold text-white bg-brand px-1.5 py-px rounded-full">HOT</span>
                    )}
                  </div>
                  <p className="text-warm-500 text-[11px] truncate mt-0.5">{item.description}</p>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-brand font-black text-base font-display">¥{item.sale_price}</span>
                    {item.price !== item.sale_price && (
                      <span className="text-warm-400 text-[10px] line-through">¥{item.price}</span>
                    )}
                    <span className="text-warm-400 text-[10px] ml-auto">{item.sales_7d}份/周</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            BOTTOM BAR — 底部常驻操作栏
            ============================================================ */}

      </div>

      {/* Fixed bottom CTA bar — always visible */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-warm-200/50 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint-light animate-pulse" />
              <span className="text-sm font-bold">{store?.name}</span>
            </div>
            <div className="h-4 w-px bg-warm-300" />
            <span className="text-warm-500 text-sm">当前 <strong className="text-amber-DEFAULT">{queue?.total_waiting ?? 0}</strong> 人排队</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/sample')}
              className="grad-mint text-white px-5 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform flex items-center gap-1.5"
            >
              <Icon name="local_cafe" className="text-[18px]" />
              免费试饮
            </button>
            <button
              onClick={() => navigate('/take-number')}
              className="grad-brand text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_16px_rgba(253,113,38,0.3)] active:scale-95 transition-transform flex items-center gap-1.5"
            >
              <Icon name="confirmation_number" fill className="text-[18px]" />
              立即取号
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
