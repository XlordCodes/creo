import React from "react";
import { PortalWrapper as CommonPortalWrapper } from "../common/AntigravityCanvas";

export default function PortalWrapper({ children }: { children: React.ReactNode }) {
  return <CommonPortalWrapper>{children}</CommonPortalWrapper>;
}

export { PortalWrapper };
