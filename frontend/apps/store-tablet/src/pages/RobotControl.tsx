import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Input, Button, Typography, Space, message, Tag, Divider, Badge } from 'antd'
import { SaveOutlined, ApiOutlined, WifiOutlined, DisconnectOutlined, LoadingOutlined, ClearOutlined } from '@ant-design/icons'
import mqtt, { MqttClient } from 'mqtt'

const { Title, Text } = Typography

const STORAGE_KEY = 'robot_mqtt_config'
const LOG_TOPIC = 'bpd/log'
const MAX_LOGS = 200

interface MqttConfig {
  broker: string
  port: string
  cmdTopic: string
  clientId: string
}

const defaultConfig: MqttConfig = {
  broker: 'broker.emqx.io',
  port: '8084',
  cmdTopic: 'bpd/cmd',
  clientId: `store-tablet-${Math.random().toString(16).slice(2, 8)}`,
}

// 指令字符映射：W=前进 S=后退 Q=左转 E=右转 Z=停止 O=开样品门 X=停止音频
const CMD_MAP = {
  forward:  'W',
  backward: 'S',
  left:     'Q',
  right:    'E',
  stop:     'Z',
  open_door: 'O',
  stop_audio: 'X',
} as const

type Direction = keyof typeof CMD_MAP

type ConnStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface LogEntry {
  id: number
  time: string
  raw: string
}

let logSeq = 0

