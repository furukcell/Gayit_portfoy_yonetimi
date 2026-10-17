-- Tighten CRM write access after reviewing agent reassignment and notification updates.
-- Apply after migrations 001-004.

-- Agents may edit activity records only while the customer is still assigned to them.
-- This prevents a former assignee from changing history after a customer is reassigned.
drop policy if exists customer_activities_update_by_role on public.customer_activities;
create policy customer_activities_update_by_role
on public.customer_activities for update to authenticated
using (
  public.is_office_owner(office_id)
  or (
    public.is_office_agent(office_id)
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.customers c
      where c.id = customer_activities.customer_id
        and c.office_id = customer_activities.office_id
        and c.assigned_agent_id = (select auth.uid())
    )
  )
)
with check (
  public.is_office_owner(office_id)
  or (
    public.is_office_agent(office_id)
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.customers c
      where c.id = customer_activities.customer_id
        and c.office_id = customer_activities.office_id
        and c.assigned_agent_id = (select auth.uid())
    )
  )
);

-- Clients should only mark their own notification as read, not rewrite its content or links.
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

