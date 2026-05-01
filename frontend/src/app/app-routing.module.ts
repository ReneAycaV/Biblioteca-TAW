import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListaLibrosComponent } from './features/catalogo/lista-libros/lista-libros.component';
import { DetalleLibroComponent } from './features/catalogo/detalle-libro/detalle-libro.component';
import { MenuPrincipalUsuarioComponent } from './features/menu-principal/menu-principal-usuario/menu-principal-usuario.component';
import { MenuPrincipalAdminComponent } from './features/menu-principal/menu-principal-admin/menu-principal-admin.component';

const routes: Routes = [
  { path: 'catalogo', component: ListaLibrosComponent },
  { path: 'catalogo/:id', component: DetalleLibroComponent },
  { path: 'menu-usuario', component: MenuPrincipalUsuarioComponent },
  { path: 'menu-admin', component: MenuPrincipalAdminComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
