import {
  BadRequestException,
  Injectable,
  InternalServerErrorException, NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto, CreateUserWithAdminDto, LoginUserDto } from './dto';
import { JwtPayload } from './interfaces';
import { use } from "passport";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registrar un nuevo usuario con rol de "admin".
   */
  async registerAdmin(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const admin = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
        roles: ['admin'], // Asignar explícitamente el rol de "admin"
      });

      await this.userRepository.save(admin);
      delete admin.password;

      return {
        ...admin,
        token: this.getJwtToken({ id: admin.id, roles: admin.roles }),
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  /**
   * Registrar un nuevo usuario con rol de "user" asociado a un administrador existente.
   */
  async registerUser(createUserWithAdminDto: CreateUserWithAdminDto) {
    const { adminCode, password, ...userData } = createUserWithAdminDto;

    // Encontrar el administrador por su UUID (adminCode).
    const admin = await this.userRepository.findOneBy({ id: adminCode });

    // Validar si el administrador existe y tiene el rol adecuado.
    if (!admin || !admin.roles.includes('admin')) {
      throw new UnauthorizedException('Invalid admin code or role.');
    }

    try {
      // Crear un nuevo usuario asociado a ese administrador.
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
        roles: ['user'],
        admin, // Asociar el usuario con el admin encontrado.
      });

      await this.userRepository.save(user);
      delete user.password;

      return {
        ...user,
        token: this.getJwtToken({ id: user.id, roles: user.roles }),
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true }, //! OJO!
    });

    if (!user) throw new UnauthorizedException('Invalid credentials (email)');

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Invalid credentials (password)');

    return {
      ...user,
      token: this.getJwtToken({ id: user.id, roles: user.roles }),
    };
  }

  async checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id, roles: user.roles }),
    };
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Encontrar todos los usuarios con el rol "admin" usando QueryBuilder.
   */
  async findAdmins(): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where(':role = ANY (user.roles)', { role: 'admin' })
      .getMany();
  }

  /**
   * Encontrar todos los usuarios con el rol "user" usando QueryBuilder.
   */
  async findUsers(): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where(':role = ANY (user.roles)', { role: 'user' })
      .getMany();
  }

  /**
   * Obtener usuarios que están gestionados por un administrador específico.
   * @param adminId El ID del administrador.
   */
  async findUsersManagedByAdmin(adminId: string): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.adminId = :adminId', { adminId })
      .getMany();
  }

  public getJwtToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  /**
   * Obtener el ID del administrador basado en el token del usuario.
   */
  async getAdminIdFromToken(token: string): Promise<string> {
    // Decodificar el token
    const decoded = this.jwtService.verify(token);

    if (!decoded || !decoded.id) {
      throw new UnauthorizedException('Invalid token');
    }

    // Buscar el usuario por ID
    const user = await this.userRepository.findOne({
      where: { id: decoded.id },
      relations: ['admin'],
    });

    if (!user || !user.admin) {
      throw new NotFoundException('User or admin not found');
    }

    return user.admin.id;
  }

  /**
   * Eliminar un usuario por su ID.
   * @param userId El ID del usuario a eliminar.
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    try {
      await this.userRepository.remove(user);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    console.log(error);

    throw new InternalServerErrorException('Please check server logs');
  }
}
