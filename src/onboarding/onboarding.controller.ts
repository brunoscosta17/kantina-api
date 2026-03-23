import { Controller, Post, Body } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Post('tenant')
  async createTenant(
    @Body() body: { name: string; adminEmail: string; adminPassword: string },
  ) {
    return this.onboarding.createTenant(body);
  }
}
