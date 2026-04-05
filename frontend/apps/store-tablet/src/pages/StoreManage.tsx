import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Typography, message } from 'antd'
import { storeApi } from '@food-reality/shared/api'
import type { Store } from '@food-reality/shared/types'

const { Title } = Typography

export default function StoreManage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    storeApi.get().then(res => form.setFieldsValue(res.data)).catch(() => {})
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      await storeApi.update(values)
      message.success('保存成功')
    } catch (err: any) {
      message.error(err.response?.data?.detail || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Title level={4}>店铺信息管理</Title>
      <Card style={{ borderRadius: 12, maxWidth: 600 }}>
        <Form form={form} layout="vertical">
          <Form.Item label="店铺名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="地址" name="address">
            <Input />
          </Form.Item>
          <Form.Item label="联系电话" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="营业时间" name="business_hours">
            <Input />
          </Form.Item>
          <Form.Item label="Logo URL" name="logo_url">
            <Input />
          </Form.Item>
          <Form.Item label="门头封面图 URL" name="cover_url">
            <Input />
          </Form.Item>
          <Button type="primary" loading={loading} onClick={handleSave}>
            保存
          </Button>
        </Form>
      </Card>
    </div>
  )
}
