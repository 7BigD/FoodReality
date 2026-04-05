import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Typography, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { productApi } from '@food-reality/shared/api'
import type { Product } from '@food-reality/shared/types'

const { Title } = Typography

export default function ProductManage() {
  const [list, setList] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const load = () => {
    setLoading(true)
    productApi.list().then(res => setList(res.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: Product) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    try {
      if (editingId) {
        await productApi.update(editingId, values)
        message.success('更新成功')
      } else {
        await productApi.create({ ...values, store_id: 1 })
        message.success('新增成功')
      }
      setModalOpen(false)
      load()
    } catch (err: any) {
      message.error(err.response?.data?.detail || '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await productApi.delete(id)
      message.success('删除成功')
      load()
    } catch (err: any) {
      message.error(err.response?.data?.detail || '删除失败')
    }
  }

  const columns = [
    { title: '商品名', dataIndex: 'name', key: 'name' },
    { title: '原价', dataIndex: 'price', key: 'price', render: (v: number) => `\u00A5${v}` },
    { title: '售价', dataIndex: 'sale_price', key: 'sale_price', render: (v: number) => `\u00A5${v}` },
    { title: '热销', dataIndex: 'is_hot', key: 'is_hot', render: (v: boolean) => v ? '是' : '否' },
    { title: '7天销量', dataIndex: 'sales_7d', key: 'sales_7d' },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: Product) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Button danger size="small" onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>商品管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增商品</Button>
      </Space>
      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} />

      <Modal title={editingId ? '编辑商品' : '新增商品'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="商品名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="原价" name="price" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="售价" name="sale_price" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="图片URL" name="image_url">
            <Input />
          </Form.Item>
          <Form.Item label="热销" name="is_hot" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="7天销量" name="sales_7d">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
