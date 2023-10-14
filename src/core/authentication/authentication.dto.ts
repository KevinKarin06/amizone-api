import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsEmail,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

// Custom validation constraint to check if the value is 'M' or 'F'
@ValidatorConstraint({ name: 'isValidSex', async: false })
class IsValidSexConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return value === 'M' || value === 'F';
  }

  defaultMessage() {
    return 'The value must be "M" for male or "F" for female.';
  }
}

// Decorator function to use the custom constraint
function IsValidSex(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSexConstraint,
    });
  };
}

export class RegisterDto {
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
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  @IsOptional()
  locale?: string;
}

export class LoginDto {
  @IsString()
  phoneNumber: string;

  @IsString()
  password: string;
}

export class ResendDto {
  @IsNotEmpty()
  phoneNumber: string;
}

export class VerifyDto {
  @IsNotEmpty()
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
