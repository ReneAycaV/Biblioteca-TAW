import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionPrestamosComponent } from './gestion-prestamos/gestion-prestamos.component';
import { RouterModule } from '@angular/router';

import { GestionLibrosComponent } from './gestion-libros/gestion-libros.component';
import { GestionUsuariosComponent } from './gestion-usuarios/gestion-usuarios.component';

import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    GestionPrestamosComponent,
    GestionLibrosComponent,
    GestionUsuariosComponent,
  ],
  imports: [CommonModule, SharedModule, RouterModule],
  exports: [
    GestionPrestamosComponent,
    GestionLibrosComponent,
    GestionUsuariosComponent,
  ],
})
export class AdminModule {}
