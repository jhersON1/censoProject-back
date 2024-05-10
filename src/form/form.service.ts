import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { Form } from "./entities/form.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../auth/entities/user.entity";

@Injectable()
export class FormService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createFormDto: CreateFormDto, adminId: string): Promise<Form> {
    const admin = await this.userRepository.findOneBy({ id: adminId });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${adminId} not found`);
    }

    const form = this.formRepository.create({ ...createFormDto, admin });
    return this.formRepository.save(form);
  }

  async findAll(): Promise<Form[]> {
    return this.formRepository.find({ relations: ['admin'] });
  }

  async findOne(id: number): Promise<Form> {
    const form = await this.formRepository.findOne({ where: { id }, relations: ['admin'] });

    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }

    return form;
  }

  async findByAdmin(adminId: string): Promise<Form[]> {
    return this.formRepository.find({
      where: { admin: { id: adminId } },
    });
  }

  async update(id: number, updateFormDto: UpdateFormDto): Promise<Form> {
    const form = await this.findOne(id);
    Object.assign(form, updateFormDto);
    return this.formRepository.save(form);
  }

  async remove(id: number): Promise<void> {
    const form = await this.findOne(id);
    await this.formRepository.remove(form);
  }
}
