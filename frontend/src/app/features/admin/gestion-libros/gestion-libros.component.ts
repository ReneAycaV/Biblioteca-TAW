import { Component, OnInit } from '@angular/core';
import { AdminService, ILibroAdmin, ILibroPayload } from '../services/admin.service';

type FiltroEstado = 'todos' | 'activos' | 'inactivos' | 'sin-stock';

interface LibroForm {
  titulo: string;
  autor: string;
  isbn: string;
  editorial: string;
  categoria: string;
  anio: string; // año (YYYY)
  descripcion: string;
  stockTotal: number;
  stockDisponible: number;
  valorLibro: number;
  ubicacionFisica: string;
}

@Component({
  selector: 'app-gestion-libros',
  templateUrl: './gestion-libros.component.html',
  styleUrls: ['./gestion-libros.component.css']
})
export class GestionLibrosComponent implements OnInit {
  libros: ILibroAdmin[] = [];
  cargando = true;
  guardando = false;
  error = '';
  exito = '';

  busqueda = '';
  filtroEstado: FiltroEstado = 'todos';
  filtroCategoria = '';

  modalAbierto = false;
  libroEditando: ILibroAdmin | null = null;
  form: LibroForm = this.formVacio();
  errorForm = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarLibros();
  }

  cargarLibros(): void {
    this.cargando = true;
    this.adminService.getLibros().subscribe({
      next: (libros) => {
        this.libros = libros;
        this.cargando = false;
      },
      error: (err) => {
        this.error = this.adminService.mensajeError(err, 'No se pudieron cargar los libros');
        this.cargando = false;
      },
    });
  }

  get categorias(): string[] {
    const set = new Set(this.libros.map((l) => l.categoria).filter((c): c is string => !!c));
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  get librosFiltrados(): ILibroAdmin[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.libros.filter((l) => {
      const coincide =
        !q ||
        [l.titulo, l.autor, l.isbn, l.editorial].some((v) => v?.toLowerCase().includes(q));
      const categoria = !this.filtroCategoria || l.categoria === this.filtroCategoria;
      const estado =
        this.filtroEstado === 'todos' ||
        (this.filtroEstado === 'activos' && this.estaActivo(l)) ||
        (this.filtroEstado === 'inactivos' && !this.estaActivo(l)) ||
        (this.filtroEstado === 'sin-stock' && this.estaActivo(l) && l.stockDisponible === 0);
      return coincide && categoria && estado;
    });
  }

  get totalEjemplares(): number {
    return this.libros.reduce((s, l) => s + (l.stockTotal || 0), 0);
  }

  get ejemplaresPrestados(): number {
    return this.libros.reduce((s, l) => s + Math.max((l.stockTotal || 0) - (l.stockDisponible || 0), 0), 0);
  }

  get librosInactivos(): number {
    return this.libros.filter((l) => !this.estaActivo(l)).length;
  }

  estaActivo(libro: ILibroAdmin): boolean {
    return libro.estado !== 0;
  }

  etiquetaEstado(libro: ILibroAdmin): { texto: string; clase: string } {
    if (libro.estado === 0) return { texto: 'Inactivo', clase: 'adm-badge--gray' };
    if (libro.estado === 4) return { texto: 'Extraviado', clase: 'adm-badge--red' };
    if (libro.estado === 3) return { texto: 'Mantenimiento', clase: 'adm-badge--amber' };
    if (libro.stockDisponible === 0) return { texto: 'Sin stock', clase: 'adm-badge--amber' };
    return { texto: 'Disponible', clase: 'adm-badge--green' };
  }

  // ───────── Modal crear / editar ─────────
  abrirNuevo(): void {
    this.libroEditando = null;
    this.form = this.formVacio();
    this.errorForm = '';
    this.modalAbierto = true;
  }

  abrirEditar(libro: ILibroAdmin): void {
    this.libroEditando = libro;
    this.form = {
      titulo: libro.titulo ?? '',
      autor: libro.autor ?? '',
      isbn: libro.isbn ?? '',
      editorial: libro.editorial ?? '',
      categoria: libro.categoria ?? '',
      anio: libro.anio ? String(libro.anio).slice(0, 4) : '',
      descripcion: libro.descripcion ?? '',
      stockTotal: libro.stockTotal,
      stockDisponible: libro.stockDisponible,
      valorLibro: Number(libro.valorLibro) || 0,
      ubicacionFisica: libro.ubicacionFisica ?? '',
    };
    this.errorForm = '';
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    if (!this.guardando) this.modalAbierto = false;
  }

  guardar(): void {
    const f = this.form;
    if (!f.titulo.trim() || !f.autor.trim() || !f.isbn.trim()) {
      this.errorForm = 'Título, autor e ISBN son obligatorios';
      return;
    }
    if (f.stockTotal < 0 || f.stockDisponible < 0 || f.valorLibro < 0) {
      this.errorForm = 'Los valores numéricos no pueden ser negativos';
      return;
    }
    if (f.stockDisponible > f.stockTotal) {
      this.errorForm = 'El stock disponible no puede ser mayor que el stock total';
      return;
    }
    if (f.anio && !/^\d{4}$/.test(f.anio)) {
      this.errorForm = 'El año debe tener 4 dígitos (ej: 2019)';
      return;
    }

    const payload: ILibroPayload = {
      titulo: f.titulo.trim(),
      autor: f.autor.trim(),
      isbn: f.isbn.trim(),
      stockTotal: Math.trunc(f.stockTotal),
      stockDisponible: Math.trunc(f.stockDisponible),
      valorLibro: Number(f.valorLibro),
      ...(f.editorial.trim() && { editorial: f.editorial.trim() }),
      ...(f.categoria.trim() && { categoria: f.categoria.trim() }),
      ...(f.anio && { anio: `${f.anio}-01-01` }),
      ...(f.descripcion.trim() && { descripcion: f.descripcion.trim() }),
      ...(f.ubicacionFisica.trim() && { ubicacionFisica: f.ubicacionFisica.trim() }),
    };

    this.guardando = true;
    this.errorForm = '';
    const editando = this.libroEditando;
    const peticion = editando
      ? this.adminService.actualizarLibro(editando.idLibro, payload)
      : this.adminService.crearLibro(payload);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.mostrarExito(editando ? 'Libro actualizado correctamente' : 'Libro creado correctamente');
        this.cargarLibros();
      },
      error: (err) => {
        this.guardando = false;
        this.errorForm = this.adminService.mensajeError(err, 'No se pudo guardar el libro');
      },
    });
  }

  cambiarEstado(libro: ILibroAdmin): void {
    const activar = !this.estaActivo(libro);
    const accion = activar ? 'activar' : 'desactivar';
    if (!confirm(`¿Seguro que deseas ${accion} "${libro.titulo}"?`)) return;

    const peticion = activar
      ? this.adminService.activarLibro(libro.idLibro)
      : this.adminService.desactivarLibro(libro.idLibro);

    peticion.subscribe({
      next: () => {
        this.mostrarExito(`Libro ${activar ? 'activado' : 'desactivado'} correctamente`);
        this.cargarLibros();
      },
      error: (err) => (this.error = this.adminService.mensajeError(err, `No se pudo ${accion} el libro`)),
    });
  }

  private mostrarExito(mensaje: string): void {
    this.error = '';
    this.exito = mensaje;
    setTimeout(() => {
      if (this.exito === mensaje) this.exito = '';
    }, 3500);
  }

  private formVacio(): LibroForm {
    return {
      titulo: '',
      autor: '',
      isbn: '',
      editorial: '',
      categoria: '',
      anio: '',
      descripcion: '',
      stockTotal: 1,
      stockDisponible: 1,
      valorLibro: 25000,
      ubicacionFisica: '',
    };
  }
}
