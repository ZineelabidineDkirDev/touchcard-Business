-- Validate requested consultation slots against published availability rules.
drop policy if exists healthcare_availability_select on public.healthcare_availability_rules;
create policy healthcare_availability_select on public.healthcare_availability_rules for select to anon,authenticated
using(private.is_org_member(organization_id) or exists(select 1 from public.cards c
 where c.organization_id=healthcare_availability_rules.organization_id and c.is_published
 and private.touchcard_public_module_enabled(healthcare_availability_rules.organization_id,c.id,'doctor_appointments')));

create or replace function public.touchcard_validate_healthcare_appointment()
returns trigger language plpgsql set search_path='' as $$
declare
 v_duration integer := 30;
 v_service_practitioner uuid;
 v_service_mode text;
 local_start timestamp;
 local_end timestamp;
 has_rules boolean;
 has_specific boolean;
 slot_allowed boolean;
begin
 if new.service_id is not null then
  select s.duration_minutes,s.practitioner_id,s.consultation_mode into v_duration,v_service_practitioner,v_service_mode
  from public.healthcare_services s where s.id=new.service_id and s.organization_id=new.organization_id and s.is_active and s.is_public;
  if not found then raise exception 'Selected healthcare service is unavailable'; end if;
  if v_service_practitioner is not null then
   if new.practitioner_id is not null and new.practitioner_id<>v_service_practitioner then raise exception 'Selected practitioner does not provide this service'; end if;
   new.practitioner_id:=v_service_practitioner;
  end if;
  new.consultation_mode:=v_service_mode;
 end if;
 new.ends_at:=new.starts_at+make_interval(mins=>v_duration);
 if new.practitioner_id is not null then
  select exists(select 1 from public.healthcare_availability_rules r where r.organization_id=new.organization_id and r.practitioner_id=new.practitioner_id) into has_rules;
  if has_rules then
   local_start:=new.starts_at at time zone 'Africa/Casablanca';
   local_end:=new.ends_at at time zone 'Africa/Casablanca';
   select exists(select 1 from public.healthcare_availability_rules r where r.organization_id=new.organization_id and r.practitioner_id=new.practitioner_id and r.specific_date=local_start::date) into has_specific;
   if has_specific then
    select exists(select 1 from public.healthcare_availability_rules r where r.organization_id=new.organization_id and r.practitioner_id=new.practitioner_id
     and r.specific_date=local_start::date and r.is_available and r.starts_at<=local_start::time and r.ends_at>=local_end::time
     and (r.location_id is null or r.location_id=new.location_id)) into slot_allowed;
   else
    select exists(select 1 from public.healthcare_availability_rules r where r.organization_id=new.organization_id and r.practitioner_id=new.practitioner_id
     and r.specific_date is null and r.day_of_week=extract(dow from local_start)::smallint and r.is_available
     and r.starts_at<=local_start::time and r.ends_at>=local_end::time and (r.location_id is null or r.location_id=new.location_id)) into slot_allowed;
   end if;
   if not slot_allowed then raise exception 'Requested time is outside the practitioner availability'; end if;
  end if;
 end if;
 return new;
end $$;
create trigger healthcare_appointment_validate_slot
before insert or update of starts_at,practitioner_id,service_id,location_id on public.healthcare_appointments
for each row execute function public.touchcard_validate_healthcare_appointment();
