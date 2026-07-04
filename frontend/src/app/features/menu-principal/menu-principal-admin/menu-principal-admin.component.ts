import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService, IPrestamoAdmin } from '../../admin/services/admin.service';

@Component({
  selector: 'app-menu-principal-admin',
  templateUrl: './menu-principal-admin.component.html',
  styleUrls: ['./menu-principal-admin.component.css']
})
export class MenuPrincipalAdminComponent implements OnInit, OnDestroy {

  nombreAdmin: string = 'Administrador';

  // Valores de las tarjetas de resumen
  totalLibros: number = 0;
  prestamosActivos: number = 0;
  prestamosAtrasados: number = 0;
  totalSalas: number = 0;

  // Préstamos atrasados para la tabla (máximo 5)
  ultimosAtrasados: IPrestamoAdmin[] = [];

  // Indicadores de carga individuales por tarjeta
  cargandoLibros: boolean = true;
  cargandoPrestamos: boolean = true;
  cargandoAtrasados: boolean = true;
  cargandoSalas: boolean = true;

  // Suscripciones para cancelar en ngOnDestroy
  private subLibros!: Subscription;
  private subPrestamos!: Subscription;
  private subAtrasados!: Subscription;
  private subSalas!: Subscription;

  constructor(
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    if (usuario) {
      this.nombreAdmin = `${usuario.nombre} ${usuario.apellido}`;
    }
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.subLibros?.unsubscribe();
    this.subPrestamos?.unsubscribe();
    this.subAtrasados?.unsubscribe();
    this.subSalas?.unsubscribe();
  }

  // Calcula las iniciales del admin para el avatar
  get iniciales(): string {
    const partes = this.nombreAdmin.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return (partes[0][0] ?? 'A').toUpperCase();
  }

  cargarDatos(): void {
    // Total de libros registrados
    this.subLibros = this.adminService.getLibros().subscribe({
      next: (libros) => {
        this.totalLibros = libros.length;
        this.cargandoLibros = false;
      },
      error: () => {
        this.cargandoLibros = false;
        console.error('Error al cargar libros');
      }
    });

    // Préstamos activos: estado 1 = ENTREGADO (en posesión del estudiante)
    this.subPrestamos = this.adminService.getPrestamos().subscribe({
      next: (prestamos) => {
        this.prestamosActivos = prestamos.filter(p => p.estado === 1).length;
        this.cargandoPrestamos = false;
      },
      error: () => {
        this.cargandoPrestamos = false;
        console.error('Error al cargar préstamos');
      }
    });

    // Préstamos atrasados y tabla con los más urgentes
    this.subAtrasados = this.adminService.getPrestamoAtrasados().subscribe({
      next: (atrasados) => {
        this.prestamosAtrasados = atrasados.length;
        this.ultimosAtrasados = atrasados.slice(0, 5);
        this.cargandoAtrasados = false;
      },
      error: () => {
        this.cargandoAtrasados = false;
        console.error('Error al cargar préstamos atrasados');
      }
    });

    // Total de salas de estudio registradas
    this.subSalas = this.adminService.getSalas().subscribe({
      next: (salas) => {
        this.totalSalas = salas.length;
        this.cargandoSalas = false;
      },
      error: () => {
        this.cargandoSalas = false;
        console.error('Error al cargar salas');
      }
    });
  }

  // Calcula cuántos días han pasado desde la fecha de devolución esperada
  calcularDiasAtraso(fechaEsperada: string): number {
    const hoy = new Date();
    const limite = new Date(fechaEsperada);
    const diferencia = hoy.getTime() - limite.getTime();
    return Math.max(0, Math.floor(diferencia / (1000 * 60 * 60 * 24)));
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}
