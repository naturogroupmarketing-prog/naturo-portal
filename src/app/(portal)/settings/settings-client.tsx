"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { toggleEmailNotifications, changePassword, updateProfile, exportMyData, requestAccountDeletion } from "@/app/actions/user-settings";
import { generateTOTPSecret, enableMFA, disableMFA } from "@/app/actions/mfa";

interface Props {
  userName: string;
  userEmail: string;
  userPhone: string;
  emailNotifications: boolean;
  hasPassword: boolean;
  mfaEnabled: boolean;
}

export function SettingsClient({ userName, userEmail, userPhone, emailNotifications, hasPassword, mfaEnabled }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [emailEnabled, setEmailEnabled] = useState(emailNotifications);
  const [togglingEmail, setTogglingEmail] = useState(false);

  // Profile edit
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editPhone, setEditPhone] = useState(userPhone);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Data export
  const [exporting, setExporting] = useState(false);

  // Account deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  // MFA
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaQrUri, setMfaQrUri] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState<"qr" | "verify">("qr");
  const [showDisableMfa, setShowDisableMfa] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disablingMfa, setDisablingMfa] = useState(false);

  const handleSetupMfa = async () => {
    setMfaLoading(true);
    try {
      const result = await generateTOTPSecret();
      setMfaQrUri(result.uri);
      setMfaSecret(result.secret);
      setMfaStep("qr");
      setShowMfaSetup(true);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to generate", "error");
    }
    setMfaLoading(false);
  };

  const handleVerifyMfa = async () => {
    if (mfaCode.length !== 6) { addToast("Enter a 6-digit code", "error"); return; }
    setMfaLoading(true);
    try {
      await enableMFA(mfaCode);
      addToast("Two-factor authentication enabled!", "success");
      setShowMfaSetup(false);
      setMfaCode("");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Invalid code", "error");
    }
    setMfaLoading(false);
  };

  const handleDisableMfa = async () => {
    setDisablingMfa(true);
    try {
      await disableMFA(disablePassword);
      addToast("Two-factor authentication disabled", "success");
      setShowDisableMfa(false);
      setDisablePassword("");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed", "error");
    }
    setDisablingMfa(false);
  };

  const handleToggleEmail = async () => {
    setTogglingEmail(true);
    const newVal = !emailEnabled;
    setEmailEnabled(newVal);
    try {
      await toggleEmailNotifications(newVal);
      addToast(`Email notifications ${newVal ? "enabled" : "disabled"}`, "success");
    } catch {
      setEmailEnabled(!newVal);
      addToast("Failed to update", "error");
    }
    setTogglingEmail(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name: editName, email: editEmail, phone: editPhone });
      addToast("Profile saved successfully", "success");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update", "error");
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { addToast("Password must be at least 8 characters", "error"); return; }
    if (!/[A-Z]/.test(newPassword)) { addToast("Password must contain at least one uppercase letter", "error"); return; }
    if (!/[0-9]/.test(newPassword)) { addToast("Password must contain at least one number", "error"); return; }
    if (newPassword !== confirmPassword) { addToast("Passwords don't match", "error"); return; }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      addToast("Password changed successfully", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to change password", "error");
    }
    setChangingPassword(false);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trackio-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Data exported successfully", "success");
    } catch {
      addToast("Failed to export data", "error");
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await requestAccountDeletion(deletePassword);
      addToast("Account deletion requested. You will be signed out.", "success");
      setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete account", "error");
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 dark:text-shark-100 tracking-tight">Settings</h1>
        <p className="text-sm text-shark-400 mt-1">Manage your account, privacy, and preferences</p>
      </div>

      {/* Profile — Editable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="user" size={18} className="text-action-500" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Email</label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Phone</label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile} loading={savingProfile}>Save Profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="mail" size={18} className="text-action-500" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-shark-800 dark:text-shark-200">Receive email notifications</p>
              <p className="text-xs text-shark-400 mt-0.5">Get emailed when you receive in-app notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={emailEnabled} onChange={handleToggleEmail} disabled={togglingEmail} className="sr-only peer" />
              <div className="w-11 h-6 bg-shark-200 peer-focus:ring-2 peer-focus:ring-action-400/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-action-500" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      {hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="lock" size={18} className="text-action-500" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Current Password</label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">New Password</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="Min 8 chars, 1 uppercase, 1 number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Confirm New Password</label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={changingPassword} loading={changingPassword}>Update Password</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="shield" size={18} className="text-action-500" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-shark-800 dark:text-shark-200">
                {mfaEnabled ? "MFA is enabled" : "Add an extra layer of security"}
              </p>
              <p className="text-xs text-shark-400 mt-0.5">
                {mfaEnabled
                  ? "Your account is protected with an authenticator app"
                  : "Use an authenticator app (Google Authenticator, Authy) for login verification"}
              </p>
            </div>
            {mfaEnabled ? (
              <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setShowDisableMfa(true)}>
                Disable
              </Button>
            ) : (
              <Button size="sm" onClick={handleSetupMfa} loading={mfaLoading}>
                Enable MFA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="shield" size={18} className="text-action-500" />
            Privacy & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Download my data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-shark-800 dark:text-shark-200">Download My Data</p>
              <p className="text-xs text-shark-400 mt-0.5">Export all your personal data as a JSON file (APP 12)</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData} disabled={exporting} loading={exporting}>
              <Icon name="download" size={14} className="mr-1.5" />
              Export
            </Button>
          </div>

          {/* Privacy policy link */}
          <div className="flex items-center justify-between border-t border-shark-100 dark:border-shark-700 pt-4">
            <div>
              <p className="text-sm font-medium text-shark-800 dark:text-shark-200">Privacy Policy</p>
              <p className="text-xs text-shark-400 mt-0.5">Read how we handle your personal information</p>
            </div>
            <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-action-500 hover:text-action-600 font-medium flex items-center gap-1">
              View <Icon name="arrow-right" size={14} />
            </Link>
          </div>

          {/* Delete account */}
          <div className="flex items-center justify-between border-t border-shark-100 dark:border-shark-700 pt-4">
            <div>
              <p className="text-sm font-medium text-red-600">Delete Account</p>
              <p className="text-xs text-shark-400 mt-0.5">Permanently deactivate your account and request data deletion</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(true)} className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Modal */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeletePassword(""); }} title="Delete Account">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-sm text-red-800 font-medium">This action cannot be undone</p>
            <p className="text-xs text-red-600 mt-1">Your account will be deactivated immediately. Your administrator will be notified to complete the deletion of your data.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">Enter your password to confirm</label>
            <Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Your current password" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }}>Cancel</Button>
            <Button onClick={handleDeleteAccount} disabled={!deletePassword || deleting} loading={deleting} className="bg-red-600 hover:bg-red-700">
              Delete My Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* MFA Setup Modal */}
      <Modal open={showMfaSetup} onClose={() => { setShowMfaSetup(false); setMfaCode(""); }} title="Set Up Two-Factor Authentication">
        <div className="space-y-5">
          {mfaStep === "qr" && (
            <>
              <div className="text-center">
                <p className="text-sm text-shark-600 mb-4">Scan this QR code with your authenticator app:</p>
                {/* QR Code rendered as a link to otpauth URI */}
                <div className="bg-white p-4 rounded-xl inline-block border border-shark-200 dark:border-shark-700 mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaQrUri)}`}
                    alt="MFA QR Code"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>
                <p className="text-xs text-shark-400 mt-3">Or enter this code manually:</p>
                <code className="block mt-1.5 text-sm font-mono bg-shark-50 dark:bg-shark-800 px-3 py-2 rounded-lg text-shark-700 dark:text-shark-300 select-all break-all">
                  {mfaSecret}
                </code>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setMfaStep("verify")}>Next</Button>
              </div>
            </>
          )}
          {mfaStep === "verify" && (
            <>
              <p className="text-sm text-shark-600">Enter the 6-digit code from your authenticator app to verify:</p>
              <Input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-[0.5em]"
                maxLength={6}
                autoFocus
              />
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setMfaStep("qr")}>Back</Button>
                <Button onClick={handleVerifyMfa} disabled={mfaCode.length !== 6 || mfaLoading} loading={mfaLoading}>
                  Verify & Enable
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Disable MFA Modal */}
      <Modal open={showDisableMfa} onClose={() => { setShowDisableMfa(false); setDisablePassword(""); }} title="Disable Two-Factor Authentication">
        <div className="space-y-4">
          <p className="text-sm text-shark-600">Enter your password to disable MFA. This will make your account less secure.</p>
          <Input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} placeholder="Your current password" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowDisableMfa(false); setDisablePassword(""); }}>Cancel</Button>
            <Button onClick={handleDisableMfa} disabled={!disablePassword || disablingMfa} loading={disablingMfa} className="bg-red-600 hover:bg-red-700 text-white">
              Disable MFA
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
