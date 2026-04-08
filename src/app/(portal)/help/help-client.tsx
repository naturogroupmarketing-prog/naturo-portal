"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface FAQ {
  q: string;
  a: string;
  roles?: string[];
}

interface FAQSection {
  title: string;
  icon: IconName;
  faqs: FAQ[];
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: "Getting Started",
    icon: "dashboard",
    faqs: [
      { q: "What is Trackio?", a: "Trackio is an asset and consumable tracking platform designed for businesses with distributed teams. It helps you track who has what equipment, manage stock levels, and keep your operations running smoothly." },
      { q: "How do I navigate the app?", a: "Use the sidebar menu on the left to navigate between pages. On mobile, tap the menu icon (☰) in the top-left to open the sidebar. You can also press Cmd+K (Mac) or Ctrl+K (Windows) to quickly search and jump to any page." },
      { q: "What is the AI Assistant?", a: "The AI Assistant is a chat-based tool that can help you manage your inventory using natural language. Click the chat bubble in the bottom-right corner to ask questions like 'Show low stock items' or 'Create 5 mop buckets for Sydney'. It can search, create, update, and manage almost everything in the app." },
      { q: "How do I use voice input with the AI?", a: "Click the microphone icon next to the chat input field. Allow microphone access when prompted. Speak your request clearly and the AI will transcribe and process it. Works best on Chrome, Edge, and Safari." },
      { q: "What does the Health Score mean?", a: "The Health Score (0-100) on your dashboard measures your operational health. Points are deducted for low stock items, overdue returns, unresolved damage, pending requests, and overdue inspections. A score of 80+ is green (healthy), 50-79 is amber (needs attention), and below 50 is red (critical). Hover over the score to see the breakdown." },
    ],
  },
  {
    title: "Inventory & Assets",
    icon: "package",
    faqs: [
      { q: "How do I view my inventory?", a: "Click 'Inventory' in the sidebar. You'll see all your locations grouped by state. Click any location to see its assets, consumables, and staff all on one page." },
      { q: "How do I create a new asset?", a: "Go to Inventory → click a location → click '+ New Asset' in the Assets section. Fill in the name, category, and details. Each asset gets a unique code and QR code automatically." },
      { q: "How do I assign an asset to a staff member?", a: "In the Assets section, find the asset and click 'Assign'. Select the staff member from the dropdown, choose permanent or temporary assignment, and confirm. The staff member will be notified." },
      { q: "How do I return an asset?", a: "Staff can return assets from their dashboard by clicking 'Return Kit' or the return button next to individual items. A pending return is created for the manager to verify and restock." },
      { q: "How do I add photos to assets?", a: "When creating or editing an asset, click 'Upload Photo' or 'Change Photo' in the photo section. Photos appear as thumbnails on cards and in the staff dashboard." },
      { q: "How do I move an asset to a different location?", a: "Edit the asset and change the Region dropdown to the new location. Or ask the AI: 'Move the PacVac to Melbourne'. The asset's QR code stays the same." },
      { q: "What do the asset statuses mean?", a: "AVAILABLE = ready to assign. ASSIGNED = given to a staff member. CHECKED OUT = temporarily borrowed. PENDING RETURN = staff has returned it, awaiting manager verification. DAMAGED = reported as damaged. LOST = reported as lost. UNAVAILABLE = taken out of service." },
      { q: "How do I set up a new location quickly?", a: "When you open an empty location in Inventory, you'll see a 'Set Up This Location' card. Click 'Apply Standard Items' to copy all asset and consumable types from your existing locations with one click." },
      { q: "How do I delete an asset?", a: "Only AVAILABLE (unassigned) assets can be deleted. Select items using the checkboxes, then click 'Delete Selected'. A confirmation dialog shows what will be deleted. This action cannot be undone.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { q: "How do I archive a location?", a: "In Inventory, click the archive icon (↓) next to the edit icon on any region card. A confirmation shows how many assets, consumables, and staff will be affected. Everything is preserved — you can restore the location anytime from the 'Archived Locations' section at the bottom of the Inventory page.", roles: ["SUPER_ADMIN"] },
      { q: "How do I restore an archived location?", a: "At the bottom of the Inventory page, click 'X archived locations' to expand the list. Click 'Restore' on the location you want to bring back. All assets, consumables, and staff reappear immediately.", roles: ["SUPER_ADMIN"] },
      { q: "How do I scan QR codes?", a: "On the Assets page, click 'Scan QR' to open your camera. Point it at an asset's QR code to instantly look up that item's details, status, and assignment history.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
    ],
  },
  {
    title: "Consumables & Stock",
    icon: "droplet",
    faqs: [
      { q: "How do I check stock levels?", a: "Go to Inventory → click a location → Consumables tab. You'll see all items with their current stock, minimum threshold, and reorder level. Items below threshold are flagged." },
      { q: "How do I add or deduct stock?", a: "Click the 'Stock' button next to any consumable. Use the toggle to switch between Add and Deduct. Enter the quantity and (for deductions) a reason. Stock updates immediately.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { q: "How do I request consumables as a staff member?", a: "Go to 'Request Consumables' in the sidebar. Browse or search for the item you need, enter the quantity, and submit. Your manager will be notified and can approve or reject the request." },
      { q: "What happens when stock is low?", a: "When a consumable drops below its minimum threshold, a purchase order is automatically created and managers are notified by email and in-app notification. The item appears in the Low Stock alerts on the dashboard." },
      { q: "How do I approve consumable requests?", a: "Go to Consumables → Requests tab. You'll see all pending requests. Click 'Approve' or 'Reject' on each one. You can also batch approve multiple requests at once.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { q: "How do I edit stock directly?", a: "When editing a consumable, there's a 'Current Stock' field (visible to Super Admin and managers with stock adjust permission). Change the number and save to set the exact quantity.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
    ],
  },
  {
    title: "Purchase Orders",
    icon: "truck",
    faqs: [
      { q: "How are purchase orders created?", a: "Purchase orders are created automatically when consumable stock drops below the threshold. They can also be created manually from the Purchase Orders page or via the AI Assistant." },
      { q: "How do I approve a purchase order?", a: "Go to Purchase Orders → find the PENDING order → click 'Approve'. Only Super Admins (or managers with approval permission) can approve orders.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { q: "How do I mark an order as received?", a: "When an ORDERED purchase order arrives at your location, click 'Received'. This automatically adds the quantity to your consumable stock." },
      { q: "What do the PO statuses mean?", a: "PENDING = awaiting approval. APPROVED = approved, ready to order from supplier. ORDERED = order placed with supplier. RECEIVED = goods arrived and stock updated. REJECTED = declined by approver." },
      { q: "How are purchase orders prioritised?", a: "The Purchase Orders page defaults to the Pending tab showing items needing immediate attention first. Regions with the most outstanding orders appear at the top. Each tab shows a count badge so you can see at a glance what needs action." },
    ],
  },
  {
    title: "Staff Management",
    icon: "users",
    faqs: [
      { q: "How do I add a new staff member?", a: "Go to Staff → click '+ New Staff'. Fill in their name, email, password, role, and region. They can log in immediately. You can also assign a starter kit during creation.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { q: "How do I view what equipment a staff member has?", a: "Go to Staff → click 'View' on any staff member. This shows all their assigned assets, consumables, consumable usage history, damage reports, and performance metrics." },
      { q: "How do I reset a staff member's password?", a: "Go to Staff → click the staff member → use the 'Reset Password' button. Or ask the AI: 'Reset Sarah's password to Welcome2026'.", roles: ["SUPER_ADMIN"] },
      { q: "How do I deactivate a staff member?", a: "Go to Staff → click the staff member → toggle the 'Active' switch to off. Deactivated users cannot log in. Their equipment should be returned first.", roles: ["SUPER_ADMIN"] },
    ],
  },
  {
    title: "Starter Kits",
    icon: "box",
    faqs: [
      { q: "What is a starter kit?", a: "A starter kit is a template of assets and consumables that new staff members need. When you apply a kit, it automatically assigns all the items from your location's inventory to that person." },
      { q: "How do I create a starter kit?", a: "Go to Starter Kits → click '+ New Kit'. Name it, then add items using the '+ Add Item' button. You can add asset categories (like 'Vacuum', 'Mop Bucket') and specific consumables with quantities.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { q: "How do I assign a kit to a staff member?", a: "On the Starter Kits page, find the kit and click 'Apply to Staff'. Select the staff member. All items will be assigned as pending — the staff member must confirm receipt on their dashboard." },
      { q: "How do I edit a starter kit?", a: "Everything is editable directly on the Starter Kits page. Use the +/- buttons to adjust quantities, the X button to remove items, 'Add Item' to add new items, and 'Settings' to rename the kit." },
      { q: "Why did the starter kit only assign some items?", a: "This usually happens for two reasons: (1) Asset category names in the kit don't match your actual categories. For example, if the kit has 'Tub System' but your assets are categorised as 'Tub', it won't match. Go to Starter Kits and check the category names match exactly. (2) Consumables don't exist in the staff member's region. The kit finds consumables by name in the staff's location. If that location hasn't been set up with consumables yet, use 'Apply Standard Items' in Inventory to populate it first." },
      { q: "Why do items show as 'Pending' after applying a kit?", a: "When a starter kit is applied, items are assigned but not yet confirmed. Assets stay as 'Available' until the staff member opens their dashboard and confirms they've received each item. Once confirmed, the asset status changes to 'Assigned'. This ensures staff actually have the equipment before it's marked as assigned in the system." },
      { q: "Do I need consumables in every location before applying a kit?", a: "Yes. The starter kit finds consumables by name in the staff member's specific region. If a consumable exists in Port Macquarie but not in Geelong, it will be skipped for Geelong staff. Use 'Apply Standard Items' on empty locations in Inventory to quickly copy all consumable types from existing locations." },
      { q: "Can I apply the same kit to multiple staff at once?", a: "Currently kits are applied one staff member at a time. However, you can use the AI Assistant to speed this up: 'Assign the cleaning kit to all staff in Sydney'. The AI will process each assignment automatically." },
    ],
  },
  {
    title: "Returns & Damage",
    icon: "arrow-left",
    faqs: [
      { q: "How does the return process work?", a: "Staff returns items from their dashboard. This creates a 'Pending Return' for the manager to verify. The manager clicks 'Verify' to confirm and restock the item, or 'Reject' if there's an issue." },
      { q: "How do I report damage to an asset?", a: "Go to 'Report Damage' in the sidebar. Select the asset, choose DAMAGE or LOSS, describe the issue, and optionally take a photo. Your manager will be notified." },
      { q: "How do I resolve a damage report?", a: "Go to the Unresolved Damage page (click 'Unresolved Damage' on the dashboard). Find the report and click 'Resolve'. Choose: Repaired, Replaced, Written Off, or Insurance Claim. Repaired/Replaced assets are automatically set back to Available.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
      { q: "Where can I see all pending returns?", a: "Click 'Returns' in the sidebar. You'll see all unverified returns with a red badge showing the count. Verify each item to restock it.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
    ],
  },
  {
    title: "Inspections",
    icon: "search",
    faqs: [
      { q: "What are condition checks?", a: "Condition checks are scheduled photo inspections of assigned equipment. Staff take photos of their assets and select a condition (Good, Fair, Poor, Damaged). Managers can review all submissions from the Inspections page." },
      { q: "How do I set the frequency for condition checks?", a: "Go to Inspections → click 'Staff Schedules'. You can set each staff member's frequency: Fortnightly, Monthly (default), Quarterly, or 6-Monthly. Set a due date and the system auto-advances to the next period when all items are checked. You can also use 'Bulk Set' to apply the same schedule to multiple staff at once.", roles: ["SUPER_ADMIN"] },
      { q: "How do I schedule an inspection?", a: "Go to Inspections → click 'Schedule Inspection'. Set a title, due date, and optional notes. All staff with inspection-eligible items will be notified immediately.", roles: ["SUPER_ADMIN"] },
      { q: "How do I complete my condition check?", a: "On your dashboard, find the Condition Check section (e.g. 'Monthly Condition Check' or 'Quarterly Condition Check'). For each item, tap 'Photo' to take a picture, select the condition, and click 'Submit'. The due date is shown — items turn red when overdue." },
      { q: "How do I configure which items need inspection?", a: "Go to Inspections → click 'Configure'. Toggle on the categories that require photos. You can also add custom photo labels (e.g., 'Front View', 'Interior') so staff submit multiple angles.", roles: ["SUPER_ADMIN"] },
      { q: "What happens if an inspection is overdue?", a: "Staff see a red 'Inspection Overdue!' banner on their dashboard. Automated email reminders are sent 48 hours and 24 hours before the due date. Managers are notified of overdue checks. The health score is reduced." },
    ],
  },
  {
    title: "Reports & Data",
    icon: "clipboard",
    faqs: [
      { q: "What reports are available?", a: "Asset Register, Consumables by Location, Staff Assignments, Staff Consumable Usage, Stock Movement, Request History, Damage & Loss, Audit Trail, and Maintenance Schedule. All exportable as CSV." },
      { q: "Can I filter reports by date?", a: "Yes. Add ?from=YYYY-MM-DD&to=YYYY-MM-DD to any report URL. For example: /api/reports/damage-loss?from=2026-01-01&to=2026-03-31." },
      { q: "How do I export data?", a: "Go to Reports → click 'Download CSV' on any report. The file will download immediately with all the data." },
      { q: "How do I download a full backup?", a: "Go to Admin → Backup. Click 'Download All' to get 4 CSV files: assets, consumables, staff, and regions. You can also download each individually. These files can be re-uploaded via Import Data to restore everything.", roles: ["SUPER_ADMIN"] },
      { q: "How do I restore from a backup?", a: "Go to Admin → Import Data. Upload any of the backup CSV files. The column headers are automatically matched. Assets and consumables are created in their original regions with unique codes.", roles: ["SUPER_ADMIN"] },
      { q: "How do I download my personal data?", a: "Go to Settings → Privacy & Data → click 'Export'. This downloads a JSON file with all your personal data, assignments, condition checks, and reports." },
    ],
  },
  {
    title: "Account & Settings",
    icon: "settings",
    faqs: [
      { q: "How do I change my password?", a: "Go to Settings → Change Password. Enter your current password and new password (minimum 8 characters, must include an uppercase letter and a number)." },
      { q: "How do I update my profile?", a: "Go to Settings → Profile section. You can edit your name, email, and phone number directly." },
      { q: "How do I enable/disable email notifications?", a: "Go to Settings → Email Notifications → toggle the switch. When disabled, you'll only get in-app notifications (bell icon), no emails." },
      { q: "How do I set up two-factor authentication?", a: "Go to Settings → Two-Factor Authentication → click 'Enable MFA'. Scan the QR code with your authenticator app (Google Authenticator, Authy), then enter the 6-digit code to verify." },
      { q: "How do I delete my account?", a: "Go to Settings → Privacy & Data → click 'Delete'. Enter your password to confirm. Your account will be deactivated and your administrator notified to complete the deletion." },
      { q: "I forgot my password", a: "On the login page, click 'Forgot your password?'. Enter your email and you'll receive a reset link. The link expires after 30 minutes." },
    ],
  },
  {
    title: "Permissions & Admin",
    icon: "lock",
    faqs: [
      { q: "What are the user roles?", a: "Super Admin — full access to everything. Branch Manager — manages their assigned location (assets, consumables, staff, returns). Staff — views their assigned items, requests consumables, reports damage, completes inspections." },
      { q: "How do I manage branch manager permissions?", a: "Go to Permissions in the Admin section. You can toggle individual permissions for each branch manager: add/edit/delete assets, adjust stock, manage POs, verify returns, view reports, etc.", roles: ["SUPER_ADMIN"] },
      { q: "How do I manage locations?", a: "Go to Inventory. Super Admins can add states and locations, edit names/addresses, archive locations (preserving all data), and restore or permanently delete archived locations.", roles: ["SUPER_ADMIN"] },
      { q: "How do I import bulk data?", a: "Go to Import Data in the Admin section. Upload a CSV or XLSX file with your data. The system auto-maps columns, validates each row, and shows errors before importing.", roles: ["SUPER_ADMIN"] },
      { q: "Where is the activity log?", a: "Go to Activity Log in the Admin section. It shows every action with who did it and when. Actions are grouped by date with clean labels like 'Assigned', 'Returned', 'Created'.", roles: ["SUPER_ADMIN"] },
      { q: "How do I view my billing plan?", a: "Go to Admin → Billing. You'll see your current plan (Free, Admin, Pro, or Enterprise), usage bars for users and assets, and options to upgrade or downgrade.", roles: ["SUPER_ADMIN"] },
      { q: "What plans are available?", a: "Free: 3 users, 50 assets. Admin ($47/mo): 15 users, 500 assets, AI assistant. Professional ($79/mo): 75 users, 2,000 assets, full features. Enterprise: custom pricing, unlimited everything.", roles: ["SUPER_ADMIN"] },
      { q: "How do I customise the dashboard?", a: "Click the settings gear icon on the dashboard. You can toggle any widget on/off (stat cards, operations overview, charts, regional breakdown, location map, etc.) and drag to reorder sections.", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
    ],
  },
  {
    title: "Keyboard Shortcuts",
    icon: "settings",
    faqs: [
      { q: "What keyboard shortcuts are available?", a: "Cmd+K (Mac) or Ctrl+K (Windows) — opens the command palette for quick navigation to any page. Type to filter, arrow keys to navigate, Enter to select, Escape to close." },
    ],
  },
];

export function HelpClient({ role }: { role: string }) {
  const [search, setSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const filteredSections = FAQ_SECTIONS.map((section) => ({
    ...section,
    faqs: section.faqs.filter((faq) => {
      // Filter by role
      if (faq.roles && !faq.roles.includes(role)) return false;
      // Filter by search
      if (!search) return true;
      const q = search.toLowerCase();
      return faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q);
    }),
  })).filter((section) => section.faqs.length > 0);

  const totalResults = filteredSections.reduce((sum, s) => sum + s.faqs.length, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Help & Support</h1>
        <p className="text-sm text-shark-400 mt-1">Find answers to common questions</p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <div className="px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-action-500 flex items-center justify-center shrink-0">
              <Icon name="message-circle" size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-shark-900">AI Assistant</p>
              <p className="text-xs text-shark-400">Click the chat bubble — available 24/7</p>
            </div>
          </div>
        </Card>
        <a href="mailto:support@trackio.com.au">
          <Card className="hover:shadow-md transition-shadow">
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-action-500 flex items-center justify-center shrink-0">
                <Icon name="mail" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-shark-900">Email Support</p>
                <p className="text-xs text-shark-400">support@trackio.com.au — response within 24hrs</p>
              </div>
            </div>
          </Card>
        </a>
      </div>

      {/* Search */}
      <Input
        placeholder="Search help articles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      {search && (
        <p className="text-xs text-shark-400">{totalResults} result{totalResults !== 1 ? "s" : ""} found</p>
      )}

      {/* FAQ Sections */}
      {filteredSections.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Icon name="search" size={40} className="text-shark-200 mx-auto mb-3" />
            <p className="text-shark-500">No results found for &quot;{search}&quot;</p>
            <p className="text-xs text-shark-400 mt-1">Try different keywords or ask the AI Assistant</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSections.map((section) => {
            const isExpanded = expandedSection === section.title || !!search;
            return (
              <Card key={section.title} className="overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded && !search ? null : section.title)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-shark-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-action-500 flex items-center justify-center">
                      <Icon name={section.icon} size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-shark-900">{section.title}</span>
                      <span className="ml-2 text-xs text-shark-400">{section.faqs.length} article{section.faqs.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <Icon name="chevron-down" size={16} className={`text-shark-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-shark-100 px-5 py-2">
                    {section.faqs.map((faq, i) => (
                      <details key={i} className="group" open={!!search}>
                        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-shark-700 hover:text-shark-900 py-3 border-b border-shark-50 last:border-0">
                          {faq.q}
                          <Icon name="chevron-down" size={14} className="text-shark-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
                        </summary>
                        <p className="text-sm text-shark-500 leading-relaxed pb-3 pl-1">
                          {faq.a}
                        </p>
                      </details>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
