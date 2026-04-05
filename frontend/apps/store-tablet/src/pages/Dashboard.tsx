import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, Typography } from 'antd'
import { TeamOutlined, GiftOutlined, OrderedListOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons'
import { dashboardApi } from '@food-reality/shared/api'
import type { DashboardOverview } from '@food-reality/shared/types'

const { Title } = Typography

export default function Dashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null)

  const load = () => {
    dashboardApi.overview().then(res => setData(res.data)).catch(() => {})
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 5000) // 每5秒刷新
    return () => clearInterval(timer)
  }, [])

  const cards = [
    { title: '今日新增会员', value: data?.today_members ?? 0, icon: <TeamOutlined />, color: '#1890ff' },
    { title: '今日样品领取', value: data?.today_samples ?? 0, icon: <GiftOutlined />, color: '#722ed1' },
    { title: '当前排队人数', value: data?.queue_count ?? 0, icon: <OrderedListOutlined />, color: '#ff6b35' },
    { title: '眼镜使用中', value: data?.glasses_in_use ?? 0, icon: <EyeOutlined />, color: '#52c41a' },
    { title: '累计会员总数', value: data?.total_members ?? 0, icon: <UserOutlined />, color: '#13c2c2' },
  ]

  return (
    <div>
      <Title level={4}>数据看板</Title>
      <Row gutter={[16, 16]}>
        {cards.map(card => (
          <Col span={8} key={card.title}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
                valueStyle={{ color: card.color, fontSize: 36 }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
