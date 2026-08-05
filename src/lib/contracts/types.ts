export interface CompanyData {
  name: string;
  managing_director: string;
  address: string;
  commercial_register: string;
  tax_number: string;
  logo_url: string;
  signature_url: string;
  city: string;
}

export interface ContractRecord {
  id: string;
  contract_number: string;
  template_id: string | null;
  status: string;
  version: number;
  employee_user_id: string | null;

  first_name: string;
  last_name: string;
  birth_date: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  social_security_number: string | null;
  nationality: string | null;
  iban: string | null;
  bic: string | null;

  position: string | null;
  department: string | null;
  start_date: string | null;
  is_temporary: boolean;
  end_date: string | null;
  probation_months: number | null;
  weekly_hours: number | null;
  work_location: string | null;
  salary: number | null;
  bonus: string | null;
  vacation_days: number | null;
  notice_period: string | null;
  working_hours: string | null;
  other_agreements: string | null;

  company: CompanyData | Record<string, unknown>;

  signature_employee: string | null;
  signature_employer: string | null;
  signed_employee_at: string | null;
  signed_employer_at: string | null;

  rendered_body: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  body: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const CONTRACT_STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "Entwurf", className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
  final: { label: "Final", className: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  signed: { label: "Unterschrieben", className: "bg-[#00CC36]/15 text-[#00CC36] border-[#00CC36]/30" },
  archived: { label: "Archiviert", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
};

export const EMPTY_COMPANY: CompanyData = {
  name: "METROPOL TOURS GmbH",
  managing_director: "",
  address: "",
  commercial_register: "",
  tax_number: "",
  logo_url: "",
  signature_url: "",
  city: "Hannover",
};
