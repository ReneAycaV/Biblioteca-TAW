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
- Ver, pagar y gestionar sus multas por atraso.
- Reservar salas de estudio por bloques horarios.
- Consultar el historial completo de sus transacciones.

Y que permita a los administradores gestionar el catálogo, las salas, los usuarios y el estado general del sistema.

---

## Roles de usuario

El sistema contempla dos roles principales (`RolUsuario`: `ADMIN` | `ESTUDIANTE`):

- **Estudiante:** puede buscar libros, solicitar préstamos, reservar salas, ver y pagar sus multas, y revisar su historial.
- **Administrador:** puede gestionar el catálogo de libros, las salas de estudio y los usuarios del sistema.

Los usuarios no se auto-registran. Son creados por el administrador o provienen de la integración con el Sistema de Matrícula.

---

## Reglas de negocio principales

- Un estudiante debe estar académicamente activo (validado contra el Sistema de Matrícula) para solicitar préstamos o reservar salas.
- Un estudiante con multa impaga no puede reservar salas.
- No se permiten reservas solapadas para el mismo usuario.
- No se permiten reservas duplicadas en la misma sala y bloque horario.
- Las multas se calculan automáticamente por días de atraso al momento de la devolución.
- Cuando una multa es pagada (vía el Sistema de Pagos), el usuario queda habilitado automáticamente.
- Un usuario no puede tener más de un número definido de préstamos activos simultáneamente.

---

## Integraciones externas

Este sistema se comunica con otros sistemas del ecosistema NYU:

- **Sistema de Matrícula y Gestión Académica** (`MatriculaApiService`): se consulta para validar si un estudiante está activo antes de permitirle solicitar préstamos o reservar salas.
- **Sistema de Pagos y Tesorería Central** (`PagoService`): se utiliza para el cobro de multas. Cuando el pago es confirmado, el sistema desbloquea al usuario automáticamente.
- **Sistema de Cafetería y Planes de Alimentación** (`SistemaCafeteriaController`): le entrega información sobre los horarios de alta demanda en la biblioteca, para que la cafetería pueda planificar promociones en esos bloques.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular (SPA) + Bootstrap |
| Backend | NestJS |
| Base de datos | PostgreSQL + TypeORM |
| Autenticación | JWT |
| Documentación API | Swagger (`/docs`) |
| Hosting | Vercel (frontend y backend) |

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
├── shared/                        ← Componentes, interfaces y utilidades reutilizables
│   ├── components/
│   │   ├── navbar/                ← Barra de navegación superior
│   │   └── loading-spinner/       ← Spinner de carga global
│   ├── interfaces/                ← Interfaces TypeScript del dominio (prefijo I)
│   │   ├── ilibro-detalle.ts
│   │   ├── iprestamo.ts
│   │   ├── ireserva.ts
│   │   ├── isala.ts
│   │   ├── ihistorial-response.ts
│   │   └── imulta-historial.ts
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
│   │   ├── estado-prestamo.enum.ts
│   │   └── estado-sala.enum.ts    ← DISPONIBLE | MANTENIMIENTO | BLOQUEADA
│   └── shared.module.ts
│
└── features/                      ← Un módulo por cada funcionalidad del sistema
    ├── auth/
    │   ├── login/
    │   └── auth.module.ts
    ├── catalogo/
    │   ├── lista-libros/          ← Búsqueda y listado de libros
    │   ├── detalle-libro/         ← Vista detallada de un libro
    │   ├── services/catalogo.service.ts
    │   └── catalogo.module.ts
    ├── prestamos/
    │   ├── crear-prestamo/
    │   ├── historial-prestamos/
    │   ├── services/prestamos.service.ts
    │   └── prestamos.module.ts
    ├── multas/
    │   ├── lista-multas/
    │   ├── pagar-multa/
    │   ├── services/multas.service.ts
    │   └── multas.module.ts
    ├── reservas/
    │   ├── nueva-reserva/          ← Wizard: horario → salas disponibles → detalle/confirmación
    │   │   ├── horario/
    │   │   └── detalle-sala/
    │   ├── services/reservas.service.ts
    │   └── reservas.module.ts
    ├── menu-principal/
    │   ├── menu-principal-usuario/
    │   ├── menu-principal-admin/
    │   └── menu-principal.module.ts
    └── admin/                     ← Solo accesible con rol ADMIN
        ├── gestion-libros/
        ├── gestion-salas/
        ├── gestion-usuarios/
        ├── services/admin.service.ts
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
│       ├── sala.entity.ts
│       └── historial-transaccion.entity.ts
│
├── controllers/                   ← Controladores HTTP agrupados por módulo
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   └── test.controller.ts
│   ├── libros/libros.controller.ts
│   ├── prestamos/prestamos.controller.ts
│   ├── multas/multas.controller.ts
│   ├── historial/historial.controller.ts
│   ├── validaciones/validaciones.controller.ts
│   ├── library/library.controller.ts      ← Verificación de acceso a biblioteca
│   ├── reserve/
│   │   ├── reserve.controller.ts          ← Crear/consultar/cancelar reservas y salas
│   │   └── high-demand.controller.ts      ← Info de horarios de alta demanda (cafetería)
│   └── salas/salas-admin.controller.ts    ← CRUD de salas (solo admin)
│
├── dto/                            ← DTOs de request/response (validados con class-validator)
│   ├── login-request.dto.ts
│   ├── login-response.dto.ts
│   ├── create-libro.dto.ts
│   ├── update-libro.dto.ts
│   ├── solicitar-prestamo.dto.ts
│   ├── reserve-create.dto.ts
│   ├── reserve-response.dto.ts
│   └── update-sala-estado.dto.ts
│
├── modules/                        ← Un módulo NestJS por funcionalidad
│   ├── auth.module.ts              ← Agrupa auth, multas, validaciones y library
│   ├── libros.module.ts
│   ├── prestamos.module.ts
│   ├── historial.module.ts
│   ├── reserve.module.ts
│   └── salas-admin.module.ts
│
├── providers/                      ← Servicios con la lógica de negocio
│   ├── auth.service.ts
│   ├── libros.service.ts
│   ├── prestamos.service.ts
│   ├── multas.service.ts
│   ├── historial.service.ts
│   ├── validaciones.service.ts
│   ├── library-access.service.ts
│   ├── reserve-room.service.ts
│   ├── salas-admin.service.ts
│   ├── matricula-api.service.ts    ← Integración con Sistema de Matrícula
│   └── pago.service.ts             ← Integración con Sistema de Pagos
│
├── security/                       ← Seguridad JWT
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/roles.decorator.ts
│   └── strategies/jwt.strategy.ts
│
├── app.module.ts                   ← Módulo raíz: TypeORM (PostgreSQL) + Config + Schedule
├── main.ts                         ← Arranque del servidor, ValidationPipe, CORS y Swagger
└── .env                            ← Variables de entorno (no se sube al repo)
```

---

## Cómo ejecutar el proyecto

### Requisitos previos

- Node.js v18+
- npm v9+
- Una base de datos PostgreSQL accesible (local o remota)

### Backend

```bash
cd backend
npm install
```

Crea un archivo `src/.env` con las siguientes variables:

```
PORT=3000
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
JWT_SECRET=
JWT_EXPIRES_IN=
USER_SYSTEM_URL=
MATRICULA_SYSTEM_URL=
```

```bash
npm run start:dev
```

El servidor arranca en `http://localhost:3000`.
La documentación Swagger estará en `http://localhost:3000/docs`.

