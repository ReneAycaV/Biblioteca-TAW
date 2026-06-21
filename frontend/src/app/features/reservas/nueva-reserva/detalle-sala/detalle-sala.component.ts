import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservaService } from '../../services/reservas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalles-sala',
  templateUrl: './detalle-sala.component.html',
  styleUrls: ['./detalle-sala.component.css']
})
export class DetalleSalaComponent implements OnInit {

  // 1. Objeto alineado con el Backend
  sala: any = {
    idSala: null,
    nombreSala: 'Cargando...',
    ubicacion: '',
    tipo: '',
    capacidad: 0,
    equipamiento: ''
  };

  // 2. Mock data
  private salasFalsas = [
    { idSala: 1, nombreSala: 'Sala de Estudio A', ubicacion: 'Aulario A', tipo: 'Estudio', capacidad: 6, equipamiento: 'Pizarra acrílica, 4 Sillas, Climatizador' },
    { idSala: 2, nombreSala: 'Sala de Estudio B', ubicacion: 'Aulario A', tipo: 'Estudio', capacidad: 4, equipamiento: 'Pizarra acrílica, Monitor HDMI' },
    { idSala: 3, nombreSala: 'Sala de Estudio C', ubicacion: 'Aulario C', tipo: 'Estudio', capacidad: 8, equipamiento: 'Proyector, Pizarra acrílica grande' },
    { idSala: 4, nombreSala: 'Auditorio Principal', ubicacion: 'Auditorio', tipo: 'Auditorio', capacidad: 50, equipamiento: 'Sistema de audio, Proyector Pro, 50 Butacas' },
    { idSala: 5, nombreSala: 'Auditorio Tecnológico', ubicacion: 'Auditorio', tipo: 'Auditorio', capacidad: 30, equipamiento: 'Telón motorizado, Micrófono inalámbrico' }
  ];

  horarioReserva: any = null

  constructor(
    private route: ActivatedRoute,
    private router: Router,
private reservaService: ReservaService
  ) { }

  ngOnInit(): void {
    const idUrl = this.route.snapshot.paramMap.get('id');
    
    if (idUrl) {
      const idBuscado = Number(idUrl); 
      const salaEncontrada = this.salasFalsas.find(s => s.idSala === idBuscado);
      
      if (salaEncontrada) {
        this.sala = salaEncontrada; 
      } else {
        console.log('No existe esa sala, devolviendo a horarios...');
        this.router.navigate(['/nueva-reserva']);
      }
    }
    this.horarioReserva = this.reservaService.obtenerHorario(); 
    console.log("Horario recuperado en detalles:", this.horarioReserva);
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
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      },
      customClass: {
        popup: 'mi-alerta'
      }
    });


    Toast.fire({
      icon: 'success',
      title: '¡Reserva Exitosa!',
      text: `Tu sala ${this.sala.nombreSala} fue reservada para el ${this.horarioReserva.dia} a las ${this.horarioReserva.rango}.`
    }).then(() => {
      this.router.navigate(['/nueva-reserva']);
    });
  }
}