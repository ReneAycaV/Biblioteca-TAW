import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  
  activeRole: string = 'student'; 

  loginData = {
    email: '',
    password: '',
    role: 'student'
  };

  setRole(roleSelected: string) {
    this.activeRole = roleSelected;
    this.loginData.role = roleSelected;
    this.loginData.email = '';
    this.loginData.password = '';
  }

  constructor(private router: Router) { }

  onSubmit(form: any) {
    console.log("ingreso con:", this.loginData.email, this.loginData.password, this.loginData.role);
    // Si el formulario es inválido (faltan datos), detenemos todo aquí
    if (form.invalid) {
      console.log("Faltan datos, no se envía nada al backend.");
      return; 
    }
      const accesoPermitido = this.testBD(this.loginData.email, this.loginData.password, this.loginData.role);

        if (accesoPermitido){
          this.router.navigate(['/catalogo']);
        } else {
          alert("Credenciales incorrectas o no tienes permiso.");
        }
      }

    testBD(email: string, password: string, role: string): boolean {
      const validStudent = { email: 'alumno@nyu.com', password: '123456', role: 'student' };
      const validAdmin = { email: 'admin_01', password: 'admin123', role: 'admin' };

      if (role === 'student') {
        return email === validStudent.email && password === validStudent.password;
      } else if (role === 'admin') {
        return email === validAdmin.email && password === validAdmin.password;
      }
      return false;
    }
  }