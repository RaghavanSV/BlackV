import { useState, useEffect } from "react";
import { Save, RefreshCw, Plus, Trash2, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  fetchProfiles, 
  createProfile, 
  updateProfile, 
  deleteProfile, 
  Profile 
} from "@/services/api";

/**
 * Profiles Page
 * 
 * This page manages beacon execution profiles with JSON configurations.
 * 
 * BACKEND INTEGRATION:
 * - GET /api/profiles - Fetches all profiles
 * - POST /api/profiles - Creates a new profile
 * - PUT /api/profiles/:profileId - Updates a profile
 * - DELETE /api/profiles/:profileId - Deletes a profile
 * 
 * Expected JSON Response from GET /api/profiles:
 * [
 *   {
 *     "id": "default",
 *     "name": "Default Profile",
 *     "description": "Standard beacon configuration",
 *     "config": {
 *       "callbackInterval": 30,
 *       "jitter": 20,
 *       "maxRetries": 3,
 *       "timeout": 10,
 *       "userAgent": "Mozilla/5.0...",
 *       "encryption": true,
 *       "antiForensics": false
 *     }
 *   }
 * ]
 */

const defaultConfig = {
  callbackInterval: 30,
  jitter: 20,
  maxRetries: 3,
  timeout: 10,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  encryption: true,
  antiForensics: false
};

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [jsonValue, setJsonValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDescription, setNewProfileDescription] = useState("");
  const [copied, setCopied] = useState(false);

  /**
   * Load profiles from the backend API
   */
  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProfiles();
      setProfiles(data);
      if (data.length > 0 && !selectedProfile) {
        setSelectedProfile(data[0]);
        setJsonValue(JSON.stringify(data[0].config, null, 2));
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonValue);
      setCopied(true);
      toast.success("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile);
    setJsonValue(JSON.stringify(profile.config, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e) {
      setJsonError("Invalid JSON format");
    }
  };

  /**
   * Save profile changes to the backend
   * Sends PUT /api/profiles/:profileId
   */
  const handleSave = async () => {
    if (jsonError || !selectedProfile) {
      toast.error("Cannot save: Invalid JSON format");
      return;
    }

    setIsSaving(true);
    try {
      const updatedConfig = JSON.parse(jsonValue);
      const updated = await updateProfile(selectedProfile.id, {
        ...selectedProfile,
        config: updatedConfig,
      });
      
      const updatedProfiles = profiles.map(p => 
        p.id === selectedProfile.id ? updated : p
      );
      setProfiles(updatedProfiles);
      setSelectedProfile(updated);
      
      toast.success(`Profile "${selectedProfile.name}" saved successfully`);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Create a new profile
   * Sends POST /api/profiles
   */
  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error("Profile name is required");
      return;
    }

    try {
      const newProfile = await createProfile({
        name: newProfileName.trim(),
        description: newProfileDescription.trim() || "Custom beacon profile",
        config: { ...defaultConfig },
      });

      setProfiles([...profiles, newProfile]);
      setSelectedProfile(newProfile);
      setJsonValue(JSON.stringify(newProfile.config, null, 2));
      setJsonError(null);
      setIsDialogOpen(false);
      setNewProfileName("");
      setNewProfileDescription("");
      
      toast.success(`Profile "${newProfile.name}" created successfully`);
    } catch (error) {
      console.error('Failed to create profile:', error);
      toast.error("Failed to create profile");
    }
  };

  /**
   * Delete a profile
   * Sends DELETE /api/profiles/:profileId
   */
  const handleDeleteProfile = async (profileId: string) => {
    const profileToDelete = profiles.find(p => p.id === profileId);
    if (!profileToDelete) return;

    try {
      await deleteProfile(profileId);
      
      const updatedProfiles = profiles.filter(p => p.id !== profileId);
      setProfiles(updatedProfiles);
      
      if (selectedProfile?.id === profileId) {
        if (updatedProfiles.length > 0) {
          setSelectedProfile(updatedProfiles[0]);
          setJsonValue(JSON.stringify(updatedProfiles[0].config, null, 2));
        } else {
          setSelectedProfile(null);
          setJsonValue("");
        }
      }
      
      toast.success(`Profile "${profileToDelete.name}" deleted`);
    } catch (error) {
      console.error('Failed to delete profile:', error);
      toast.error("Failed to delete profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Profiles</h1>
          <p className="text-muted-foreground">Configure execution profiles and beacon settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadProfiles}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              New Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Profile</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a new beacon profile with default configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-foreground">Profile Name</Label>
                <Input
                  id="profile-name"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g., Low Profile"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-description" className="text-foreground">Description</Label>
                <Input
                  id="profile-description"
                  value={newProfileDescription}
                  onChange={(e) => setNewProfileDescription(e.target.value)}
                  placeholder="e.g., Configuration for low-visibility operations"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProfile} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Create Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Selector */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Select Profile</CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose a profile to edit its configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {profiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No profiles yet. Create one to get started.
              </div>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`relative group w-full text-left p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedProfile?.id === profile.id
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => handleProfileSelect(profile)}
                >
                  <div className="font-medium text-foreground pr-8">{profile.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">{profile.description}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProfile(profile.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* JSON Editor */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">
              {selectedProfile?.name || "Profile"} Configuration
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Edit the JSON configuration for the selected beacon profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProfile ? (
              <>
                <div className="relative">
                  <Textarea
                    value={jsonValue}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className={`min-h-[400px] font-mono text-sm bg-background border-border text-foreground resize-none ${
                      jsonError ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                    placeholder="Loading configuration..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-muted/80 hover:bg-muted"
                    onClick={handleCopyJson}
                    title="Copy JSON"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {jsonError && (
                    <div className="absolute bottom-2 left-2 text-sm text-destructive bg-destructive/10 px-2 py-1 rounded">
                      {jsonError}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Profile ID: <code className="bg-muted px-2 py-1 rounded">{selectedProfile?.id}</code>
                  </div>
                  <Button 
                    onClick={handleSave} 
                    disabled={!!jsonError || isSaving}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Profile
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Select a profile to edit its configuration
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
