# 店小乖 - 技术方案设计

## Context

基于需求设计文档（RequirementDesign.md），需要从零搭建整个系统。这是一个3天黑客松项目，核心目标是完成单商家近场引流+挽留功能的Demo演示。技术选型以快速出Demo为第一优先级。

**技术选型**：Python + FastAPI / SQLite / React + Vite / Monorepo

---

## 1. 项目结构

```
FoodReality/
├── backend/                    # FastAPI 后端服务
│   ├── app/
│   │   ├── main.py             # FastAPI 入口，CORS配置
│   │   ├── database.py         # SQLite 连接 & SQLAlchemy 引擎
│   │   ├── models.py           # ORM 模型（8张表）
│   │   ├── schemas.py          # Pydantic 请求/响应模型
│   │   ├── routers/
│   │   │   ├── member.py       # 会员注册/登录/查询
│   │   │   ├── queue.py        # 取号/叫号/排队管理
│   │   │   ├── glasses.py      # 眼镜绑定/解绑/库存
│   │   │   ├── store.py        # 店铺信息CRUD
│   │   │   ├── product.py      # 商品CRUD
│   │   │   ├── sample.py       # 样品管理/领取
│   │   │   └── game.py         # 游戏记录/积分
│   │   └── seed.py             # 初始化种子数据（Demo用）
│   ├── requirements.txt
│   └── food_reality.db         # SQLite 数据库文件（运行时生成）
│
├── frontend/
│   ├── package.json            # Monorepo 根配置
│   ├── pnpm-workspace.yaml     # pnpm workspace 配置
│   ├── apps/
│   │   ├── robot-tablet/       # 机器人平板（C端）
│   │   │   ├── src/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── Home.tsx            # 首页（门店封面+5个按钮）
│   │   │   │   │   ├── StoreInfo.tsx       # 门店信息页
│   │   │   │   │   ├── ProductList.tsx     # 商品列表页
│   │   │   │   │   ├── HotProducts.tsx     # 热销商品页
│   │   │   │   │   ├── QueueStatus.tsx     # 排队情况页
│   │   │   │   │   ├── TakeNumber.tsx      # 取号页（含注册/登录）
│   │   │   │   │   └── ClaimSample.tsx     # 领样品页
│   │   │   │   ├── api/
│   │   │   │   │   └── index.ts            # API 请求封装
│   │   │   │   ├── App.tsx
│   │   │   │   └── main.tsx
│   │   │   ├── index.html
│   │   │   ├── package.json
│   │   │   └── vite.config.ts
│   │   │
│   │   └── store-tablet/       # 店家平板（B端）
│   │       ├── src/
│   │       │   ├── pages/
│   │       │   │   ├── Dashboard.tsx       # 首页看板（核心数据概览）
│   │       │   │   ├── StoreManage.tsx     # 店铺信息管理
│   │       │   │   ├── ProductManage.tsx   # 商品管理
│   │       │   │   ├── QueueManage.tsx     # 排队叫号管理
│   │       │   │   ├── GlassesManage.tsx   # 眼镜库存管理
│   │       │   │   ├── MemberList.tsx      # 会员数据
│   │       │   │   └── SampleManage.tsx    # 样品管理
│   │       │   ├── api/
│   │       │   │   └── index.ts
│   │       │   ├── App.tsx
│   │       │   └── main.tsx
│   │       ├── index.html
│   │       ├── package.json
│   │       └── vite.config.ts
│   │
│   └── packages/
│       └── shared/             # 共享代码
│           ├── types/          # 共享 TypeScript 类型定义
│           ├── api/            # 共享 API 客户端（Axios 封装）
│           └── package.json
│
├── docs/
│   ├── PRD.md
│   ├── RequirementDesign.md
│   └── TechDesign.md           # 本文档
│
└── README.md
```

---

## 2. 技术栈总览

| 层级 | 选型 | 说明 |
|------|------|------|
| 后端框架 | FastAPI | 自动生成 Swagger 文档，异步支持，开发效率高 |
| ORM | SQLAlchemy 2.0 | 成熟稳定，支持 SQLite |
| 数据库 | SQLite | 零配置，单文件，Demo 演示够用 |
| 数据校验 | Pydantic v2 | FastAPI 原生集成 |
| 前端框架 | React 18 + TypeScript | 类型安全，组件化开发 |
| 构建工具 | Vite | 快速 HMR，开发体验好 |
| UI 组件库 | Ant Design | 丰富组件，快速搭建 B/C 端界面 |
| 路由 | React Router v6 | SPA 路由管理 |
| HTTP 客户端 | Axios | API 请求封装 |
| Monorepo | pnpm workspace | 轻量 workspace 管理，共享依赖 |
| 跨域 | FastAPI CORSMiddleware | 允许前端跨域访问后端 |

---

## 3. 后端设计

### 3.1 数据模型（SQLAlchemy ORM）

直接映射 RequirementDesign.md 中的 8 张核心表：

