import { Controller, Param, Put, Body, Req, Get } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UserDto } from './user.dto';
import { Admin, Payment } from 'src/guards/auth.guard';

@Admin(false)
@Payment(false)
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get(':id')
  async getProfile(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getProfile(req.user, id);
  }

  @Get(':id/referral/count')
  async getReferralsCount(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getReferralsCount(req.user, id);
  }

  @Get(':id/referral/revenue')
  async getReferralRevenue(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getReferralRevenue(req.user, id);
  }

  @Get(':id/referral/balance')
  async getReferralBalance(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getReferralRevenue(req.user, id);
  }

  @Get(':id/referral/tree')
  async getReferralTree(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getReferralTree(req.user, id);
  }

  @Put(':id')
  async updateProfile(
    @Body() data: UserDto,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return await this.profileService.updateProfile(data, req.user, id);
  }
}
