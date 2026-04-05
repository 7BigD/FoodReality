import { useEffect, useState } from 'react'
import { Table, Button, Tag, Typography, Space, message, Modal, Input, Form, Select } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { glassesApi, queueApi } from '@food-reality/shared/api'
import type { Glasses } from '@food-reality/shared/types'

const { Title } = Typography

const statusMap: Record<string, { color: string; text: string }> = {
  available: { color: 'green', text: '空闲' },
  in_use:    { color: 'blue',  text: '使用中' },
  charging:  { color: 'orange', text: '充电中' },
  offline:   { color: 'default', text: '离线' },
}

export default function GlassesManage() {
  const [list, setList] = useState<Glasses[]>([])
  const [loading, setLoading] = useState(false)
  const [bindModal, setBindModal] = useState(false)
  const [bindLoading, setBindLoading] = useState(false)
  const [form] = Form.useForm()

  const load = () => {
    setLoading(true)
    glassesApi.list().then(res => setList(res.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleUnbind = (record: Glasses) => {
    Modal.confirm({
      title: '确认归还眼镜',
      content: (
        <div>
          <p>设备编号：<strong>{record.device_code}</strong></p>
          {record.current_member_phone && <p>当前用户：<strong>{record.current_member_phone}</strong></p>}
          <p style={{ marginTop: 8, color: '#888' }}>解绑后眼镜将恢复为空闲状态，同时完成对应排队记录。</p>
        </div>
      ),
      okText: '确认归还',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await glassesApi.unbind(record.id)
          if (record.current_queue_id) {
            await queueApi.complete(record.current_queue_id).catch(() => {})
          }
          message.success(`${record.device_code} 已归还，眼镜恢复空闲`)
          load()
        } catch (err: any) {
          message.error(err.response?.data?.detail || '操作失败')
        }
      },
    })
  }

  const handleBind = async () => {
    try {
      const values = await form.validateFields()
      setBindLoading(true)
      await glassesApi.bind(values.glasses_id, values.member_phone, values.queue_number)
      message.success(`绑定成功：眼镜已关联 ${values.member_phone} / ${values.queue_number}`)
      setBindModal(false)
      form.resetFields()
      load()
    } catch (err: any) {
      if (err?.errorFields) return  // form validation error, ignore
      message.error(err.response?.data?.detail || '绑定失败')
    } finally {
      setBindLoading(false)
    }
  }

  const availableGlasses = list.filter(g => g.status === 'available')

  const columns = [
    { title: '设备编号', dataIndex: 'device_code', key: 'device_code' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>,
    },
    {
      title: '当前用户', dataIndex: 'current_member_phone', key: 'current_member_phone',
      render: (v: string | null) => v ?? '-',
    },
    {
      title: '排队号', dataIndex: 'current_queue_id', key: 'current_queue_id',
      render: (v: number | null) => v ?? '-',
    },
    {
      title: '绑定时间', dataIndex: 'bound_at', key: 'bound_at',
      render: (t: string | null) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: Glasses) => (
        record.status === 'in_use'
          ? <Button danger size="small" onClick={() => handleUnbind(record)}>归还回收</Button>
          : '-'
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>眼镜库存管理</Title>
        <Space>
          <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={() => setBindModal(true)}
          >
            绑定眼镜
          </Button>
          <Button onClick={load}>刷新</Button>
        </Space>
      </Space>

      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} pagination={false} />

      {/* ——— 绑定弹窗 ——— */}
      <Modal
        title="绑定眼镜"
        open={bindModal}
        onOk={handleBind}
        onCancel={() => { setBindModal(false); form.resetFields() }}
        okText="确认绑定"
        cancelText="取消"
        confirmLoading={bindLoading}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="选择眼镜"
            name="glasses_id"
            rules={[{ required: true, message: '请选择眼镜' }]}
          >
            <Select placeholder="选择空闲眼镜">
              {availableGlasses.map(g => (
                <Select.Option key={g.id} value={g.id}>{g.device_code}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="用户手机号"
            name="member_phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^\d{11}$/, message: '请输入11位手机号' },
            ]}
          >
            <Input placeholder="例如 13800138000" maxLength={11} />
          </Form.Item>
          <Form.Item
            label="排队号"
            name="queue_number"
            rules={[{ required: true, message: '请输入排队号' }]}
          >
            <Input placeholder="例如 A001" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
