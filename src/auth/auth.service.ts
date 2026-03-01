import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async register(registerDto: RegisterDto) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.auth.signUp({
            email: registerDto.email,
            password: registerDto.password,
            options: {
                data: {
                    name: registerDto.name,
                }
            }
        });

        if (error) {
            throw new UnauthorizedException(error.message);
        }
        return data;
    }

    async login(loginDto: LoginDto) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.auth.signInWithPassword({
            email: loginDto.email,
            password: loginDto.password,
        });

        if (error) {
            throw new UnauthorizedException(error.message);
        }
        return data;
    }
}
