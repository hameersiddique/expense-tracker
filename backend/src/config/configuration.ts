export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  uploadDest: process.env.UPLOAD_DEST || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  database: {
    // If DATABASE_URL is set (Neon, Render, Supabase, Railway all provide this),
    // it takes priority over the individual DB_* vars below.
    url: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'expense_user',
    password: process.env.DB_PASSWORD || 'expense_pass123',
    database: process.env.DB_DATABASE || 'expense_tracker',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    // Most free hosted Postgres providers require SSL; set DB_SSL=true for them.
    ssl: process.env.DB_SSL === 'true',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});
