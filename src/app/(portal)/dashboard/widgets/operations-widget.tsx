"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

interface OperationsOverview {
  healthScore: number;
  ordersAwaitingApproval: number;
  ordersAwaitingReceival: number;
  overdueReturns: number;
  incompleteInspections: number;
  unresolvedDamage: number;
  lostItems: number;
  totalStaff: number;
  pendingRequests: number;
  lowStockCount: number;
}

export function OperationsWidget({ data }: { data: OperationsOverview }) {
  return (
    <Card>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-shark-900">Operations</h2>
            <p className="text-sm text-shark-400">Business health overview</p>
          </div>
          <div className="text-center relative group/health">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white cursor-pointer ${
              data.healthScore >= 80 ? "bg-action-500" :
              data.healthScore >= 50 ? "bg-[#E8532E]" : "bg-red-500"
            }`}>
              {data.healthScore}
            </div>
            <p className="text-[10px] text-shark-400 mt-1">Health</p>
            <div className="absolute right-0 sm:right-0 top-full mt-2 w-56 sm:w-64 bg-[#1a1c21] text-white rounded-xl p-3.5 sm:p-4 shadow-2xl opacity-0 invisible group-hover/health:opacity-100 group-hover/health:visible transition-all duration-200 z-50 text-left">
              <p className="text-xs font-semibold mb-2 text-shark-400">Health Score Breakdown</p>
              <div className="space-y-1.5 text-xs">
                {data.lowStockCount > 0 && (
                  <div className="flex justify-between"><span className="text-shark-400">Low stock ({data.lowStockCount})</span><span className="text-red-400">-{Math.min(30, data.lowStockCount * 5)}</span></div>
                )}
                {data.overdueReturns > 0 && (
                  <div className="flex justify-between"><span className="text-shark-400">Overdue returns ({data.overdueReturns})</span><span className="text-red-400">-{Math.min(20, data.overdueReturns * 4)}</span></div>
                )}
                {(data.unresolvedDamage + data.lostItems) > 0 && (
                  <div className="flex justify-between"><span className="text-shark-400">Damage reports ({data.unresolvedDamage + data.lostItems})</span><span className="text-red-400">-{Math.min(15, (data.unresolvedDamage + data.lostItems) * 5)}</span></div>
                )}
                {data.incompleteInspections > 0 && (
                  <div className="flex justify-between"><span className="text-shark-400">Overdue inspections ({data.incompleteInspections})</span><span className="text-red-400">-{Math.min(15, data.incompleteInspections * 5)}</span></div>
                )}
                {data.pendingRequests > 0 && (
                  <div className="flex justify-between"><span className="text-shark-400">Pending requests ({data.pendingRequests})</span><span className="text-red-400">-{Math.min(10, data.pendingRequests * 2)}</span></div>
                )}
                {data.healthScore === 100 && (
                  <p className="text-action-400">No deductions — perfect score!</p>
                )}
                <div className="border-t border-shark-700 pt-1.5 mt-1.5 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className={data.healthScore >= 80 ? "text-action-400" : data.healthScore >= 50 ? "text-amber-400" : "text-red-400"}>
                    {data.healthScore}/100
                  </span>
                </div>
              </div>
              <div className="absolute -top-1.5 right-5 w-3 h-3 bg-[#1a1c21] rotate-45" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link href="/purchase-orders" className="bg-shark-50 rounded-xl px-3 py-2.5 hover:bg-shark-100 transition-colors">
            <p className="text-[10px] text-shark-400 uppercase tracking-wider">Awaiting Approval</p>
            <p className={`text-lg font-bold ${data.ordersAwaitingApproval > 0 ? "text-[#E8532E]" : "text-shark-900"}`}>{data.ordersAwaitingApproval}</p>
            <p className="text-[10px] text-shark-400">purchase orders</p>
          </Link>
          <Link href="/purchase-orders?status=ORDERED" className="bg-shark-50 rounded-xl px-3 py-2.5 hover:bg-shark-100 transition-colors">
            <p className="text-[10px] text-shark-400 uppercase tracking-wider">Awaiting Receival</p>
            <p className={`text-lg font-bold ${data.ordersAwaitingReceival > 0 ? "text-action-500" : "text-shark-900"}`}>{data.ordersAwaitingReceival}</p>
            <p className="text-[10px] text-shark-400">purchase orders</p>
          </Link>
        </div>

        <div className="space-y-2">
          {[
            { label: "Overdue Returns", value: data.overdueReturns, icon: "arrow-left" as const, href: "/returns", danger: true },
            { label: "Low Stock Items", value: data.lowStockCount, icon: "alert-triangle" as const, href: "/purchase-orders", danger: true },
            { label: "Damage", value: data.unresolvedDamage + data.lostItems, icon: "alert-triangle" as const, href: "/alerts/damage", danger: true },
            { label: "Pending Requests", value: data.pendingRequests, icon: "clipboard" as const, href: "/inventory", danger: false },
            { label: "Overdue Inspections", value: data.incompleteInspections, icon: "search" as const, href: "/condition-checks", danger: true },
          ].filter((item) => item.value > 0).map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-shark-50 transition-colors -mx-1">
              <div className="flex items-center gap-2.5">
                <Icon name={item.icon} size={14} className={item.danger ? "text-[#E8532E]" : "text-action-500"} />
                <span className="text-sm text-shark-600">{item.label}</span>
              </div>
              <span className={`text-sm font-bold ${item.danger ? "text-[#E8532E]" : "text-shark-700"}`}>{item.value}</span>
            </Link>
          ))}
          {data.overdueReturns === 0 && data.lowStockCount === 0 && data.unresolvedDamage === 0 && data.pendingRequests === 0 && data.incompleteInspections === 0 && (
            <div className="flex items-center gap-2 px-3 py-3">
              <Icon name="check" size={16} className="text-action-500" />
              <span className="text-sm text-action-600 font-medium">All clear — no outstanding issues</span>
            </div>
          )}
        </div>

        <Link href="/staff" className="mt-4 pt-3 border-t border-shark-100 flex items-center justify-between hover:bg-shark-50 -mx-4 px-4 -mb-4 pb-4 rounded-b-xl transition-colors cursor-pointer">
          <span className="text-xs text-shark-400">Active Staff</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-shark-700">{data.totalStaff}</span>
            <Icon name="arrow-right" size={14} className="text-shark-400" />
          </div>
        </Link>
      </div>
    </Card>
  );
}
