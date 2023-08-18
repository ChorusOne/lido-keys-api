import { Inject, Injectable, NotFoundException, LoggerService } from '@nestjs/common';
import { ConfigService } from 'common/config';
import { ModuleId } from 'http/common/entities/';
import { ELBlockSnapshot, SRModule, CuratedOperator } from 'http/common/entities/';
import { GroupedByModuleOperatorListResponse, SRModuleOperatorResponse } from './entities';
import { LOGGER_PROVIDER } from '@lido-nestjs/logger';
import { CuratedModuleService, STAKING_MODULE_TYPE } from 'staking-router-modules';
import { KeysUpdateService } from 'jobs/keys-update';
import { SRModuleOperator } from 'http/common/entities/sr-module-operator';
import { httpExceptionTooEarlyResp } from 'http/common/entities/http-exceptions/too-early-resp';
import { RegistryOperator } from '@lido-nestjs/registry';

@Injectable()
export class SRModulesOperatorsService {
  constructor(
    @Inject(LOGGER_PROVIDER) protected readonly logger: LoggerService,
    protected configService: ConfigService,
    protected curatedService: CuratedModuleService,
    protected keysUpdateService: KeysUpdateService,
  ) {}

  public async getAll(): Promise<GroupedByModuleOperatorListResponse> {
    const stakingModules = await this.keysUpdateService.getStakingModules();

    if (stakingModules.length == 0) {
      this.logger.warn('No staking modules in list. Maybe didnt fetched from SR yet');
      throw httpExceptionTooEarlyResp();
    }

    const collectedData: { operators: SRModuleOperator[]; module: SRModule }[] = [];
    let elBlockSnapshot: ELBlockSnapshot | null = null;

    // Because of current lido-nestjs/registry implementation in case of more than one
    // staking router module we need to wrap code below in transaction (with serializable isolation level that is default in mikro orm )
    // to prevent reading keys for different blocks
    // But now we have only one module and in current future we will try to find solution without transactions

    for (let i = 0; i < stakingModules.length; i++) {
      if (stakingModules[i].type == STAKING_MODULE_TYPE.CURATED_ONCHAIN_V1_TYPE) {
        const { operators: curatedOperators, meta } = await this.curatedService.getOperatorsWithMeta();

        if (!meta) {
          this.logger.warn(`Meta is null, maybe data hasn't been written in db yet.`);
          throw httpExceptionTooEarlyResp();
        }

        const operators: CuratedOperator[] = curatedOperators.map((op) => new CuratedOperator(op));

        // meta should be the same for all modules
        // so in answer we can use meta of any module
        // lets use meta of first module in list
        // currently we sure if stakingModules is not empty, we will have in list Curated Module
        // in future this check should be in each if clause
        if (i == 0) {
          elBlockSnapshot = new ELBlockSnapshot(meta);
        }

        collectedData.push({ operators, module: new SRModule(meta.keysOpIndex, stakingModules[i]) });
      }
    }

    // we check stakingModules list types so this condition should never be true
    if (!elBlockSnapshot) {
      this.logger.warn(`Meta for response wasnt set.`);
      throw httpExceptionTooEarlyResp();
    }

    return {
      data: collectedData,
      meta: {
        elBlockSnapshot,
      },
    };
  }

  public async getByModule(moduleId: ModuleId): Promise<{
    operatorsStream: AsyncGenerator<RegistryOperator>;
    module: SRModule;
    meta: { elBlockSnapshot: ELBlockSnapshot };
  }> {
    const stakingModule = await this.keysUpdateService.getStakingModule(moduleId);

    if (!stakingModule) {
      throw new NotFoundException(`Module with moduleId ${moduleId} is not supported`);
    }

    // We suppose if module in list, Keys API knows how to work with it
    // it is also important to have consistent module info and meta

    if (stakingModule.type !== STAKING_MODULE_TYPE.CURATED_ONCHAIN_V1_TYPE) {
      throw new NotFoundException(`Modules with other types are not supported`);
    }
    const meta = await this.curatedService.getMetaDataFromStorage();
    const operatorsStream = this.curatedService.getOperatorsStream();

    if (!meta) {
      this.logger.warn(`Meta is null, maybe data hasn't been written in db yet.`);
      throw httpExceptionTooEarlyResp();
    }

    const elBlockSnapshot = new ELBlockSnapshot(meta);

    return {
      operatorsStream,
      module: new SRModule(meta.keysOpIndex, stakingModule),
      meta: {
        elBlockSnapshot,
      },
    };
  }

  public async getModuleOperator(moduleId: ModuleId, operatorIndex: number): Promise<SRModuleOperatorResponse> {
    const stakingModule = await this.keysUpdateService.getStakingModule(moduleId);

    if (!stakingModule) {
      throw new NotFoundException(`Module with moduleId ${moduleId} is not supported`);
    }

    // We suppose if module in list, Keys API knows how to work with it
    // it is also important to have consistent module info and meta

    if (stakingModule.type === STAKING_MODULE_TYPE.CURATED_ONCHAIN_V1_TYPE) {
      const { operator, meta } = await this.curatedService.getOperatorByIndex(operatorIndex);

      if (!meta) {
        this.logger.warn(`Meta is null, maybe data hasn't been written in db yet.`);
        throw httpExceptionTooEarlyResp();
      }

      if (!operator) {
        throw new NotFoundException(
          `Operator with index ${operatorIndex} is not found for module with moduleId ${moduleId}`,
        );
      }

      const curatedOperator: CuratedOperator = new CuratedOperator(operator);
      const elBlockSnapshot = new ELBlockSnapshot(meta);
      return {
        data: { operator: curatedOperator, module: new SRModule(meta.keysOpIndex, stakingModule) },
        meta: {
          elBlockSnapshot,
        },
      };
    }

    throw new NotFoundException(`Modules with other types are not supported`);
  }
}
