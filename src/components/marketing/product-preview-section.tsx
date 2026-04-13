export function ProductPreviewSection() {
  return (
    <section className="py-20 sm:py-28 bg-shark-50/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold text-action-500 uppercase tracking-widest mb-4">
            Built for Operations
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-shark-900 tracking-tight font-exo leading-tight">
            A clearer way to manage your branches.
          </h2>
          <p className="mt-4 text-shark-400 text-lg">
            See stock levels, staff assignments, and activity across every
            location &mdash; all in one view.
          </p>
        </div>

        {/* Location overview mockup */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-shark-200 shadow-xl shadow-shark-200/30 overflow-hidden">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-shark-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-shark-800">Inventory by Location</h3>
                <p className="text-xs text-shark-400 mt-0.5">4 active branches</p>
              </div>
              <div className="flex gap-2">
                <div className="h-7 px-3 rounded-lg bg-action-50 text-action-600 text-[11px] font-medium flex items-center">All Regions</div>
                <div className="h-7 px-3 rounded-lg bg-shark-50 text-shark-400 text-[11px] font-medium flex items-center border border-shark-100">Export</div>
              </div>
            </div>

            {/* Location cards */}
            <div className="p-4 sm:p-6 grid sm:grid-cols-2 gap-4">
              {[
                {
                  name: "North Branch",
                  assets: 68,
                  supplies: 142,
                  staff: 12,
                  alerts: 0,
                  status: "Healthy",
                  statusColor: "bg-green-50 text-green-600 border-green-100",
                },
                {
                  name: "Central Office",
                  assets: 94,
                  supplies: 208,
                  staff: 18,
                  alerts: 2,
                  status: "2 Low Stock",
                  statusColor: "bg-amber-50 text-amber-600 border-amber-100",
                },
                {
                  name: "East Branch",
                  assets: 52,
                  supplies: 96,
                  staff: 8,
                  alerts: 0,
                  status: "Healthy",
                  statusColor: "bg-green-50 text-green-600 border-green-100",
                },
                {
                  name: "South Branch",
                  assets: 41,
                  supplies: 78,
                  staff: 6,
                  alerts: 1,
                  status: "1 Low Stock",
                  statusColor: "bg-amber-50 text-amber-600 border-amber-100",
                },
              ].map((location) => (
                <div
                  key={location.name}
                  className="rounded-xl border border-shark-100 p-4 hover:border-shark-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-shark-800">{location.name}</h4>
                      <p className="text-[11px] text-shark-400 mt-0.5">{location.staff} staff members</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${location.statusColor}`}>
                      {location.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-shark-400 uppercase tracking-wider">Assets</p>
                      <p className="text-lg font-bold text-shark-900 mt-0.5">{location.assets}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-shark-400 uppercase tracking-wider">Supplies</p>
                      <p className="text-lg font-bold text-shark-900 mt-0.5">{location.supplies}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-shark-400 uppercase tracking-wider">Alerts</p>
                      <p className={`text-lg font-bold mt-0.5 ${location.alerts > 0 ? "text-amber-600" : "text-shark-300"}`}>
                        {location.alerts}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
