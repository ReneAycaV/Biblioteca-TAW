import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPrestamosComponent } from './gestion-prestamos.component';

describe('GestionPrestamosComponent', () => {
  let component: GestionPrestamosComponent;
  let fixture: ComponentFixture<GestionPrestamosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionPrestamosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPrestamosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
