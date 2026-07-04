import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionPrestamosComponent } from './gestion-prestamos/gestion-prestamos.component';

import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [GestionPrestamosComponent],
  imports: [CommonModule, SharedModule],
  exports: [GestionPrestamosComponent],
})
export class AdminModule {}
