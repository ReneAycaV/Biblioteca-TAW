import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservaService } from '../../services/reservas.service';
import { ISala } from '../../../../shared/interfaces/isala';
import Swal from 'sweetalert2';

interface SalaDetalle extends Omit<ISala, 'idSala'> {
  idSala: number | null;
  tipo: string;
  equipamiento: string;
}

@Component({
  selector: 'app-detalles-sala',
  templateUrl: './detalle-sala.component.html',
  styleUrls: ['./detalle-sala.component.css'],
})
export class DetalleSalaComponent implements OnInit {
  sala: SalaDetalle = {
    idSala: null,
    nombreSala: 'Cargando...',
    ubicacion: '',
    tipo: '',
    capacidad: 0,
    estado: '' as any,
    equipamiento: '',
  };

  horarioReserva: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservaService: ReservaService,
  ) {}

  ngOnInit(): void {
    const idUrl = this.route.snapshot.paramMap.get('id');
    if (!idUrl) {
      console.warn('No hay id en la URL, redirigiendo a nueva-reserva');
      this.router.navigate(['/nueva-reserva']);
      return;
    }

    const idBuscado = Number(idUrl);
    this.horarioReserva = this.reservaService.obtenerHorario();
    console.log('Horario recuperado en detalles:', this.horarioReserva);

    this.reservaService.getSalaById(idBuscado).subscribe({
      next: (sala) => {
        this.sala = {
          ...sala,
          tipo: this.getTipoSala(sala.ubicacion),
          equipamiento: 'Equipamiento no especificado',
        };
      },
      error: (err) => {
        console.warn('Error cargando sala desde backend:', err);
        Swal.fire({
          icon: 'error',
          title: 'Sala no encontrada',
          text: 'La sala seleccionada no existe en la base de datos.',
        }).then(() => this.router.navigate(['/nueva-reserva']));
      },
    });
  }

  getColorFondo(tipo: string): string {
    if (tipo === 'Sala de Estudio') {
      return 'linear-gradient(145deg, #57068C, #8E2DE2)';
    } else if (tipo === 'Auditorio') {
      return 'linear-gradient(145deg, #008080, #00ced1)';
    }
    return 'linear-gradient(145deg, #6B7280, #9CA3AF)';
  }

  confirmarReservaFinal() {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#F0FDF4',
      color: '#065F46',
      iconColor: '#10B981',
      didOpen: (toast: HTMLElement) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
      customClass: {
        popup: 'mi-alerta',
      },
    });

    if (!this.horarioReserva || !this.sala?.idSala) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Falta sala o horario.',
      });
      this.router.navigate(['/nueva-reserva']);
      return;
    }

    const payload = {
      idSala: this.sala.idSala,
      fechaReserva: this.getNextDateForWeekday(this.horarioReserva.dia),
      bloqueHorario: this.horarioReserva.idBloque,
    };

    this.reservaService.crearReserva(payload).subscribe({
      next: () => {
        Toast.fire({
          icon: 'success',
          title: 'Reserva exitosa',
          text: 'Reserva creada.',
        }).then(() => this.router.navigate(['/nueva-reserva']));
      },
      error: (err) => {
        const msg =
          err?.error?.message || err?.message || 'Error creando reserva';
        Swal.fire({ icon: 'error', title: 'No se pudo reservar', text: msg });
      },
    });
  }

  private getNextDateForWeekday(dia: string): string {
    const diaNormalizado = dia.toLowerCase();
    const target = this.getWeekdayNumber(diaNormalizado);
    if (target === undefined) return new Date().toISOString().slice(0, 10);
    const hoy = new Date();
    const hoyNum = hoy.getDay();
    let offset = target - hoyNum;
    if (offset <= 0) offset += 7;
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + offset);
    return fecha.toISOString().split('T')[0];
  }

  private getTipoSala(ubicacion: string): string {
    return ubicacion.toLowerCase().includes('auditorio')
      ? 'Auditorio'
      : 'Sala de Estudio';
  }

  private getWeekdayNumber(dia: string): number | undefined {
    if (dia.startsWith('lun')) return 1;
    if (dia.startsWith('mar')) return 2;
    if (dia.startsWith('mi')) return 3;
    if (dia.startsWith('jue')) return 4;
    if (dia.startsWith('vie')) return 5;
    return undefined;
  }
}
