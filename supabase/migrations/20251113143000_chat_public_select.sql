-- Relax RLS to allow public (anon) SELECT on chat tickets and messages
-- This enables the unauthenticated ChatWidget to read ticket metadata and messages.

begin;

-- Chat tickets: allow public select
drop policy if exists "Authenticated users can view and update tickets" on public.chat_tickets;
create policy "Anyone can view tickets"
  on public.chat_tickets
  for select
  to public
  using (true);

-- Chat messages: allow public select
drop policy if exists "Authenticated users can view messages" on public.chat_messages;
create policy "Anyone can view messages"
  on public.chat_messages
  for select
  to public
  using (true);

commit;