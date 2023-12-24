import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsEmail,
} from 'class-validator';
import { IsValidPhoneNumber, IsValidSex } from '../common/validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsString()
  @IsValidPhoneNumber()
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
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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

export class LoginDto {
  @IsString()
  @IsValidPhoneNumber()
  phoneNumber: string;

  @IsString()
  password: string;
}

export class ResendDto {
  @IsNotEmpty()
  @IsValidPhoneNumber()
  phoneNumber: string;
}

export class VerifyDto {
  @IsNotEmpty()
  @IsValidPhoneNumber()
  phoneNumber: string;

  @IsNumber()
  @IsNotEmpty()
  code: string;
}

export class ResetDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
