import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { GestionLibrosComponent } from './gestion-libros/gestion-libros.component';
import { GestionUsuariosComponent } from './gestion-usuarios/gestion-usuarios.component';
import { GestionSalasComponent } from './gestion-salas/gestion-salas.component';
import { GestionMultasComponent } from './gestion-multas/gestion-multas.component';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    GestionLibrosComponent,
    GestionUsuariosComponent,
    GestionSalasComponent,
    GestionMultasComponent,
  ],
  imports: [CommonModule, RouterModule, FormsModule],
  exports: [
    AdminLayoutComponent,
    GestionLibrosComponent,
    GestionUsuariosComponent,
    GestionSalasComponent,
    GestionMultasComponent,
  ],
})
export class AdminModule {}
