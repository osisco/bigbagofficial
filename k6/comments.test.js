import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, defaultHeaders, thinkTime, TEST_ROLL_ID } from './config.js';

export const options = {
  vus: 100,
  duration: '1m',
};

export default function () {
  const token = __ENV.TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTNjYmY3MjU3YWU1NDBmYmYyMGRmMSIsInJvbGUiOiJ2ZW5kb3IiLCJpYXQiOjE3Njc0NDAxOTcsImV4cCI6MTc2ODA0NDk5N30.Mq0qs_Hwfah4VoCYVk3kanvqAMDTKk-7qVQm1pXpqQs';

  const res = http.post(
    `${BASE_URL}/api/comments`,
    JSON.stringify({
      rollId: __ENV.ROLL_ID || TEST_ROLL_ID,
      comment: 'Great roll!',
    }),
    {
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  check(res, {
    'comment created': (r) => r.status === 200 || r.status === 201,
  });

  thinkTime();
}
