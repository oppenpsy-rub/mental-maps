import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Researcher } from '../models/Researcher';
import { ResearcherRepository } from '../repositories/ResearcherRepository';
import { ApiError, AuthenticationError } from '../types/errors';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResult {
    researcher: Researcher;
    accessToken: string;
    refreshToken: string;
}

export interface TokenPayload {
    researcherId: string;
    email: string;
    type: 'access' | 'refresh';
    iat?: number;
    exp?: number;
}

export class AuthService {
    private researcherRepository: ResearcherRepository;
    private jwtSecret: string;
    private jwtExpiresIn: string;
    private refreshTokenExpiresIn: string;

    constructor() {
        this.researcherRepository = new ResearcherRepository();
        this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

        if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET must be set in production environment');
        }
    }

    async authenticateResearcher(credentials: LoginCredentials): Promise<AuthResult> {
        const { email, password } = credentials;

        // Find researcher by email
        const researcher = await this.researcherRepository.findByEmail(email);
        if (!researcher) {
            throw new AuthenticationError('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, researcher.passwordHash);
        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid email or password');
        }

        // Generate tokens
        const accessToken = this.generateAccessToken(researcher);
        const refreshToken = this.generateRefreshToken(researcher);

        return {
            researcher,
            accessToken,
            refreshToken
        };
    }

    async refreshToken(refreshToken: string): Promise<AuthResult> {
        try {
            const payload = this.validateToken(refreshToken) as TokenPayload;

            if (payload.type !== 'refresh') {
                throw new AuthenticationError('Invalid token type');
            }

            // Find researcher
            const researcher = await this.researcherRepository.findById(payload.researcherId);
            if (!researcher) {
                throw new AuthenticationError('Researcher not found');
            }

            // Generate new tokens
            const newAccessToken = this.generateAccessToken(researcher);
            const newRefreshToken = this.generateRefreshToken(researcher);

            return {
                researcher,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthenticationError('Invalid refresh token');
            }
            throw error;
        }
    }

    generateAccessToken(researcher: Researcher): string {
        const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
            researcherId: researcher.id,
            email: researcher.email,
            type: 'access'
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn,
            issuer: 'mental-maps-app',
            audience: 'mental-maps-researchers'
        } as jwt.SignOptions);
    }

    generateRefreshToken(researcher: Researcher): string {
        const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
            researcherId: researcher.id,
            email: researcher.email,
            type: 'refresh'
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.refreshTokenExpiresIn,
            issuer: 'mental-maps-app',
            audience: 'mental-maps-researchers'
        } as jwt.SignOptions);
    }

    validateToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, this.jwtSecret, {
                issuer: 'mental-maps-app',
                audience: 'mental-maps-researchers'
            } as jwt.VerifyOptions) as TokenPayload;
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthenticationError('Invalid token');
            }
            throw error;
        }
    }

    async hashPassword(password: string): Promise<string> {
        const saltRounds = 12;
        return bcrypt.hash(password, saltRounds);
    }

    async validatePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    extractTokenFromHeader(authHeader: string | undefined): string | null {
        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }
}