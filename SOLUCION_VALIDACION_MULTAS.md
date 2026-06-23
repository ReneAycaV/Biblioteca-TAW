# 🛠️ Solución: Validación de Multas Antes de Solicitar Préstamo

## 📋 Descripción del Problema

Cuando presionabas "solicitar préstamo", el sistema no mostraba si tenías multas **antes** de intentar hacer la solicitud. Solo mostraba el error **después** de que el backend rechazaba la petición.

## ✅ Solución Implementada

### Cambios en el Frontend

#### 1. **Servicio de Préstamos** (`frontend/src/app/features/prestamos/services/prestamos.service.ts`)

```typescript
// Nuevo método agregado:
getMultasPendientes(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/multas/pendientes`);
}
```

#### 2. **Componente Detalle-Libro** (`frontend/src/app/features/catalogo/detalle-libro/detalle-libro.component.ts`)

**Nuevas propiedades:**

```typescript
tieneMultasPendientes = false;
multasPendientes: any[] = [];
```

**En `ngOnInit()`:**

```typescript
ngOnInit(): void {
  // Cargar multas pendientes al inicializar
  this.cargarMultasPendientes();

  this.paramSub = this.route.params.subscribe(params => {
    const id = +params['id'];
    this.cargarLibro(id);
  });
}
```

**Nuevo método:**

```typescript
cargarMultasPendientes(): void {
  this.prestamosService.getMultasPendientes().subscribe({
    next: (response: any) => {
      this.multasPendientes = Array.isArray(response) ? response : [];
      this.tieneMultasPendientes = this.multasPendientes && this.multasPendientes.length > 0;

      if (this.tieneMultasPendientes) {
        this.mensajeError = `Tienes ${this.multasPendientes.length} multa(s) pendiente(s). Debes regularizar tu situación antes de solicitar un préstamo.`;
      }
    },
    error: (err) => {
      console.error('Error al cargar multas:', err);
      this.tieneMultasPendientes = false;
    }
  });
}
```

**Método actualizado:**

```typescript
puedeSolicitarPrestamo(): boolean {
  if (!this.libroDetalle) return false;
  if (this.solicitando) return false;
  if (this.tieneMultasPendientes) return false; // ← NUEVO: bloquea si hay multas
  return this.libroDetalle.disponible && this.libroDetalle.stockDisponible > 0;
}
```

#### 3. **Template HTML** (`frontend/src/app/features/catalogo/detalle-libro/detalle-libro.component.html`)

**Nueva alerta agregada:**

```html
<!-- Alerta de multas pendientes -->
<div *ngIf="tieneMultasPendientes" class="detalle-alerta detalle-alerta--error">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
  <span>
    Tienes {{ multasPendientes.length }} multa(s) pendiente(s). Regulariza tu
    situación para poder solicitar un préstamo.
    <a routerLink="/multas" class="detalle-alerta__link"
      >Ver y pagar mis multas →</a
    >
  </span>
</div>
```

## 🔄 Flujo de Funcionamiento

1. **Usuario abre el detalle de un libro**
   - Se carga automáticamente: `cargarMultasPendientes()`

2. **Sistema verifica multas pendientes**
   - Consulta: `GET /api/multas/pendientes`

3. **Si el usuario tiene multas:**
   - ⚠️ Se muestra alerta roja y visible
   - ❌ El botón "Solicitar préstamo" se **deshabilita**
   - 🔗 Se muestra link directo a `/multas`
   - Número de multas se muestra en la alerta

4. **Si el usuario NO tiene multas:**
   - ✅ El botón está **habilitado**
   - Funciona normalmente

## 🔐 Validación en Backend (Existente)

El backend **ya contaba** con validación en dos lugares:

### 1. `library-access.service.ts`

```typescript
async validateNoPendingFines(userId: number): Promise<UsuarioEntity> {
  const usuario = await this.validateAcademicStatus(userId);

  if (usuario.tieneMultaImpaga) {
    throw new ForbiddenException('El usuario tiene multas impagas');
  }

  return usuario;
}
```

### 2. `prestamo.service.ts`

```typescript
async solicitarPrestamo(userId: number, idLibro: number): Promise<PrestamoEntity> {
  // ← Esta validación previene que se cree el préstamo
  const usuario = await this.libraryAccessService.validateNoPendingFines(userId);
  // ... resto del código
}
```

## 📡 Endpoint Usado

**GET** `/api/multas/pendientes`

- **Autenticación**: JWT requerido
- **Respuesta**: Array de multas del usuario
- **Formato**:

```json
[
  {
    "idPrestamo": 1,
    "libro": {
      "titulo": "...",
      "autor": "...",
      "valorLibro": 25000
    },
    "prestamo": {
      "fechaPrestamo": "2026-06-10",
      "fechaDevolucionEsperada": "2026-06-24",
      "estado": 1,
      "diasAtraso": 5
    },
    "multa": {
      "idMulta": 1,
      "estadoPago": "pendiente",
      "fechaGeneracion": "2026-06-25",
      "monto": 1250,
      "diasAtraso": 5
    }
  }
]
```

## 🎯 Beneficios

✅ **Validación temprana**: El usuario ve las multas ANTES de intentar solicitar  
✅ **Mejor UX**: Alerta clara y visible  
✅ **Prevención de errores**: Se evita hacer peticiones innecesarias  
✅ **Acceso rápido**: Link directo a la sección de multas  
✅ **Seguridad**: Backend mantiene su propia validación como respaldo

## 🧪 Pruebas Recomendadas

1. **Sin multas**: Verifica que el botón funcione normalmente
2. **Con multas**: Verifica que se muestre la alerta y se deshabilite el botón
3. **Error de conexión**: Verifica que no bloquee si falla la consulta de multas
4. **Pagar multas**: Verifica que después de pagar, se actualice la interfaz

## 📝 Notas

- La solución es **no bloqueante en caso de error**: Si hay problema consultando multas, el usuario puede intentar solicitar (será rechazado por el backend)
- El campo `usuario.tieneMultaImpaga` se actualiza automáticamente cuando se pagan las multas
- El CRON detecta préstamos vencidos diariamente a la medianoche
