# Servicio de Pagos (simulado)

Servicio **externo e independiente** del backend de la biblioteca que cobra las multas. Reemplaza al servicio de Pagos del otro equipo (Railway), que dejó de responder.

Expone el mismo contrato que usa `backend/src/providers/pago.service.ts`, así que el backend no necesita cambios de código: solo `PAGOS_BASE_URL` y `PAGOS_PRIVATE_KEY`.

**No mueve dinero real.** El resultado de cada pago depende de `MODO`.

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/v1/auth/token` | Recibe `{ privateKey }` y entrega `{ access_token, service, expires_in }` (válido 1 hora). Clave incorrecta: 401 |
| POST | `/v1/payments/orders` | Con `Authorization: Bearer <token>` y `{ referenceId, originService, amount, paymentMethod, description }`, crea la orden (201). Si la referencia ya tiene una orden pendiente o aprobada: 409. Una orden rechazada o cancelada se puede reintentar |
| GET | `/v1/payments/:referenceId` | Con token, devuelve `{ id, referenceId, status, amount, updatedAt }`. No existe: 404 |
| GET | `/` | Panel con las órdenes; en modo PENDIENTE permite aprobarlas o rechazarlas |
| GET | `/health` | Estado del servicio, modo y dónde guarda las órdenes |

`status` puede ser `PENDING`, `APPROVED`, `REJECTED` o `CANCELLED`, y `paymentMethod` `TARJETA`, `TRANSFERENCIA` o `BILLETERA`.

## Modos

| MODO | Resultado de cada pago nuevo |
|---|---|
| `APROBAR` (por defecto) | Aprobado al instante: la multa queda pagada |
| `PENDIENTE` | Queda pendiente; se aprueba o rechaza a mano en el panel |
| `RECHAZAR` | Rechazado siempre, para probar el caso de error |

## Dónde se guardan las órdenes

En la tabla **`pagos`** de la misma base de datos de Supabase de la biblioteca. La tabla se crea sola la primera vez y no toca ninguna otra tabla. Los tokens van firmados con la clave privada, así que cualquier instancia los valida sin guardarlos: por eso funciona en Vercel, donde cada petición puede atenderla una instancia distinta.

Sin variables de base de datos (solo en el PC), las órdenes se guardan en `data/ordenes.json`.

## Ejecutar en el PC

```powershell
cd C:\Angular\Biblioteca-TAW\servicio-pagos; npm install; Copy-Item .env.example .env
```

Completa `.env` (la misma clave que `PAGOS_PRIVATE_KEY` del backend y las 5 variables `DB_*` del backend) y luego:

```powershell
cd C:\Angular\Biblioteca-TAW\servicio-pagos; npm start
```

Queda en http://localhost:3002. En `backend/.env`: `PAGOS_BASE_URL=http://localhost:3002` y la misma `PAGOS_PRIVATE_KEY`. Reinicia el backend después de cambiar su `.env`.

## Publicar en Vercel

1. Nuevo proyecto en Vercel desde el mismo repositorio, con **Root Directory = `servicio-pagos`** y **Framework Preset = Other**. `vercel.json` envía todas las rutas a `api/index.js`.
2. Variables de entorno del proyecto:

   | Variable | Valor |
   |---|---|
   | `PAGOS_PRIVATE_KEY` | Una clave larga inventada |
   | `MODO` | `APROBAR` |
   | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | Los mismos valores que el backend |

3. Al terminar el despliegue, abre `https://<tu-proyecto>.vercel.app/health`: debe decir `"status":"ok"` y `"almacen":"PostgreSQL (tabla pagos)"`.
4. En el proyecto del **backend** en Vercel: `PAGOS_BASE_URL` = la URL del servicio (sin `/` al final) y `PAGOS_PRIVATE_KEY` = la misma clave. Vuelve a desplegar el backend.
