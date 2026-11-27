import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NuevaReservaComponent } from './nueva-reserva/nueva-reserva.component';
import { SharedModule } from '../../shared/shared.module';
import { HorarioComponent } from './nueva-reserva/horario/horario.component';
import { Routes, RouterModule } from '@angular/router';
import { DetalleSalaComponent } from './nueva-reserva/detalle-sala/detalle-sala.component';
import { RecomendadorSalasComponent } from './nueva-reserva/recomendador-salas/recomendador-salas.component';
import { FormsModule } from '@angular/forms';

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

@NgModule({
  declarations: [
    NuevaReservaComponent,
    HorarioComponent,
    DetalleSalaComponent,
    RecomendadorSalasComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ReservasModule { }

