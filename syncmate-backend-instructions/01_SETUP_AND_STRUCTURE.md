# 01 – Setup & Structure

## Dependencies
Runtime: `express cors helmet compression morgan express-rate-limit mongoose zod jsonwebtoken bcryptjs socket.io dotenv date-fns luxon node-cron firebase-admin nodemailer googleapis nanoid pino pino-pretty cookie-parser`
Dev: `nodemon eslint prettier jest supertest mongodb-memory-server @faker-js/faker`

`package.json`: `"type":"module"`, scripts: `dev` (nodemon src/server.js), `start`, `lint`, `test`, `seed`.

## Folder structure
```
syncmate-backend/
├─ src/
│  ├─ server.js              # http server + socket attach + scheduler start
│  ├─ app.js                 # express app (middleware, routes, error handler)
│  ├─ config/{env.js,db.js,firebase.js,google.js,mailer.js,logger.js}
│  ├─ models/                # User, RefreshToken, Group, Event, Pin, Participation, Reminder, Notification, Activity, GoogleSync
│  ├─ validators/            # zod schemas per module
│  ├─ middleware/{auth.js,validate.js,groupAccess.js,errorHandler.js,rateLimit.js,asyncHandler.js}
│  ├─ routes/{index.js,auth.routes.js,user.routes.js,group.routes.js,event.routes.js,watchlist.routes.js,reminder.routes.js,notification.routes.js,dashboard.routes.js,google.routes.js}
│  ├─ controllers/           # one per routes file
│  ├─ services/{auth,group,event,pin,participation,reminder,notification,push,email,activity,dashboard,googleCalendar}.service.js
│  ├─ listeners/{notification.listener.js,socket.listener.js,google.listener.js,activity.listener.js}
│  ├─ realtime/{socket.js,rooms.js}
│  ├─ jobs/{scheduler.js,reminder.job.js,googleResync.job.js}
│  ├─ utils/{eventBus.js,ApiError.js,response.js,dates.js,priority.js,crypto.js,serializers.js}
│  └─ seed/seed.js
├─ tests/                    # mirrors src, integration tests with mongodb-memory-server
├─ docs/                     # these instruction files
├─ .env.example, Dockerfile, docker-compose.yml (api + mongo), .eslintrc.cjs
```

## Environment variables (.env.example)
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/syncmate
WEB_URL=http://localhost:5173
API_URL=http://localhost:5000
CORS_ORIGINS=http://localhost:5173
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
ACCESS_TTL=15m
REFRESH_TTL_DAYS=30
MAX_GROUP_MEMBERS=5
ENCRYPTION_KEY=32_byte_hex_for_aes256gcm
FIREBASE_SERVICE_ACCOUNT_JSON=./secrets/firebase.json   # optional; push disabled with a warning if absent
SMTP_HOST= SMTP_PORT=587 SMTP_USER= SMTP_PASS= MAIL_FROM="SyncMate <no-reply@syncmate.app>"
GOOGLE_CLIENT_ID= GOOGLE_CLIENT_SECRET= GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/integrations/google/callback
```
Integrations (Firebase, SMTP, Google) must **degrade gracefully**: if not configured, log a warning and skip, never crash.

## App boot sequence (`server.js`)
connect Mongo → create express app → create http server → init Socket.IO → register listeners → start scheduler → listen. Handle SIGTERM (close server, stop cron, close DB).

## Middleware order (`app.js`)
helmet → cors (allowlist from CORS_ORIGINS, credentials true) → compression → json (limit 1mb) → morgan/pino-http → global rate limit (100 req/min/IP) → `/api/v1` routes → 404 handler → error handler. Auth routes get a stricter limiter (10/min/IP).
