export interface ILoginResponseDTO {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    rol: string;
  };
}
