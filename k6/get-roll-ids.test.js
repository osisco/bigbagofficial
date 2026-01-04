import http from 'k6/http';
import { BASE_URL } from './config.js';

export const options = {
  vus: 1,
  duration: '10s',
};

export default function () {
  const res = http.get(
    `${BASE_URL}/api/rolls?category=all&limit=5`,
    { headers: { 'ngrok-skip-browser-warning': 'true' } }
  );

  if (res.status === 200) {
    const data = JSON.parse(res.body);
    if (data.success && data.data && data.data.length > 0) {
      console.log('Available Roll IDs:');
      data.data.forEach((roll, index) => {
        console.log(`${index + 1}. ID: ${roll.id} - Caption: ${roll.caption || 'No caption'}`);
      });
    } else {
      console.log('No rolls found in response');
    }
  } else {
    console.log(`Feed request failed: status=${res.status}, body=${res.body}`);
  }
}