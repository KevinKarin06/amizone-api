import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import {
  LoginDto,
  RegisterDto,
  ResendDto,
  ResetDto,
  VerifyDto,
} from './authentication.dto';
import { Public } from 'src/guards/auth.guard';

@Public()
@Controller('auth')
export class AuthenticationController {
  constructor(private authService: AuthenticationService) {}

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return await this.authService.register(data);
  }

  @Post('verify')
  async verifyOtpCode(@Body() data: VerifyDto) {
    return await this.authService.verifyOtp(data);
  }

  @Post('resend')
  async resendOtpCode(@Body() data: ResendDto) {
    return await this.authService.resendOtp(data);
  }

  @Post('forgot')
  async forgotPassword(@Body() data: ResendDto) {
    return await this.authService.resendOtp(data);
  }

  @Post('login')
  async login(@Body() data: LoginDto) {
    return await this.authService.login(data);
  }

  @Public(false)
  @Post('reset')
  async reset(@Body() data: ResetDto, @Req() req: any) {
    return await this.authService.resetPassword(data, req.user);
  }
}
