import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidSex', async: false })
class IsValidSexConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return value === 'M' || value === 'F';
  }

  defaultMessage() {
    return 'The value must be "M" for male or "F" for female.';
  }
}

@ValidatorConstraint({ name: 'isValidPhoneNumber', async: false })
class IsValidPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    const cameroonPhoneRegex = /^(?:237)([6]\d{8})$/;
    return cameroonPhoneRegex.test(value);
  }

  defaultMessage() {
    return 'The value must be a valid phone number (eg: 237690112233)';
  }
}

export function IsValidSex(validationOptions?: ValidationOptions) {
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

export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPhoneNumberConstraint,
    });
  };
}
