import { inject, injectable } from "inversify";
import { PrismaClient, FinancialStatement, Prisma } from "@prisma/client";
import { TYPES } from "../types";

@injectable()
export class FinancialStatementRepository {
  constructor(@inject(TYPES.PrismaClient) private prisma: PrismaClient) {}

  // Most recently uploaded first.
  list(): Promise<FinancialStatement[]> {
    return this.prisma.financialStatement.findMany({
      orderBy: [{ uploadedAt: "desc" }],
    });
  }

  findById(id: string): Promise<FinancialStatement | null> {
    return this.prisma.financialStatement.findUnique({ where: { id } });
  }

  create(data: Prisma.FinancialStatementUncheckedCreateInput): Promise<FinancialStatement> {
    return this.prisma.financialStatement.create({ data });
  }

  update(
    id: string,
    data: Prisma.FinancialStatementUncheckedUpdateInput,
  ): Promise<FinancialStatement> {
    return this.prisma.financialStatement.update({ where: { id }, data });
  }

  delete(id: string): Promise<FinancialStatement> {
    return this.prisma.financialStatement.delete({ where: { id } });
  }
}
