import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, defaultHeaders, thinkTime, TEST_USER } from './config.js';

export const options = {
  vus: 50,
  duration: '2m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const payload = JSON.stringify({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    payload,
    { headers: defaultHeaders }
  );

  if (res.status !== 200) {
    console.log(
      `FAILED LOGIN | status=${res.status} | body=${res.body}`
    );
  }

  check(res, {
    'login 200': (r) => r.status === 200,
    'token exists': (r) =>
      r.status === 200 && JSON.parse(r.body).token !== undefined,
  });

  thinkTime();
}
