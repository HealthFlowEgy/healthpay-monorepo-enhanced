import { IsArray, IsNotEmpty, IsString } from 'class-validator';

import { Type } from 'class-transformer';

export class InputParameterList {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

// create trasnaction inquiry dto
export class TransactionInquiryDto {
  @IsArray({
    each: true,
    message: 'input_parameter_list must be an array',
  })
  @IsNotEmpty()
  @Type(() => InputParameterList)
  input_parameter_list: Array<{
    key: string;
    value: string;
  }>;
}
