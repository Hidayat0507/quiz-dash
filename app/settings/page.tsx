"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Lock, Eye, Globe, Moon, Sun, Smartphone } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Email Notifications</h2>
                </div>
                <p className="text-sm text-gray-500">Receive email updates about your account activity</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Push Notifications</h2>
                </div>
                <p className="text-sm text-gray-500">Receive push notifications on your mobile device</p>
              </div>
              <Switch />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                </div>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Profile Visibility</h2>
                </div>
                <p className="text-sm text-gray-500">Control who can see your profile information</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Public Profile</h2>
                </div>
                <p className="text-sm text-gray-500">Make your profile visible to everyone</p>
              </div>
              <Switch />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Sun className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Light Mode</h2>
                </div>
                <p className="text-sm text-gray-500">Use light theme</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Moon className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Dark Mode</h2>
                </div>
                <p className="text-sm text-gray-500">Use dark theme</p>
              </div>
              <Switch />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}