// Servicio de Pagos simulado
//
// Servicio externo e independiente del backend de la biblioteca. Expone el mismo
// contrato que consume backend/src/providers/pago.service.ts:
//
//   POST /v1/auth/token           { privateKey }                      -> { access_token, service, expires_in }
//   POST /v1/payments/orders      Bearer + { referenceId, originService, amount, paymentMethod, description }
//                                                                      -> 201 orden | 409 si ya existe
//   GET  /v1/payments/:referenceId  Bearer                            -> { id, referenceId, status, amount, updatedAt }
//
// No mueve dinero real: decide el resultado del pago según MODO (APROBAR, PENDIENTE o RECHAZAR).
// Con MODO=PENDIENTE las órdenes se aprueban o rechazan a mano desde el panel (GET /).
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3002;
const PRIVATE_KEY = (process.env.PAGOS_PRIVATE_KEY || '').trim();
const MODO = (process.env.MODO || 'APROBAR').trim().toUpperCase();
const TOKEN_TTL_MS = 60 * 60 * 1000;
const DATA_FILE = path.join(__dirname, '..', 'data', 'ordenes.json');

const METODOS = ['TARJETA', 'TRANSFERENCIA', 'BILLETERA'];
const ESTADOS = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const ESTADO_INICIAL = { APROBAR: 'APPROVED', PENDIENTE: 'PENDING', RECHAZAR: 'REJECTED' }[MODO];

if (!PRIVATE_KEY) {
  console.error('Falta PAGOS_PRIVATE_KEY. Copia .env.example a .env y define una clave.');
  process.exit(1);
}
if (!ESTADO_INICIAL) {
  console.error(`MODO inválido: "${MODO}". Usa APROBAR, PENDIENTE o RECHAZAR.`);
  process.exit(1);
}

// ───────── almacenamiento (archivo JSON) ─────────
function cargar() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}
const ordenes = cargar(); // referenceId -> orden
function guardar() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(ordenes, null, 2));
}

