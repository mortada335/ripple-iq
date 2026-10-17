"use client";

import { useEffect, useState } from "react";
import { DEFAULT_ORGANIZATION, readDemoOrganization, type OrganizationProfile } from "./organization";

export function useOrganizationProfile() {
  const [organization, setOrganization] = useState<OrganizationProfile>(DEFAULT_ORGANIZATION);

  useEffect(() => {
    const sync = () => setOrganization(readDemoOrganization());
    sync();
    window.addEventListener("rippleiq:organization-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("rippleiq:organization-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return organization;
}
