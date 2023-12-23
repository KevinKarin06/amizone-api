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
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  profession?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: Date;

  @IsValidSex()
  @IsOptional()
  sex?: string;

  @IsString()
  @IsOptional()
  interest?: string;

  @IsString()
  @IsOptional()
  password?: string;

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
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  @IsOptional()
  locale?: string;
}
