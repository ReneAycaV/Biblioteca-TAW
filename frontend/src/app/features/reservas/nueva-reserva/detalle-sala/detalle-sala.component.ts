import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Traemos las herramientas de rutas

@Component({
  selector: 'app-detalles-sala',
  templateUrl: './detalle-sala.component.html',
  styleUrls: ['./detalle-sala.component.css']
  // Si tu archivo se llama detalle-sala (sin s), recuerda corregir arriba
})
export class DetalleSalaComponent implements OnInit {

  // 1. Aquí guardaremos la sala que encuentre el "espía"
  sala: any = {
    id: null,
    nombre: 'Cargando...',
    ubicacion: '',
    tipo: '',
    capacidad: 0,
    equipamiento: ''
  };

  // 2. Base de datos simulada (Mock data) alineada con tu modal y tu compañero
  private salasFalsas = [
    { id: 1, nombre: 'Sala de Estudio A', ubicacion: 'Aulario A - Piso 2', tipo: 'Sala de Estudio', capacidad: 6, equipamiento: 'Pizarra acrílica, 4 Sillas, Climatizador' },
    { id: 2, nombre: 'Sala de Estudio B', ubicacion: 'Aulario A - Piso 2', tipo: 'Sala de Estudio', capacidad: 4, equipamiento: 'Pizarra acrílica, Monitor HDMI' },
    { id: 3, nombre: 'Sala de Estudio C', ubicacion: 'Aulario C - Piso 1', tipo: 'Sala de Estudio', capacidad: 8, equipamiento: 'Proyector, Pizarra acrílica grande' },
    { id: 4, nombre: 'Auditorio Principal', ubicacion: 'Facultad de Ingeniería', tipo: 'Auditorio', capacidad: 50, equipamiento: 'Sistema de audio, Proyector Pro, 50 Butacas' },
    { id: 5, nombre: 'Auditorio Tecnológico', ubicacion: 'Edificio de Ciencias', tipo: 'Auditorio', capacidad: 30, equipamiento: 'Telón motorizado, Micrófono inalámbrico' }
  ];

  // 3. Inyectamos ActivatedRoute para espiar la URL y Router por si necesitamos salir de aquí
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 4. El espía entra en acción apenas carga la página
    // Buscamos el parámetro llamado 'id' que configuramos en las rutas
    const idUrl = this.route.snapshot.paramMap.get('id');
    
    if (idUrl) {
      const idBuscado = Number(idUrl); // Convertimos el texto "3" a número 3
      
      // Buscamos en nuestra lista la sala que tenga ese mismo ID
      const salaEncontrada = this.salasFalsas.find(s => s.id === idBuscado);
      
      if (salaEncontrada) {
        this.sala = salaEncontrada; // ¡La encontramos! Se la pasamos al HTML
      } else {
        console.log('No existe esa sala, devolviendo a horarios...');
        this.router.navigate(['/nueva-reserva']);
      }
    }
  }

  // 5. Esta es la función que maneja los colores dinámicos (como el catálogo de libros de tu compañero)
  getColorFondo(tipo: string): string {
    if (tipo === 'Sala de Estudio') {
      // Un gradiente morado elegante estilo universidad
      return 'linear-gradient(145deg, #57068C, #8E2DE2)';
    } else if (tipo === 'Auditorio') {
      // Un gradiente verde/turquesa vivo para diferenciarlo al tiro
      return 'linear-gradient(145deg, #008080, #00ced1)';
    }
    // Color por defecto por si acaso
    return 'linear-gradient(145deg, #6B7280, #9CA3AF)';
  }

  // 6. El botón definitivo de confirmación
  confirmarReservaFinal() {
    alert(`¡Reserva confirmada con éxito para la ${this.sala.nombre}!`);
    // Aquí es donde en el futuro llamaremos al servicio de tu compañero para hacer el POST a la base de datos.
    // Por ahora, devolvemos al alumno a la página principal
    this.router.navigate(['/nueva-reserva']);
  }
}