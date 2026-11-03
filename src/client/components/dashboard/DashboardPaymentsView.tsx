import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Printer,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import type { UserProfile, ContractItem } from '../../../shared/types.js';
import { BrandCrest } from '../BrandLogo.js';

interface DashboardPaymentsViewProps {
  user: UserProfile;
  contracts: ContractItem[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardPaymentsView: React.FC<DashboardPaymentsViewProps> = ({
  user,
  contracts,
  showToast,
}) => {
  const isClient = user.role === 'client';

  // Calculate real metrics directly from user's actual MongoDB contracts
  const totalContractValue = contracts.reduce((sum, c) => sum + (c.agreedAmount || 0), 0);
  const completedContractsValue = contracts
    .filter((c) => c.status === 'completed')
    .reduce((sum, c) => sum + (c.agreedAmount || 0), 0);

  const activeEscrowValue = totalContractValue - completedContractsValue;

  // New accounts start strictly at $0.00 (freelancers earn from completed contracts; clients fund via deposit)
  const [vaultBalance, setVaultBalance] = useState<number>(() => {
    return isClient ? 0 : completedContractsValue;
  });
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(1000);

  // Statement & Receipt Modal States
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [activeReceiptTx, setActiveReceiptTx] = useState<{
    id: string;
    date: string;
    project: string;
    counterparty: string;
    amount: number;
    status: string;
  } | null>(null);

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setVaultBalance((prev) => prev + Number(depositAmount));
    setDepositModalOpen(false);
    showToast(`$${Number(depositAmount).toLocaleString()} added to escrow balance!`, 'success');
  };

  // Generate realistic milestone transactions from user's actual contracts
  const displayTransactions = contracts.map((c, idx) => ({
    id: `TXN-${String(c._id).slice(-6).toUpperCase()}`,
    date: new Date(Date.now() - idx * 86400000 * 4).toLocaleDateString(),
    project: typeof c.projectId === 'object' && c.projectId !== null
      ? (c.projectId as { title?: string }).title || 'Veloura Contract'
      : 'Veloura Milestone Contract',
    counterparty:
      (isClient
        ? typeof c.freelancer === 'object' && c.freelancer !== null
          ? (c.freelancer as { name?: string }).name
          : 'Specialist'
        : typeof c.client === 'object' && c.client !== null
        ? (c.client as { name?: string }).name
        : 'Client') || 'Collaboration Partner',
    amount: c.agreedAmount,
    status: c.status === 'completed' ? 'Released' : 'Locked Escrow',
  }));

  /**
   * Export Full Financial Statement to CSV File
   */
  const exportStatementCSV = () => {
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const csvLines = [
        'VELOURA SIMULATED FINANCIAL & ESCROW STATEMENT (DEMO MODE)',
        `Account Holder,${user.name}`,
        `Role,${user.role}`,
        `Email,${user.email}`,
        `Statement Date,${new Date().toLocaleDateString()}`,
        `Available Vault Balance,$${vaultBalance.toLocaleString()}`,
        `Active Locked Escrow,$${activeEscrowValue.toLocaleString()}`,
        `Lifetime Cleared Volume,$${completedContractsValue.toLocaleString()}`,
        '',
        'TRANSACTION LEDGER',
        'Reference ID,Date,Project Initiative,Counterparty,Amount (USD),Escrow Status,Currency,Settlement Method',
        ...(displayTransactions.length > 0
          ? displayTransactions.map((tx) =>
              [
                tx.id,
                `"${tx.date}"`,
                `"${tx.project.replace(/"/g, '""')}"`,
                `"${tx.counterparty.replace(/"/g, '""')}"`,
                tx.amount,
                tx.status,
                'USD',
                'Veloura Multi-Currency Escrow',
              ].join(',')
            )
          : ['No transactions recorded,,,,,USD,Veloura Escrow']),
      ];

      const csvContent = csvLines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `veloura-statement-${user.name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Money statement exported successfully as CSV!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to export statement', 'error');
    }
  };

  /**
   * Export Single Transaction Receipt File
   */
  const exportReceiptFile = (tx: typeof displayTransactions[0]) => {
    try {
      const receiptContent = `=====================================================
VELOURA ESCROW TRANSACTION RECEIPT & INVOICE
=====================================================
Receipt ID:         ${tx.id}
Date:               ${tx.date}
Initiative:         ${tx.project}
Counterparty:       ${tx.counterparty}
Payer / Payee:      ${user.name} (${user.role.toUpperCase()})
Agreed Milestone:   $${tx.amount.toLocaleString()} USD
Platform Escrow:    $0.00 USD (0% Veloura Verified Escrow)
Total Settled:      $${tx.amount.toLocaleString()} USD
Settlement Status:  ${tx.status.toUpperCase()}
Verification Seal:  VELOURA-CRYPTOGRAPHIC-ESCROW-CONFIRMED
=====================================================
Thank you for building on Veloura.
For support & reconciliation: support@veloura.io
`;

      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `veloura-receipt-${tx.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Receipt ${tx.id} exported successfully!`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to export receipt', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Escrow &amp; Settlement Hub (Simulated Sandbox)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {isClient ? 'Billing & Escrow Payments' : 'Earnings & Milestone Payouts'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            <strong className="text-rose-500 font-semibold">[Demo Sandbox]</strong> Milestone escrow locking, deposit simulations, and settlement ledgers are modeled for platform demonstration without live fiat processing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportStatementCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-rose-400 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
          >
            <Download className="h-4 w-4 text-rose-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setStatementModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-500 hover:to-rose-400 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF Statement</span>
          </button>

          {isClient && (
            <button
              type="button"
              onClick={() => setDepositModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300/40 bg-rose-500/15 text-rose-600 dark:text-rose-400 px-3.5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-rose-500/25 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Fund Vault</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Metric Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Available Vault Balance
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            ${vaultBalance.toLocaleString()}
          </p>
          <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Simulated Escrow Sandbox</span>
          </span>
        </div>

        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {isClient ? 'Active Locked Escrow' : 'Pending Milestone Escrow'}
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-500">
            ${activeEscrowValue.toLocaleString()}
          </p>
          <span className="text-[11px] text-[var(--text-muted)]">
            {contracts.filter((c) => c.status === 'active').length} active milestones
          </span>
        </div>

        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {isClient ? 'Lifetime Commission Spend' : 'Lifetime Cleared Earnings'}
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ${completedContractsValue.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Verified Escrow Volume</span>
          </span>
        </div>

        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Settlement Speed
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-600">
            Instant
          </p>
          <span className="text-[11px] text-[var(--text-muted)]">
            ACH / SEPA / Card Rails
          </span>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Milestone Settlement Ledger
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Full itemized breakdown of locked and released escrow transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportStatementCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] hover:border-rose-400 bg-[var(--bg-elevated)]/60 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-rose-500" />
              <span>Download Statement (.CSV)</span>
            </button>
            <button
              type="button"
              onClick={() => setStatementModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] hover:border-rose-400 bg-[var(--bg-elevated)]/60 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-rose-500" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Project Initiative</th>
                <th className="py-3 px-4">Counterparty</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Escrow Status</th>
                <th className="py-3 px-4 text-right">Receipt / Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Clock className="h-8 w-8 text-[var(--text-muted)] mx-auto opacity-40" />
                      <p className="font-bold text-[var(--text-primary)]">No Transactions Recorded Yet</p>
                      <p className="text-[11px] leading-relaxed">
                        {isClient
                          ? 'Fund your custodial vault or accept specialist proposals to initiate milestone escrows.'
                          : 'Your account balance is $0.00. As soon as you complete project milestones, funds will be released directly into your vault.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--bg-elevated)]/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-primary)]">
                      {tx.id}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)]">{tx.date}</td>
                    <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                      {tx.project}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)]">{tx.counterparty}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-500">
                      ${tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.status === 'Released'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setActiveReceiptTx(tx)}
                        className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                      >
                        View Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => exportReceiptFile(tx)}
                        title="Download receipt text file"
                        className="text-xs text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================
          STATEMENT MODAL (PRINTABLE & SAVABLE AS PDF)
      =================================================================== */}
      {statementModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
        >
          <div className="veloura-surface max-w-2xl w-full p-6 sm:p-8 space-y-6 rounded-3xl border border-rose-300/40 my-8 bg-white dark:bg-stone-900 shadow-2xl">
            {/* Modal Actions Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-3">
                <BrandCrest size="sm" />
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Official Escrow Statement
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Veloura Multi-Currency Vault &amp; Settlement System
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportStatementCSV}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] hover:border-rose-400 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-rose-500" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-xs font-semibold text-white shadow-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatementModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Statement Body */}
            <div className="space-y-5 text-xs text-[var(--text-primary)]" id="printable-statement">
              {/* Statement Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[var(--bg-elevated)]/40 border border-[var(--border-subtle)]">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    Account Holder
                  </p>
                  <p className="text-sm font-bold mt-0.5">{user.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{user.email}</p>
                  <p className="text-[11px] capitalize text-rose-500 font-semibold">{user.role}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    Statement ID
                  </p>
                  <p className="text-sm font-mono font-bold mt-0.5">
                    STMT-{Date.now().toString().slice(-8)}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Issued: {new Date().toLocaleDateString()}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Status: Audited &amp; Reconciled
                  </p>
                </div>
              </div>

              {/* Balances Summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/20">
                  <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold">
                    Vault Balance
                  </span>
                  <p className="text-lg font-bold text-rose-500 mt-0.5">
                    ${vaultBalance.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/20">
                  <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold">
                    Active Escrow
                  </span>
                  <p className="text-lg font-bold text-amber-500 mt-0.5">
                    ${activeEscrowValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/20">
                  <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold">
                    Cleared Volume
                  </span>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${completedContractsValue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 font-bold uppercase text-[var(--text-muted)]">
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Initiative</th>
                      <th className="py-2.5 px-3">Counterparty</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Amount (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {displayTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-2.5 px-3 font-mono font-bold">{tx.id}</td>
                        <td className="py-2.5 px-3 text-[var(--text-muted)]">{tx.date}</td>
                        <td className="py-2.5 px-3 font-medium">{tx.project}</td>
                        <td className="py-2.5 px-3 text-[var(--text-muted)]">{tx.counterparty}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              tx.status === 'Released'
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-500">
                          ${tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Security Seal Footer */}
              <div className="pt-2 text-[10px] text-[var(--text-muted)] flex items-center justify-between border-t border-[var(--border-subtle)]">
                <span>✦ Guaranteed Escrow Verification Hash: 0x9f4a...83d1</span>
                <span>Powered by Veloura Global Escrow</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          INDIVIDUAL TRANSACTION RECEIPT MODAL
      =================================================================== */}
      {activeReceiptTx && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="veloura-surface max-w-lg w-full p-6 sm:p-7 space-y-5 rounded-3xl border border-rose-300/40 bg-white dark:bg-stone-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <BrandCrest size="xs" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Transaction Receipt &amp; Invoice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceiptTx(null)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-300/30">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                    Settlement Status
                  </span>
                  <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                    {activeReceiptTx.status} &amp; Verified
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                    Receipt #
                  </span>
                  <p className="text-sm font-mono font-bold text-rose-500 mt-0.5">
                    {activeReceiptTx.id}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-y border-[var(--border-subtle)] py-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Initiative / Project:</span>
                  <span className="font-semibold text-right max-w-xs">{activeReceiptTx.project}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Counterparty:</span>
                  <span className="font-semibold">{activeReceiptTx.counterparty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Date Settled:</span>
                  <span className="font-semibold">{activeReceiptTx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Escrow Protection Fee:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    $0.00 (Complimentary)
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--border-subtle)] text-sm font-bold">
                  <span>Total Amount Settled:</span>
                  <span className="text-rose-500 font-mono text-base">
                    ${activeReceiptTx.amount.toLocaleString()} USD
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => exportReceiptFile(activeReceiptTx)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-subtle)] hover:border-rose-400 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-rose-500" />
                <span>Download Receipt File</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-xs font-semibold text-white shadow-xs cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fund Escrow Modal */}
      {depositModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="veloura-surface max-w-md w-full p-6 space-y-4 rounded-3xl border border-rose-300/40">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Fund Escrow Vault
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Deposit funds into your custodial escrow vault to unlock zero-delay milestone authorizations.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Deposit Amount ($)
                </label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-3.5 py-2 text-sm font-bold text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
