import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TestsController } from './tests.controller';

@Module({
  controllers: [TestsController],
  providers: [PrismaService],
})
export class TestsModule {}
