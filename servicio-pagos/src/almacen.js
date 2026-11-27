// Dónde se guardan las órdenes de pago.
//
// - Con base de datos (DATABASE_URL, o DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME igual que el backend):
//   tabla `pagos` en PostgreSQL, que se crea sola si no existe. Es lo que se usa en Vercel,
//   donde cada petición puede atenderla una instancia distinta y no se puede escribir en disco.
// - Sin base de datos: archivo data/ordenes.json (solo para correrlo en el PC).
const fs = require('fs');
const path = require('path');

function configBD() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } };
  }
  if (process.env.DB_HOST) {
    return {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME || 'postgres',
      ssl: { rejectUnauthorized: false },
    };
  }
  return null;
}

// ───────── PostgreSQL ─────────
function almacenPostgres(config) {
  const { Pool } = require('pg');
  const pool = new Pool({ ...config, max: 3 });
  let lista = null;
  const listo = () =>
    (lista ??= pool.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id              TEXT PRIMARY KEY,
        reference_id    VARCHAR(100) NOT NULL UNIQUE,
        origin_service  VARCHAR(50),
        amount          NUMERIC(12,2) NOT NULL,
        payment_method  VARCHAR(20) NOT NULL,
        description     VARCHAR(255),
        status          VARCHAR(20) NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      )`).catch((e) => { lista = null; throw e; }));

  const aOrden = (f) => f && ({
    id: f.id,
    referenceId: f.reference_id,
    originService: f.origin_service,
    amount: Number(f.amount),
    paymentMethod: f.payment_method,
    description: f.description,
    status: f.status,
    createdAt: new Date(f.created_at).toISOString(),
    updatedAt: new Date(f.updated_at).toISOString(),
  });

  return {
    tipo: 'PostgreSQL (tabla pagos)',
    async obtener(ref) {
      await listo();
      const { rows } = await pool.query('SELECT * FROM pagos WHERE reference_id = $1', [ref]);
      return aOrden(rows[0]);
    },
    // Crea la orden o reemplaza una anterior con la misma referencia (reintento tras un rechazo)
    async guardar(o) {
      await listo();
      await pool.query(
        `INSERT INTO pagos (id, reference_id, origin_service, amount, payment_method, description, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (reference_id) DO UPDATE SET id = EXCLUDED.id, origin_service = EXCLUDED.origin_service,
           amount = EXCLUDED.amount, payment_method = EXCLUDED.payment_method, description = EXCLUDED.description,
           status = EXCLUDED.status, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`,
        [o.id, o.referenceId, o.originService, o.amount, o.paymentMethod, o.description, o.status, o.createdAt, o.updatedAt],
      );
    },
    async cambiarEstado(ref, estado) {
      await listo();
      const { rowCount } = await pool.query('UPDATE pagos SET status = $2, updated_at = now() WHERE reference_id = $1', [ref, estado]);
      return rowCount > 0;
    },
    async listar() {
      await listo();
      const { rows } = await pool.query('SELECT * FROM pagos ORDER BY created_at DESC LIMIT 200');
      return rows.map(aOrden);
    },
  };
}

// ───────── archivo JSON (PC) ─────────
function almacenArchivo() {
  const archivo = path.join(__dirname, '..', 'data', 'ordenes.json');
  let ordenes = {};
  try { ordenes = JSON.parse(fs.readFileSync(archivo, 'utf8')); } catch { /* aún no hay órdenes */ }
  const escribir = () => {
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, JSON.stringify(ordenes, null, 2));
  };
  return {
    tipo: 'archivo data/ordenes.json',
    async obtener(ref) { return ordenes[ref] || null; },
    async guardar(o) { ordenes[o.referenceId] = o; escribir(); },
    async cambiarEstado(ref, estado) {
      const o = ordenes[ref];
      if (!o) return false;
      o.status = estado;
      o.updatedAt = new Date().toISOString();
      escribir();
      return true;
    },
    async listar() { return Object.values(ordenes).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  };
}

function crearAlmacen() {
  const config = configBD();
  return config ? almacenPostgres(config) : almacenArchivo();
}

module.exports = { crearAlmacen };
