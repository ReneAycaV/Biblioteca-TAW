import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ILibro } from '../../../shared/interfaces/ilibro-detalle';
import { ISala } from '../../../shared/interfaces/isala';
import { EstadoSala } from '../../../shared/enums/estado-sala.enum';
import { CatalogoService } from '../../catalogo/services/catalogo.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservaService } from '../../reservas/services/reservas.service';

@Component({
  selector: 'app-menu-principal-usuario',
  templateUrl: './menu-principal-usuario.component.html',
  styleUrls: ['./menu-principal-usuario.component.css'],
})
export class MenuPrincipalUsuarioComponent implements OnInit, OnDestroy {

  // Nombre del usuario autenticado
  userName = '';

  // Libros cargados desde el backend
  libros: ILibro[] = [];
  cargandoLibros = false;

  // Salas cargadas desde el backend (GET /reserve/salas)
  salas: ISala[] = [];
  cargandoSalas = false;

  private subLibros!: Subscription;
  private subSalas!: Subscription;

  constructor(
    private catalogoService: CatalogoService,
    private authService: AuthService,
    private reservaService: ReservaService
  ) {}

  ngOnInit(): void {
    // Obtiene el nombre del usuario desde el token guardado en localStorage
    const usuario = this.authService.getUsuario();
    this.userName = usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario';

    this.cargarLibros();
    this.cargarSalas();
  }

  ngOnDestroy(): void {
    this.subLibros?.unsubscribe();
    this.subSalas?.unsubscribe();
  }

  cargarLibros(): void {
    this.cargandoLibros = true;
    this.subLibros = this.catalogoService.getLibros().subscribe({
      next: (libros) => {
        this.libros = libros;
        this.cargandoLibros = false;
      },
      error: (err) => {
        this.cargandoLibros = false;
        console.error('Error al cargar libros en inicio:', err);
      }
    });
  }

  cargarSalas(): void {
    this.cargandoSalas = true;
    this.subSalas = this.reservaService.getSalas().subscribe({
      next: (salas) => {
        this.salas = salas;
        this.cargandoSalas = false;
      },
      error: (err) => {
        this.cargandoSalas = false;
        console.error('Error al cargar salas en inicio:', err);
      }
    });
  }

  // Devuelve solo los libros disponibles para mostrar en la sección de inicio
  get librosDisponibles(): ILibro[] {
    return this.libros.filter(libro => libro.disponible);
  }

  // Devuelve solo las salas con estado "Disponible" para mostrar en la sección de inicio
  get salasDisponibles(): ISala[] {
    return this.salas.filter(sala => sala.estado === EstadoSala.DISPONIBLE);
  }

  getCoverColor(categoria: string | null): string {
    const map: { [key: string]: string } = {
      Literatura: '#702B9D',
      Ciencias:   '#009B8A',
      Historia:   '#330662',
      Tecnología: '#59B2D1',
      Filosofía:  '#7B5AA6',
    };
    return map[categoria ?? ''] ?? '#57068C';
  }

  getCoverAccent(categoria: string | null): string {
    const map: { [key: string]: string } = {
      Literatura: '#9B4BC7',
      Ciencias:   '#00BFA8',
      Historia:   '#5A0FA8',
      Tecnología: '#7EC8E3',
      Filosofía:  '#9B75C0',
    };
    return map[categoria ?? ''] ?? '#702B9D';
  }

  getInitial(nombre: string | null): string {
    return (nombre ?? '').charAt(0).toUpperCase();
  }
}
