import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NuevaReservaComponent } from './nueva-reserva/nueva-reserva.component';
import { SharedModule } from '../../shared/shared.module';
import { HorarioComponent } from './nueva-reserva/horario/horario.component';
import { Routes } from '@angular/router';



@NgModule({
  declarations: [
    NuevaReservaComponent,
    HorarioComponent,
  ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class ReservasModule { }

const routes: Routes = [
  {
    path: 'nueva-reserva',
    component: NuevaReservaComponent,
    children: [
      { path: 'horario', component: HorarioComponent },
      { path: '', redirectTo: 'horario', pathMatch: 'full' }
    ]
  }
];