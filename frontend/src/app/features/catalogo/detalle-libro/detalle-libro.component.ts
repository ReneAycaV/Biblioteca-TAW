import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ILibro } from '../../../shared/interfaces/ilibro-detalle';
import { CatalogoService } from '../services/catalogo.service';
import { PrestamosService } from '../../prestamos/services/prestamos.service';

@Component({
  selector: 'app-detalle-libro',
  templateUrl: './detalle-libro.component.html',
  styleUrls: ['./detalle-libro.component.scss']
})
export class DetalleLibroComponent implements OnInit, OnDestroy {

  libroDetalle: ILibro | null = null;

  // Estados de la UI
  cargando = false;
  mensajeError = '';
  mensajeExito = '';
  solicitando = false;

  private paramSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogoService: CatalogoService,
    private prestamosService: PrestamosService
  ) {}

  ngOnInit(): void {
    this.paramSub = this.route.params.subscribe(params => {
      const id = +params['id'];
      this.cargarLibro(id);
    });
  }

  ngOnDestroy(): void {
    this.paramSub.unsubscribe();
  }

  cargarLibro(id: number): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.catalogoService.getLibroPorId(id).subscribe({
      next: (libro) => {
        this.libroDetalle = libro;
        this.cargando = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.mensajeError = 'El libro no existe.';
        } else {
          this.mensajeError = 'Error al cargar el libro. Intenta más tarde.';
        }
        this.cargando = false;
        console.error('Error al cargar libro:', err);
      }
    });
  }

  // Evalúa si el usuario puede solicitar préstamo según los datos del libro
  puedeSolicitarPrestamo(): boolean {
    if (!this.libroDetalle) return false;
    if (this.solicitando) return false;
    return this.libroDetalle.disponible && this.libroDetalle.stockDisponible > 0;
  }

  // Llama a POST /prestamos/solicitar con el id del libro actual
  solicitarPrestamo(): void {
    if (!this.libroDetalle || !this.puedeSolicitarPrestamo()) return;

    this.solicitando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.prestamosService.solicitarPrestamo(this.libroDetalle.idLibro).subscribe({
      next: (resp) => {
        this.mensajeExito = `Préstamo solicitado exitosamente. Fecha de devolución: ${this.formatearFecha(resp.prestamo.fechaDevolucionEsperada)}.`;
        this.solicitando = false;
        // Actualiza el stock localmente para reflejar el cambio en la UI
        if (this.libroDetalle) {
          this.libroDetalle = {
            ...this.libroDetalle,
            stockDisponible: this.libroDetalle.stockDisponible - 1,
            disponible: this.libroDetalle.stockDisponible - 1 > 0
          };
        }
      },
      error: (err) => {
        this.solicitando = false;
        if (err.status === 403) {
          this.mensajeError = 'No puedes solicitar este préstamo. Verifica si tienes multas pendientes o el libro no está disponible.';
        } else if (err.status === 404) {
          this.mensajeError = 'El libro no fue encontrado.';
        } else if (err.status === 401) {
          this.mensajeError = 'No estás autorizado. Inicia sesión.';
          this.router.navigate(['/login']);
        } else {
          this.mensajeError = 'Error al solicitar el préstamo. Intenta más tarde.';
        }
        console.error('Error al solicitar préstamo:', err);
      }
    });
  }

  // Convierte 'YYYY-MM-DD' a 'DD/MM/YYYY' para mostrarlo en pantalla
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const [anio, mes, dia] = fecha.substring(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  // Extrae solo el año de la fecha 'YYYY-MM-DD' que devuelve el backend
  getAnio(anio: string | null): string {
    if (!anio) return '';
    return anio.substring(0, 4);
  }

  volverAlCatalogo(): void {
    this.router.navigate(['/catalogo']);
  }

  getCoverColor(categoria: string | null): string {
    const map: { [key: string]: string } = {
      'Literatura': '#702B9D',
      'Ciencias':   '#009B8A',
      'Historia':   '#330662',
      'Tecnología': '#59B2D1',
      'Filosofía':  '#7B5AA6',
    };
    return map[categoria ?? ''] ?? '#57068C';
  }

  getCoverAccent(categoria: string | null): string {
    const map: { [key: string]: string } = {
      'Literatura': '#9B4BC7',
      'Ciencias':   '#00BFA8',
      'Historia':   '#5A0FA8',
      'Tecnología': '#7EC8E3',
      'Filosofía':  '#9B75C0',
    };
    return map[categoria ?? ''] ?? '#702B9D';
  }

  getInitial(titulo: string | null): string {
    return (titulo ?? '').charAt(0).toUpperCase();
  }
}
