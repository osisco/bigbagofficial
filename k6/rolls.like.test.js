import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, thinkTime, TEST_ROLL_ID } from './config.js';

export const options = {
  vus: 200,
  duration: '1m',
};

export default function () {
  const token = __ENV.TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTNjYmY3MjU3YWU1NDBmYmYyMGRmMSIsInJvbGUiOiJ2ZW5kb3IiLCJpYXQiOjE3Njc0NDAxOTcsImV4cCI6MTc2ODA0NDk5N30.Mq0qs_Hwfah4VoCYVk3kanvqAMDTKk-7qVQm1pXpqQs';
  const rollId = __ENV.ROLL_ID || TEST_ROLL_ID;

  const headers = {
    Authorization: `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true',
  };

  const like = http.post(
    `${BASE_URL}/api/rolls/${rollId}/like`,
    null,
    { headers }
  );

  if (like.status !== 200 && like.status !== 400) {
    console.log(`LIKE FAILED: status=${like.status}, body=${like.body}`);
  }

  check(like, {
    'like ok': (r) => r.status === 200 || r.status === 400,
  });

  thinkTime();

  const unlike = http.del(
    `${BASE_URL}/api/rolls/${rollId}/like`,
    null,
    { headers }
  );

  if (unlike.status !== 200 && unlike.status !== 400) {
    console.log(`UNLIKE FAILED: status=${unlike.status}, body=${unlike.body}`);
  }

  check(unlike, {
    'unlike ok': (r) => r.status === 200 || r.status === 400,
  });

  thinkTime();
}
