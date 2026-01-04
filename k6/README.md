# BigBag k6 Load Tests

## Requirements
- k6 installed
- Test users created
- Valid JWT token
- Existing rollId

## Environment Variables
BASE_URL=https://api.bigbag.com
TOKEN=jwt_token_here
ROLL_ID=existing_roll_id

## Run Tests
k6 run k6/auth.login.test.js
k6 run k6/rolls.feed.test.js
k6 run k6/rolls.like.test.js
k6 run k6/comments.test.js
k6 run k6/shops.browse.test.js

## Safety
- Do not run during peak hours
- Increase load gradually
