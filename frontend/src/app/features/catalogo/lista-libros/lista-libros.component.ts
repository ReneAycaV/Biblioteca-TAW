import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ILibro } from '../../../shared/interfaces/ilibro-detalle';
import { CatalogoService } from '../services/catalogo.service';
import {
  IBusquedaInteligenteResponse,
  IRecomendacionesLibrosResponse,
} from '../../../shared/interfaces/irecomendacion';

@Component({
  selector: 'app-lista-libros',
  templateUrl: './lista-libros.component.html',
  styleUrls: ['./lista-libros.component.scss']
})
export class ListaLibrosComponent implements OnInit, OnDestroy {

  searchQuery = '';
  filtroActivo = 'todos';

  filtros = ['Todos', 'Disponibles', 'Literatura', 'Ciencias', 'Historia', 'Tecnología', 'Filosofía'];

  libros: ILibro[] = [];
  cargando = false;
  mensajeError = '';

  // ── Propuesta B: recomendaciones y búsqueda inteligente (IA con modo respaldo) ──
  recomendaciones: IRecomendacionesLibrosResponse | null = null;
  cargandoRecomendaciones = false;

  modoBusqueda: 'normal' | 'inteligente' = 'normal';
  busquedaIa: IBusquedaInteligenteResponse | null = null;
  buscandoIa = false;
  errorBusquedaIa = '';

  private sub!: Subscription;

  constructor(private catalogoService: CatalogoService) {}

  ngOnInit(): void {
    this.cargarLibros();
    this.cargarRecomendaciones();
  }

  cargarRecomendaciones(): void {
    this.cargandoRecomendaciones = true;
    this.catalogoService.getRecomendaciones().subscribe({
      next: (res) => {
        this.recomendaciones = res;
        this.cargandoRecomendaciones = false;
      },
      error: (err) => {
        // si falla, simplemente no se muestra la sección
        console.warn('No se pudieron cargar las recomendaciones:', err);
        this.cargandoRecomendaciones = false;
      },
    });
  }

  setModoBusqueda(modo: 'normal' | 'inteligente'): void {
    this.modoBusqueda = modo;
    this.busquedaIa = null;
    this.errorBusquedaIa = '';
  }

  // Enter en el buscador: en modo inteligente consulta al backend
  onBuscar(): void {
    if (this.modoBusqueda !== 'inteligente') return;
    const consulta = this.searchQuery.trim();
    if (consulta.length < 3 || this.buscandoIa) return;

    this.buscandoIa = true;
    this.errorBusquedaIa = '';
    this.catalogoService.busquedaInteligente(consulta).subscribe({
      next: (res) => {
        this.busquedaIa = res;
        this.buscandoIa = false;
      },
      error: (err) => {
        this.errorBusquedaIa = err?.error?.message || 'No se pudo realizar la búsqueda inteligente.';
        this.buscandoIa = false;
      },
    });
  }

  limpiarBusqueda(): void {
    this.searchQuery = '';
    this.busquedaIa = null;
    this.errorBusquedaIa = '';
  }

  etiquetaModo(modo: string | undefined): string {
    return modo === 'ia' ? 'Generado con IA' : 'Modo respaldo · reglas';
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  cargarLibros(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.sub = this.catalogoService.getLibros().subscribe({
      next: (libros) => {
        this.libros = libros;
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = 'Error al cargar el catálogo. Intenta más tarde.';
        this.cargando = false;
        console.error('Error al cargar catálogo:', err);
      }
    });
  }

  // Filtra por búsqueda de texto y por el chip activo
  get librosFiltrados(): ILibro[] {
    // en modo inteligente el texto es una descripción, no filtra la grilla
    const q = this.modoBusqueda === 'inteligente' ? '' : this.searchQuery.trim().toLowerCase();
    return this.libros.filter(libro => {
      const matchSearch = !q ||
        (libro.titulo ?? '').toLowerCase().includes(q) ||
        (libro.autor ?? '').toLowerCase().includes(q);

      const f = this.filtroActivo;
      const matchFiltro =
        f === 'todos' ||
        (f === 'disponibles' && libro.disponible) ||
        (libro.categoria ?? '').toLowerCase() === f.toLowerCase();

      return matchSearch && matchFiltro;
    });
  }

  setFiltro(filtro: string): void {
    this.filtroActivo = filtro.toLowerCase();
  }

  // El backend devuelve anio como 'YYYY-MM-DD'; extrae solo el año de 4 dígitos
  getAnio(anio: string | null): string {
    if (!anio) return '';
    return anio.substring(0, 4);
  }

  // Texto del badge de disponibilidad según el estado numérico del backend
  getTextoEstadoLibro(libro: ILibro): string {
    if (libro.disponible) return 'Disponible';
    const textos: { [key: number]: string } = {
      2: 'Prestado',
      3: 'Mantenimiento',
      4: 'Extraviado'
    };
    return textos[libro.estado] ?? 'No disponible';
  }

  getCoverColor(categoria: string | null): string {
    const map: { [key: string]: string } = {
      'Literatura':  '#702B9D',
      'Ciencias':    '#009B8A',
      'Historia':    '#330662',
      'Tecnología':  '#59B2D1',
      'Filosofía':   '#7B5AA6',
    };
    return map[categoria ?? ''] ?? '#57068C';
  }

  getCoverAccent(categoria: string | null): string {
    const map: { [key: string]: string } = {
      'Literatura':  '#9B4BC7',
      'Ciencias':    '#00BFA8',
      'Historia':    '#5A0FA8',
      'Tecnología':  '#7EC8E3',
      'Filosofía':   '#9B75C0',
    };
    return map[categoria ?? ''] ?? '#702B9D';
  }

  getInitial(titulo: string | null): string {
    return (titulo ?? '').charAt(0).toUpperCase();
  }
}
