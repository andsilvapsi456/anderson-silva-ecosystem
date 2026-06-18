/** Cálculo de parcelas — usado pelo modal (preview) e pela action (criação). */

export interface InstallmentPreview {
  number: number;
  dueDate: string; // yyyy-mm-dd
  amountCents: number;
}

/** Divide em parcelas mensais iguais (resto de centavos vai na 1ª). */
export function splitInstallments(totalCents: number, parts: number, firstDue: string): InstallmentPreview[] {
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - base * parts;
  return Array.from({ length: parts }, (_, i) => {
    const d = new Date(`${firstDue}T12:00:00`);
    d.setMonth(d.getMonth() + i);
    return {
      number: i + 1,
      dueDate: d.toISOString().slice(0, 10),
      amountCents: base + (i === 0 ? remainder : 0),
    };
  });
}
