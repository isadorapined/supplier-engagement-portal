-- v3.1: every verified supplier is now `authenticated`, so the review
-- dashboard's "authenticated may read ..." policies and its status function
-- would hand every supplier every row. Builder's decision (25 Sep 2026):
-- scope them to accounts flagged app_metadata.role = 'reviewer', set by hand
-- on auth.users. app_metadata is writable only with the service role, so a
-- supplier cannot flag themselves. Nothing else about the dashboard changes.
--
-- Data fix applied alongside (execute_sql, not part of this migration):
--   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"reviewer"}'
--   where email = 'isadorapined@gmail.com';

drop policy "authenticated may read companies" on public.companies;
create policy "reviewer may read companies"
  on public.companies for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'reviewer');

drop policy "authenticated may read submissions" on public.submissions;
create policy "reviewer may read submissions"
  on public.submissions for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'reviewer');

drop policy "authenticated may read the status log" on public.submission_status_changes;
create policy "reviewer may read the status log"
  on public.submission_status_changes for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'reviewer');

-- Same body as dashboard_v1_set_submission_status, plus the reviewer check.
create or replace function public.set_submission_status(p_submission_id uuid, p_new_status text, p_reason text default null)
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid      uuid := auth.uid();
  v_email    text := nullif(auth.jwt() ->> 'email', '');
  v_current  text;
  v_reason   text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_uid is null then
    raise exception 'Not signed in.' using errcode = 'DL401';
  end if;

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'reviewer' then
    raise exception 'Only reviewers can change a submission''s status.' using errcode = 'DL403';
  end if;

  if p_new_status not in ('accepted', 'needs_review') then
    raise exception 'Status % cannot be set by hand.', p_new_status using errcode = 'DL422';
  end if;

  -- Locks the row for the life of the transaction, so two team members
  -- saving at once cannot both read 'new' and write two log entries.
  select status into v_current
    from public.submissions
   where id = p_submission_id
   for update;

  if v_current is null then
    raise exception 'Submission not found.' using errcode = 'DL422';
  end if;

  if v_current = 'superseded' then
    raise exception 'This submission has been superseded and is locked.' using errcode = 'DL409';
  end if;

  if v_current = p_new_status then
    raise exception 'The submission is already %.', p_new_status using errcode = 'DL422';
  end if;

  if p_new_status = 'needs_review' and v_reason is null then
    raise exception 'A reason is required for Needs review.' using errcode = 'DL422';
  end if;

  update public.submissions
     set status = p_new_status
   where id = p_submission_id;

  insert into public.submission_status_changes
    (submission_id, from_status, to_status, reason, changed_by, changed_by_email)
  values
    (p_submission_id, v_current, p_new_status, v_reason, v_uid, v_email);
end;
$function$;
