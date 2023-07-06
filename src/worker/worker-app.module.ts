import { Module } from '@nestjs/common';
import { PrometheusModule } from 'common/prometheus';
import { ConfigModule, ConfigService } from 'common/config';
import { HealthModule } from 'common/health';
import { ExecutionProviderModule } from 'common/execution-provider';
import { ConsensusProviderModule } from 'common/consensus-provider';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JobsModule } from 'jobs';
import { ScheduleModule } from '@nestjs/schedule';
import config from 'mikro-orm.config';
import { StakingRouterModule } from 'staking-router-modules';
import { ValidatorsModule } from 'validators';
import { LoggerModule } from '@lido-nestjs/logger';

@Module({
  imports: [
    HealthModule,
    PrometheusModule,
    LoggerModule,
    ConfigModule,
    ExecutionProviderModule,
    ConsensusProviderModule,
    MikroOrmModule.forRootAsync({
      async useFactory(configService: ConfigService) {
        return {
          ...config,
          dbName: configService.get('DB_NAME'),
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          user: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          autoLoadEntities: false,
          cache: { enabled: false },
          debug: false,
          registerRequestContext: true,
          allowGlobalContext: false,
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    StakingRouterModule,
    ValidatorsModule,
    JobsModule,
  ],
  providers: [],
})
export class WorkerAppModule {}
