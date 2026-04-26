import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UsuarioDocument = Usuario & Document;

@Schema({ timestamps: true })
export class Usuario {
  @ApiProperty({ example: 'John', description: 'First name' })
  @Prop({ required: true })
  nombre: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @Prop({ required: true })
  apellido: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Phone number' })
  @Prop({ required: false })
  telefono?: string;

  @ApiProperty({ example: true, description: 'Whether user is active' })
  @Prop({ default: true })
  activo: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);