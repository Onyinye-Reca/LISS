import { inject, injectable } from "inversify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { RegisterInput, LoginInput, MemberView } from "@liss11/shared";
import { TYPES } from "../types";
import { MemberRepository } from "../repositories/member.repository";
import type { EmailService } from "./email.service";

const BCRYPT_COST = 12; // PRD 7.2
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24h, PRD 3.3

export class AuthError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.MemberRepository) private members: MemberRepository,
    @inject(TYPES.EmailService) private email: EmailService,
  ) {}

  private toView(m: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    verified: boolean;
  }): MemberView {
    return {
      id: m.id,
      fullName: m.fullName,
      email: m.email,
      role: m.role,
      verified: m.verified,
    };
  }

  private sign(memberId: string, role: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");
    return jwt.sign({ sub: memberId, role }, secret, {
      expiresIn: TOKEN_TTL_SECONDS,
    });
  }

  async register(input: RegisterInput): Promise<MemberView> {
    const existing = await this.members.findByEmail(input.email);
    if (existing) throw new AuthError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const member = await this.members.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
    });

    const verifyToken = randomBytes(32).toString("hex");
    await this.email.sendVerification(member.email, verifyToken);

    return this.toView(member);
  }

  async login(input: LoginInput): Promise<{ token: string; member: MemberView }> {
    const member = await this.members.findByEmail(input.email);
    if (!member) throw new AuthError("Invalid credentials", 401);

    const ok = await bcrypt.compare(input.password, member.passwordHash);
    if (!ok) throw new AuthError("Invalid credentials", 401);

    const token = this.sign(member.id, member.role);
    return { token, member: this.toView(member) };
  }

  async getMember(id: string): Promise<MemberView | null> {
    const member = await this.members.findById(id);
    return member ? this.toView(member) : null;
  }

  get tokenTtlMs(): number {
    return TOKEN_TTL_SECONDS * 1000;
  }
}
