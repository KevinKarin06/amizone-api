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
