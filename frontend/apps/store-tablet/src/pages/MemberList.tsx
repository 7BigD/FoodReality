import { useEffect, useState } from 'react'
import { Table, Typography, Button } from 'antd'
import { memberApi } from '@food-reality/shared/api'
import type { Member } from '@food-reality/shared/types'

const { Title } = Typography

export default function MemberList() {
  const [list, setList] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    memberApi.list().then(res => setList(res.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '姓名', dataIndex: 'name', key: 'name', render: (v: string) => v || '-' },
    { title: '积分', dataIndex: 'points', key: 'points' },
    {
      title: '注册时间', dataIndex: 'created_at', key: 'created_at',
      render: (t: string) => new Date(t).toLocaleString('zh-CN'),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>会员管理</Title>
        <Button onClick={load}>刷新</Button>
      </div>
      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  )
}
