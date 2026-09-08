import React from "react";

import { AppCore } from "../../../../bcms-saas-platform.jsx";
import DisasterWorkshopApp from "./features/disaster/DisasterWorkshopApp";
import WorkshopAttendanceApp from "./features/disaster/WorkshopAttendanceApp";
import {
  TenantLoadingScreen,
  TenantNotFoundScreen,
  TenantProvider,
  useTenantBootstrap,
} from "./tenant/runtime";

export default function App() {
  if (window.location.pathname.startsWith("/disaster-workshop")) {
    return <WorkshopTenantAwareApp />;
  }

  return <TenantAwareApp />;
}

function WorkshopTenantAwareApp() {
  const { tenant, loading, error } = useTenantBootstrap();

  if (loading) return <TenantLoadingScreen />;
  if (error === "not_found") return <TenantNotFoundScreen />;

  const isAttendance = window.location.pathname.startsWith("/disaster-workshop/attendance");

  return (
    <TenantProvider value={tenant}>
      {isAttendance ? <WorkshopAttendanceApp tenant={tenant} /> : <DisasterWorkshopApp tenant={tenant} />}
    </TenantProvider>
  );
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
