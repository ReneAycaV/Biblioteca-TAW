# Sistema de Biblioteca y Reserva de Espacios — NYU

> Proyecto Semestral · Taller de Aplicaciones Web  
> Universidad de Tarapacá · Ingeniería Civil en Computación e Informática

---

## Contexto del proyecto

Este sistema forma parte de un ecosistema universitario más amplio de 5 aplicaciones web interconectadas para la Universidad de New York (NYU). Cada aplicación opera de forma independiente pero se comunica con las demás a través de APIs REST.

El **Sistema de Biblioteca y Reserva de Espacios** tiene como objetivo centralizar la gestión del catálogo bibliográfico, los préstamos de libros, las devoluciones, el cálculo de multas por atraso y la reserva de salas de estudio. Actualmente estos procesos se realizan sin validación cruzada, lo que genera conflictos de disponibilidad, multas mal calculadas y préstamos no controlados.

---

## Objetivo del sistema

Construir una plataforma web que permita a los estudiantes activos de la universidad:

- Buscar y consultar el catálogo de material bibliográfico.
- Solicitar y devolver libros con control de fechas.
- Ver y gestionar sus multas por atraso.
- Reservar salas de estudio por bloques horarios.
- Consultar el historial completo de sus transacciones.

Y que permita a los administradores gestionar el catálogo, las salas, los usuarios y el estado general del sistema.

---

## Roles de usuario

El sistema contempla dos roles principales:

- **Estudiante:** puede buscar libros, solicitar préstamos, reservar salas, ver sus multas e historial.
- **Administrador:** puede gestionar el catálogo de libros, las salas de estudio, los usuarios y las multas del sistema.

Los usuarios no se auto-registran. Son creados por el administrador o provienen de la integración con el Sistema de Matrícula.

---

## Reglas de negocio principales

- Un estudiante debe estar académicamente activo para solicitar préstamos o reservar salas.
- Un estudiante con multa impaga no puede reservar salas.
- No se permiten reservas solapadas para el mismo usuario.
- No se permiten reservas duplicadas en la misma sala y bloque horario.
- Las multas se calculan automáticamente por días de atraso al momento de la devolución.
- Cuando una multa es pagada, el usuario queda habilitado automáticamente.
- Un usuario no puede tener más de un número definido de préstamos activos simultáneamente.

---

## Integraciones externas

Este sistema se comunica con otros sistemas del ecosistema NYU:

- **Sistema de Matrícula y Gestión Académica:** se consulta para validar si un estudiante está activo antes de permitirle solicitar préstamos o reservar salas.
- **Sistema de Pagos y Tesorería Central:** se utiliza para el cobro de multas. Cuando el pago es confirmado, el sistema desbloquea al usuario automáticamente.
- **Sistema de Cafetería y Planes de Alimentación:** este sistema le ofrece información sobre los horarios de alta demanda en la biblioteca, para que la cafetería pueda planificar promociones en esos bloques.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular (SPA) + Bootstrap |
| Backend | NestJS |
| Base de datos | MySQL + TypeORM |
| Autenticación | JWT |
| Documentación API | Swagger |

---

## Estructura del repositorio

```
biblioteca-nyu/
├── frontend/     # Aplicación Angular
├── backend/      # Aplicación NestJS
└── README.md
```

### Frontend — Angular (`frontend/src/app/`)

```
app/
├── core/                          ← Servicios y guards que existen una sola vez en la app
│   ├── guards/
│   │   ├── auth.guard.ts          ← Protege rutas que requieren login
│   │   └── role.guard.ts          ← Protege rutas según rol (admin/estudiante)
│   ├── interceptors/
│   │   └── jwt.interceptor.ts     ← Agrega el token JWT a cada petición HTTP
│   ├── services/
│   │   └── auth.service.ts        ← Login, logout, manejo del token
│   └── core.module.ts
│
├── shared/                        ← Componentes, modelos y utilidades reutilizables
│   ├── components/
│   │   ├── navbar/                ← Barra de navegación superior
│   │   └── loading-spinner/       ← Spinner de carga global
│   ├── models/                    ← Interfaces TypeScript del dominio
│   │   ├── usuario.model.ts
│   │   ├── libro.model.ts
│   │   ├── prestamo.model.ts
│   │   ├── multa.model.ts
│   │   ├── reserva.model.ts
│   │   └── sala.model.ts
│   ├── dtos/                      ← DTOs para peticiones y respuestas HTTP
│   │   ├── auth/
│   │   │   ├── login-request.dto.ts
│   │   │   └── login-response.dto.ts
│   │   ├── prestamo/
│   │   │   ├── create-prestamo.dto.ts
│   │   │   └── prestamo-response.dto.ts
│   │   └── reserva/
│   │       └── create-reserva.dto.ts
│   ├── enums/
│   │   ├── rol-usuario.enum.ts    ← ADMIN | ESTUDIANTE
│   │   └── estado-prestamo.enum.ts
│   └── shared.module.ts
│
└── features/                      ← Un módulo por cada funcionalidad del sistema
    ├── auth/
    │   ├── login/
    │   ├── register/
    │   └── auth.module.ts
    ├── catalogo/
    │   ├── lista-libros/          ← Búsqueda y listado de libros
    │   ├── detalle-libro/         ← Vista detallada de un libro
    │   ├── services/
    │   │   └── catalogo.service.ts
    │   └── catalogo.module.ts
    ├── prestamos/
    │   ├── crear-prestamo/
    │   ├── historial-prestamos/
    │   ├── services/
    │   │   └── prestamos.service.ts
    │   └── prestamos.module.ts
    ├── multas/
    │   ├── lista-multas/
    │   ├── pagar-multa/
    │   ├── services/
    │   │   └── multas.service.ts
    │   └── multas.module.ts
    ├── reservas/
    │   ├── crear-reserva/
    │   ├── mis-reservas/
    │   ├── services/
    │   │   └── reservas.service.ts
    │   └── reservas.module.ts
    └── admin/                     ← Solo accesible con rol ADMIN
        ├── gestion-usuarios/
        ├── gestion-libros/
        └── admin.module.ts
```

