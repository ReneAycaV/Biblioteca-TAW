import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListaLibrosComponent } from './features/catalogo/lista-libros/lista-libros.component';
import { DetalleLibroComponent } from './features/catalogo/detalle-libro/detalle-libro.component';
import { ListaMultasComponent } from './features/multas/lista-multas/lista-multas.component';
import { LoginComponent } from './features/auth/login/login.component';

const routes: Routes = [
  { path: '',          redirectTo: '/catalogo', pathMatch: 'full' },
  { path: 'catalogo',     component: ListaLibrosComponent },
  { path: 'catalogo/:id', component: DetalleLibroComponent },
  { path: 'multas',       component: ListaMultasComponent },
  { path: 'login',        component: LoginComponent },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
