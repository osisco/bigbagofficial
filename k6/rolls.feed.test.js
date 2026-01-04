import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, thinkTime, defaultHeaders } from './config.js';

export const options = {
  scenarios: {
    feed_load: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '2m', target: 300 },
        { duration: '1m', target: 0 },
      ],
    },
  },
};

export default function () {
  const res = http.get(
    `${BASE_URL}/api/rolls?category=all`,
    { headers: { 'ngrok-skip-browser-warning': 'true' } }
  );

  check(res, {
    'feed ok': (r) => r.status === 200,
  });

  thinkTime();
}
