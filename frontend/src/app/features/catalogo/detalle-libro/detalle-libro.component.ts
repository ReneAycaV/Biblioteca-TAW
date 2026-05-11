import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ILibroDetalle } from '../../../shared/interfaces/ilibro-detalle';

@Component({
  selector: 'app-detalle-libro',
  templateUrl: './detalle-libro.component.html',
  styleUrls: ['./detalle-libro.component.scss']
})
export class DetalleLibroComponent implements OnInit, OnDestroy {

  // Datos del libro — mockeados hasta que el backend esté disponible
  libroDetalle: ILibroDetalle = {
    id: 1,
    titulo: 'Cien Años de Soledad',
    autor: 'Gabriel García Márquez',
    anio: 1967,
    isbn: '978-0-06-088328-7',
    genero: 'Literatura',
    descripcion: 'Una de las obras más importantes de la literatura hispanoamericana y universal. ' +
      'Narra la historia de la familia Buendía a lo largo de siete generaciones en el mítico pueblo ' +
      'de Macondo, fundado en medio de la selva por José Arcadio Buendía. Con un estilo que mezcla ' +
      'lo cotidiano con lo fantástico, García Márquez construyó una saga épica sobre el amor, la ' +
      'soledad, el poder y la memoria colectiva de un pueblo condenado a repetir su historia.',
    stockTotal: 5,
    stockDisponible: 2,
    estado: 'disponible',
    ubicacionFisica: 'Biblioteca Central — Campus Arica, Edificio A, Piso 2'
  };

  // Estado del usuario — mockeado hasta que el backend esté listo
  // Cambiar a true / 'inactivo' para probar los bloqueos del botón
  multaPendiente: boolean = false;
  estadoAcademico: string = 'activo';

  // El signo ! le dice a TypeScript que esta variable será asignada antes de usarse (en ngOnInit),
  // evitando el error de "variable no inicializada" sin necesidad de ponerla en null
  private paramSub!: Subscription;

  // Constructor: solo inyección de dependencias, sin lógica
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // route.params es un Observable que emite cada vez que cambia el :id en la URL.
    // Se suscribe aquí para reaccionar si el usuario navega entre detalles sin salir del componente
    this.paramSub = this.route.params.subscribe(params => {
      // El operador + delante de params['id'] convierte el string de la URL a número
      const id = +params['id'];
      this.cargarLibro(id);
    });
  }

  ngOnDestroy(): void {
    // Si no se cancela la suscripción al destruir el componente, el Observable sigue
    // activo en memoria aunque la página ya no esté visible (memory leak)
    this.paramSub.unsubscribe();
  }

  // Carga el libro por id — por ahora usa datos mock; reemplazar con llamada al servicio
  cargarLibro(id: number): void {
    // TODO: reemplazar con this.catalogoService.getLibroPorId(id).subscribe(...)
    console.log(`Cargando libro con id: ${id}`);
  }

  /**
   * Evalúa si el usuario puede solicitar un préstamo.
   * Las condiciones se revisan en orden de prioridad: la más grave primero.
   * Si alguna retorna false, las siguientes ni se evalúan (cortocircuito).
   */
  puedeSolicitarPrestamo(): boolean {
    // Multa pendiente tiene mayor prioridad: bloquea aunque haya stock
    if (this.multaPendiente) return false;
    // Cuenta inactiva impide solicitar aunque no haya multa
    if (this.estadoAcademico !== 'activo') return false;
    // Sin stock: no hay copias físicas para entregar
    if (this.libroDetalle.stockDisponible === 0) return false;
    // Estado 'prestado' significa que todas las copias ya están fuera
    if (this.libroDetalle.estado === 'prestado') return false;
    return true;
  }

  // Navega de regreso al catálogo usando el Router en vez de routerLink porque es un botón
  volverAlCatalogo(): void {
    this.router.navigate(['/catalogo']);
  }

  /**
   * Retorna el color primario del gradiente de portada según el género.
   * El operador ?? (nullish coalescing) devuelve el valor de la derecha solo si
   * el de la izquierda es null o undefined — útil cuando el género no está en el mapa.
   */
  getCoverColor(genero: string): string {
    const map: { [key: string]: string } = {
      'Literatura': '#702B9D',
      'Ciencias':   '#009B8A',
      'Historia':   '#330662',
      'Tecnología': '#59B2D1',
      'Filosofía':  '#7B5AA6',
    };
    return map[genero] ?? '#57068C';
  }

  // Retorna el color de acento del gradiente — se combina con getCoverColor en el HTML
  getCoverAccent(genero: string): string {
    const map: { [key: string]: string } = {
      'Literatura': '#9B4BC7',
      'Ciencias':   '#00BFA8',
      'Historia':   '#5A0FA8',
      'Tecnología': '#7EC8E3',
      'Filosofía':  '#9B75C0',
    };
    return map[genero] ?? '#702B9D';
  }

  // Extrae la primera letra del título en mayúscula para mostrar en la portada
  getInitial(titulo: string): string {
    return titulo.charAt(0).toUpperCase();
  }
}