### Frontend

```bash
cd frontend
npm install
ng serve
```

La aplicación estará disponible en `http://localhost:4200`.

> **Importante:** `environment.ts` apunta por defecto al backend ya desplegado en Vercel (`apiUrl`), no a `localhost:3000`. Si necesitas probar contra tu backend local, cambia `apiUrl` en `frontend/src/environments/environment.ts` antes de correr `ng serve`.

### Despliegue

Tanto el frontend como el backend se despliegan en **Vercel**. El backend define en `backend/vercel.json` un cron job diario (`/multas/cron/verificar-prestamos`) para generar multas automáticamente por préstamos atrasados.

---

## Módulos del sistema

El sistema se organiza en los siguientes módulos funcionales:

- **Autenticación:** login y control de acceso por roles con JWT.
- **Catálogo:** búsqueda y consulta del material bibliográfico disponible.
- **Préstamos:** solicitud, seguimiento y devolución de libros.
- **Multas:** visualización, cálculo automático (vía cron) y flujo de pago de multas.
- **Reservas:** búsqueda de salas disponibles, reserva por bloques horarios y cancelación.
- **Historial:** registro completo de todas las transacciones del usuario.
- **Administración:** gestión del catálogo, salas y usuarios del sistema.

---

## Estado académico y restricciones

El sistema aplica restricciones automáticas basadas en el estado del estudiante. Antes de permitir un préstamo o una reserva, se verifica en tiempo real (contra el Sistema de Matrícula) si el estudiante está activo académicamente y si tiene multas pendientes. Estas validaciones ocurren tanto en el backend (reglas de negocio) como en el frontend (experiencia de usuario con mensajes claros).

---

## Entregables logrados

- Módulos de préstamo y reserva funcionando de extremo a extremo.
- API REST documentada con Swagger para consumo externo (`/docs`).
- Flujo completo de multa generada → pago → habilitación automática del usuario.
- Integración funcional con el Sistema de Matrícula y el Sistema de Pagos.
- Panel de administración con gestión de libros, salas y usuarios.

---

## Equipo de desarrollo

| Rol | Cantidad |
|---|---|
| Líder de equipo | 1 |
| Desarrolladores Frontend | 3 |
| Desarrolladores Backend | 3 |
