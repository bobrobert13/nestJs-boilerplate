export interface Usuario {
  id?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUsuario {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
}

export interface UpdateUsuario {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  activo?: boolean;
}