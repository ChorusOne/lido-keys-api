import { ApiProperty } from '@nestjs/swagger';

export class KeyQuery {
  @ApiProperty({
    required: false,
    description:
      'Filter to get used keys. Possible values: true/false. If this value is not specified endpoint will return all keys.',
  })
  used?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Filter for operator with specified index. If this value is not specified endpoint will return keys for all operators.',
  })
  operatorIndex?: number;
}
