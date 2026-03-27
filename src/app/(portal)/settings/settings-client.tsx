"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { toggleEmailNotifications, changePassword } from "@/app/actions/user-settings";

interface Props {
  userName: string;
  userEmail: string;
  emailNotifications: boolean;
  hasPassword: boolean;
}

export function SettingsClient({ userName, userEmail, emailNotifications, hasPassword }: Props) {
  const { addToast } = useToast();
  const [emailEnabled, setEmailEnabled] = useState(emailNotifications);
  const [togglingEmail, setTogglingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast("Password must be at least 8 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("Passwords don't match", "error");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      addToast("Password changed successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to change password", "error");
    }
    setChangingPassword(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Settings</h1>
        <p className="text-sm text-shark-400 mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="user" size={18} className="text-action-500" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-shark-400 uppercase tracking-wider">Name</label>
              <p className="text-sm text-shark-800 mt-0.5">{userName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-shark-400 uppercase tracking-wider">Email</label>
              <p className="text-sm text-shark-800 mt-0.5">{userEmail}</p>
            </div>
          </div>
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
              <p className="text-sm font-medium text-shark-800">Receive email notifications</p>
              <p className="text-xs text-shark-400 mt-0.5">Get emailed when you receive in-app notifications (assignments, returns, requests, alerts)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={handleToggleEmail}
                disabled={togglingEmail}
                className="sr-only peer"
              />
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
                <label className="block text-sm font-medium text-shark-700 mb-1">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-shark-700 mb-1">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={changingPassword} loading={changingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
