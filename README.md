# Grocery Pro Backend

Backend base para una aplicación colaborativa de listas de compras para hogares, construido con Node.js, Express, TypeScript, Prisma y PostgreSQL.

## Estructura

```text
grocery-backend/
├── .env.example
├── .gitignore
├── package.json
├── prisma/
│   └── schema.prisma
├── README.md
├── tsconfig.json
└── src/
	├── app.ts
	├── config/
	│   ├── env.ts
	│   └── prisma.ts
	├── controllers/
	│   ├── auth.controller.ts
	│   ├── health.controller.ts
	│   └── shoppingList.controller.ts
	├── middlewares/
	│   ├── authenticate.ts
	│   ├── error.middleware.ts
	│   └── validate.middleware.ts
	├── routes/
	│   ├── auth.routes.ts
	│   ├── health.routes.ts
	│   ├── index.ts
	│   └── shoppingList.routes.ts
	├── services/
	│   ├── auth.service.ts
	│   └── shoppingList.service.ts
	├── types/
	│   └── express.d.ts
	├── utils/
	│   ├── apiResponse.ts
	│   ├── appError.ts
	│   ├── asyncHandler.ts
	│   ├── jwt.ts
	│   └── password.ts
	└── validators/
		├── auth.schema.ts
		└── shoppingList.schema.ts
```

## Funcionalidades iniciales

- Registro de usuario con nombre, correo y contraseña.
- Inicio de sesión con JWT.
- Consulta del perfil autenticado.
- CRUD completo de listas de compras.
- Protección de rutas con middleware JWT.
- Validación de entradas con Zod.
- Manejo centralizado de errores.
- Conexión con PostgreSQL vía Prisma.

## Instalación

1. Instala dependencias:

	pnpm install

2. Crea tu archivo .env a partir de .env.example.

	PowerShell:
	Copy-Item .env.example .env

	Bash:
	cp .env.example .env

3. Genera el cliente de Prisma:

	pnpm exec prisma generate

4. Crea y aplica la primera migración:

	pnpm exec prisma migrate dev --name init

## Ejecución

### Desarrollo

	pnpm run dev

### Build

	pnpm run build

### Producción

		pnpm start

## Nota Windows + PowerShell

Si ves un error de tipo PSSecurityException al ejecutar pnpm, usa uno de estos enfoques:

- Ejecutar con pnpm.cmd en lugar de pnpm.
- Usar una terminal Bash/Git Bash.
- Ajustar la política de ejecución para CurrentUser:
	Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

## Endpoints base

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/lists`
- `GET /api/lists/:id`
- `POST /api/lists`
- `PATCH /api/lists/:id`
- `DELETE /api/lists/:id`

## Variables de entorno

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `BCRYPT_SALT_ROUNDS`
- `CORS_ORIGIN`