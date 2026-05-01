import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuPrincipalUsuarioComponent } from './menu-principal-usuario/menu-principal-usuario.component';
import { MenuPrincipalAdminComponent } from './menu-principal-admin/menu-principal-admin.component';



@NgModule({
  declarations: [
    MenuPrincipalUsuarioComponent,
    MenuPrincipalAdminComponent
  ],
  imports: [
    CommonModule
  ]
})
export class MenuPrincipalModule { }
