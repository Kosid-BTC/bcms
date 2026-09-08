import React from "react";

import { AppCore } from "../../../../bcms-saas-platform.jsx";
import DisasterWorkshopApp from "./features/disaster/DisasterWorkshopApp";
import {
  TenantLoadingScreen,
  TenantNotFoundScreen,
  TenantProvider,
  useTenantBootstrap,
} from "./tenant/runtime";

export default function App() {
  if (window.location.pathname.startsWith("/disaster-workshop")) {
    return <DisasterWorkshopApp />;
  }

  return <TenantAwareApp />;
}

function TenantAwareApp() {
  const { tenant, loading, error } = useTenantBootstrap();

  if (loading) return <TenantLoadingScreen />;
  if (error === "not_found") return <TenantNotFoundScreen />;

  return (
    <TenantProvider value={tenant}>
      <AppCore tenant={tenant} />
    </TenantProvider>
  );
}
