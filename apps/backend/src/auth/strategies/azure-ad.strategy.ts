
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { OIDCStrategy } from 'passport-azure-ad';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class AzureAdStrategy extends PassportStrategy(OIDCStrategy, 'azure-ad') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            identityMetadata: `https://login.microsoftonline.com/${configService.get('AZURE_AD_TENANT_ID')}/v2.0/.well-known/openid-configuration`,
            clientID: configService.get('AZURE_AD_CLIENT_ID'),
            responseType: 'code id_token',
            responseMode: 'form_post',
            redirectUrl: configService.get('AZURE_AD_CALLBACK_URL') || 'http://localhost:3000/api/auth/azure/callback',
            allowHttpForRedirectUrl: true,
            clientSecret: configService.get('AZURE_AD_CLIENT_SECRET'),
            validateIssuer: false, // Set to true in production if strictly single tenant
            // passReqToCallback: false, // Default is false, explicit false causes type overlap with WithRequest interface
            scope: ['email', 'profile', 'openid', 'offline_access'],
            loggingLevel: 'info',
            useCookieInsteadOfSession: false,
            cookieEncryptionKeys: [
                { 'key': '12345678901234567890123456789012', 'iv': '123456789012' },
            ],
        } as any);
    }

    async validate(profile: any): Promise<any> {
        if (!profile) {
            throw new UnauthorizedException('No profile received from Azure AD');
        }

        const email = profile.upn || profile.unique_name || (profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null);

        if (!email) {
            throw new UnauthorizedException('No email found in Azure AD profile');
        }

        const user = await this.authService.validateUserFromProvider({
            email,
            name: profile.displayName || email.split('@')[0],
            provider: 'azure-ad',
            providerId: profile.oid,
        });

        return user;
    }
}
