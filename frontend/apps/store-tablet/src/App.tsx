import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ConfigProvider, Layout, Menu } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import {
  DashboardOutlined,
  OrderedListOutlined,
  EyeOutlined,
  ShopOutlined,
  AppstoreOutlined,
  TeamOutlined,
  GiftOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import QueueManage from './pages/QueueManage'
import GlassesManage from './pages/GlassesManage'
import StoreManage from './pages/StoreManage'
import ProductManage from './pages/ProductManage'
import MemberList from './pages/MemberList'
import SampleManage from './pages/SampleManage'
import RobotControl from './pages/RobotControl'

const { Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/queue', icon: <OrderedListOutlined />, label: '排队叫号' },
  { key: '/glasses', icon: <EyeOutlined />, label: '眼镜管理' },
  { key: '/store', icon: <ShopOutlined />, label: '店铺管理' },
  { key: '/products', icon: <AppstoreOutlined />, label: '商品管理' },
  { key: '/members', icon: <TeamOutlined />, label: '会员管理' },
  { key: '/samples', icon: <GiftOutlined />, label: '样品管理' },
  { key: '/robot', icon: <RobotOutlined />, label: '机器人控制' },
]

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200}>
        <div style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', fontSize: 18, color: '#ff6b35' }}>
          店小乖管理
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Content style={{ padding: 24, background: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/queue" element={<QueueManage />} />
          <Route path="/glasses" element={<GlassesManage />} />
          <Route path="/store" element={<StoreManage />} />
          <Route path="/products" element={<ProductManage />} />
          <Route path="/members" element={<MemberList />} />
          <Route path="/samples" element={<SampleManage />} />
          <Route path="/robot" element={<RobotControl />} />
        </Routes>
      </Content>
    </Layout>
  )
}

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#ff6b35', borderRadius: 8 } }}>
      <AppLayout />
    </ConfigProvider>
  )
}

export default App