| ORM 模型 | 数据表 | 核心字段 |
|----------|--------|---------|
| `Member` | member | id, phone(UK), name, points, created_at |
| `Queue` | queue | id, queue_number, member_id(FK), glasses_id(FK), status, created_at, called_at |
| `Glasses` | glasses | id, device_code(UK), status, current_member_id(FK), current_queue_id(FK), bound_at |
| `Store` | store | id, name, address, phone, business_hours, logo_url, cover_url |
| `Product` | product | id, store_id(FK), name, price, sale_price, image_url, is_hot, sales_7d |
| `Sample` | sample | id, store_id(FK), product_name, total_count, remaining_count |
| `SampleRecord` | sample_record | id, member_id(FK), sample_id(FK), created_at |
| `GameRecord` | game_record | id, member_id(FK), glasses_id(FK), score, reward_threshold, reward_earned, reward_claimed, created_at |

### 3.2 API 接口设计

#### 3.2.1 会员模块 `/api/members`

| 方法 | 路径 | 说明 | 请求参数 | 返回 |
|------|------|------|---------|------|
| POST | `/api/members/register` | 注册/登录 | `{ phone, name? }` | Member 对象 |
| GET | `/api/members` | 会员列表（B端） | `?page&size` | Member[] |
| GET | `/api/members/{id}` | 会员详情 | - | Member 对象 |

> 注册逻辑：手机号已存在 → 直接返回已有记录；不存在 → 创建新会员后返回。

#### 3.2.2 排队模块 `/api/queue`

| 方法 | 路径 | 说明 | 请求参数 | 返回 |
|------|------|------|---------|------|
| POST | `/api/queue/take-number` | 取号 | `{ member_id }` | Queue 对象（含排队号） |
| GET | `/api/queue/status` | 排队状态（C端） | - | `{ total, estimated_wait }` |
| GET | `/api/queue/list` | 排队列表（B端） | `?status` | Queue[] |
| POST | `/api/queue/{id}/call` | 叫号 | - | Queue 对象 |
| POST | `/api/queue/{id}/complete` | 完成就餐 | - | Queue 对象 |
| POST | `/api/queue/{id}/cancel` | 取消排队 | - | Queue 对象 |

> 取号规则：同一手机号每日最多取 3 次。排队号格式如 A001、A002 递增。

#### 3.2.3 眼镜模块 `/api/glasses`

| 方法 | 路径 | 说明 | 请求参数 | 返回 |
|------|------|------|---------|------|
| GET | `/api/glasses` | 眼镜列表+状态（B端） | - | Glasses[] |
| POST | `/api/glasses/{id}/bind` | 绑定眼镜 | `{ member_id, queue_id }` | Glasses 对象 |
| POST | `/api/glasses/{id}/unbind` | 解绑（归还回收） | - | Glasses 对象 |

> 绑定规则：一副眼镜同一时刻只能绑定一个用户。

#### 3.2.4 店铺模块 `/api/store`

| 方法 | 路径 | 说明 | 请求参数 | 返回 |
|------|------|------|---------|------|
| GET | `/api/store` | 获取店铺信息（C端） | - | Store 对象 |
| PUT | `/api/store` | 更新店铺信息（B端） | Store 全量字段 | Store 对象 |

#### 3.2.5 商品模块 `/api/products`

| 方法 | 路径 | 说明 | 请求参数 | 返回 |
|------|------|------|---------|------|
| GET | `/api/products` | 商品列表 | `?hot=true` 筛选热销 | Product[] |
| POST | `/api/products` | 新增商品（B端） | Product 字段 | Product 对象 |
| PUT | `/api/products/{id}` | 编辑商品（B端） | Product 字段 | Product 对象 |
| DELETE | `/api/products/{id}` | 删除商品（B端） | - | `{ success }` |

#### 3.2.6 样品模块 `/api/samples`

| 方法 | 路径 | 说明 | 请求参数 | 返回 |
|------|------|------|---------|------|
| GET | `/api/samples` | 样品列表+库存 | - | Sample[] |
| PUT | `/api/samples/{id}` | 更新库存（B端补仓） | `{ total_count }` | Sample 对象 |
| POST | `/api/samples/{id}/claim` | 领取样品 | `{ member_id }` | SampleRecord 对象 |

> 领取规则：同一手机号对同一样品仅可领取 1 次；领取时 remaining_count - 1。

#### 3.2.7 游戏模块 `/api/games`

| 方法 | 路径 | 说明 | 请求参数 | 返回 |
|------|------|------|---------|------|
| POST | `/api/games/record` | 提交游戏记录 | `{ member_id, glasses_id, score }` | GameRecord 对象 |
| GET | `/api/games/records` | 游戏记录列表（B端） | `?member_id` | GameRecord[] |
| POST | `/api/games/{id}/claim-reward` | 兑换奖品 | - | GameRecord 对象 |

> 达标逻辑：score >= reward_threshold 时 reward_earned = true。

#### 3.2.8 看板数据 `/api/dashboard`

| 方法 | 路径 | 说明 | 返回 |
|------|------|------|------|
| GET | `/api/dashboard/overview` | 聚合数据概览 | `{ today_members, today_samples, queue_count, glasses_in_use, total_members }` |

