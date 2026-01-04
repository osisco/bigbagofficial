# BigBag k6 Load Tests

## Requirements
- k6 installed
- Test users created
- Valid JWT token
- Existing rollId

## Environment Variables
NOT TO SHOW
## Run Tests
k6 run k6/auth.login.test.js
k6 run k6/rolls.feed.test.js
k6 run k6/rolls.like.test.js
k6 run k6/comments.test.js
k6 run k6/shops.browse.test.js


