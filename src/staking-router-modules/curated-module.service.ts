import { Inject, Injectable } from '@nestjs/common';
import {
  KeyRegistryService,
  RegistryKeyStorageService,
  RegistryKey,
  RegistryOperator,
  RegistryOperatorStorageService,
} from 'common/registry';
import { EntityManager } from '@mikro-orm/postgresql';
import { Trace } from 'common/decorators/trace';
import { LOGGER_PROVIDER, LoggerService } from 'common/logger';
import { QueryOrder } from '@mikro-orm/core';
import { StakingModuleInterface } from './interfaces/staking-module.interface';
import { KeysFilter } from './interfaces/keys-filter';
import { OperatorsFilter } from './interfaces';
import { KeyField } from './interfaces/key-fields';

const TRACE_TIMEOUT = 15 * 60 * 1000;

@Injectable()
export class CuratedModuleService implements StakingModuleInterface {
  constructor(
    @Inject(LOGGER_PROVIDER) protected readonly logger: LoggerService,
    protected readonly keyRegistryService: KeyRegistryService,
    protected readonly keyStorageService: RegistryKeyStorageService,
    protected readonly operatorStorageService: RegistryOperatorStorageService,
    protected readonly entityManager: EntityManager,
  ) {}

  // we need it
  @Trace(TRACE_TIMEOUT)
  public async update(moduleAddress: string, blockHash: string): Promise<void> {
    await this.keyRegistryService.update(moduleAddress, blockHash);
  }

  // we need it
  public async getCurrentNonce(moduleAddress: string, blockHash: string): Promise<number> {
    const nonce = await this.keyRegistryService.getNonceFromContract(moduleAddress, blockHash);
    return nonce;
  }

  public async getKeys(
    moduleAddress: string,
    filters: KeysFilter,
    fields: readonly KeyField[] | undefined,
  ): Promise<RegistryKey[]> {
    const where = {};
    if (filters.operatorIndex != undefined) {
      where['operatorIndex'] = filters.operatorIndex;
    }

    if (filters.used != undefined) {
      where['used'] = filters.used;
    }

    // we store keys of modules with the same impl at the same table
    where['moduleAddress'] = moduleAddress;

    const keys = await this.keyStorageService.find(where, { populate: fields });

    return keys;
  }

  public async *getKeysStream(
    contractAddress: string,
    filters: KeysFilter,
    fields: readonly KeyField[] | undefined,
  ): AsyncGenerator<RegistryKey> {
    const where = {};
    if (filters.operatorIndex != undefined) {
      where['operatorIndex'] = filters.operatorIndex;
    }

    if (filters.used != undefined) {
      where['used'] = filters.used;
    }

    where['moduleAddress'] = contractAddress;

    const batchSize = 10000;
    let offset = 0;

    while (true) {
      const chunk = await this.keyStorageService.find(where, { limit: batchSize, offset, populate: fields });
      if (chunk.length === 0) {
        break;
      }

      offset += batchSize;

      for (const record of chunk) {
        yield record;
      }
    }
  }

  public async getKeysByPubKeys(
    moduleAddress: string,
    pubKeys: string[],
    fields: readonly KeyField[] | undefined,
  ): Promise<RegistryKey[]> {
    return await this.keyStorageService.find({ key: { $in: pubKeys }, moduleAddress }, { populate: fields });
  }

  public async getKeysByPubkey(
    moduleAddress: string,
    pubKey: string,
    fields: readonly KeyField[] | undefined,
  ): Promise<RegistryKey[]> {
    return await this.keyStorageService.find({ key: pubKey.toLocaleLowerCase(), moduleAddress }, { populate: fields });
  }

  public async getOperators(moduleAddress: string, filters?: OperatorsFilter): Promise<RegistryOperator[]> {
    const where = {};
    if (filters?.index != undefined) {
      where['index'] = filters.index;
    }
    // we store operators of modules with the same impl at the same table
    where['moduleAddress'] = moduleAddress;
    return await this.operatorStorageService.find(where, { orderBy: [{ index: QueryOrder.ASC }] });
  }

  public async getOperator(moduleAddress: string, index: number): Promise<RegistryOperator | null> {
    const operators = await this.operatorStorageService.find({ moduleAddress, index });
    return operators[0];
  }
}
