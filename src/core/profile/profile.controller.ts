import { Controller, Param, Put, Body, Req, Get, Query } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UserDto } from './user.dto';
import { Admin, Payment } from 'src/guards/auth.guard';
import { formatQueryParams } from 'src/utils/misc';

@Admin(false)
@Payment(false)
@Controller('')
export class ProfileController {
  private filterableFields = [
    'id',
    'name',
    'phoneNumber',
    'profession',
    'dateOfBirth',
    'sex',
    'interest',
    'phoneVerified',
    'active',
    'hasPayment',
    'email',
    'parentId',
    'locale',
    'startDate',
    'endDate',
  ];

  constructor(private profileService: ProfileService) {}

  @Get('user')
  async getUsers(@Query() params: any) {
    const queryParams = formatQueryParams(params, this.filterableFields);

    return await this.profileService.getUsers(queryParams);
  }

  @Get('user/search')
  async searchUser(@Query() params: any) {
    return await this.profileService.searchUser(params.term);
  }

  @Admin()
  @Get('user/count')
  async getUserCount(@Query() params: any) {
    const queryParams = formatQueryParams(params, this.filterableFields);

    return await this.profileService.getUserCount(queryParams);
  }

  @Get('profile/:id')
  async getProfile(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getProfile(req.user, id);
  }

  @Get('profile/:id/referral/count')
  async getReferralsCount(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getReferralsCount(req.user, id);
  }

  @Get('profile/:id/referral/revenue')
  async getReferralRevenue(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getReferralRevenue(req.user, id);
  }

  @Get('profile/:id/referral/balance')
  async getReferralBalance(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getReferralBalance(req.user, id);
  }

  @Get('profile/:id/referral/tree')
  async getReferralTree(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getReferralTree(req.user, id);
  }

  @Get('profile/:id/referral/child')
  async getFirstChild(@Param('id') id: string, @Req() req: any) {
    return await this.profileService.getFirstChild(req.user, id);
  }

  @Put('profile/:id')
  async updateProfile(
    @Body() data: UserDto,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return await this.profileService.updateProfile(data, req.user, id);
  }
}