---

## 4. 前端设计

### 4.1 机器人平板（C端）- `robot-tablet`

**端口**：`localhost:5173`

| 页面 | 路由 | 调用 API | 核心交互 |
|------|------|---------|---------|
| 首页 | `/` | `GET /api/store` | 门店封面图 + 5 个入口按钮 |
| 门店信息 | `/store` | `GET /api/store` | 展示地址、营业时间、电话、门头照 |
| 商品列表 | `/products` | `GET /api/products` | 商品卡片列表（图片+名称+价格） |
| 热销商品 | `/hot` | `GET /api/products?hot=true` | 3 款热销商品 + 热销标识 |
| 排队情况 | `/queue` | `GET /api/queue/status` | 当前排队人数 + 预计等待时间 |
| 取号 | `/take-number` | `POST /register` → `POST /take-number` → `POST /bind` | 输入手机号 → 注册/登录 → 生成排队号 → 领取眼镜 |
| 领样品 | `/sample` | `GET /api/samples` → `POST /claim` | 查看可领样品 → 注册后领取 |

**页面流转**：
```
首页 ──→ 门店信息 ──→ 返回首页
  │──→ 商品列表 ──→ 返回首页
  │──→ 热销商品 ──→ 返回首页
  │──→ 排队情况 ──→ 返回首页
  │──→ 取号（注册→取号→领眼镜）──→ 成功页 → 返回首页
  └──→ 领样品（注册→领取）──→ 成功页 → 返回首页
```

### 4.2 店家平板（B端）- `store-tablet`

**端口**：`localhost:5174`

| 页面 | 路由 | 调用 API | 核心交互 |
|------|------|---------|---------|
| 数据看板 | `/` | `GET /api/dashboard/overview` | 数字卡片展示今日核心指标 |
| 排队管理 | `/queue` | `GET /api/queue/list` | 排队列表 + 叫号按钮 + 状态筛选 |
| 眼镜管理 | `/glasses` | `GET /api/glasses` | 眼镜库存表（状态/绑定用户/操作） |
| 店铺管理 | `/store` | `GET/PUT /api/store` | 店铺信息编辑表单 |
| 商品管理 | `/products` | `GET/POST/PUT/DELETE /api/products` | 商品 CRUD 表格 |
| 会员管理 | `/members` | `GET /api/members` | 会员列表 + 积分 + 奖品兑换状态 |
| 样品管理 | `/samples` | `GET/PUT /api/samples` | 样品库存 + 领取记录 |

**导航结构**：侧边栏菜单，包含以上 7 个入口。

---

## 5. 共享层设计（`packages/shared`）

### 5.1 类型定义 `types/index.ts`

```typescript
// 与后端 Pydantic Schema 对齐的 TypeScript 类型
export interface Member { id: number; phone: string; name: string; points: number; created_at: string; }
export interface Queue { id: number; queue_number: string; member_id: number; glasses_id?: number; status: string; ... }
export interface Glasses { id: number; device_code: string; status: string; current_member_id?: number; ... }
export interface Store { id: number; name: string; address: string; phone: string; ... }
export interface Product { id: number; name: string; price: number; sale_price: number; is_hot: boolean; ... }
export interface Sample { id: number; product_name: string; total_count: number; remaining_count: number; }
export interface GameRecord { id: number; score: number; reward_earned: boolean; reward_claimed: boolean; ... }
export interface DashboardOverview { today_members: number; today_samples: number; queue_count: number; glasses_in_use: number; }
```

### 5.2 API 客户端 `api/index.ts`

统一的 Axios 实例，配置 `baseURL = http://localhost:8000/api`，两个前端应用共用。

---

## 6. 启动方式

```bash
# 后端
cd backend
pip install -r requirements.txt
python -m app.seed          # 初始化种子数据（首次）
uvicorn app.main:app --reload --port 8000

# 前端（在 frontend/ 目录下）
pnpm install
pnpm --filter robot-tablet dev    # C端 → localhost:5173
pnpm --filter store-tablet dev    # B端 → localhost:5174
```

---

## 7. 实施步骤 & 优先级

| 步骤 | 内容 | 优先级 |
|------|------|--------|
| Step 1 | 项目初始化：目录结构、依赖配置、CORS | P0 |
| Step 2 | 后端 ORM 模型 + 种子数据 + 全部 API | P0 |
| Step 3 | 机器人平板前端（C端 7 个页面） | P0 |
| Step 4 | 店家平板前端（B端 7 个页面） | P0 |
| Step 5 | 前后端联调 & 端到端验证 | P0 |

---

## 8. 验证方式

1. **后端 API**：访问 `http://localhost:8000/docs` 查看 Swagger 文档，逐个测试接口
2. **C端流程**：访问 `http://localhost:5173`，走通「浏览信息 → 注册 → 取号 → 领眼镜」
3. **B端流程**：访问 `http://localhost:5174`，走通「录入数据 → 查看排队 → 叫号 → 管理眼镜」
4. **核心链路**：C端取号 → B端看到新排队 → B端叫号 → 数据状态一致
