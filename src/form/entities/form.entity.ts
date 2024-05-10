import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../auth/entities/user.entity";

@Entity('forms')
export class Form {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('jsonb')
  fields: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  // Relación con el usuario administrador.
  @ManyToOne(() => User, (user) => user.forms)
  admin: User;

}
