"use client";

import { useEffect, useState } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

function getDeviceType(width: number): DeviceType {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  useEffect(() => {
    function updateDeviceType() {
      setDeviceType(getDeviceType(window.innerWidth));
    }

    updateDeviceType();
    window.addEventListener("resize", updateDeviceType);
    return () => window.removeEventListener("resize", updateDeviceType);
  }, []);

  return deviceType;
}
