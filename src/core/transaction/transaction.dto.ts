import {
  IsString,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationOptions,
  registerDecorator,
  IsNotEmpty,
} from 'class-validator';
import { TransactionMotif } from 'src/utils/constants';

@ValidatorConstraint({ name: 'isValidMotif', async: false })
class IsValidMotifConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return (
      value === TransactionMotif.AppPayment ||
      value === TransactionMotif.ReferralGain
    );
  }

  defaultMessage() {
    return `The value must be "${TransactionMotif.AppPayment}" or "${TransactionMotif.ReferralGain}".`;
  }
}

function IsValidMotif(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidMotifConstraint,
    });
  };
}

export class TransactionDto {
  @IsNotEmpty()
  @IsString()
  @IsValidMotif()
  motif: string;
}
