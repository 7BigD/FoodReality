import { useEffect, useState } from 'react'
import { Table, Button, Tag, Typography, Space, message, Select } from 'antd'
import { queueApi } from '@food-reality/shared/api'
import type { Queue } from '@food-reality/shared/types'

const { Title } = Typography

const statusMap: Record<string, { color: string; text: string }> = {
  waiting: { color: 'orange', text: '等待中' },
  called: { color: 'blue', text: '已叫号' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'default', text: '已取消' },
}

export default function QueueManage() {
  const [list, setList] = useState<Queue[]>([])
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    queueApi.list(filter).then(res => setList(res.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleCall = async (id: number) => {
    try {
      await queueApi.call(id)
      message.success('叫号成功')
      load()
    } catch (err: any) {
      message.error(err.response?.data?.detail || '操作失败')
    }
  }

  const handleComplete = async (id: number) => {
    try {
      await queueApi.complete(id)
      message.success('已完成')
      load()
    } catch (err: any) {
      message.error(err.response?.data?.detail || '操作失败')
    }
  }

  const columns = [
    { title: '排队号', dataIndex: 'queue_number', key: 'queue_number', width: 100 },
    {
      title: '会员', key: 'member', width: 150,
      render: (_: unknown, record: Queue) => record.member ? `${record.member.name || ''} ${record.member.phone}` : '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>,
    },
    {
      title: '取号时间', dataIndex: 'created_at', key: 'created_at', width: 180,
      render: (t: string) => new Date(t).toLocaleString('zh-CN'),
    },
    {
      title: '操作', key: 'action', width: 200,
      render: (_: unknown, record: Queue) => (
        <Space>
          {record.status === 'waiting' && (
            <Button type="primary" size="small" onClick={() => handleCall(record.id)}>叫号</Button>
          )}
          {record.status === 'called' && (
            <Button type="primary" size="small" style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => handleComplete(record.id)}>完成就餐</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>排队叫号管理</Title>
        <Space>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            onChange={val => setFilter(val)}
            options={[
              { label: '等待中', value: 'waiting' },
              { label: '已叫号', value: 'called' },
              { label: '已完成', value: 'completed' },
              { label: '已取消', value: 'cancelled' },
            ]}
          />
          <Button onClick={load}>刷新</Button>
        </Space>
      </Space>
      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  )
}