export default function RobotControl() {
  const [config, setConfig]       = useState<MqttConfig>(defaultConfig)
  const [connStatus, setConnStatus] = useState<ConnStatus>('disconnected')
  const [activeDir, setActiveDir] = useState<Direction | null>(null)
  const [logs, setLogs]           = useState<LogEntry[]>([])
  const clientRef  = useRef<MqttClient | null>(null)
  const logEndRef  = useRef<HTMLDivElement>(null)

  // localStorage 读取配置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setConfig({ ...parsed, clientId: `store-tablet-${Math.random().toString(16).slice(2, 8)}` })
      }
    } catch {}
  }, [])

  // 新日志自动滚到底部
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // 卸载时断开
  useEffect(() => {
    return () => { clientRef.current?.end(true) }
  }, [])

  const pushLog = (raw: string) => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`
    setLogs(prev => {
      const next = [...prev, { id: logSeq++, time, raw }]
      return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next
    })
  }

  const handleSave = () => {
    const { clientId: _, ...toSave } = config
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    message.success('MQTT 配置已保存')
  }

  const handleConnect = () => {
    if (clientRef.current && connStatus === 'connected') {
      clientRef.current.end(true)
      clientRef.current = null
      setConnStatus('disconnected')
      pushLog('[系统] 已手动断开连接')
      return
    }

    setConnStatus('connecting')
    const brokerUrl = `wss://${config.broker}:${config.port}/mqtt`
    pushLog(`[系统] 正在连接 ${brokerUrl} …`)

    const client = mqtt.connect(brokerUrl, {
      clientId: config.clientId,
      connectTimeout: 5000,
      reconnectPeriod: 0,
    })

    client.on('connect', () => {
      setConnStatus('connected')
      message.success('MQTT 连接成功，设备就绪')
      pushLog(`[系统] 连接成功，clientId: ${config.clientId}`)

      // 订阅硬件反馈日志
      client.subscribe(LOG_TOPIC, { qos: 1 }, (err) => {
        if (err) {
          pushLog(`[系统] 订阅 ${LOG_TOPIC} 失败: ${err.message}`)
        } else {
          pushLog(`[系统] 已订阅 ${LOG_TOPIC}，等待硬件日志…`)
        }
      })
    })

    client.on('message', (_topic, payload) => {
      pushLog(`[硬件] ${payload.toString()}`)
    })

    client.on('error', (err) => {
      setConnStatus('error')
      message.error('MQTT 连接失败，请检查配置')
      pushLog(`[系统] 连接错误: ${err.message}`)
      client.end(true)
    })

    client.on('close', () => {
      if (connStatus !== 'error') setConnStatus('disconnected')
    })

    clientRef.current = client
  }

  const handleMove = useCallback((direction: Direction) => {
    setActiveDir(direction)

    if (!clientRef.current || connStatus !== 'connected') {
      message.warning('请先连接 MQTT Broker')
      setTimeout(() => setActiveDir(null), 200)
      return
    }

    const cmd = CMD_MAP[direction]
    clientRef.current.publish(config.cmdTopic, cmd, { qos: 1 }, (err) => {
      if (err) {
        pushLog(`[发送失败] cmd="${cmd}" err=${err.message}`)
        message.error('指令发送失败')
      } else {
        pushLog(`[发送] → ${config.cmdTopic}  cmd="${cmd}"`)
      }
      setTimeout(() => setActiveDir(null), 200)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connStatus, config.cmdTopic])

  // 键盘快捷键 WASD + 方向键
  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      w: 'forward',  W: 'forward',  ArrowUp:    'forward',
      s: 'backward', S: 'backward', ArrowDown:  'backward',
      q: 'left',     Q: 'left',     ArrowLeft:  'left',
      e: 'right',    E: 'right',    ArrowRight: 'right',
      z: 'stop',     Z: 'stop',     ' ': 'stop',
      o: 'open_door',  O: 'open_door',
      x: 'stop_audio', X: 'stop_audio',
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const dir = keyMap[e.key]
      if (dir) { e.preventDefault(); handleMove(dir) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleMove])

  const connTag = {
    disconnected: <Tag icon={<DisconnectOutlined />}>未连接</Tag>,
    connecting:   <Tag icon={<LoadingOutlined spin />} color="processing">连接中</Tag>,
    connected:    <Tag icon={<WifiOutlined />} color="success">已连接</Tag>,
    error:        <Tag icon={<DisconnectOutlined />} color="error">连接失败</Tag>,
  }[connStatus]

  const dirBtnStyle = (dir: string): React.CSSProperties => ({
    width: 80, height: 80, fontSize: 16,
    fontWeight: 'bold', borderRadius: 16,
    ...(activeDir === dir ? { transform: 'scale(0.93)', opacity: 0.8 } : {}),
  })

  return (
    <div>
      <Title level={4}>机器人控制</Title>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* ——— 左：MQTT 配置 ——— */}
        <Card title={<><ApiOutlined /> MQTT 配置</>} extra={connTag} style={{ borderRadius: 12 }}>
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>Broker 地址</Text>
              <Input
                placeholder="broker.emqx.io"
                value={config.broker}
                onChange={e => setConfig(c => ({ ...c, broker: e.target.value }))}
                addonBefore="wss://"
                addonAfter="/mqtt"
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>WebSocket 端口</Text>
              <Input
                placeholder="8083"
                value={config.port}
                onChange={e => setConfig(c => ({ ...c, port: e.target.value }))}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>指令 Topic（Publish）</Text>
              <Input
                placeholder="bpd/cmd"
                value={config.cmdTopic}
                onChange={e => setConfig(c => ({ ...c, cmdTopic: e.target.value }))}
              />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                日志 Topic（Subscribe）：<Text code>{LOG_TOPIC}</Text>
              </Text>
            </div>
            <Space>
              <Button icon={<SaveOutlined />} onClick={handleSave}>保存配置</Button>
              <Button
                type="primary"
                icon={connStatus === 'connected' ? <DisconnectOutlined /> : <WifiOutlined />}
                loading={connStatus === 'connecting'}
                danger={connStatus === 'connected'}
                onClick={handleConnect}
              >
                {connStatus === 'connected' ? '断开连接' : '连接 Broker'}
              </Button>
            </Space>
          </Space>
        </Card>

        {/* ——— 右：方向控制 ——— */}
        <Card
          title="方向控制"
          style={{ borderRadius: 12 }}
          extra={connStatus !== 'connected'
            ? <Text type="secondary" style={{ fontSize: 12 }}>请先连接 MQTT</Text>
            : <Tag color="success">就绪</Tag>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {/* W 前进 */}
            <Button type="primary" disabled={connStatus !== 'connected'}
              style={dirBtnStyle('forward')} onClick={() => handleMove('forward')}>
              <div>W</div>
              <div style={{ fontSize: 11, fontWeight: 'normal', marginTop: 2 }}>前进</div>
            </Button>

            {/* A  停止  D */}
            <Space size={8}>
              <Button type="primary" disabled={connStatus !== 'connected'}
                style={dirBtnStyle('left')} onClick={() => handleMove('left')}>
                <div>A</div>
                <div style={{ fontSize: 11, fontWeight: 'normal', marginTop: 2 }}>左转</div>
              </Button>

              <Button danger type="primary" disabled={connStatus !== 'connected'}
                style={{
                  ...dirBtnStyle('stop'),
                  background: connStatus === 'connected' ? '#ff4d4f' : undefined,
                  borderColor: '#ff4d4f',
                }}
                onClick={() => handleMove('stop')}>
                <div style={{ fontSize: 20 }}>■</div>
                <div style={{ fontSize: 11, fontWeight: 'normal', marginTop: 2 }}>停止</div>
              </Button>

              <Button type="primary" disabled={connStatus !== 'connected'}
                style={dirBtnStyle('right')} onClick={() => handleMove('right')}>
                <div>D</div>
                <div style={{ fontSize: 11, fontWeight: 'normal', marginTop: 2 }}>右转</div>
              </Button>
            </Space>

            {/* S 后退 */}
            <Button type="primary" disabled={connStatus !== 'connected'}
              style={dirBtnStyle('backward')} onClick={() => handleMove('backward')}>
              <div>S</div>
              <div style={{ fontSize: 11, fontWeight: 'normal', marginTop: 2 }}>后退</div>
            </Button>
          </div>

          <Divider style={{ margin: '16px 0 12px' }} />
          {/* 功能指令 */}
          <Space style={{ width: '100%', justifyContent: 'center' }} size={12}>
            <Button
              disabled={connStatus !== 'connected'}
              style={{ height: 56, width: 120, borderRadius: 12, fontWeight: 'bold', fontSize: 13 }}
              icon={<span style={{ fontSize: 18, marginRight: 4 }}>📦</span>}
              onClick={() => handleMove('open_door')}
            >
              <div>开样品门</div>
              <div style={{ fontSize: 10, fontWeight: 'normal', color: '#888' }}>键盘 O</div>
            </Button>
            <Button
              disabled={connStatus !== 'connected'}
              danger
              style={{ height: 56, width: 120, borderRadius: 12, fontWeight: 'bold', fontSize: 13 }}
              icon={<span style={{ fontSize: 18, marginRight: 4 }}>🔇</span>}
              onClick={() => handleMove('stop_audio')}
            >
              <div>停止音频</div>
              <div style={{ fontSize: 10, fontWeight: 'normal', color: '#888' }}>键盘 X</div>
            </Button>
          </Space>
          <Divider style={{ margin: '12px 0 8px' }} />
          <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
            W=前进 S=后退 Q=左转 E=右转 Z/空格=停止
          </Text>
        </Card>

      </div>

      {/* ——— 硬件日志控制台 ——— */}
      <Card
        style={{ borderRadius: 12, marginTop: 24 }}
        title={
          <Space>
            <span>硬件日志</span>
            <Badge count={logs.length} overflowCount={999} style={{ backgroundColor: '#52c41a' }} />
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
              订阅自 <Text code style={{ fontSize: 12 }}>{LOG_TOPIC}</Text>
            </Text>
          </Space>
        }
        extra={
          <Button size="small" icon={<ClearOutlined />} onClick={() => setLogs([])}>
            清空
          </Button>
        }
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{
            height: 220,
            overflowY: 'auto',
            background: '#0d1117',
            borderRadius: '0 0 12px 12px',
            padding: '10px 14px',
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: '20px',
          }}
        >
          {logs.length === 0 ? (
            <span style={{ color: '#484f58' }}>// 暂无日志，连接后将自动订阅 {LOG_TOPIC}</span>
          ) : (
            logs.map(entry => (
              <div key={entry.id} style={{ display: 'flex', gap: 12, color: '#e6edf3' }}>
                <span style={{ color: '#484f58', flexShrink: 0 }}>{entry.time}</span>
                <span style={{
                  color: entry.raw.startsWith('[硬件]') ? '#79c0ff'
                       : entry.raw.startsWith('[发送失败]') ? '#ff7b72'
                       : entry.raw.startsWith('[发送]') ? '#56d364'
                       : '#8b949e',
                }}>
                  {entry.raw}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </Card>
    </div>
  )
}
