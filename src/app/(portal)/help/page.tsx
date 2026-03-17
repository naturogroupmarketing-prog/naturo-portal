import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/icon";

export default async function HelpPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Help & Support</h1>
        <p className="text-sm text-shark-400 mt-1">
          Get the help you need to make the most of Trackio
        </p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Assistant */}
        <div className="rounded-2xl border border-shark-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-action-50 flex items-center justify-center mb-4">
            <Icon name="message-circle" size={24} className="text-action-500" />
          </div>
          <h2 className="text-lg font-semibold text-shark-900">AI Assistant</h2>
          <p className="text-sm text-shark-500 mt-2 leading-relaxed">
            Get instant answers to your questions using our built-in AI assistant.
            It can help you with inventory queries, asset lookups, stock levels,
            and general navigation around the app.
          </p>
          <div className="mt-4 bg-action-50 rounded-xl p-4">
            <p className="text-sm font-medium text-action-700 mb-2">How to use:</p>
            <ol className="text-sm text-action-600 space-y-1.5 list-decimal list-inside">
              <li>Click the chat bubble icon in the bottom-right corner</li>
              <li>Type your question or use a suggested prompt</li>
              <li>Get instant answers about your assets and inventory</li>
            </ol>
          </div>
          <div className="mt-4">
            <p className="text-xs text-shark-400">
              Available 24/7 &middot; Instant responses &middot; No wait time
            </p>
          </div>
        </div>

        {/* Email Support */}
        <div className="rounded-2xl border border-shark-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <Icon name="mail" size={24} className="text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold text-shark-900">Email Support</h2>
          <p className="text-sm text-shark-500 mt-2 leading-relaxed">
            For account issues, billing enquiries, feature requests, or any questions
            the AI assistant can&apos;t answer, reach out to our support team via email.
          </p>
          <div className="mt-4 bg-emerald-50 rounded-xl p-4">
            <p className="text-sm font-medium text-emerald-700 mb-2">Contact us at:</p>
            <a
              href="mailto:support@trackio.au"
              className="text-base font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
            >
              support@trackio.au
            </a>
          </div>
          <div className="mt-4">
            <p className="text-xs text-shark-400">
              Response within 24 hours &middot; Mon&ndash;Fri
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="rounded-2xl border border-shark-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-shark-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-shark-700 hover:text-shark-900 py-2 border-b border-shark-50">
              How do I assign an asset to a staff member?
              <Icon name="chevron-down" size={16} className="text-shark-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-sm text-shark-500 mt-2 pb-2">
              Navigate to the Assets page, find the asset you want to assign, click on it to open the details,
              then use the &quot;Assign&quot; button to select a staff member. The assignment will be logged in the activity trail.
            </p>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-shark-700 hover:text-shark-900 py-2 border-b border-shark-50">
              How do I request consumable items?
              <Icon name="chevron-down" size={16} className="text-shark-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-sm text-shark-500 mt-2 pb-2">
              Go to &quot;Request Consumables&quot; in the sidebar, select the item you need, enter the quantity,
              and submit the request. Your manager will be notified and can approve or deny the request.
            </p>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-shark-700 hover:text-shark-900 py-2 border-b border-shark-50">
              How do I report a damaged or lost asset?
              <Icon name="chevron-down" size={16} className="text-shark-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-sm text-shark-500 mt-2 pb-2">
              Go to &quot;Report Damage/Loss&quot; in the sidebar, select the affected asset, describe the issue,
              and submit the report. Your manager will review it and take appropriate action.
            </p>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-shark-700 hover:text-shark-900 py-2 border-b border-shark-50">
              How do I export reports?
              <Icon name="chevron-down" size={16} className="text-shark-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-sm text-shark-500 mt-2 pb-2">
              Navigate to the Reports page where you&apos;ll find various report types including Asset Register,
              Consumables by Location, Staff Assignments, and more. Click &quot;Download CSV&quot; on any report to export the data.
            </p>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-shark-700 hover:text-shark-900 py-2 border-b border-shark-50">
              How do I add a new location or region?
              <Icon name="chevron-down" size={16} className="text-shark-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-sm text-shark-500 mt-2 pb-2">
              Admins can manage locations from the Admin &gt; Locations page. Use the &quot;+ State&quot; button to add a new state,
              then &quot;+ Region&quot; to add regions within that state. Each region can have its own staff, assets, and consumables.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
