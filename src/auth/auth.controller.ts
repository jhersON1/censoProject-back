import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Headers,
  HttpException,
  HttpStatus,
  Param, UnauthorizedException, Delete
} from "@nestjs/common";
import { AuthService } from './auth.service';
import { GetUser, Auth } from './decorators';

import { CreateUserDto, CreateUserWithAdminDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { ValidRoles } from './interfaces';
import { LoginResponse } from './interfaces/login-response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registrar un nuevo usuario con rol de "admin".
   */
  @Post('register-admin')
  registerAdmin(@Body() createUserDto: CreateUserDto) {
    return this.authService.registerAdmin(createUserDto);
  }

  /**
   * Registrar un nuevo usuario con rol de "user" y asociado a un "admin".
   */
  @Post('register-user')
  registerUser(@Body() createUserWithAdminDto: CreateUserWithAdminDto) {
    return this.authService.registerUser(createUserWithAdminDto);
  }

  /**
   * Iniciar sesión con un usuario existente.
   */
  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  /**
   * Obtener todos los usuarios con rol "admin".
   */
  @Get('admins')
  getAdmins() {
    return this.authService.findAdmins();
  }

  /**
   * Obtener todos los usuarios con rol "user".
   */
  @Get('users')
  getUsers() {
    return this.authService.findUsers();
  }

  /**
   * Verificar el estado de autenticación del usuario actual.
   */
  @Get('check-status')
  @Auth()
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

  /**
   * Endpoint privado accesible solo para admins.
   */
  @Get('private3')
  @Auth(ValidRoles.admin)
  privateRoute3(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  /**
   * Endpoint para obtener los usuarios que gestiona un administrador.
   * @param adminId El ID del administrador.
   */
  @Get('admin/:adminId/users')
  getUsersManagedByAdmin(@Param('adminId') adminId: string) {
    return this.authService.findUsersManagedByAdmin(adminId);
  }

  @Get('admin-id')
  async getAdminId(@Headers('Authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    return this.authService.getAdminIdFromToken(token);
  }

  /**
   * Verificar la validez del token actual y retornar un nuevo token.
   */
  @Auth()
  @Get('check-token')
  checkToken(@Request() req: Request): LoginResponse {
    const user = req['user'] as User;
    if (!user) {
      throw new HttpException(
        'No user found in request',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      user,
      token: this.authService.getJwtToken({ id: user.id }),
    };
  }

  /**
   * Encontrar y listar todos los usuarios.
   */
  @Get()
  findAll() {
    return this.authService.findAll();
  }

  //@Auth(ValidRoles.admin)
  @Delete('user/:id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.authService.deleteUser(id);
  }
}
