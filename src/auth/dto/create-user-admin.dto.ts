import { CreateUserDto } from './create-user.dto';
import { IsUUID } from 'class-validator';

export class CreateUserWithAdminDto extends CreateUserDto {
  @IsUUID()
  adminCode: string;
}
