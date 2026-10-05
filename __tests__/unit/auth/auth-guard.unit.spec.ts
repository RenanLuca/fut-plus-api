import { mock } from "vitest-mock-extended";
import type { IUsersRepository } from "@src/shared/database/interfaces/users.repository.interface";
import type { JwtService } from "@nestjs/jwt";
import type { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { describe, it, expect, beforeEach } from "vitest";
import { AuthGuard } from "@src/modules/auth/auth.guard";
import { randomUUID } from "crypto";

const usersRepoMock = mock<IUsersRepository>();
const jwtServiceMock = mock<JwtService>();
const reflectorMock = mock<Reflector>();

function makeContext(headers: Record<string, string> = {}) {
  const request: { headers: Record<string, string>; userId?: string } = {
    headers,
  };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

const issuedAt = Math.floor(Date.now() / 1000);

let sut: AuthGuard;
beforeEach(() => {
  sut = new AuthGuard(jwtServiceMock, reflectorMock, usersRepoMock);
  reflectorMock.getAllAndOverride.mockReturnValue(false);
  jwtServiceMock.verifyAsync.mockResolvedValue({
    sub: "user-id",
    iat: issuedAt,
  });
  usersRepoMock.findPasswordChangedAtById.mockResolvedValue({
    passwordChangedAt: null,
  });
});

describe("AuthGuard", () => {
  it("should let public routes through without checking the token", async () => {
    reflectorMock.getAllAndOverride.mockReturnValueOnce(true);
    const { context } = makeContext();

    await expect(sut.canActivate(context)).resolves.toBe(true);
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  it("should reject a request without an Authorization header", async () => {
    const { context } = makeContext();

    await expect(sut.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should reject a non-Bearer authorization scheme", async () => {
    const { context } = makeContext({
      authorization: "Basic abc123",
    });

    await expect(sut.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should reject a token that fails verification", async () => {
    jwtServiceMock.verifyAsync.mockRejectedValueOnce(
      new Error("invalid signature"),
    );
    const { context } = makeContext({
      authorization: "Bearer bad-token",
    });

    await expect(sut.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should reject a token whose user no longer exists", async () => {
    usersRepoMock.findPasswordChangedAtById.mockResolvedValueOnce(
      null,
    );
    const { context } = makeContext({
      authorization: "Bearer valid-token",
    });

    await expect(sut.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should reject a token issued before the last password change", async () => {
    const passwordChangedAt = new Date((issuedAt + 60) * 1000);
    usersRepoMock.findPasswordChangedAtById.mockResolvedValueOnce({
      passwordChangedAt,
    });
    const { context } = makeContext({
      authorization: "Bearer old-token",
    });

    await expect(sut.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should accept a token issued after the last password change and expose the user id", async () => {
    const passwordChangedAt = new Date((issuedAt - 60) * 1000);
    usersRepoMock.findPasswordChangedAtById.mockResolvedValueOnce({
      passwordChangedAt,
    });
    const userId = randomUUID();
    jwtServiceMock.verifyAsync.mockResolvedValueOnce({
      sub: userId,
      iat: issuedAt,
    });
    const { context, request } = makeContext({
      authorization: "Bearer fresh-token",
    });

    await expect(sut.canActivate(context)).resolves.toBe(true);
    expect(request.userId).toBe(userId);
  });

  it("should accept a token when the user never changed their password", async () => {
    const { context, request } = makeContext({
      authorization: "Bearer valid-token",
    });

    await expect(sut.canActivate(context)).resolves.toBe(true);
    expect(request.userId).toBe("user-id");
  });
});
