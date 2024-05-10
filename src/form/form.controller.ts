import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { FormService } from './form.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';

@Controller('form')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  create(@Body() createFormDto: CreateFormDto, @Query('adminId') adminId: string) {
    return this.formService.create(createFormDto, adminId);
  }

  @Get()
  findAll() {
    return this.formService.findAll();
  }

  @Get('admin/:adminId')
  findByAdmin(@Param('adminId') adminId: string) {
    return this.formService.findByAdmin(adminId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFormDto: UpdateFormDto) {
    return this.formService.update(+id, updateFormDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formService.remove(+id);
  }
}
