import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FirebaseAdminService } from './firebase.service';

@UseGuards(JwtAuthGuard)
@Controller('firebase')
export class FirebaseController {
  constructor(private readonly fb: FirebaseAdminService) {}

  /**
   * Returns a Firebase custom token for the currently authenticated user.
   * Client (Firebase JS) will call signInWithCustomToken(token) and then can upload to Storage.
   */
  @Post('custom-token')
  async createCustomToken(@Req() req: any) {
    // Your JwtStrategy returns { userId, email } – use userId as Firebase UID
    const uid = String(req.user.userId);
    const claims = {
      // optional custom claims you might want:
      // handle: req.user.handle,
    };
    const token = await this.fb.auth.createCustomToken(uid, claims);
    return { token };
  }
}
