import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Order System API")
    .setDescription(
      "API B2B multi-tenant — catálogo, carrinho, reservas, pedidos e auditoria de estoque.",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token obtido em POST /auth/login ou /auth/refresh",
      },
      "access-token",
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();
