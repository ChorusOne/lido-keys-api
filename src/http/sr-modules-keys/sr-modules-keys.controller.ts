import { Controller, Get, Version, Param, Query, Body, Post, NotFoundException, HttpStatus, Res } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SRModuleKeyListResponse, GroupedByModuleKeyListResponse } from './entities';
import { SRModulesKeysService } from './sr-modules-keys.service';
import { ModuleId, KeyQuery } from '../common/entities/';
import { KeysFindBody } from '../common/entities/pubkeys';
import { TooEarlyResponse } from '../common/entities/http-exceptions';
import { IsolationLevel } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/knex';
import * as JSONStream from 'jsonstream';
import type { FastifyReply } from 'fastify';

@Controller('modules')
@ApiTags('sr-module-keys')
export class SRModulesKeysController {
  constructor(
    protected readonly srModulesKeysService: SRModulesKeysService,
    protected readonly entityManager: EntityManager,
  ) {}

  @Version('1')
  @ApiOperation({ summary: 'Get keys for all modules grouped by staking router module.' })
  @ApiResponse({
    status: 200,
    description: 'Keys for all modules grouped by staking router module.',
    type: GroupedByModuleKeyListResponse,
  })
  @ApiResponse({
    status: 425,
    description: "Meta is null, maybe data hasn't been written in db yet",
    type: TooEarlyResponse,
  })
  @Get('keys')
  async getGroupedByModuleKeys(@Query() filters: KeyQuery, @Res() reply?: FastifyReply) {
    await this.entityManager.transactional(
      async () => {
        const { keysGeneratorsByModules, meta } = await this.srModulesKeysService.getGroupedByModuleKeys(filters);

        const jsonStream = JSONStream.stringify('{ "meta": ' + JSON.stringify(meta) + ', "data": [', ',', ']}');

        reply && reply.type('application/json').send(jsonStream);

        for (const { keysGenerator, module } of keysGeneratorsByModules) {
          // TODO: does memory consumption is increase ?
          const keysData = { module, keys: [] as any[] };

          for await (const keysBatch of keysGenerator) {
            keysData.keys.push(keysBatch);
          }

          jsonStream.write(keysData);
        }

        jsonStream.end();
      },
      { isolationLevel: IsolationLevel.REPEATABLE_READ },
    );
  }

  @Version('1')
  @ApiOperation({ summary: 'Staking router module keys.' })
  @ApiResponse({
    status: 200,
    description: 'List of all modules supported in API',
    type: SRModuleKeyListResponse,
  })
  @ApiResponse({
    status: 425,
    description: "Meta is null, maybe data hasn't been written in db yet",
    type: TooEarlyResponse,
  })
  @ApiNotFoundResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provided module is not supported',
    type: NotFoundException,
  })
  @ApiParam({
    name: 'module_id',
    description: 'Staking router module_id or contract address.',
  })
  @Get(':module_id/keys')
  async getModuleKeys(@Param('module_id') moduleId: ModuleId, @Query() filters: KeyQuery, @Res() reply?: FastifyReply) {
    await this.entityManager.transactional(
      async () => {
        const { keysGenerator, module, meta } = await this.srModulesKeysService.getModuleKeys(moduleId, filters);
        const jsonStream = JSONStream.stringify(
          '{ "meta": ' + JSON.stringify(meta) + ', "data": { "module": ' + JSON.stringify(module) + ', "keys": [',
          ',',
          ']}}',
        );

        reply && reply.type('application/json').send(jsonStream);

        for await (const keysBatch of keysGenerator) {
          jsonStream.write(keysBatch);
        }

        jsonStream.end();
      },
      { isolationLevel: IsolationLevel.REPEATABLE_READ },
    );
  }

  @Version('1')
  @Post(':module_id/keys/find')
  @ApiOperation({ summary: 'Get list of found staking router module keys in db from pubkey list.' })
  @ApiResponse({
    status: 200,
    description: 'Staking Router module keys.',
    type: SRModuleKeyListResponse,
  })
  @ApiResponse({
    status: 425,
    description: "Meta is null, maybe data hasn't been written in db yet",
    type: TooEarlyResponse,
  })
  @ApiNotFoundResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provided module is not supported',
    type: NotFoundException,
  })
  @ApiParam({
    name: 'module_id',
    description: 'Staking router module_id or contract address.',
  })
  getModuleKeysByPubkeys(@Param('module_id') moduleId: ModuleId, @Body() keys: KeysFindBody) {
    return this.srModulesKeysService.getModuleKeysByPubKeys(moduleId, keys.pubkeys);
  }
}
