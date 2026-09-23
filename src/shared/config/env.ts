import "dotenv/config";
import { plainToInstance } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  validateSync,
} from "class-validator";

class Env {
  @IsString()
  @IsNotEmpty()
  jwtSecret!: string;

  @IsString()
  @IsNotEmpty()
  databaseUrl!: string;

  @IsString()
  @IsNotEmpty()
  resendApiKey!: string;

  @IsString()
  @IsNotEmpty()
  mailFrom!: string;

  @IsString()
  @IsNotEmpty()
  frontendUrl!: string;
}

const env: Env = plainToInstance(Env, {
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  resendApiKey: process.env.RESEND_API_KEY,
  mailFrom: process.env.MAIL_FROM,
  frontendUrl: process.env.FRONTEND_URL?.replace(/\/+$/, ""),
});

const errors = validateSync(env);

if (errors.length > 0) {
  throw new Error(
    `Invalid environment variables: ${errors.toString()}`,
  );
}

export { env };
