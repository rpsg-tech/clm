/**
 * Auth Module
 * 
 * Handles authentication with JWT and organization context.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { RolesController, PermissionsController } from './roles.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        UsersModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');
                if (!secret) {
                    throw new Error('JWT_SECRET must be defined in environment variables');
                }
                return {
                    secret,
                    signOptions: {
                        expiresIn: configService.get<any>('JWT_EXPIRES_IN', '15m'),
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController, RolesController, PermissionsController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
