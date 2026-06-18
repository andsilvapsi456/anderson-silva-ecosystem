export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "PSYCHOLOGIST" | "SECRETARY" | "COORDINATOR" | "PATIENT";
};

/**
 * Modo demo: ativo quando o Supabase ainda não foi configurado.
 * Permite rodar o ecossistema inteiro localmente com dados fictícios,
 * sem nenhuma conta externa — custo zero até o primeiro deploy.
 */
export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export const DEMO_PATIENT: SessionUser = {
  id: "demo-patient",
  email: "paciente@demo.com",
  name: "Mariana Costa",
  role: "PATIENT",
};

export const DEMO_ADMIN: SessionUser = {
  id: "demo-admin",
  email: "anderson@demo.com",
  name: "Anderson Silva",
  role: "ADMIN",
};
