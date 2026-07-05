// Respuesta del backend al solicitar un préstamo
export interface IPrestamoResponseDTO {
  message: string;
  prestamo: {
    idPrestamo: number;
    fechaPrestamo: string;
    fechaDevolucionEsperada: string;
    estado: number;
  };
}
