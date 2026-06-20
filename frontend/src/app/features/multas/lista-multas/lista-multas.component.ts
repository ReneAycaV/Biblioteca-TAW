import { Component, OnInit } from '@angular/core';
import { MultasService } from '../services/multas.service';
import { IMultaHistorial } from '../../../shared/interfaces/imulta-historial';

@Component({
  selector: 'app-lista-multas',
  templateUrl: './lista-multas.component.html',
  styleUrls: ['./lista-multas.component.css']
})
export class ListaMultasComponent implements OnInit {

  // Lista completa recibida del backend (o mock)
  todasLasMultas: IMultaHistorial[] = [];

  // Controla qué pestaña está activa en los chips de filtro
  filtroActivo: 'todas' | 'pendientes' | 'pagadas' = 'todas';

  // Texto del buscador — enlazado con [(ngModel)] al input del header
  searchQuery = '';

  // Totales calculados desde el endpoint /multas/resumen
  totalPendiente = 0;
  totalPagado = 0;
  cantidadPendientes = 0;
  cantidadPagadas = 0;

  // Control de estados de la UI
  cargando = false;
  mensajeError = '';
  mensajeExito = '';

  // Guarda el id de la multa que se está pagando para deshabilitar su botón
  pagandoId: number | null = null;

  // Constructor: SOLO inyección de dependencias, la lógica va en ngOnInit
  constructor(private multasService: MultasService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // Carga datos mock mientras no se conecta con el backend real
  cargarDatos(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.usarDatosMock();
    this.cargando = false;
  }

  // Datos de demostración que simulan la respuesta real del backend de Yazuska.
  // Cubren los 4 casos posibles: pendiente-pagable, pendiente-en-revisión, pagada-devuelto, pagada-extraviado.
  private usarDatosMock(): void {
    this.todasLasMultas = [
      {
        idPrestamo: 1,
        libro: { titulo: 'Cien Años de Soledad', autor: 'Gabriel García Márquez', valorLibro: 25000 },
        prestamo: {
          fechaPrestamo: '2026-04-20',
          fechaDevolucionEsperada: '2026-05-04',
          fechaDevolucionReal: '2026-05-07',
          estado: 'DEVUELTO',
          diasAtraso: 3
        },
        multa: {
          idMulta: 1,
          estadoPago: 'pendiente',
          fechaGeneracion: '2026-05-05',
          fechaPago: null,
          monto: 750,
          estadoLibro: 'devuelto_bueno',
          puedePagar: true,
          mensajeUsuario: 'Libro devuelto en buen estado. Debes pagar solo la multa por atraso.'
        }
      },
      {
        idPrestamo: 2,
        libro: { titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry', valorLibro: 12000 },
        prestamo: {
          fechaPrestamo: '2026-05-01',
          fechaDevolucionEsperada: '2026-05-15',
          fechaDevolucionReal: null,
          estado: 'VENCIDO',
          diasAtraso: 12
        },
        multa: {
          idMulta: 2,
          estadoPago: 'pendiente',
          fechaGeneracion: '2026-05-16',
          fechaPago: null,
          monto: null,
          estadoLibro: 'no_devuelto',
          requiereDecision: true,
          mensajeAdmin: 'El libro está pendiente de revisión por el administrador.'
        }
      },
      {
        idPrestamo: 3,
        libro: { titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', valorLibro: 30000 },
        prestamo: {
          fechaPrestamo: '2026-03-10',
          fechaDevolucionEsperada: '2026-03-24',
          fechaDevolucionReal: '2026-03-30',
          estado: 'DEVUELTO',
          diasAtraso: 6
        },
        multa: {
          idMulta: 3,
          estadoPago: 'pagada',
          fechaGeneracion: '2026-03-25',
          fechaPago: '2026-04-02',
          monto: 1800,
          estadoLibro: 'devuelto_bueno'
        }
      },
      {
        idPrestamo: 4,
        libro: { titulo: 'Breve Historia del Tiempo', autor: 'Stephen Hawking', valorLibro: 18000 },
        prestamo: {
          fechaPrestamo: '2026-02-01',
          fechaDevolucionEsperada: '2026-02-15',
          fechaDevolucionReal: '2026-03-01',
          estado: 'PERDIDO',
          diasAtraso: 14
        },
        multa: {
          idMulta: 4,
          estadoPago: 'pagada',
          fechaGeneracion: '2026-02-16',
          fechaPago: '2026-03-05',
          monto: 21500,
          estadoLibro: 'perdido_total'
        }
      }
    ];

    // Calcula los totales desde los propios datos mock (igual que haría el backend)
    this.cantidadPendientes = this.todasLasMultas.filter(m => m.multa.estadoPago === 'pendiente').length;
    this.cantidadPagadas    = this.todasLasMultas.filter(m => m.multa.estadoPago === 'pagada').length;
    this.totalPendiente = this.todasLasMultas
      .filter(m => m.multa.estadoPago === 'pendiente' && m.multa.monto !== null)
      .reduce((suma, m) => suma + (m.multa.monto ?? 0), 0);
    this.totalPagado = this.todasLasMultas
      .filter(m => m.multa.estadoPago === 'pagada')
      .reduce((suma, m) => suma + (m.multa.monto ?? 0), 0);
  }

  // Getter calculado: combina filtro de estado + filtro de búsqueda por texto.
  // Angular vuelve a evaluarlo automáticamente cada vez que cambia filtroActivo o searchQuery.
  get multasFiltradas(): IMultaHistorial[] {
    let resultado = this.todasLasMultas;

    if (this.filtroActivo === 'pendientes') {
      resultado = resultado.filter(m => m.multa.estadoPago === 'pendiente');
    } else if (this.filtroActivo === 'pagadas') {
      resultado = resultado.filter(m => m.multa.estadoPago === 'pagada');
    }

    // Si hay texto en el buscador, filtra también por título o autor
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      resultado = resultado.filter(m =>
        m.libro.titulo.toLowerCase().includes(q) ||
        m.libro.autor.toLowerCase().includes(q)
      );
    }

    return resultado;
  }

  // Cambia el chip activo; el getter multasFiltradas reacciona automáticamente
  setFiltro(filtro: 'todas' | 'pendientes' | 'pagadas'): void {
    this.filtroActivo = filtro;
  }

  // Llama a POST /multas/pagar con el id de la multa.
  // Mientras espera, deshabilita el botón con pagandoId para evitar doble pago.
  pagarMulta(idMulta: number): void {
    this.pagandoId = idMulta;
    this.mensajeExito = '';
    this.mensajeError = '';

    this.multasService.pagarMulta(idMulta).subscribe({
      next: () => {
        this.mensajeExito = '¡Multa pagada exitosamente! Tu estado de cuenta ha sido actualizado.';
        this.pagandoId = null;
        // Recarga todos los datos para reflejar el nuevo estado en el banner y las tarjetas
        this.cargarDatos();
      },
      error: (err) => {
        this.pagandoId = null;
        if (err.status === 400) {
          this.mensajeError = 'Esta multa ya fue pagada anteriormente.';
        } else if (err.status === 403) {
          this.mensajeError = 'No puedes pagar una multa que no te pertenece.';
        } else if (err.status === 404) {
          this.mensajeError = 'No se encontró la multa. Recarga la página.';
        } else {
          this.mensajeError = 'Error al procesar el pago. Intenta más tarde.';
        }
        console.error('Error al pagar multa:', err);
      }
    });
  }

  // Formatea un número como monto en pesos chilenos (sin decimales, con separador de miles)
  formatearMonto(monto: number | null): string {
    if (monto === null || monto === undefined) return '—';
    return monto.toLocaleString('es-CL');
  }

  // Convierte los valores internos del backend ('devuelto_bueno', etc.) a texto legible en pantalla
  getTextoEstadoLibro(estadoLibro: string): string {
    const textos: { [key: string]: string } = {
      'devuelto_bueno': 'Devuelto',
      'perdido_total':  'Extraviado',
      'no_devuelto':    'No devuelto'
    };
    // El operador ?? retorna el valor de la derecha solo si la izquierda es null/undefined
    return textos[estadoLibro] ?? estadoLibro;
  }
}
