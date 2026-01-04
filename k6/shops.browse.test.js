import http from 'k6/http';
import { thinkTime, defaultHeaders } from './config.js';
import { BASE_URL } from './config.js';

export const options = {
  vus: 100,
  duration: '2m',
};

export default function () {
  http.get(`${BASE_URL}/api/shops`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
  http.get(`${BASE_URL}/api/offers`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
  http.get(`${BASE_URL}/api/coupons`, { headers: { 'ngrok-skip-browser-warning': 'true' } });

  thinkTime();
}
