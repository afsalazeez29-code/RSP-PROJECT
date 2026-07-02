require('dotenv').config();

const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const logger = require('morgan');
const path = require('path');

const { app: appConstants } = require('./config/constants');
const requestLogger = require('./middleware/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const profileRouter = require('./routes/profile');
const authApiRouter = require('./routes/api/auth');
const recipesApiRouter = require('./routes/api/recipes');
const imagesApiRouter = require('./routes/api/images');
const userApiRouter = require('./routes/api/users');
const searchApiRouter = require('./routes/api/search');
const activityApiRouter = require('./routes/api/activity');
const dashboardApiRouter = require('./routes/api/dashboard');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'http:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'data:', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
      connectSrc: ["'self'", 'http://localhost:*', 'http://127.0.0.1:*', process.env.BACKEND_URL || 'https://recipeio.duckdns.org']
    }
  }
}));

app.use(compression());

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      /^https:\/\/rsp-project(-[\w-]+)?\.vercel\.app$/.test(origin) ||
      origin === process.env.FRONTEND_ORIGIN
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed.'));
  },
  credentials: true
}));


app.use(logger(appConstants.isProduction ? 'combined' : 'dev'));
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/profile', profileRouter);

app.use('/api/auth', authApiRouter);
app.use('/api/recipes', recipesApiRouter);
app.use('/api/users', userApiRouter);
app.use('/api/activity', activityApiRouter);
app.use('/api/dashboard', dashboardApiRouter);
app.use('/api', searchApiRouter);
app.use('/api', imagesApiRouter);


app.use(notFound);
app.use(errorHandler);

module.exports = app;