### Backend — NestJS (`backend/src/`)

```
src/
├── database/
│   └── entities/                  ← Entidades TypeORM (tablas de la BD)
│       ├── usuario.entity.ts
│       ├── libro.entity.ts
│       ├── prestamo.entity.ts
│       ├── multa.entity.ts
│       ├── reserva.entity.ts
│       └── sala.entity.ts
│
├── controllers/                   ← Controladores HTTP agrupados por módulo
│   ├── auth/
│   │   ├── dto/
│   │   │   ├── login-request.dto.ts
│   │   │   ├── login-response.dto.ts
│   │   │   ├── register-request.dto.ts
│   │   │   └── register-response.dto.ts
│   │   ├── auth.controller.ts
│   │   └── auth.module.ts
│   ├── libros/
│   │   ├── dto/
│   │   │   ├── create-libro.dto.ts
│   │   │   └── libro-response.dto.ts
│   │   ├── libros.controller.ts
│   │   └── libros.module.ts
│   ├── prestamos/
│   │   ├── dto/
│   │   │   └── create-prestamo.dto.ts
│   │   ├── prestamos.controller.ts
│   │   └── prestamos.module.ts
│   ├── multas/
│   │   ├── multas.controller.ts
│   │   └── multas.module.ts
│   ├── reservas/
│   │   ├── reservas.controller.ts
│   │   └── reservas.module.ts
│   └── controller.module.ts       ← Módulo que agrupa todos los controllers
│
├── providers/                     ← Servicios con la lógica de negocio
│   ├── auth/auth.service.ts
│   ├── libros/libros.service.ts
│   ├── prestamos/prestamos.service.ts
│   ├── multas/multas.service.ts
│   └── reservas/reservas.service.ts
│
├── security/                      ← Seguridad JWT
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   └── roles.decorator.ts
│   └── strategies/
│       └── jwt.strategy.ts
│
├── app.module.ts                  ← Módulo raíz con TypeORM + Config
├── main.ts                        ← Arranque del servidor
└── .env                           ← Variables de entorno (no se sube al repo)
```

---

## Cómo ejecutar el proyecto

### Requisitos previos

- Node.js v18+
- npm v9+
- MySQL corriendo localmente (o via Docker)

### Backend

```bash
cd backend
npm install
# Configura las variables de entorno antes de correr
cp src/.env.example src/.env   # ajusta DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, JWT_SECRET
npm run start:dev
```

El servidor arranca en `http://localhost:3000`.
La documentación Swagger estará en `http://localhost:3000/api`.

### Frontend

```bash
cd frontend
npm install
ng serve
```

La aplicación estará disponible en `http://localhost:4200`.

---

## Módulos del sistema

El sistema se organiza en los siguientes módulos funcionales:

- **Autenticación:** login y control de acceso por roles con JWT.
- **Catálogo:** búsqueda y consulta del material bibliográfico disponible.
- **Préstamos:** solicitud, seguimiento y devolución de libros.
- **Multas:** visualización, cálculo automático y flujo de pago de multas.
- **Reservas:** búsqueda de salas disponibles, reserva por bloques horarios y cancelación.
- **Historial:** registro completo de todas las transacciones del usuario.
- **Administración:** gestión del catálogo, salas, usuarios y multas del sistema.

---

## Estado académico y restricciones

El sistema aplica restricciones automáticas basadas en el estado del estudiante. Antes de permitir un préstamo o una reserva, se verifica en tiempo real si el estudiante está activo académicamente y si tiene multas pendientes. Estas validaciones ocurren tanto en el backend (reglas de negocio) como en el frontend (experiencia de usuario con mensajes claros).

---

## Entregables esperados

- Módulos de préstamo y reserva funcionando de extremo a extremo.
- API REST documentada con Swagger para consumo externo.
- Flujo completo de multa generada → pago → habilitación automática del usuario.
- Integración funcional con el Sistema de Matrícula y el Sistema de Pagos.

---

## Equipo de desarrollo

| Rol | Cantidad |
|---|---|
| Líder de equipo | 1 |
| Desarrolladores Frontend | 3 |
| Desarrolladores Backend | 3 |
