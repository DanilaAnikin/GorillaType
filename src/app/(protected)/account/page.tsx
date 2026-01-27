"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/user-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  User,
  Mail,
  Lock,
  Globe,
  Github,
  Twitter,
  Trash2,
  Upload,
  Save,
  AlertTriangle,
  Camera,
  X,
  ImageIcon,
} from "lucide-react";

interface ProfileFormData {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  githubUrl: string;
  twitterUrl: string;
  websiteUrl: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AccountPage() {
  const { user, profile, updateProfile } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    username: "",
    displayName: "",
    bio: "",
    avatarUrl: null,
    githubUrl: "",
    twitterUrl: "",
    websiteUrl: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    if (profile) {
      setProfileForm({
        username: profile.username || "",
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || null,
        githubUrl: "",
        twitterUrl: "",
        websiteUrl: "",
      });
    }
    if (user) {
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Validate avatar file
  const validateAvatarFile = (file: File): string | null => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Please select a JPG, PNG, or WebP image";
    }

    if (file.size > 2 * 1024 * 1024) {
      return "Image must be less than 2MB";
    }

    return null;
  };

  // Upload avatar via API
  const uploadAvatar = useCallback(async (file: File) => {
    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);

    // Create preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload avatar");
      }

      setProfileForm((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));

      // Update local store
      updateProfile({
        avatarUrl: data.avatarUrl,
      });

      setSuccess("Avatar uploaded successfully");
      setAvatarPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
      console.error("Avatar upload error:", err);
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [updateProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Delete avatar
  const handleDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    setError(null);

    try {
      const response = await fetch("/api/users/avatar", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete avatar");
      }

      setProfileForm((prev) => ({ ...prev, avatarUrl: null }));

      // Update local store
      updateProfile({
        avatarUrl: null,
      });

      setSuccess("Avatar removed successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete avatar");
      console.error("Avatar delete error:", err);
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadAvatar(files[0]);
    }
  }, [uploadAvatar]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: profileForm.username,
          display_name: profileForm.displayName,
          bio: profileForm.bio,
          avatar_url: profileForm.avatarUrl,
          github_url: profileForm.githubUrl,
          twitter_url: profileForm.twitterUrl,
          website_url: profileForm.websiteUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      // Update local store
      updateProfile({
        username: profileForm.username,
        displayName: profileForm.displayName,
        bio: profileForm.bio,
        avatarUrl: profileForm.avatarUrl,
      });

