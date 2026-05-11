import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListaLibrosComponent } from './features/catalogo/lista-libros/lista-libros.component';
import { DetalleLibroComponent } from './features/catalogo/detalle-libro/detalle-libro.component';

const routes: Routes = [
  { path: 'catalogo',     component: ListaLibrosComponent },
  { path: 'catalogo/:id', component: DetalleLibroComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
