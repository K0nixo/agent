-- Spusť tohle v Supabase: tvůj projekt -> SQL Editor -> New query -> vlož -> Run

create table if not exists app_data (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- Zapni Row Level Security a NEdávej žádný policy.
-- Tím se tabulka stane nepřístupná přes veřejný (anon) klíč.
-- Appka k ní sahá jen přes service_role klíč na serveru, kterej RLS obchází — takže to je bezpečný.
alter table app_data enable row level security;
