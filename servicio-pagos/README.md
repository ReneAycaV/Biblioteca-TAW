# Servicio de Pagos (simulado)

Servicio **externo e independiente** del backend de la biblioteca que cobra las multas. Reemplaza al servicio de Pagos del otro equipo (Railway), que dejó de responder.

Expone el mismo contrato que usa `backend/src/providers/pago.service.ts`, así que el backend no necesita cambios de código: solo `PAGOS_BASE_URL` y `PAGOS_PRIVATE_KEY` en `backend/.env`.

**No mueve dinero real.** El resultado de cada pago depende de `MODO`.

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/v1/auth/token` | Recibe `{ privateKey }` y entrega `{ access_token, service, expires_in }` (válido 1 hora). Clave incorrecta: 401 |
| POST | `/v1/payments/orders` | Con `Authorization: Bearer <token>` y `{ referenceId, originService, amount, paymentMethod, description }`, crea la orden (201). Si la referencia ya tiene una orden pendiente o aprobada: 409. Una orden rechazada o cancelada se puede reintentar |
| GET | `/v1/payments/:referenceId` | Con token, devuelve `{ id, referenceId, status, amount, updatedAt }`. No existe: 404 |
| GET | `/` | Panel con todas las órdenes; en modo PENDIENTE permite aprobarlas o rechazarlas |
| GET | `/health` | Estado del servicio y modo actual |

`status` puede ser `PENDING`, `APPROVED`, `REJECTED` o `CANCELLED`, y `paymentMethod` `TARJETA`, `TRANSFERENCIA` o `BILLETERA`.

## Modos

| MODO | Resultado de cada pago nuevo |
|---|---|
| `APROBAR` (por defecto) | Aprobado al instante: la multa queda pagada |
| `PENDIENTE` | Queda pendiente; se aprueba o rechaza a mano en el panel |
| `RECHAZAR` | Rechazado siempre, para probar el caso de error |

## Ejecutar

```powershell
cd C:\Angular\Biblioteca-TAW\servicio-pagos; npm install; Copy-Item .env.example .env
```

Edita `.env` y pon la misma clave en `PAGOS_PRIVATE_KEY` aquí y en `backend/.env`. Luego:

```powershell
cd C:\Angular\Biblioteca-TAW\servicio-pagos; npm start
```

Queda en http://localhost:3002. En `backend/.env`:

```
PAGOS_BASE_URL=http://localhost:3002
PAGOS_PRIVATE_KEY=<la misma clave>
```

Reinicia el backend después de cambiar su `.env`. Las órdenes se guardan en `data/ordenes.json` (no se sube a git).

## Desplegarlo

Es una app Node.js con Express sin base de datos, así que se puede publicar en Render o Railway con `npm start` y las variables `PAGOS_PRIVATE_KEY` y `MODO`. En esos servicios el archivo `data/ordenes.json` se borra al reiniciar; para una demo basta, pero si se necesita conservar el historial habría que guardarlo en una base de datos.
