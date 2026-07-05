import { Component, OnInit } from '@angular/core';
import { AdminService, ISalaAdmin } from '../services/admin.service';

@Component({
  selector: 'app-gestion-salas',
  templateUrl: './gestion-salas.component.html',
  styleUrls: ['./gestion-salas.component.css']
})

export class GestionSalasComponent implements OnInit {
  
  listaSalas: ISalaAdmin[] = []; 
  
  nuevaSala = {
    nombreSala: '',
    capacidad: 10,
    ubicacion: 'Biblioteca',
    estado: 'Disponible'
  };

  ubicaciones = ['Biblioteca', 'Aulario A', 'Aulario C', 'Cafeteria A', 'Cafeteria B', 'Auditorio'];
  estados = ['Disponible', 'Mantenimiento', 'Bloqueada'];

  // Inyectamos el servicio del admin
  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.cargarSalas();
  }

  cargarSalas() {
    this.adminService.getSalas().subscribe({
      next: (data: ISalaAdmin[]) => {
        this.listaSalas = data;
      },
      error: (err) => console.error("Error al cargar salas", err)
    });
  }

  guardarSala() {
    if (this.nuevaSala.nombreSala.trim()) {
      this.adminService.crearSala(this.nuevaSala).subscribe({
        next: (res) => {
          console.log("¡Sala guardada con éxito!", res);
          this.cargarSalas(); // Recargar la tabla
          this.limpiarFormulario(); // Vaciar el form
        },
        error: (err) => console.error("Error al guardar sala", err)
      });
    }
  }

  borrarSala(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta sala del sistema?')) {
      this.adminService.eliminarSala(id).subscribe({
        next: () => {
          this.cargarSalas(); // Recargar la tabla
        },
        error: (err) => console.error("Error al borrar la sala", err)
      });
    }
  }

  limpiarFormulario() {
    this.nuevaSala = {
      nombreSala: '',
      capacidad: 10,
      ubicacion: 'Biblioteca',
      estado: 'Disponible'
    };
  }
}