      setSuccess("Profile saved successfully");
    } catch (err) {
      setError("Failed to save profile");
      console.error("Profile save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const { error: passwordError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (passwordError) throw passwordError;

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSuccess("Password changed successfully");
    } catch (err) {
      setError("Failed to change password");
      console.error("Password change error:", err);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setIsDeletingAccount(true);
    setError(null);

    try {
      const supabase = createClient();

      // Delete user data first
      const { error: deleteDataError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user?.id);

      if (deleteDataError) throw deleteDataError;

      // Sign out user via server-side API to properly clear session cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Clear local state and redirect
      useUserStore.getState().clearUser();
      window.location.href = '/';
    } catch (err) {
      setError("Failed to delete account");
      console.error("Account deletion error:", err);
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Account Settings</h1>
          <p className="text-sub mt-1">
            Manage your profile, security, and account preferences
          </p>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-error">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-main/10 border border-main/20 p-4 text-main">
            {success}
          </div>
        )}

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your profile details and public information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-4">
              <div className="flex items-start gap-6">
                {/* Avatar Preview */}
                <div className="relative flex-shrink-0">
                  <div
                    onClick={handleAvatarClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative h-28 w-28 cursor-pointer rounded-full overflow-hidden group
                      transition-all duration-200
                      ${isDragging
                        ? "ring-4 ring-main ring-offset-2 ring-offset-bg scale-105"
                        : "hover:ring-2 hover:ring-sub"
                      }
                    `}
                  >
                    {avatarPreview || profileForm.avatarUrl ? (
                      <img
                        src={avatarPreview || profileForm.avatarUrl || ""}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-sub-alt">
                        <User className="h-12 w-12 text-sub" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className={`
                      absolute inset-0 flex items-center justify-center bg-black/60
                      transition-opacity duration-200
                      ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                    `}>
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    {/* Loading overlay */}
                    {(isUploadingAvatar || isDeletingAvatar) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="h-8 w-8 animate-spin rounded-full border-3 border-white border-t-transparent" />
                      </div>
                    )}
                  </div>
                  {/* Remove button */}
                  {profileForm.avatarUrl && !isUploadingAvatar && !isDeletingAvatar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAvatar();
                      }}
                      className="absolute -top-1 -right-1 p-1.5 rounded-full bg-error text-white hover:bg-error/90 transition-colors shadow-lg"
                      title="Remove avatar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload info and drop zone */}
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-text">Profile Picture</p>
                    <p className="text-xs text-sub mt-1">
                      Upload a JPG, PNG, or WebP image. Max 2MB.
                    </p>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={handleAvatarClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed
                      cursor-pointer transition-all duration-200
                      ${isDragging
                        ? "border-main bg-main/10 scale-[1.02]"
                        : "border-sub/30 hover:border-sub hover:bg-sub-alt/30"
                      }
                    `}
                  >
                    <ImageIcon className={`h-6 w-6 mb-2 ${isDragging ? "text-main" : "text-sub"}`} />
                    <p className={`text-xs text-center ${isDragging ? "text-main" : "text-sub"}`}>
                      {isDragging ? "Drop image here" : "Click or drag image to upload"}
                    </p>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Username</label>
              <Input
                name="username"
                value={profileForm.username}
                onChange={handleProfileChange}
                placeholder="your_username"
                leftIcon={<User className="h-4 w-4" />}
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">
                Display Name
              </label>
              <Input
                name="displayName"
                value={profileForm.displayName}
                onChange={handleProfileChange}
                placeholder="Your Display Name"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Bio</label>
              <textarea
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                placeholder="Tell us about yourself..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Links
            </CardTitle>
            <CardDescription>
              Connect your social profiles and website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* GitHub */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">GitHub</label>
              <Input
                name="githubUrl"
                value={profileForm.githubUrl}
                onChange={handleProfileChange}
                placeholder="https://github.com/username"
                leftIcon={<Github className="h-4 w-4" />}
              />
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">
                Twitter / X
              </label>
              <Input
                name="twitterUrl"
                value={profileForm.twitterUrl}
                onChange={handleProfileChange}
                placeholder="https://twitter.com/username"
                leftIcon={<Twitter className="h-4 w-4" />}
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Website</label>
              <Input
                name="websiteUrl"
                value={profileForm.websiteUrl}
                onChange={handleProfileChange}
                placeholder="https://yourwebsite.com"
                leftIcon={<Globe className="h-4 w-4" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email & Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Email & Security
            </CardTitle>
            <CardDescription>
              Manage your email address and password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">
                Email Address
              </label>
              <Input
                value={email}
                disabled
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <p className="text-xs text-sub">
                Contact support to change your email address
              </p>
            </div>

            {/* Password Change */}
            <div className="border-t border-border pt-6 space-y-4">
              <h4 className="text-sm font-medium text-text">Change Password</h4>

              <div className="space-y-2">
                <label className="text-sm text-sub">Current Password</label>
                <Input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  leftIcon={<Lock className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-sub">New Password</label>
                <Input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  leftIcon={<Lock className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-sub">Confirm New Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  leftIcon={<Lock className="h-4 w-4" />}
                />
              </div>

              <Button
                onClick={handleChangePassword}
                loading={isChangingPassword}
                disabled={
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
                variant="outline"
              >
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-error/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="border-error text-error hover:bg-error hover:text-bg"
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Delete Account
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-sub">
                  This action cannot be undone. All your data, including test
                  results, personal bests, and achievements will be permanently
                  deleted.
                </p>
                <div className="space-y-2">
                  <label className="text-sm text-text">
                    Type <span className="font-bold text-error">DELETE</span> to
                    confirm
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="max-w-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteAccount}
                    loading={isDeletingAccount}
                    disabled={deleteConfirmText !== "DELETE"}
                    className="bg-error hover:bg-error/90"
                  >
                    Delete My Account
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            onClick={handleSaveProfile}
            loading={isSaving}
            size="lg"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
