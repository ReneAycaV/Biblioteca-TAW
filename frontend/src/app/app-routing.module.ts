import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListaLibrosComponent } from './features/catalogo/lista-libros/lista-libros.component';
import { DetalleLibroComponent } from './features/catalogo/detalle-libro/detalle-libro.component';
import { LoginComponent } from './features/auth/login/login.component';
import { NuevaReservaComponent } from './features/reservas/nueva-reserva/nueva-reserva.component';

const routes: Routes = [
  { path: 'catalogo',     component: ListaLibrosComponent },
  { path: 'catalogo/:id', component: DetalleLibroComponent },
  { path: 'login', component: LoginComponent },
  { path: 'nueva-reserva', component: NuevaReservaComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
