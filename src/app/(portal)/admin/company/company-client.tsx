"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { updateCompanyDetails } from "@/app/actions/admin";

interface Props {
  org: {
    id: string;
    name: string;
    logo: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    website: string | null;
    abn: string | null;
  };
}

export function CompanyClient({ org }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 tracking-tight">Company Details</h1>
        <p className="text-sm text-shark-400 mt-1">Manage your organisation information</p>
      </div>

      <Card>
        <CardContent>
          <form
            action={async (fd) => {
              setSaving(true);
              try {
                const result = await updateCompanyDetails(fd);
                if (result.success) {
                  addToast("Company details updated", "success");
                  router.refresh();
                } else {
                  addToast(result.error || "Failed to update", "error");
                }
              } catch (e) {
                addToast(e instanceof Error ? e.message : "Failed", "error");
              }
              setSaving(false);
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Company Name *</label>
              <Input name="name" required defaultValue={org.name} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Phone</label>
                <Input name="phone" type="tel" defaultValue={org.phone || ""} placeholder="e.g. 03 1234 5678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Email</label>
                <Input name="email" type="email" defaultValue={org.email || ""} placeholder="e.g. info@company.com.au" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Address</label>
              <Input name="address" defaultValue={org.address || ""} placeholder="e.g. 123 Main St, Melbourne VIC 3000" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Website</label>
                <Input name="website" defaultValue={org.website || ""} placeholder="e.g. www.company.com.au" />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">ABN</label>
                <Input name="abn" defaultValue={org.abn || ""} placeholder="e.g. 12 345 678 901" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-shark-700 mb-1">Logo URL</label>
              <Input name="logo" defaultValue={org.logo || ""} placeholder="https://..." />
              {org.logo && (
                <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-shark-100">
                  <img src={org.logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-shark-100 dark:border-shark-700">
              <Button type="submit" disabled={saving} loading={saving}>
                <Icon name="check" size={14} className="mr-1.5" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
