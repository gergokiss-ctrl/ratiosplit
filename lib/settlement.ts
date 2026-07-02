import { SplitType } from "@prisma/client";
import { BPS } from "./money";

export type SettlementExpense = {
  id: string;
  amountHufMinor: number;
  paidByPersonId: string;
  splitType: SplitType;
  customSplits?: { personId: string; ratioBps: number | null; amountHufMinor: number | null }[];
};

export type SettlementInput = {
  person1Id: string;
  person2Id: string;
  person1RatioBps: number;
  person2RatioBps: number;
  expenses: SettlementExpense[];
};

function splitByBps(amount: number, bps1: number) {
  const p1 = Math.round((amount * bps1) / BPS);
  return [p1, amount - p1] as const;
}

export function calculateSettlement(input: SettlementInput) {
  let paid1 = 0, paid2 = 0, owed1 = 0, owed2 = 0;

  for (const expense of input.expenses) {
    const amount = expense.amountHufMinor;
    if (expense.splitType === "EXCLUDED") continue;

    if (expense.paidByPersonId === input.person1Id) paid1 += amount;
    if (expense.paidByPersonId === input.person2Id) paid2 += amount;

    switch (expense.splitType) {
      case "MONTHLY_RATIO": {
        const [a, b] = splitByBps(amount, input.person1RatioBps);
        owed1 += a; owed2 += b;
        break;
      }
      case "EQUAL": {
        const [a, b] = splitByBps(amount, 5000);
        owed1 += a; owed2 += b;
        break;
      }
      case "PERSON_1_ONLY": owed1 += amount; break;
      case "PERSON_2_ONLY": owed2 += amount; break;
      case "CUSTOM_PERCENT": {
        const custom1 = expense.customSplits?.find(s => s.personId === input.person1Id)?.ratioBps ?? 0;
        const [a, b] = splitByBps(amount, custom1);
        owed1 += a; owed2 += b;
        break;
      }
    }
  }

  const balance1 = paid1 - owed1;
  const balance2 = paid2 - owed2;
  let settlementDirection: "PERSON_1_TO_PERSON_2" | "PERSON_2_TO_PERSON_1" | "NONE" = "NONE";
  let settlementAmount = 0;

  if (balance1 > 0) { settlementDirection = "PERSON_2_TO_PERSON_1"; settlementAmount = balance1; }
  if (balance1 < 0) { settlementDirection = "PERSON_1_TO_PERSON_2"; settlementAmount = Math.abs(balance1); }

  return { paid1, paid2, owed1, owed2, balance1, balance2, settlementDirection, settlementAmount };
}
