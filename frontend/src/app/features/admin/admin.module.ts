import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { GestionLibrosComponent } from './gestion-libros/gestion-libros.component';
import { GestionUsuariosComponent } from './gestion-usuarios/gestion-usuarios.component';

@NgModule({
  declarations: [
    GestionLibrosComponent,
    GestionUsuariosComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [
    GestionLibrosComponent,
    GestionUsuariosComponent,
  ]
})
export class AdminModule { }
