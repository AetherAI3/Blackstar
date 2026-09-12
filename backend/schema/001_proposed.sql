-- PROPOSAL ONLY. Not applied or verified against a database.
-- Separate private API schema. No public/anon/authenticated grants or policies supplied.
-- Applying this file alone intentionally grants no browser access.
begin;
create schema if not exists blackstar;
revoke all on schema blackstar from public;

create table blackstar.organizations (
  id uuid primary key,
  name text not null check (length(name) between 1 and 200),
  created_at timestamptz not null default now()
);
create table blackstar.memberships (
  organization_id uuid not null references blackstar.organizations(id),
  user_id uuid not null, -- Supabase Auth user ID; provider FK added at integration time.
  role text not null check (role in ('staff_admin','project_lead','client_approver','client_contributor')),
  status text not null check (status in ('invited','active','revoked')),
  primary key (organization_id,user_id)
);
create table blackstar.projects (
  organization_id uuid not null references blackstar.organizations(id),
  id uuid not null,
  name text not null,
  approver_user_id uuid not null,
  stage text not null default 'discovery',
  version integer not null default 1 check (version > 0),
  primary key (organization_id,id),
  foreign key (organization_id,approver_user_id) references blackstar.memberships(organization_id,user_id)
);
create table blackstar.project_access (
  organization_id uuid not null,
  project_id uuid not null,
  user_id uuid not null,
  primary key (organization_id,project_id,user_id),
  foreign key (organization_id,project_id) references blackstar.projects(organization_id,id),
  foreign key (organization_id,user_id) references blackstar.memberships(organization_id,user_id)
);
create table blackstar.invitations (
  id uuid primary key,
  organization_id uuid not null references blackstar.organizations(id),
  token_hash text not null unique, -- Only hashed, high-entropy single-use token.
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  role text not null check (role in ('client_approver','client_contributor'))
);
create table blackstar.quotes (
  organization_id uuid not null,
  project_id uuid not null,
  id uuid not null,
  version integer not null check (version > 0),
  mode text not null default 'proposal' check (mode in ('proposal','sandbox','live')),
  status text not null check (status in ('offered','accepted','superseded','expired')),
  catalog_version text not null,
  scope_digest text not null check (scope_digest ~ '^[a-f0-9]{64}$'),
  snapshot jsonb not null,
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  total_cents bigint not null check (total_cents > 0 and total_cents <= 9007199254740991),
  currency text not null check (currency = 'usd'),
  accepted_by uuid,
  accepted_at timestamptz,
  primary key (organization_id,project_id,id,version),
  foreign key (organization_id,project_id) references blackstar.projects(organization_id,id),
  foreign key (organization_id,accepted_by) references blackstar.memberships(organization_id,user_id),
  check ((status <> 'accepted') or (accepted_by is not null and accepted_at is not null))
);
create table blackstar.invoice_stages (
  organization_id uuid not null,
  project_id uuid not null,
  quote_id uuid not null,
  quote_version integer not null,
  stage_key text not null,
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 9007199254740991),
  approved_at timestamptz,
  primary key (organization_id,project_id,quote_id,quote_version,stage_key),
  foreign key (organization_id,project_id,quote_id,quote_version) references blackstar.quotes(organization_id,project_id,id,version)
);
create table blackstar.invoice_mirrors (
  organization_id uuid not null,
  project_id uuid not null,
  id uuid not null,
  quote_id uuid not null,
  quote_version integer not null,
  stage_key text not null,
  provider_account_id text not null,
  provider_customer_id text not null,
  provider_invoice_id text not null,
  livemode boolean not null,
  currency text not null check (currency = 'usd'),
  total_cents bigint not null check (total_cents >= 0 and total_cents <= 9007199254740991),
  provider_status text not null check (provider_status in ('draft','open','paid','void','uncollectible')),
  version integer not null default 0,
  last_reconciled_at timestamptz,
  primary key (organization_id,project_id,id),
  unique (provider_account_id,livemode,provider_invoice_id),
  unique (organization_id,project_id,quote_id,quote_version,stage_key),
  foreign key (organization_id,project_id,quote_id,quote_version,stage_key) references blackstar.invoice_stages(organization_id,project_id,quote_id,quote_version,stage_key)
);
create table blackstar.billing_journal (
  organization_id uuid not null,
  project_id uuid not null,
  invoice_id uuid not null,
  kind text not null check (kind in ('payment','refund','credit_note','processor_fee')),
  provider_fact_id text not null,
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 9007199254740991),
  related_payment_id text,
  recorded_at timestamptz not null default now(),
  primary key (organization_id,project_id,invoice_id,kind,provider_fact_id),
  foreign key (organization_id,project_id,invoice_id) references blackstar.invoice_mirrors(organization_id,project_id,id)
);
create table blackstar.event_inbox (
  provider_account_id text not null,
  livemode boolean not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null, -- Access restricted; minimum retained provider data.
  state text not null default 'pending' check (state in ('pending','processing','processed','failed','manual_review')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error_code text,
  received_at timestamptz not null default now(),
  primary key (provider_account_id,livemode,event_id)
);
create index event_inbox_pending on blackstar.event_inbox(next_attempt_at) where state in ('pending','failed');
create table blackstar.notice_outbox (
  id uuid primary key,
  organization_id uuid not null references blackstar.organizations(id),
  dedupe_key text not null unique,
  template_key text not null,
  recipient_user_id uuid not null,
  state text not null default 'pending' check (state in ('pending','accepted','failed','manual_review')),
  provider_message_id text,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now()
);
create table blackstar.assets (
  organization_id uuid not null,
  project_id uuid not null,
  id uuid not null,
  object_key text not null unique,
  display_filename text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 104857600),
  state text not null check (state in ('quarantine','clean','rejected')),
  content_digest text,
  primary key (organization_id,project_id,id),
  foreign key (organization_id,project_id) references blackstar.projects(organization_id,id)
);
create table blackstar.deliverables (
  organization_id uuid not null,
  project_id uuid not null,
  id uuid not null,
  version integer not null check (version > 0),
  content_digest text not null,
  status text not null check (status in ('draft','in_review','approved','superseded')),
  revision_limit integer not null check (revision_limit >= 0),
  rounds_used integer not null default 0 check (rounds_used >= 0 and rounds_used <= revision_limit),
  primary key (organization_id,project_id,id,version),
  foreign key (organization_id,project_id) references blackstar.projects(organization_id,id)
);
create table blackstar.feedback_rounds (
  organization_id uuid not null,
  project_id uuid not null,
  deliverable_id uuid not null,
  deliverable_version integer not null,
  round integer not null check (round > 0),
  author_id uuid not null,
  comments text not null check (length(comments) between 1 and 6000),
  primary key (organization_id,project_id,deliverable_id,deliverable_version,round),
  foreign key (organization_id,project_id,deliverable_id,deliverable_version) references blackstar.deliverables(organization_id,project_id,id,version),
  foreign key (organization_id,author_id) references blackstar.memberships(organization_id,user_id)
);

-- Safe starting posture: all tables deny direct access until reviewed policies/grants exist.
do $$ declare item record; begin
  for item in select tablename from pg_tables where schemaname = 'blackstar' loop
    execute format('alter table blackstar.%I enable row level security', item.tablename);
    execute format('alter table blackstar.%I force row level security', item.tablename);
  end loop;
end $$;
commit;
