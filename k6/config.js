import { sleep } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'https://bigbag-api.fly.dev';

export const defaultHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

export function thinkTime() {
  sleep(Math.random() * 1.5 + 0.5); // 0.5–2s
}

// Test data
export const TEST_USER = {
  email: 'osama@osama.com',
  password: '123123Os#'
};

export const TEST_ROLL_ID = '6953cc94accff2f91a3819e2';
export const TEST_SHOP_ID = '6953cc98accff2f91a3819ee';
