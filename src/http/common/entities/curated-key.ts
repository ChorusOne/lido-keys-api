import { ApiProperty } from '@nestjs/swagger';
import { Key } from 'http/common/entities/';
import { RegistryKey } from 'common/registry';

// TODO: it enough use key from registry , lets remove
export class CuratedKey extends Key {
  constructor(key: RegistryKey) {
    super(key);
    this.index = key.index;
  }

  @ApiProperty({
    description: 'Key index in contract',
  })
  index: number;
}
