'use client';

import { useState } from 'react';
import CopilotButton from './CopilotButton';
import CopilotPanel from './CopilotPanel';
import CopilotSettings from './CopilotSettings';
import { useDiagnostics } from '@/hooks/useDiagnostics';

export default function CopilotWrapper() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { alerts, dismissAlert } = useDiagnostics(15000);

  const activeAlertCount = alerts.filter((a) => !a.dismissed).length;

  return (
    <>
      {!isPanelOpen && (
        <CopilotButton onClick={() => setIsPanelOpen(true)} alertCount={activeAlertCount} />
      )}
      <CopilotPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        diagnosticAlerts={alerts}
        onDismissAlert={dismissAlert}
      />
      <CopilotSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
