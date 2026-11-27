import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaService } from '../../services/reservas.service';
import {
  IRecomendacionSalasResponse,
  ISalaRecomendada,
} from '../../../../shared/interfaces/irecomendacion';

// Propuesta A: el estudiante describe lo que necesita y recibe el top 3 de salas
@Component({
  selector: 'app-recomendador-salas',
  templateUrl: './recomendador-salas.component.html',
  styleUrls: ['./recomendador-salas.component.css'],
})
export class RecomendadorSalasComponent {
  consulta = '';
  cargando = false;
  error = '';
  respuesta: IRecomendacionSalasResponse | null = null;

  ejemplos = [
    'Necesito una sala para 5 personas hoy en la tarde, cerca de la cafetería',
    'Somos 3 y queremos un lugar tranquilo a las 4 de la tarde',
    'Quiero estudiar solo en la biblioteca lo antes posible',
  ];

  constructor(
    private reservaService: ReservaService,
    private router: Router,
  ) {}

  usarEjemplo(ejemplo: string): void {
    this.consulta = ejemplo;
    this.recomendar();
  }

  recomendar(): void {
    const texto = this.consulta.trim();
    if (texto.length < 3 || this.cargando) return;

    this.cargando = true;
    this.error = '';
    this.respuesta = null;

    this.reservaService.recomendarSalas(texto).subscribe({
      next: (res) => {
        this.respuesta = res;
        this.cargando = false;
      },
      error: (err) => {
        this.error =
          err?.error?.message || 'No se pudieron obtener recomendaciones.';
        this.cargando = false;
      },
    });
  }

  // Reutiliza el flujo de reserva existente: guarda el horario y abre el detalle de la sala
  reservar(rec: ISalaRecomendada): void {
    const horario = {
      dia: 'Hoy', // detalle-sala usa la fecha de hoy cuando el día no es Lunes–Viernes
      idBloque: rec.bloque,
      rango: `${rec.inicio} - ${rec.fin}`,
    };
    this.reservaService.guardarHorario(horario);
    this.reservaService.guardarSala(rec);

    this.router.navigate(['/detalle-sala', rec.idSala], {
      queryParams: horario,
    });
  }

  get etiquetaModo(): string {
    return this.respuesta?.modo === 'ia'
      ? 'Generado con IA'
      : 'Modo respaldo · reglas';
  }
}
