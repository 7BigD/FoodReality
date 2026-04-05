import { useEffect, useState } from 'react'
import { Table, Button, InputNumber, Typography, Space, message } from 'antd'
import { sampleApi } from '@food-reality/shared/api'
import type { Sample } from '@food-reality/shared/types'

const { Title } = Typography

export default function SampleManage() {
  const [list, setList] = useState<Sample[]>([])
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    sampleApi.list().then(res => setList(res.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRestock = async (id: number, addCount: number) => {
    const sample = list.find(s => s.id === id)
    if (!sample) return
    try {
      await sampleApi.update(id, {
        total_count: sample.total_count + addCount,
        remaining_count: sample.remaining_count + addCount,
      })
      message.success(`补仓 ${addCount} 份成功`)
      load()
    } catch (err: any) {
      message.error(err.response?.data?.detail || '操作失败')
    }
  }

  const columns = [
    { title: '样品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '总数', dataIndex: 'total_count', key: 'total_count' },
    { title: '剩余', dataIndex: 'remaining_count', key: 'remaining_count' },
    {
      title: '已领取', key: 'claimed',
      render: (_: unknown, record: Sample) => record.total_count - record.remaining_count,
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: Sample) => (
        <Space>
          <Button size="small" onClick={() => handleRestock(record.id, 10)}>补仓+10</Button>
          <Button size="small" onClick={() => handleRestock(record.id, 50)}>补仓+50</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>样品管理</Title>
        <Button onClick={load}>刷新</Button>
      </div>
      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} pagination={false} />
    </div>
  )
}
