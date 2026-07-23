export interface IPersonDto {
  idpersona?: number;
  tipo_persona: 'Cliente' | 'Proveedor';
  nombre: string;
  tipo_documento?: string;
  num_documento?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}
