import axios from 'axios';

// @ts-ignore - Vite 环境变量，由消费方 app 的 vite 注入
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE) || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ========== Member ==========
export const memberApi = {
  register: (phone: string, name?: string) =>
    api.post('/api/members/register', { phone, name }),
  list: (page = 1, size = 20) =>
    api.get('/api/members', { params: { page, size } }),
  get: (id: number) =>
    api.get(`/api/members/${id}`),
};

// ========== Queue ==========
export const queueApi = {
  takeNumber: () =>
    api.post('/api/queue/take-number', {}),
  status: () =>
    api.get('/api/queue/status'),
  list: (status?: string) =>
    api.get('/api/queue/list', { params: status ? { status } : {} }),
  call: (id: number) =>
    api.post(`/api/queue/${id}/call`),
  complete: (id: number) =>
    api.post(`/api/queue/${id}/complete`),
  cancel: (id: number) =>
    api.post(`/api/queue/${id}/cancel`),
};

// ========== Glasses ==========
export const glassesApi = {
  list: () =>
    api.get('/api/glasses'),
  bind: (id: number, member_phone: string, queue_number: string) =>
    api.post(`/api/glasses/${id}/bind`, { member_phone, queue_number }),
  unbind: (id: number) =>
    api.post(`/api/glasses/${id}/unbind`),
};

// ========== Store ==========
export const storeApi = {
  get: () =>
    api.get('/api/store'),
  update: (data: Record<string, unknown>) =>
    api.put('/api/store', data),
};

// ========== Product ==========
export const productApi = {
  list: (hot?: boolean) =>
    api.get('/api/products', { params: hot !== undefined ? { hot } : {} }),
  create: (data: Record<string, unknown>) =>
    api.post('/api/products', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/products/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/products/${id}`),
};

// ========== Sample ==========
export const sampleApi = {
  list: () =>
    api.get('/api/samples'),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/samples/${id}`, data),
  claim: (id: number, member_id: number) =>
    api.post(`/api/samples/${id}/claim`, { member_id }),
};

// ========== Game ==========
export const gameApi = {
  createRecord: (data: { member_id: number; glasses_id: number; score: number }) =>
    api.post('/api/games/record', data),
  listRecords: (member_id?: number) =>
    api.get('/api/games/records', { params: member_id ? { member_id } : {} }),
  claimReward: (id: number) =>
    api.post(`/api/games/${id}/claim-reward`),
};

// ========== Dashboard ==========
export const dashboardApi = {
  overview: () =>
    api.get('/api/dashboard/overview'),
};

// ========== Hardware ==========
// Broker:  broker.emqx.io:8084 (WSS) / :1883 (TCP for ESP32)
// Topic:   bpd/cmd
// Payload: 单字符  W=前进 S=后退 Q=左转 E=右转 Z=停止 O=开样品门 X=停止音频

import mqtt from 'mqtt';

const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';
const MQTT_CMD_TOPIC = 'bpd/cmd';

/**
 * 一次性向 bpd/cmd 发送单字符指令，发完自动断开。
 * 用于 C 端触发硬件动作（如领取样品后开门）。
 */
export function publishRobotCmd(cmd: string): void {
  const clientId = `robot-tablet-${Math.random().toString(16).slice(2, 8)}`;
  const client = mqtt.connect(MQTT_BROKER, { clientId, connectTimeout: 5000, reconnectPeriod: 0 });
  client.on('connect', () => {
    console.log(`[MQTT] publishRobotCmd: "${cmd}"`);
    client.publish(MQTT_CMD_TOPIC, cmd, { qos: 1 }, () => {
      client.end();
    });
  });
  client.on('error', (err) => {
    console.warn('[MQTT] publishRobotCmd error:', err.message);
    client.end();
  });
}
