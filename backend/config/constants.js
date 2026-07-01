const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

module.exports = {
  app: {
    name: process.env.APP_NAME || 'Recipe.IO Backend',
    nodeEnv,
    isProduction,
    port: toNumber(process.env.PORT, 4000)
  },
  database: {
    uri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/RecipesDB',
    connectRetries: toNumber(process.env.MONGODB_CONNECT_RETRIES, 3),
    connectRetryDelayMs: toNumber(process.env.MONGODB_CONNECT_RETRY_DELAY, 2000)
  },
  security: {
    bcryptSaltRounds: toNumber(process.env.BCRYPT_SALT_ROUNDS, 10),
    loginRateLimitWindowMs: toNumber(process.env.LOGIN_RATE_LIMIT_WINDOW, 15 * 60 * 1000),
    loginRateLimitMax: toNumber(process.env.LOGIN_RATE_LIMIT_MAX, 5)
  },
  pagination: {
    itemsPerPage: toNumber(process.env.ITEMS_PER_PAGE, 10),
    recipesPerPage: toNumber(process.env.RECIPES_PER_PAGE, 10),
    usersPerPage: toNumber(process.env.USERS_PER_PAGE, 10),
    dashboardTopRecipes: 10,
    mostViewedLimit: 10,
    maxPerPage: 100
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log'
  }
};
