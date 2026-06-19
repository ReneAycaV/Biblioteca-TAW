import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListaLibrosComponent } from './features/catalogo/lista-libros/lista-libros.component';
import { DetalleLibroComponent } from './features/catalogo/detalle-libro/detalle-libro.component';
import { MenuPrincipalUsuarioComponent } from './features/menu-principal/menu-principal-usuario/menu-principal-usuario.component';
import { MenuPrincipalAdminComponent } from './features/menu-principal/menu-principal-admin/menu-principal-admin.component';
import { CrearPrestamoComponent } from './features/prestamos/crear-prestamo/crear-prestamo.component';
import { HistorialPrestamosComponent } from './features/prestamos/historial-prestamos/historial-prestamos.component';
import { LoginComponent } from './features/auth/login/login.component';

const routes: Routes = [
  { path: '', component: MenuPrincipalUsuarioComponent },
  { path: 'catalogo', component: ListaLibrosComponent },
  { path: 'catalogo/:id', component: DetalleLibroComponent },
  { path: 'inicio', component: MenuPrincipalUsuarioComponent },
  { path: 'menu-admin', component: MenuPrincipalAdminComponent },
  { path: 'crear-prestamo', component: CrearPrestamoComponent },
  { path: 'historial', component: HistorialPrestamosComponent },
  { path: 'login', component: LoginComponent },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
