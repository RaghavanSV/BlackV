import { useEffect, useState } from "react";

interface SettingsData {
  c2Host: string;
  c2Port: string;
  wsUrl: string;
  autoReconnect: boolean;

  beaconSleep: number;
  beaconJitter: number;
  encryptionKey: string;
  profileName: string;

  logRetention: number;
  notifications: boolean;
  soundAlerts: boolean;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    c2Host: "",
    c2Port: "",
    wsUrl: "",
    autoReconnect: true,
    beaconSleep: 5,
    beaconJitter: 20,
    encryptionKey: "",
    profileName: "",
    logRetention: 500,
    notifications: true,
    soundAlerts: false,
  });

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem("blackv-settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem("blackv-settings", JSON.stringify(settings));
    alert("Settings saved.");
  };

  const update = (key: keyof SettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-10">

        {/* ---------------------- */}
        {/* C2 SERVER SETTINGS */}
        {/* ---------------------- */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">C2 Server</h2>

          <div className="space-y-4">
            <InputField
              label="C2 Host"
              value={settings.c2Host}
              onChange={(v) => update("c2Host", v)}
            />

            <InputField
              label="C2 Port"
              value={settings.c2Port}
              onChange={(v) => update("c2Port", v)}
            />

            <InputField
              label="WebSocket URL"
              value={settings.wsUrl}
              onChange={(v) => update("wsUrl", v)}
              placeholder="ws://localhost:8080/ws"
            />

            <ToggleField
              label="Auto-Reconnect WebSocket"
              checked={settings.autoReconnect}
              onChange={(v) => update("autoReconnect", v)}
            />
          </div>
        </section>

        {/* ---------------------- */}
        {/* BEACON SETTINGS */}
        {/* ---------------------- */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Beacon Default Settings</h2>

          <div className="space-y-4">
            <InputField
              label="Sleep (seconds)"
              type="number"
              value={settings.beaconSleep}
              onChange={(v) => update("beaconSleep", Number(v))}
            />

            <InputField
              label="Jitter (%)"
              type="number"
              value={settings.beaconJitter}
              onChange={(v) => update("beaconJitter", Number(v))}
            />

            <InputField
              label="Encryption Key"
              value={settings.encryptionKey}
              onChange={(v) => update("encryptionKey", v)}
            />

            <InputField
              label="Default C2 Profile Name"
              value={settings.profileName}
              onChange={(v) => update("profileName", v)}
            />
          </div>
        </section>

        {/* ---------------------- */}
        {/* UI SETTINGS */}
        {/* ---------------------- */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">UI Settings</h2>

          <div className="space-y-4">
            <InputField
              label="Log Retention (max entries)"
              type="number"
              value={settings.logRetention}
              onChange={(v) => update("logRetention", Number(v))}
            />

            <ToggleField
              label="Enable Notifications"
              checked={settings.notifications}
              onChange={(v) => update("notifications", v)}
            />

            <ToggleField
              label="Enable Sound Alerts"
              checked={settings.soundAlerts}
              onChange={(v) => update("soundAlerts", v)}
            />
          </div>
        </section>

      </div>

      <button
        onClick={saveSettings}
        className="mt-10 bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold"
      >
        Save Settings
      </button>
    </div>
  );
}


/* ----------------------------------------- */
/* Reusable UI Components                   */
/* ----------------------------------------- */

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block mb-1 text-gray-300">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-900 p-2 rounded w-full border border-gray-700 focus:ring-2 focus:ring-blue-600 outline-none"
      />
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-300">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5"
      />
    </div>
  );
}
