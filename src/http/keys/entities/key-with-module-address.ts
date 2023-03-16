import { ApiProperty } from '@nestjs/swagger';
import { Key, SRModuleKey } from 'http/common/response-entities';

export class KeyWithModuleAddress extends Key {
  constructor(key: SRModuleKey, moduleAddress: string) {
    super(key);
    this.moduleAddress = moduleAddress;
  }

  @ApiProperty({
    required: true,
    description: 'Module address',
  })
  moduleAddress: string;
}
