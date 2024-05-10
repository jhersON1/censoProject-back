import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Form } from "./entities/form.entity";
import { User } from "../auth/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Form, User])],
  controllers: [FormController],
  providers: [FormService],
})
export class FormModule {}
