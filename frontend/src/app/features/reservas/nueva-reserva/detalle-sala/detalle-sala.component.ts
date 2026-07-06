import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ReservaService } from '../../services/reservas.service';

interface SalaDetalleView {
  idSala: number | null;
  nombreSala: string;
  ubicacion: string;
  tipo: 'Estudio' | 'Auditorio' | '';
  capacidad: number;
  equipamiento: string;
  estado?: number;
}

@Component({
  selector: 'app-detalles-sala',
  templateUrl: './detalle-sala.component.html',
  styleUrls: ['./detalle-sala.component.css'],
})
export class DetalleSalaComponent implements OnInit {
  sala: SalaDetalleView = {
    idSala: null,
    nombreSala: 'Cargando...',
    ubicacion: '',
    tipo: '',
    capacidad: 0,
    equipamiento: 'No especificado',
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
      this.router.navigate(['/nueva-reserva']);
      return;
    }

    const idBuscado = Number(idUrl);
    this.horarioReserva = this.reservaService.obtenerHorario();
    console.log('Horario recuperado en detalles:', this.horarioReserva);

    this.reservaService.getSalaById(idBuscado).subscribe({
      next: (sala) => {
        if (!sala) {
          this.mostrarErrorCarga();
          return;
        }

        this.sala = this.mapearSala(sala);
      },
      error: (err) => {
        console.warn('Error cargando sala desde backend:', err);
        this.mostrarErrorCarga();
      },
    });
  }

  getColorFondo(tipo: string): string {
    if (tipo === 'Estudio') {
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

  private mapearSala(sala: any): SalaDetalleView {
    const ubicacion = Number(sala.ubicacion ?? sala.ubicacion_sala);

    return {
      idSala: sala.idSala ?? sala.id,
      nombreSala: sala.nombreSala ?? sala.nombre ?? 'Sala sin nombre',
      ubicacion: this.formatearUbicacion(ubicacion),
      tipo: ubicacion === 6 ? 'Auditorio' : 'Estudio',
      capacidad: sala.capacidad ?? sala.capacidad_sala ?? 0,
      equipamiento: sala.equipamiento ?? 'No especificado',
      estado: Number(sala.estado ?? sala.estado_sala),
    };
  }

  private mostrarErrorCarga(): void {
    Swal.fire({
      icon: 'error',
      title: 'No se pudo cargar la sala',
      text: 'La sala no existe o no se pudo obtener desde la base de datos.',
    }).then(() => this.router.navigate(['/nueva-reserva']));
  }

  private getNextDateForWeekday(dia: string): string {
    const map: Record<string, number> = {
      Lunes: 1,
      Martes: 2,
      Miercoles: 3,
      Jueves: 4,
      Viernes: 5,
    };
    const target = map[dia];
    const hoy = new Date();
    if (target === undefined) return this.formatLocalDate(hoy);
    const hoyNum = hoy.getDay();
    let offset = target - hoyNum;
    if (offset < 0) offset += 7;
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + offset);
    return this.formatLocalDate(fecha);
  }

  private formatLocalDate(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatearUbicacion(ubicacion: number): string {
    const ubicaciones: Record<number, string> = {
      1: 'Biblioteca',
      2: 'Aulario A',
      3: 'Aulario C',
      4: 'Cafeteria A',
      5: 'Cafeteria B',
      6: 'Auditorio INF',
    };

    return ubicaciones[ubicacion] ?? 'Sin ubicacion';
  }
}
