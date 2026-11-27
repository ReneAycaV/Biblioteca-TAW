// Arranque en el PC: npm start (lee .env) -> http://localhost:3002
const { app, MODO, almacen, errorConfig } = require('./app');

if (errorConfig) {
  console.error(`${errorConfig}. Copia .env.example a .env y complétalo.`);
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3002;
app.listen(PORT, () => {
  console.log(`Servicio de Pagos escuchando en http://localhost:${PORT} (modo ${MODO}, órdenes en ${almacen.tipo})`);
});