// ───────── tokens ─────────
const tokens = new Map(); // token -> { service, expira }
function autenticar(req, res, next) {
  const m = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  const t = m && tokens.get(m[1]);
  if (!t || t.expira < Date.now()) {
    if (m) tokens.delete(m[1]);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  req.servicio = t.service;
  next();
}
const claveValida = (clave) =>
  typeof clave === 'string' &&
  clave.length === PRIVATE_KEY.length &&
  crypto.timingSafeEqual(Buffer.from(clave), Buffer.from(PRIVATE_KEY));

const publica = (o) => ({
  id: o.id,
  referenceId: o.referenceId,
  originService: o.originService,
  amount: o.amount.toFixed(2),
  paymentMethod: o.paymentMethod,
  description: o.description,
  status: o.status,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
});

const app = express();
app.use(express.json({ limit: '20kb' }));
app.use((req, _res, next) => {
  if (req.path.startsWith('/v1')) console.log(`[PAGOS] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok', modo: MODO }));

// 1) Token
app.post('/v1/auth/token', (req, res) => {
  if (!claveValida(req.body?.privateKey)) {
    return res.status(401).json({ message: 'Clave privada inválida' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, { service: 'BIBLIOTECA', expira: Date.now() + TOKEN_TTL_MS });
  res.json({ access_token: token, service: 'BIBLIOTECA', expires_in: TOKEN_TTL_MS / 1000 });
});

// 2) Crear orden
app.post('/v1/payments/orders', autenticar, (req, res) => {
  const { referenceId, originService, amount, paymentMethod = 'TARJETA', description = '' } = req.body || {};
  const errores = [];
  if (typeof referenceId !== 'string' || !referenceId.trim() || referenceId.length > 100) errores.push('referenceId es obligatorio (texto de hasta 100 caracteres)');
  const monto = Number(amount);
  if (!Number.isFinite(monto) || monto <= 0) errores.push('amount debe ser un número mayor que 0');
  if (!METODOS.includes(paymentMethod)) errores.push(`paymentMethod debe ser ${METODOS.join(', ')}`);
  if (errores.length) return res.status(400).json({ message: 'Datos inválidos', errores });

  const previa = ordenes[referenceId];
  // Una orden rechazada o cancelada se puede reintentar con la misma referencia
  if (previa && !['REJECTED', 'CANCELLED'].includes(previa.status)) {
    return res.status(409).json({ message: 'Ya existe una orden con esa referencia', order: publica(previa) });
  }

  const ahora = new Date().toISOString();
  const orden = {
    id: `ORD-${crypto.randomUUID()}`,
    referenceId,
    originService: originService || req.servicio,
    amount: Math.round(monto * 100) / 100,
    paymentMethod,
    description: String(description).slice(0, 255),
    status: ESTADO_INICIAL,
    createdAt: ahora,
    updatedAt: ahora,
  };
  ordenes[referenceId] = orden;
  guardar();
  console.log(`[PAGOS] Orden ${orden.id} (${referenceId}) por $${orden.amount} -> ${orden.status}`);
  res.status(201).json(publica(orden));
});

// 3) Consultar estado
app.get('/v1/payments/:referenceId', autenticar, (req, res) => {
  const orden = ordenes[req.params.referenceId];
  if (!orden) return res.status(404).json({ message: 'Orden no encontrada' });
  res.json(publica(orden));
});

// ───────── panel (solo para ver y resolver órdenes en la demo) ─────────
app.post('/panel/ordenes/:referenceId/estado', express.urlencoded({ extended: false }), (req, res) => {
  const orden = ordenes[req.params.referenceId];
  const estado = String(req.body?.estado || '').toUpperCase();
  if (!orden || !ESTADOS.includes(estado)) return res.status(400).send('Orden o estado inválido');
  orden.status = estado;
  orden.updatedAt = new Date().toISOString();
  guardar();
  res.redirect('/');
});

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
app.get('/', (_req, res) => {
  const filas = Object.values(ordenes)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((o) => `<tr><td>${esc(o.referenceId)}</td><td>${esc(o.description)}</td><td class="num">$${o.amount.toLocaleString('es-CL')}</td>
      <td>${esc(o.paymentMethod)}</td><td><span class="st ${o.status}">${o.status}</span></td><td>${new Date(o.updatedAt).toLocaleString('es-CL')}</td>
      <td>${o.status === 'PENDING' ? ['APPROVED', 'REJECTED'].map((e) => `<form method="post" action="/panel/ordenes/${encodeURIComponent(o.referenceId)}/estado"><input type="hidden" name="estado" value="${e}"><button class="${e}">${e === 'APPROVED' ? 'Aprobar' : 'Rechazar'}</button></form>`).join('') : ''}</td></tr>`)
    .join('');
  res.send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Servicio de Pagos</title><style>
body{font-family:Arial,sans-serif;margin:24px;color:#1f2328}h1{font-size:20px;margin:0 0 4px}p{color:#5b6169;margin:0 0 16px}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid #e6e8eb;padding:8px;text-align:left}th{background:#f6f8fa}
.num{text-align:right}.st{padding:2px 8px;border-radius:10px;font-size:12px;font-weight:700}.APPROVED{background:#dafbe1;color:#1a7f37}
.PENDING{background:#fff8c5;color:#7d4e00}.REJECTED,.CANCELLED{background:#ffebe9;color:#cf222e}form{display:inline;margin-right:4px}
button{border:1px solid #d0d7de;border-radius:6px;padding:4px 10px;cursor:pointer}</style></head><body>
<h1>Servicio de Pagos (simulado)</h1><p>Modo: <b>${MODO}</b> · ${Object.keys(ordenes).length} órdenes · no se mueve dinero real</p>
<table><thead><tr><th>Referencia</th><th>Descripción</th><th class="num">Monto</th><th>Método</th><th>Estado</th><th>Actualizada</th><th></th></tr></thead>
<tbody>${filas || '<tr><td colspan="7">Sin órdenes todavía.</td></tr>'}</tbody></table></body></html>`);
});

app.listen(PORT, () => {
  console.log(`Servicio de Pagos escuchando en http://localhost:${PORT} (modo ${MODO})`);
});
