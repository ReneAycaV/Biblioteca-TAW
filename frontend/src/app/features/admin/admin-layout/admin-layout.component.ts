import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

// Contenedor común del panel de administración: sidebar fijo + página activa
@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent {
  menuAbierto = false;

  readonly enlaces = [
    { ruta: '/menu-admin', icono: 'bi-speedometer2', texto: 'Inicio', exacto: true },
    { ruta: '/admin/libros', icono: 'bi-book', texto: 'Libros', exacto: false },
    { ruta: '/admin/usuarios', icono: 'bi-people', texto: 'Usuarios', exacto: false },
    { ruta: '/admin/salas', icono: 'bi-door-open', texto: 'Salas', exacto: false },
    { ruta: '/admin/multas', icono: 'bi-cash-stack', texto: 'Multas', exacto: false },
  ];

  constructor(private authService: AuthService) {}

  cerrarSesion(): void {
    this.authService.logout();
  }
}
