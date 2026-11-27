import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import {
  AdminService,
  IUsuarioAdmin,
  IUsuarioPayload,
  RolUsuarioAdmin,
} from '../services/admin.service';

interface UsuarioForm {
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  password: string;
  rol: RolUsuarioAdmin;
  telefono: string;
  estadoAcademico: string;
}

@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.css']
})
export class GestionUsuariosComponent implements OnInit {
  usuarios: IUsuarioAdmin[] = [];
  cargando = true;
  guardando = false;
  error = '';
  exito = '';

  busqueda = '';
  filtroRol: '' | RolUsuarioAdmin = '';
  filtroEstado: '' | 'activo' | 'inactivo' | 'multa' = '';

  modalAbierto = false;
  usuarioEditando: IUsuarioAdmin | null = null;
  form: UsuarioForm = this.formVacio();
  errorForm = '';

  private idAdminActual: number | null = null;

  constructor(
    private adminService: AdminService,
    authService: AuthService,
  ) {
    this.idAdminActual = authService.getUsuario()?.id ?? null;
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.adminService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargando = false;
      },
      error: (err) => {
        this.error = this.adminService.mensajeError(err, 'No se pudieron cargar los usuarios');
        this.cargando = false;
      },
    });
  }

  get usuariosFiltrados(): IUsuarioAdmin[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.usuarios.filter((u) => {
      const coincide =
        !q ||
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        u.rut.toLowerCase().includes(q);
      const rol = !this.filtroRol || u.rol === this.filtroRol;
      const estado =
        !this.filtroEstado ||
        (this.filtroEstado === 'multa' ? u.tieneMultaImpaga : u.estadoAcademico === this.filtroEstado);
      return coincide && rol && estado;
    });
  }

  get totalEstudiantes(): number {
    return this.usuarios.filter((u) => u.rol === 'ESTUDIANTE').length;
  }

  get totalAdmins(): number {
    return this.usuarios.filter((u) => u.rol === 'ADMIN').length;
  }

  get totalInactivos(): number {
    return this.usuarios.filter((u) => u.estadoAcademico !== 'activo').length;
  }

  get totalConMulta(): number {
    return this.usuarios.filter((u) => u.tieneMultaImpaga).length;
  }

  esUsuarioActual(u: IUsuarioAdmin): boolean {
    return u.idUsuario === this.idAdminActual;
  }

  iniciales(u: IUsuarioAdmin): string {
    return `${u.nombre?.[0] ?? ''}${u.apellido?.[0] ?? ''}`.toUpperCase();
  }

  // ───────── Modal crear / editar ─────────
  abrirNuevo(): void {
    this.usuarioEditando = null;
    this.form = this.formVacio();
    this.errorForm = '';
    this.modalAbierto = true;
  }

  abrirEditar(u: IUsuarioAdmin): void {
    this.usuarioEditando = u;
    this.form = {
      nombre: u.nombre,
      apellido: u.apellido,
      rut: u.rut,
      correo: u.correo,
      password: '',
      rol: u.rol,
      telefono: u.telefono ?? '',
      estadoAcademico: u.estadoAcademico,
    };
    this.errorForm = '';
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    if (!this.guardando) this.modalAbierto = false;
  }

  guardar(): void {
    const f = this.form;
    const editando = this.usuarioEditando;

    if (!f.nombre.trim() || !f.apellido.trim() || !f.rut.trim() || !f.correo.trim()) {
      this.errorForm = 'Nombre, apellido, RUT y correo son obligatorios';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo.trim())) {
      this.errorForm = 'El correo no tiene un formato válido';
      return;
    }
    if (!editando && f.password.length < 6) {
      this.errorForm = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (editando && f.password && f.password.length < 6) {
      this.errorForm = 'La nueva contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (editando && this.esUsuarioActual(editando) && f.rol !== 'ADMIN') {
      this.errorForm = 'No puedes quitarte a ti mismo el rol de administrador';
      return;
    }

    const payload: IUsuarioPayload = {
      nombre: f.nombre.trim(),
      apellido: f.apellido.trim(),
      rut: f.rut.trim(),
      correo: f.correo.trim(),
      rol: f.rol,
      estadoAcademico: f.estadoAcademico,
      telefono: f.telefono.trim(),
      ...(f.password && { password: f.password }),
    };

    this.guardando = true;
    this.errorForm = '';
    const peticion = editando
      ? this.adminService.actualizarUsuario(editando.idUsuario, payload)
      : this.adminService.crearUsuario(payload);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.mostrarExito(editando ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        this.cargarUsuarios();
      },
      error: (err) => {
        this.guardando = false;
        this.errorForm = this.adminService.mensajeError(err, 'No se pudo guardar el usuario');
      },
    });
  }

  cambiarEstado(u: IUsuarioAdmin): void {
    const nuevoEstado = u.estadoAcademico === 'activo' ? 'inactivo' : 'activo';
    const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
    const aviso = nuevoEstado === 'inactivo' ? '\nNo podrá iniciar sesión, pedir préstamos ni reservar salas.' : '';
    if (!confirm(`¿Seguro que deseas ${accion} a ${u.nombre} ${u.apellido}?${aviso}`)) return;

    this.adminService.cambiarEstadoUsuario(u.idUsuario, nuevoEstado).subscribe({
      next: () => {
        this.mostrarExito(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
        this.cargarUsuarios();
      },
      error: (err) => (this.error = this.adminService.mensajeError(err, `No se pudo ${accion} el usuario`)),
    });
  }

  private mostrarExito(mensaje: string): void {
    this.error = '';
    this.exito = mensaje;
    setTimeout(() => {
      if (this.exito === mensaje) this.exito = '';
    }, 3500);
  }

  private formVacio(): UsuarioForm {
    return {
      nombre: '',
      apellido: '',
      rut: '',
      correo: '',
      password: '',
      rol: 'ESTUDIANTE',
      telefono: '',
      estadoAcademico: 'activo',
    };
  }
}
