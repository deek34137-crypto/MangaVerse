import React from "react";
import { aggregator } from "@/services/aggregation/aggregator";
import { providerPolicyRegistry } from "@/services/providers/shared/provider-policy";

export default async function AdminDashboardPage() {
  const bizMetrics = aggregator.getBusinessMetrics();
  const infraMetrics = aggregator.getInfrastructureMetrics();
  const descriptors = providerPolicyRegistry.getAllDescriptors();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 max-w-7xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-black text-white">System Telemetry & Provider Operations</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time status of 8 aggregated providers and canonical snapshot serving.</p>
      </div>

      {/* Top Infrastructure Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-semibold uppercase">Cache Hit Rate</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{(infraMetrics.cacheHitRate * 100).toFixed(1)}%</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-semibold uppercase">Merge Success Rate</p>
          <p className="text-2xl font-black text-indigo-400 mt-1">{(bizMetrics.mergeSuccessRate * 100).toFixed(1)}%</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-semibold uppercase">Reader Failover Rate</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{(infraMetrics.readerFailoverRate * 100).toFixed(1)}%</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-semibold uppercase">Merge Drift Rate</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{(bizMetrics.mergeDriftRate * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Provider Operations Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Provider Health & Policy Status</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-bold text-slate-400">
              <tr>
                <th className="p-4">Provider</th>
                <th className="p-4">Trust Score</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Capabilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {descriptors.map((desc) => (
                <tr key={desc.identity.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-white">{desc.identity.displayName}</td>
                  <td className="p-4 font-mono">{(desc.quality.trustScore * 100).toFixed(0)}%</td>
                  <td className="p-4 font-mono">#{desc.quality.mergePriority}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ONLINE
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400">
                    {[
                      desc.capabilities.search && "Search",
                      desc.capabilities.reader && "Reader",
                      desc.capabilities.highResCover && "High-Res Cover",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
