-- Venue fee gets its own currency, same pattern as leagues.currency (0004) —
-- the amount is meaningless without it once a second currency exists.
alter table venues add column currency text not null default 'ILS';

-- One owner, at most one venue. Every venue-owner page resolves the venue with
-- `.eq('owner_id', uid).single()`, which silently breaks if this ever holds
-- two rows. It also makes the venues->profiles embed a true one-to-one.
create unique index venues_owner_id_key on venues (owner_id) where owner_id is not null;

-- 0006 described these two policies as scoping access. They don't: select on
-- venues and matches is already world-open via the pre-existing `using (true)`
-- policies, and Postgres ORs permissive policies together. They are kept as
-- documentation of owner intent (and so the world-open policies can be
-- tightened later without locking owners out), not as a restriction.
comment on policy "owners read own venue" on venues is
  'Redundant while the world-open select policy exists; kept so owner access survives tightening that policy.';
comment on policy "owners read matches assigned to their venue" on matches is
  'Redundant while the world-open select policy exists; kept so owner access survives tightening that policy.';
