export interface Member {
  id: number;
  phone: string;
  name: string;
  points: number;
  created_at: string;
}

export interface Queue {
  id: number;
  queue_number: string;
  member_id: number;
  glasses_id?: number;
  status: 'waiting' | 'called' | 'completed' | 'cancelled';
  created_at: string;
  called_at?: string;
  member?: Member;
}

export interface QueueStatus {
  total_waiting: number;
  estimated_wait_minutes: number;
}

export interface Glasses {
  id: number;
  device_code: string;
  status: 'available' | 'in_use' | 'charging' | 'offline';
  current_member_id?: number;
  current_member_phone?: string;
  current_queue_id?: number;
  bound_at?: string;
}

export interface Store {
  id: number;
  name: string;
  address: string;
  phone: string;
  business_hours: string;
  logo_url: string;
  cover_url: string;
}

export interface Product {
  id: number;
  store_id: number;
  name: string;
  price: number;
  sale_price: number;
  image_url: string;
  is_hot: boolean;
  sales_7d: number;
  description: string;
}

export interface Sample {
  id: number;
  store_id: number;
  product_name: string;
  total_count: number;
  remaining_count: number;
}

export interface SampleRecord {
  id: number;
  member_id: number;
  sample_id: number;
  created_at: string;
}

export interface GameRecord {
  id: number;
  member_id: number;
  glasses_id: number;
  score: number;
  reward_threshold: number;
  reward_earned: boolean;
  reward_claimed: boolean;
  created_at: string;
}

export interface DashboardOverview {
  today_members: number;
  today_samples: number;
  queue_count: number;
  glasses_in_use: number;
  total_members: number;
}
