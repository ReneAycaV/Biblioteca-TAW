import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { GestionLibrosComponent } from './gestion-libros/gestion-libros.component';
import { GestionUsuariosComponent } from './gestion-usuarios/gestion-usuarios.component';
import { GestionSalasComponent } from './gestion-salas/gestion-salas.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    GestionLibrosComponent,
    GestionUsuariosComponent,
    GestionSalasComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  exports: [
    GestionLibrosComponent,
    GestionUsuariosComponent,
  ]
})
export class AdminModule { }
