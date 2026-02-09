
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { OIDCStrategy } from 'passport-azure-ad';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

// Helper to check if Azure AD is properly configured
function isAzureAdConfigured(configService: ConfigService): boolean {
    const clientId = configService.get('AZURE_AD_CLIENT_ID');
    // Check if it looks like a valid GUID (basic check)
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return clientId && guidRegex.test(clientId);
}

@Injectable()
export class AzureAdStrategy extends PassportStrategy(OIDCStrategy, 'azure-ad') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        const clientId = configService.get('AZURE_AD_CLIENT_ID');
        const isConfigured = isAzureAdConfigured(configService);

        // Use a placeholder GUID if not configured - strategy won't be used anyway
        const safeClientId = isConfigured ? clientId : '00000000-0000-0000-0000-000000000000';

        super({
            identityMetadata: `https://login.microsoftonline.com/${configService.get('AZURE_AD_TENANT_ID') || 'common'}/v2.0/.well-known/openid-configuration`,
            clientID: safeClientId,
            responseType: 'code id_token',
            responseMode: 'form_post',
            redirectUrl: configService.get('AZURE_AD_CALLBACK_URL') || 'http://localhost:3001/api/auth/azure/callback',
            allowHttpForRedirectUrl: true,
            clientSecret: configService.get('AZURE_AD_CLIENT_SECRET') || 'placeholder-secret',
            validateIssuer: false,
            scope: ['email', 'profile', 'openid', 'offline_access'],
            loggingLevel: 'warn',
            useCookieInsteadOfSession: false,
            cookieEncryptionKeys: [
                { 'key': '12345678901234567890123456789012', 'iv': '123456789012' },
            ],
        } as any);

        if (!isConfigured) {
            console.warn('⚠️  Azure AD SSO is not configured. Set AZURE_AD_CLIENT_ID to a valid GUID to enable.');
        }
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
