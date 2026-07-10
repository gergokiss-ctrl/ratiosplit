"use client";

import { useEffect, useMemo, useState } from "react";

type AnyRecord = Record<string, any>;

type BackupPayload = {
  people?: AnyRecord[];
  months?: AnyRecord[];
  monthlyIncomes?: AnyRecord[];
  expenses?: AnyRecord[];
};

type MonthOverview = {
  key: string;
  incomeTotal: number;
  personIncomes: { id: string; name: string; amount: number }[];
  trackedExpenses: number;
  excludedExpenses: number;
  expenseCount: number;
  ratioText: string;
  status: string;
  locked: boolean;
  settled: boolean;
};

function money(minor: number) {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long" }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}

function monthKeyFromDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function explicitMonthKey(value: AnyRecord | undefined) {
  if (!value) return null;
  const direct = value.monthKey ?? value.yearMonth ?? value.key ?? value.month;
  if (typeof direct === "string" && /^\d{4}-\d{2}$/.test(direct)) return direct;
  if (typeof value.year === "number" && typeof value.monthNumber === "number") {
    return `${value.year}-${String(value.monthNumber).padStart(2, "0")}`;
  }
  return null;
}

function minorAmount(value: AnyRecord) {
  const direct = value.amountHufMinor ?? value.amountMinor ?? value.amount ?? 0;
  const number = Number(direct);
  return Number.isFinite(number) ? number : 0;
}

function isIncludedIncome(value: AnyRecord) {
  return value.isIncluded !== false && value.included !== false;
}

function monthStatus(month: AnyRecord | undefined) {
  if (!month) return { status: "Open", locked: false, settled: false };
  const locked = Boolean(month.isLocked ?? month.lockedAt ?? month.status === "LOCKED");
  const settled = Boolean(month.isSettled ?? month.settledAt ?? month.status === "SETTLED");
  return {
    status: locked && settled ? "Settled / Locked" : locked ? "Locked" : settled ? "Settled" : "Open",
    locked,
    settled,
  };
}

export default function MonthsOverviewPage() {
  const [payload, setPayload] = useState<BackupPayload | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/backup/json", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load monthly data.");
      const raw = await response.json();
      const source = raw?.data ?? raw?.backup?.data ?? raw?.backup ?? raw;
      setPayload({
        people: Array.isArray(source?.people) ? source.people : [],
        months: Array.isArray(source?.months) ? source.months : [],
        monthlyIncomes: Array.isArray(source?.monthlyIncomes)
          ? source.monthlyIncomes
          : Array.isArray(source?.incomes)
            ? source.incomes
            : [],
        expenses: Array.isArray(source?.expenses) ? source.expenses : [],
      });
    } catch (error: any) {
      setMessage(error?.message ?? "Could not load monthly data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const overview = useMemo<MonthOverview[]>(() => {
    if (!payload) return [];

    const people = payload.people ?? [];
    const months = payload.months ?? [];
    const incomes = payload.monthlyIncomes ?? [];
    const expenses = payload.expenses ?? [];
    const monthById = new Map(months.map((month) => [String(month.id), month]));
    const keys = new Set<string>();

    for (const month of months) {
      const key = explicitMonthKey(month);
      if (key) keys.add(key);
    }
    for (const expense of expenses) {
      const linked = monthById.get(String(expense.monthId ?? ""));
      const key = explicitMonthKey(linked) ?? explicitMonthKey(expense) ?? monthKeyFromDate(expense.date);
      if (key) keys.add(key);
    }
    for (const income of incomes) {
      const linked = monthById.get(String(income.monthId ?? ""));
      const key = explicitMonthKey(linked) ?? explicitMonthKey(income);
      if (key) keys.add(key);
    }

    return [...keys]
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const month = months.find((item) => explicitMonthKey(item) === key);
        const monthId = month?.id != null ? String(month.id) : null;
        const monthIncomes = incomes.filter((income) => {
          if (monthId && String(income.monthId ?? "") === monthId) return true;
          return explicitMonthKey(income) === key;
        });
        const monthExpenses = expenses.filter((expense) => {
          if (monthId && String(expense.monthId ?? "") === monthId) return true;
          return explicitMonthKey(expense) === key || monthKeyFromDate(expense.date) === key;
        });

        const personIncomes = people.map((person) => {
          const amount = monthIncomes
            .filter((income) => String(income.personId ?? income.person?.id ?? "") === String(person.id))
            .filter(isIncludedIncome)
            .reduce((sum, income) => sum + minorAmount(income), 0);
          return { id: String(person.id), name: String(person.name ?? "Person"), amount };
        });
        const incomeTotal = personIncomes.reduce((sum, person) => sum + person.amount, 0);
        const trackedExpenses = monthExpenses
          .filter((expense) => expense.splitType !== "EXCLUDED" && !expense.deletedAt)
          .reduce((sum, expense) => sum + minorAmount(expense), 0);
        const excludedExpenses = monthExpenses
          .filter((expense) => expense.splitType === "EXCLUDED" && !expense.deletedAt)
          .reduce((sum, expense) => sum + minorAmount(expense), 0);
        const ratioText = personIncomes.length
          ? personIncomes
              .map((person) => `${person.name} ${incomeTotal > 0 ? ((person.amount / incomeTotal) * 100).toFixed(1) : "0.0"}%`)
              .join(" / ")
          : "No income data";
        const status = monthStatus(month);

        return {
          key,
          incomeTotal,
          personIncomes,
          trackedExpenses,
          excludedExpenses,
          expenseCount: monthExpenses.filter((expense) => !expense.deletedAt).length,
          ratioText,
          ...status,
        };
      });
  }, [payload]);

  return (
    <main className="shell">
      <header className="header">
        <div className="logo">
          <div className="logo-mark" />
          <div>
            <h1 className="h-title">Monthly overview</h1>
            <p className="h-sub">Historical income, expense and month status summary</p>
          </div>
        </div>
        <div className="action-row">
          <a className="btn secondary" href="/">Back to RatioSplit</a>
          <button className="btn secondary" onClick={load}>Refresh</button>
        </div>
      </header>

      {message && <div className="notice" style={{ marginTop: 14 }}>{message}</div>}

      <section className="card" style={{ marginTop: 16 }}>
        <div className="toolbar">
          <div>
            <h2 className="panel-title">Months</h2>
            <div className="muted">{loading ? "Loading..." : `${overview.length} month(s) found`}</div>
          </div>
          <a className="btn secondary" href="/backup">Backup dashboard</a>
        </div>

        <div className="expense-list">
          {overview.map((month) => (
            <article className="expense-item" key={month.key} style={{ cursor: "default" }}>
              <div className="expense-item-header">
                <div>
                  <div className="expense-title">{monthLabel(month.key)}</div>
                  <div className="expense-meta">{month.key} · {month.status}</div>
                </div>
                <div className="action-row">
                  <a className="btn secondary small" href={`/api/export/${month.key}`}>Export CSV</a>
                </div>
              </div>

              <div className="review-grid" style={{ marginTop: 12 }}>
                <div className="summary-card">
                  <h3>Income</h3>
                  <div className="summary-row"><span>Total</span><strong>{money(month.incomeTotal)}</strong></div>
                  {month.personIncomes.map((person) => (
                    <div className="summary-row" key={person.id}><span>{person.name}</span><strong>{money(person.amount)}</strong></div>
                  ))}
                  <div className="muted" style={{ marginTop: 8 }}>{month.ratioText}</div>
                </div>

                <div className="summary-card">
                  <h3>Expenses</h3>
                  <div className="summary-row"><span>Tracked</span><strong>{money(month.trackedExpenses)}</strong></div>
                  <div className="summary-row"><span>Excluded</span><strong>{money(month.excludedExpenses)}</strong></div>
                  <div className="summary-row"><span>Entries</span><strong>{month.expenseCount}</strong></div>
                </div>

                <div className="summary-card">
                  <h3>Status</h3>
                  <div className="summary-row"><span>Settled</span><strong>{month.settled ? "Yes" : "No"}</strong></div>
                  <div className="summary-row"><span>Locked</span><strong>{month.locked ? "Yes" : "No"}</strong></div>
                  <div className="muted" style={{ marginTop: 8 }}>Open the month on the main page for the full Review and settlement calculation.</div>
                </div>
              </div>
            </article>
          ))}
          {!loading && !overview.length && <div className="muted">No monthly data found yet.</div>}
        </div>
      </section>
    </main>
  );
}

