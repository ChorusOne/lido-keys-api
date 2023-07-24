import { Entity, EntityRepositoryType, PrimaryKey, PrimaryKeyType, Property } from '@mikro-orm/core';
import { ElMetaRepository } from './el-meta.repository';

@Entity({ customRepository: () => ElMetaRepository })
export class ElMetaEntity {
  [EntityRepositoryType]?: ElMetaRepository;
  [PrimaryKeyType]?: [number, number];

  constructor(meta: ElMetaEntity) {
    this.blockNumber = meta.blockNumber;
    this.blockHash = meta.blockHash.toLocaleLowerCase();
    this.timestamp = meta.timestamp;
  }

  @PrimaryKey()
  blockNumber: number;

  @PrimaryKey()
  @Property({ length: 66 })
  blockHash: string;

  @Property()
  timestamp: number;
}
