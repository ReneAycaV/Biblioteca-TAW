import { Component, OnInit } from '@angular/core';
import { AdminService, ISalaAdmin, ISalaPayload } from '../services/admin.service';

// Nombres que entiende el backend (SalasAdminService.mapearUbicacion / mapearEstado)
const UBICACIONES: Record<number, string> = {
  1: 'Biblioteca',
  2: 'Aulario A',
  3: 'Aulario C',
  4: 'Cafeteria A',
  5: 'Cafeteria B',
  6: 'Auditorio',
};

const ESTADOS: Record<number, string> = {
  1: 'Disponible',
  2: 'Mantenimiento',
  3: 'Bloqueada',
};

@Component({
  selector: 'app-gestion-salas',
  templateUrl: './gestion-salas.component.html',
  styleUrls: ['./gestion-salas.component.css']
})
export class GestionSalasComponent implements OnInit {
  listaSalas: ISalaAdmin[] = [];
  cargando = true;
  guardando = false;
  error = '';
  exito = '';

  busqueda = '';
  filtroUbicacion = '';
  filtroEstado = '';

  readonly ubicaciones = Object.values(UBICACIONES);
  readonly estados = Object.values(ESTADOS);

  modalAbierto = false;
  salaEditando: ISalaAdmin | null = null;
  form: ISalaPayload = this.formVacio();
  errorForm = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarSalas();
  }

  cargarSalas(): void {
    this.cargando = true;
    this.adminService.getSalas().subscribe({
      next: (data) => {
        // El backend entrega ubicación y estado como números: se traducen a texto
        this.listaSalas = data
          .map((sala) => ({
            ...sala,
            ubicacion: this.formatear(sala.ubicacion, UBICACIONES, 'Sin ubicación'),
            estado: this.formatear(sala.estado, ESTADOS, 'Disponible'),
          }))
          .sort((a, b) => a.idSala - b.idSala);
        this.cargando = false;
      },
      error: (err) => {
        this.error = this.adminService.mensajeError(err, 'No se pudieron cargar las salas');
        this.cargando = false;
      },
    });
  }

  get salasFiltradas(): ISalaAdmin[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.listaSalas.filter(
      (s) =>
        (!q || s.nombreSala.toLowerCase().includes(q) || (s.descripcion ?? '').toLowerCase().includes(q)) &&
        (!this.filtroUbicacion || s.ubicacion === this.filtroUbicacion) &&
        (!this.filtroEstado || s.estado === this.filtroEstado),
    );
  }

  contarPorEstado(estado: string): number {
    return this.listaSalas.filter((s) => s.estado === estado).length;
  }

  get capacidadTotal(): number {
    return this.listaSalas
      .filter((s) => s.estado === 'Disponible')
      .reduce((total, s) => total + s.capacidad, 0);
  }

  claseEstado(estado: string): string {
    if (estado === 'Disponible') return 'adm-badge--green';
    if (estado === 'Mantenimiento') return 'adm-badge--amber';
    return 'adm-badge--red';
  }

  // ───────── Modal crear / editar ─────────
  abrirNueva(): void {
    this.salaEditando = null;
    this.form = this.formVacio();
    this.errorForm = '';
    this.modalAbierto = true;
  }

  abrirEditar(sala: ISalaAdmin): void {
    this.salaEditando = sala;
    this.form = {
      nombreSala: sala.nombreSala,
      capacidad: sala.capacidad,
      descripcion: sala.descripcion ?? '',
      ubicacion: sala.ubicacion,
      estado: sala.estado,
    };
    this.errorForm = '';
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    if (!this.guardando) this.modalAbierto = false;
  }

  guardarSala(): void {
    const nombre = this.form.nombreSala.trim();
    const capacidad = Number(this.form.capacidad);

    if (!nombre) {
      this.errorForm = 'El nombre de la sala es obligatorio';
      return;
    }
    if (!Number.isInteger(capacidad) || capacidad < 1) {
      this.errorForm = 'La capacidad debe ser un número entero mayor a 0';
      return;
    }
    const duplicada = this.listaSalas.some(
      (s) =>
        s.nombreSala.trim().toLowerCase() === nombre.toLowerCase() &&
        s.idSala !== this.salaEditando?.idSala,
    );
    if (duplicada) {
      this.errorForm = 'Ya existe una sala con ese nombre';
      return;
    }

    const descripcion = this.form.descripcion.trim();
    if (descripcion.length > 500) {
      this.errorForm = 'La descripción no puede superar los 500 caracteres';
      return;
    }

    const payload: ISalaPayload = { ...this.form, nombreSala: nombre, capacidad, descripcion };
    const editando = this.salaEditando;
    this.guardando = true;
    this.errorForm = '';

    const peticion = editando
      ? this.adminService.actualizarSala(editando.idSala, payload)
      : this.adminService.crearSala(payload);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.mostrarExito(editando ? 'Sala actualizada correctamente' : 'Sala creada correctamente');
        this.cargarSalas();
      },
      error: (err) => {
        this.guardando = false;
        this.errorForm = this.adminService.mensajeError(err, 'No se pudo guardar la sala');
      },
    });
  }

  // Cambio rápido de estado desde la tabla
  cambiarEstado(sala: ISalaAdmin, estado: string): void {
    if (estado === sala.estado) return;
    this.adminService.actualizarSala(sala.idSala, { estado }).subscribe({
      next: () => {
        this.mostrarExito(`"${sala.nombreSala}" ahora está ${estado.toLowerCase()}`);
        this.cargarSalas();
      },
      error: (err) => {
        this.error = this.adminService.mensajeError(err, 'No se pudo cambiar el estado');
        this.cargarSalas();
      },
    });
  }

  borrarSala(sala: ISalaAdmin): void {
    if (!confirm(`¿Seguro que deseas eliminar la sala "${sala.nombreSala}"?\nEsta acción no se puede deshacer.`)) {
      return;
    }
    this.adminService.eliminarSala(sala.idSala).subscribe({
      next: () => {
        this.mostrarExito('Sala eliminada correctamente');
        this.cargarSalas();
      },
      error: (err) => (this.error = this.adminService.mensajeError(err, 'No se pudo eliminar la sala')),
    });
  }

  private mostrarExito(mensaje: string): void {
    this.error = '';
    this.exito = mensaje;
    setTimeout(() => {
      if (this.exito === mensaje) this.exito = '';
    }, 3500);
  }

  private formatear(valor: string | number, mapa: Record<number, string>, porDefecto: string): string {
    if (typeof valor === 'string' && Number.isNaN(Number(valor))) return valor;
    return mapa[Number(valor)] ?? porDefecto;
  }

  private formVacio(): ISalaPayload {
    return { nombreSala: '', capacidad: 6, descripcion: '', ubicacion: 'Biblioteca', estado: 'Disponible' };
  }
}
