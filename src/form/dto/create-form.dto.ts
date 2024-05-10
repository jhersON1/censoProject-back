import { IsNotEmpty, IsObject, IsString } from "class-validator";

export class CreateFormDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsObject()
  fields: Record<string, any>;
}
