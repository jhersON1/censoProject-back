import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Form } from "../../form/entities/form.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {
    unique: true,
  })
  email: string;

  @Column('text', {
    select: false,
  })
  password: string;

  @Column('text')
  name: string;

  @Column('text')
  lastName: string;

  @Column('text', {
    unique: true,
  })
  dni: string;

  @Column('bool', {
    default: true,
  })
  isActive: boolean;

  @Column('text', {
    array: true,
    default: ['user'],
  })
  roles: string[];

  // Un usuario que tiene como rol "user" tiene un solo "admin".
  @ManyToOne(() => User, (admin) => admin.managedUsers)
  admin?: User;

  // Un usuario con rol "admin" puede gestionar múltiples usuarios con rol "user".
  @OneToMany(() => User, (user) => user.admin)
  managedUsers: User[];

  // Un usuario con rol "admin" puede gestionar múltiples formularios.
  @OneToMany(() => Form, (form) => form.admin)
  forms: Form[];

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
  }
}
