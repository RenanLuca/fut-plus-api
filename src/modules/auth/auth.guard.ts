import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from "@src/shared/decorators/IsPublic";
import { UsersRepository } from "@src/shared/database/repositories/users.repository";
import { Request } from "express";

type AccessTokenPayload = {
  sub: string;
  iat: number;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly usersRepository: UsersRepository,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: AccessTokenPayload;
    try {
      payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(
          token,
        );
    } catch {
      throw new UnauthorizedException();
    }

    await this.rejectIfIssuedBeforePasswordChange(payload);
    request.userId = payload.sub;
    return true;
  }

  /**
   * A JWT can't be revoked, so after a password change the old ones would
   * stay valid until they expire. Comparing the token's `iat` (issued-at,
   * in seconds) with `passwordChangedAt` invalidates every session that
   * started before the change. Also rejects tokens of deleted users.
   */
  private async rejectIfIssuedBeforePasswordChange({
    sub,
    iat,
  }: AccessTokenPayload) {
    const user = await this.usersRepository.findUnique({
      where: { id: sub },
      select: { passwordChangedAt: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    if (
      user.passwordChangedAt &&
      iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(
    request: Request,
  ): string | undefined {
    const [type, token] =
      request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
