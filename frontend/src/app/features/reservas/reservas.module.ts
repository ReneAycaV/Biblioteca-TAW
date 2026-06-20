import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NuevaReservaComponent } from './nueva-reserva/nueva-reserva.component';
import { SharedModule } from '../../shared/shared.module';
import { HorarioComponent } from './nueva-reserva/horario/horario.component';
import { Routes } from '@angular/router';
import { DetalleSalaComponent } from './nueva-reserva/detalle-sala/detalle-sala.component';


@NgModule({
  declarations: [
    NuevaReservaComponent,
    HorarioComponent,
    DetalleSalaComponent,
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