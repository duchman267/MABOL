import dotenv from 'dotenv';

dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  appUrl: string;
  isProduction: boolean;
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',
};
