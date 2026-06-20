import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListaLibrosComponent } from './features/catalogo/lista-libros/lista-libros.component';
import { DetalleLibroComponent } from './features/catalogo/detalle-libro/detalle-libro.component';
import { ListaMultasComponent } from './features/multas/lista-multas/lista-multas.component';
import { MenuPrincipalUsuarioComponent } from './features/menu-principal/menu-principal-usuario/menu-principal-usuario.component';
import { MenuPrincipalAdminComponent } from './features/menu-principal/menu-principal-admin/menu-principal-admin.component';
import { CrearPrestamoComponent } from './features/prestamos/crear-prestamo/crear-prestamo.component';
import { HistorialPrestamosComponent } from './features/prestamos/historial-prestamos/historial-prestamos.component';
import { LoginComponent } from './features/auth/login/login.component';
import { NuevaReservaComponent } from './features/reservas/nueva-reserva/nueva-reserva.component';
import { DetalleSalaComponent } from './features/reservas/nueva-reserva/detalle-sala/detalle-sala.component';

const routes: Routes = [
  { path: '',                component: MenuPrincipalUsuarioComponent },
  { path: 'inicio',          component: MenuPrincipalUsuarioComponent },
  { path: 'catalogo',        component: ListaLibrosComponent },
  { path: 'catalogo/:id',    component: DetalleLibroComponent },
  { path: 'multas',          component: ListaMultasComponent },
  { path: 'historial',       component: HistorialPrestamosComponent },
  { path: 'crear-prestamo',  component: CrearPrestamoComponent },
  { path: 'nueva-reserva',   component: NuevaReservaComponent },
  { path: 'detalle-sala/:id', component: DetalleSalaComponent },
  { path: 'menu-admin',      component: MenuPrincipalAdminComponent },
  { path: 'login',           component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
