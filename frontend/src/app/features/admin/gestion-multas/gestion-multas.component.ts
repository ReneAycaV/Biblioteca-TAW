import { Component, OnInit } from '@angular/core';
import { AdminService, IMultaAdmin } from '../services/admin.service';

type FiltroMulta = '' | 'revision' | 'pendiente' | 'pagada' | 'condonada';

@Component({
  selector: 'app-gestion-multas',
  templateUrl: './gestion-multas.component.html',
  styleUrls: ['./gestion-multas.component.css'],
})
export class GestionMultasComponent implements OnInit {
  multas: IMultaAdmin[] = [];
  cargando = true;
  procesando = false;
  error = '';
  exito = '';

  busqueda = '';
  filtro: FiltroMulta = '';

  // Modal de revisión del libro (devuelto / perdido)
  multaRevision: IMultaAdmin | null = null;
  // Modal de condonación
  multaCondonar: IMultaAdmin | null = null;
  motivoCondonacion = '';
  errorModal = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarMultas();
  }

  cargarMultas(): void {
    this.cargando = true;
    this.adminService.getMultas().subscribe({
      next: (multas) => {
        this.multas = multas;
        this.cargando = false;
      },
      error: (err) => {
        this.error = this.adminService.mensajeError(err, 'No se pudieron cargar las multas');
        this.cargando = false;
      },
    });
  }

  esCondonada(m: IMultaAdmin): boolean {
    return m.estadoPago === 'pagada' && !!m.observaciones?.startsWith('CONDONADA');
  }

  situacion(m: IMultaAdmin): Exclude<FiltroMulta, ''> {
    if (this.esCondonada(m)) return 'condonada';
    if (m.estadoPago === 'pagada') return 'pagada';
    if (m.requiereDecision) return 'revision';
    return 'pendiente';
  }

  etiqueta(m: IMultaAdmin): { texto: string; clase: string } {
    switch (this.situacion(m)) {
      case 'revision':
        return { texto: 'Requiere revisión', clase: 'adm-badge--amber' };
      case 'pendiente':
        return { texto: 'Pendiente de pago', clase: 'adm-badge--red' };
      case 'condonada':
        return { texto: 'Condonada', clase: 'adm-badge--blue' };
      default:
        return { texto: 'Pagada', clase: 'adm-badge--green' };
    }
  }

  etiquetaLibro(m: IMultaAdmin): string {
    if (m.estadoLibro === 'devuelto_bueno') return 'Devuelto';
    if (m.estadoLibro === 'perdido_total') return 'Perdido';
    return 'No devuelto';
  }

  // Monto que se cobraría si el admin marca el libro como devuelto (solo atraso)
  montoEstimado(m: IMultaAdmin, perdido: boolean): number {
    const atraso = m.diasAtraso * m.libro.valorLibro * 0.01;
    return perdido ? m.libro.valorLibro + atraso : atraso;
  }

  get multasFiltradas(): IMultaAdmin[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.multas.filter((m) => {
      const coincide =
        !q ||
        `${m.usuario.nombre} ${m.usuario.apellido}`.toLowerCase().includes(q) ||
        m.usuario.correo.toLowerCase().includes(q) ||
        m.usuario.rut?.toLowerCase().includes(q) ||
        (m.libro.titulo ?? '').toLowerCase().includes(q);
      return coincide && (!this.filtro || this.situacion(m) === this.filtro);
    });
  }

  contar(s: Exclude<FiltroMulta, ''>): number {
    return this.multas.filter((m) => this.situacion(m) === s).length;
  }

  get totalPorCobrar(): number {
    return this.multas
      .filter((m) => this.situacion(m) === 'pendiente')
      .reduce((t, m) => t + (Number(m.monto) || 0), 0);
  }

  get totalRecaudado(): number {
    return this.multas
      .filter((m) => this.situacion(m) === 'pagada')
      .reduce((t, m) => t + (Number(m.monto) || 0), 0);
  }

  // ───────── Revisión del libro ─────────
  abrirRevision(m: IMultaAdmin): void {
    this.multaRevision = m;
    this.errorModal = '';
  }

  resolver(estado: 'BUENO' | 'PERDIDO'): void {
    const m = this.multaRevision;
    if (!m) return;
    this.procesando = true;
    this.errorModal = '';
    this.adminService.resolverMulta(m.idMulta, estado).subscribe({
      next: () => {
        this.procesando = false;
        this.multaRevision = null;
        this.mostrarExito(
          estado === 'BUENO'
            ? `Libro de ${m.usuario.nombre} registrado como devuelto. El estudiante ya puede pagar la multa.`
            : `Libro registrado como perdido. Se descontó un ejemplar del inventario.`,
        );
        this.cargarMultas();
      },
      error: (err) => {
        this.procesando = false;
        this.errorModal = this.adminService.mensajeError(err, 'No se pudo registrar la revisión');
      },
    });
  }

  // ───────── Condonación ─────────
  abrirCondonar(m: IMultaAdmin): void {
    this.multaCondonar = m;
    this.motivoCondonacion = '';
    this.errorModal = '';
  }

  condonar(): void {
    const m = this.multaCondonar;
    if (!m) return;
    if (!this.motivoCondonacion.trim()) {
      this.errorModal = 'Debes indicar el motivo de la condonación';
      return;
    }
    this.procesando = true;
    this.errorModal = '';
    this.adminService.condonarMulta(m.idMulta, this.motivoCondonacion.trim()).subscribe({
      next: () => {
        this.procesando = false;
        this.multaCondonar = null;
        this.mostrarExito(`Multa #${m.idMulta} condonada correctamente`);
        this.cargarMultas();
      },
      error: (err) => {
        this.procesando = false;
        this.errorModal = this.adminService.mensajeError(err, 'No se pudo condonar la multa');
      },
    });
  }

  cerrarModales(): void {
    if (this.procesando) return;
    this.multaRevision = null;
    this.multaCondonar = null;
  }

  private mostrarExito(mensaje: string): void {
    this.error = '';
    this.exito = mensaje;
    setTimeout(() => {
      if (this.exito === mensaje) this.exito = '';
    }, 4500);
  }
}
