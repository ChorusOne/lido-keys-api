import { Controller, Get, Version, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { SRModuleOperatorsKeysResponse } from './entities';
import { ModuleId, KeyQuery } from 'http/common/response-entities';
import { SRModulesOperatorsKeysService } from './sr-modules-operators-keys.service';

@Controller('/modules')
@ApiTags('operators-keys')
export class SRModulesOperatorsKeysController {
  constructor(protected readonly srModulesOperatorsKeys: SRModulesOperatorsKeysService) {}

  @Version('1')
  @ApiOperation({ summary: 'Staking router module operators.' })
  @ApiResponse({
    status: 200,
    description: 'List of all SR module operators',
    type: SRModuleOperatorsKeysResponse,
  })
  @ApiParam({
    name: 'module_id',
    description: 'Staking router module_id or contract address.',
  })
  @Get(':module_id/operators/keys')
  getOperatorsKeys(@Param('module_id') moduleId: ModuleId, @Query() filters: KeyQuery) {
    return this.srModulesOperatorsKeys.get(moduleId, filters);
  }
}
