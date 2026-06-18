import { PageHeader } from "@as/ui";
import { isDemoMode } from "@as/auth";
import { chargeMessageTemplate, getTimeBlocks } from "../../../lib/data";
import { getNotificationSettings } from "../../../lib/notifications/settings";
import { SettingsPanel } from "../../../components/settings-panel";
import { MfaSetup } from "../../../components/mfa-setup";
import { SystemHealth } from "../../../components/system-health";
import { ImportPatients } from "../../../components/import-patients";
import { TimeBlocksManager } from "../../../components/time-blocks-manager";

export default async function ConfiguracoesPage() {
  const [notificationSettings, timeBlocks] = await Promise.all([getNotificationSettings(), getTimeBlocks()]);
  return (
    <>
      <PageHeader
        title="Configurações da clínica"
        subtitle="Segurança, templates, notificações, dados e integrações — tudo em um lugar."
      />
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <MfaSetup demo={isDemoMode()} />
        <SystemHealth />
      </div>
      <div className="mb-5">
        <TimeBlocksManager blocks={timeBlocks} />
      </div>
      <div className="mb-5">
        <ImportPatients />
      </div>
      <SettingsPanel chargeTemplate={chargeMessageTemplate()} notificationSettings={notificationSettings} />
    </>
  );
}
