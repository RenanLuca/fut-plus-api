import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(AppModule);
  // Behind Railway's proxy, req.ip would be the proxy's address and the
  // throttler would rate-limit every user together. Trust one hop so it
  // reads the real client IP from X-Forwarded-For.
  app.set("trust proxy", 1);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen(3000);
}
bootstrap();
