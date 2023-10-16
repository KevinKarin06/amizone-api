import {
  IsString,
  IsOptional,
  IsEmail,
  IsBase64,
  IsBoolean,
} from 'class-validator';
import { IsValidSex } from '../common/validator';

export class UserDto {
  @IsString()
  name: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  profession: string;

  @IsString()
  dateOfBirth: Date;

  @IsValidSex()
  sex: string;

  @IsString()
  interest: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsOptional()
  @IsBoolean()
  active?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBase64()
  profileImage?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  @IsOptional()
  locale?: string;
}
