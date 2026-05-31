"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/app/(app)/settings/actions";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushNotifications() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  // Inert until this deployment is configured with a VAPID key, and hidden on
  // browsers without push support (e.g. iOS Safari outside an installed PWA).
  if (!VAPID_PUBLIC_KEY || !supported) return null;

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications are blocked in your browser settings.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });
      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      setEnabled(true);
    } catch {
      setError("Couldn't enable notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setEnabled(false);
    } catch {
      setError("Couldn't turn off notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-[#00e8ff]" />
        <h2 className="font-display font-semibold text-base">Notifications</h2>
      </div>
      <p className="text-sm text-[#8a92b4]">
        Get a push notification on this device for new announcements, setlists,
        devotions, and when you&apos;re added to the schedule.
      </p>
      {error && (
        <p className="text-sm text-[#ff5566] bg-[#ff5566]/10 border border-[#ff5566]/30 rounded-lg p-2">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={enabled ? disable : enable}
        className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white font-semibold text-sm hover:bg-white/[0.08] transition disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        {enabled ? "Turn off on this device" : "Enable on this device"}
      </button>
    </div>
  );
}
