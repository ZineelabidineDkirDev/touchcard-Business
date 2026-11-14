import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAvailabilityRule, setBusinessAvailabilityRuleState, updateAppointmentStatus } from "@/app/actions/business-modules";
import {
  createHealthcareAvailability, setHealthcareAvailabilityRuleState,
  updateHealthcareAppointmentStatus, updateRentalBookingStatus,
} from "@/app/actions/industry-modules";

const TZ = "Africa/Casablanca";
const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const weekdayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const statusLabels: Record<string,string> = {
  pending:"En attente", confirmed:"Confirmée", active:"En cours", in_progress:"En cours",
  completed:"Terminée", cancelled:"Annulée", rejected:"Refusée", planned:"Planifiée",
};
const typeLabels: Record<string,string> = { business:"Rendez-vous", healthcare:"Santé", rental:"Location", maintenance:"Entretien" };
type CalendarEvent = {
  id:string; type:string; title:string; detail:string; status:string;
  startKey:string; endKey:string; time?:string; phone?:string;
};

function localDateKey(value:string|Date) {
  const parts = new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(value));
  const get=(name:string)=>parts.find((part)=>part.type===name)?.value||"";
  return get("year")+"-"+get("month")+"-"+get("day");
}
function casablancaLocalToIso(value:string) {
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if(!match)return new Date(value).toISOString();
  const [,y,m,d,h,min]=match;
  const desired=Date.UTC(Number(y),Number(m)-1,Number(d),Number(h),Number(min));
  let guess=new Date(desired);
  for(let i=0;i<3;i++){
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(guess);
    const get=(key:string)=>Number(parts.find((part)=>part.type===key)?.value||0);
    const observed=Date.UTC(get("year"),get("month")-1,get("day"),get("hour"),get("minute"),get("second"));
    guess=new Date(guess.getTime()+desired-observed);
  }
  return guess.toISOString();
}
function localTime(value:string) {
  return new Date(value).toLocaleTimeString("fr-FR",{timeZone:TZ,hour:"2-digit",minute:"2-digit"});
}
function dateLabel(value:string) {
  return new Date(value+"T12:00:00Z").toLocaleDateString("fr-FR",{timeZone:TZ,day:"numeric",month:"short"});
}
function monthFromNow() { return localDateKey(new Date()).slice(0,7); }
function shiftMonth(value:string,delta:number) {
  const [year,month]=value.split("-").map(Number);
  const date=new Date(Date.UTC(year,month-1+delta,1));
  return date.toISOString().slice(0,7);
}
function monthDays(value:string) {
  const [year,month]=value.split("-").map(Number);
  const count=new Date(Date.UTC(year,month,0)).getUTCDate();
  const mondayOffset=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7;
  return {year,month,count,mondayOffset,first:new Date(Date.UTC(year,month-1,1)).toISOString(),next:new Date(Date.UTC(year,month,1)).toISOString(),last:new Date(Date.UTC(year,month,count)).toISOString().slice(0,10)};
}
function eachDate(start:string,end:string) {
  const values:string[]=[];
  const cursor=new Date(start+"T12:00:00Z");
  const limit=new Date(end+"T12:00:00Z");
  for(let i=0;i<40&&cursor<=limit;i++){values.push(cursor.toISOString().slice(0,10));cursor.setUTCDate(cursor.getUTCDate()+1);}
  return values;
}
function monthHref(month:string,status:string,type:string) {
  const params=new URLSearchParams({month});
  if(status!=="all")params.set("status",status);
  if(type!=="all")params.set("type",type);
  return "/dashboard/calendar?"+params.toString();
}
function EventStatusForm({event}:{event:CalendarEvent}) {
  const action=event.type==="healthcare"?updateHealthcareAppointmentStatus:event.type==="rental"?updateRentalBookingStatus:updateAppointmentStatus;
  const statuses=event.type==="rental"?["pending","confirmed","active","completed","rejected","cancelled"]:["pending","confirmed","completed","rejected","cancelled"];
  return <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
    <input type="hidden" name="id" value={event.id}/>
    <select name="status" defaultValue={event.status} aria-label="Statut de la réservation" className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
      {statuses.map((status)=><option key={status} value={status}>{statusLabels[status]||status}</option>)}
    </select>
    <button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">Enregistrer</button>
  </form>;
}

export default async function CalendarPage({searchParams}:{searchParams:Promise<{month?:string;status?:string;type?:string}>}) {
  await connection();
  const params=await searchParams;
  const month=/^\\d{4}-(0[1-9]|1[0-2])$/.test(params.month||"")?params.month!:monthFromNow();
  const statusFilter=["all","pending","confirmed","active","in_progress","completed","cancelled","rejected"].includes(params.status||"")?params.status||"all":"all";
  const typeFilter=["all","business","healthcare","rental","maintenance"].includes(params.type||"")?params.type||"all":"all";
  const {first,next,count,mondayOffset,last}=monthDays(month);
  const monthEndExclusive=new Date(new Date(last+"T12:00:00Z").getTime()+86400000).toISOString().slice(0,10);
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login");
  const {data:membership}=await supabase.from("organization_members").select("organization_id,role").eq("user_id",user.id).limit(1).maybeSingle();
  if(!membership?.organization_id)notFound();
  if(!["organization_admin","manager","super_admin"].includes(String(membership.role)))notFound();
  const organizationId=membership.organization_id;
  const {data:organization}=await supabase.from("organizations").select("name,workspace_config").eq("id",organizationId).maybeSingle();
  const config=(organization?.workspace_config??{}) as {version?:number;modules?:string[]};
  const modules=Array.isArray(config.modules)?config.modules:[];
  const enabled=(module:string)=>!config.version||modules.includes(module);
  const canBusiness=enabled("bookings")||enabled("doctor_appointments");
  const canAvailability=enabled("availability_calendar");
  const canHealth=enabled("doctor_appointments");
  const canRental=enabled("car_rental");
  if(!canBusiness&&!canHealth&&!canRental)notFound();

  const [businessResult,healthResult,rentalResult,maintenanceResult,businessRulesResult,healthRulesResult,vehiclesResult,practitionersResult,servicesResult,locationsResult]=await Promise.all([
    canBusiness?supabase.from("business_appointments").select("id,customer_name,customer_phone,appointment_type,starts_at,ends_at,status,party_size,message").eq("organization_id",organizationId).gte("starts_at",rangeStart).lt("starts_at",rangeEnd).order("starts_at"):Promise.resolve({data:[] as any[]}),
    canHealth?supabase.from("healthcare_appointments").select("id,patient_name,patient_phone,practitioner_id,service_id,starts_at,ends_at,status").eq("organization_id",organizationId).gte("starts_at",first).lt("starts_at",next).order("starts_at"):Promise.resolve({data:[] as any[]}),
    canRental?supabase.from("rental_bookings").select("id,vehicle_id,customer_name,customer_phone,pickup_date,return_date,status,total_amount,currency").eq("organization_id",organizationId).lte("pickup_date",last).gt("return_date",month.slice(0,7)+"-01").order("pickup_date"):Promise.resolve({data:[] as any[]}),
    canRental?supabase.from("rental_maintenance").select("id,vehicle_id,title,scheduled_start,scheduled_end,status").eq("organization_id",organizationId).lte("scheduled_start",last).gte("scheduled_end",month.slice(0,7)+"-01").order("scheduled_start"):Promise.resolve({data:[] as any[]}),
    canAvailability?supabase.from("business_availability_rules").select("*").eq("organization_id",organizationId).order("day_of_week").order("starts_at"):Promise.resolve({data:[] as any[]}),
    canHealth?supabase.from("healthcare_availability_rules").select("*").eq("organization_id",organizationId).order("day_of_week").order("starts_at"):Promise.resolve({data:[] as any[]}),
    canRental?supabase.from("rental_vehicles").select("id,brand,model").eq("organization_id",organizationId):Promise.resolve({data:[] as any[]}),
    canHealth?supabase.from("healthcare_practitioners").select("id,full_name").eq("organization_id",organizationId).order("full_name"):Promise.resolve({data:[] as any[]}),
    canHealth?supabase.from("healthcare_services").select("id,name").eq("organization_id",organizationId):Promise.resolve({data:[] as any[]}),
    canHealth?supabase.from("healthcare_locations").select("id,name").eq("organization_id",organizationId):Promise.resolve({data:[] as any[]}),
  ]);
  const vehicleName=(id:string)=>{const v=(vehiclesResult.data??[]).find((x:any)=>x.id===id);return v?v.brand+" "+v.model:"Véhicule";};
  const practitionerName=(id:string|null)=>{const p=(practitionersResult.data??[]).find((x:any)=>x.id===id);return p?.full_name||"Praticien à attribuer";};
  const serviceName=(id:string|null)=>{const s=(servicesResult.data??[]).find((x:any)=>x.id===id);return s?.name||"Consultation";};
  const events:CalendarEvent[]=[];
  for(const item of businessResult.data??[])events.push({id:item.id,type:"business",title:item.customer_name,detail:(item.appointment_type==="restaurant_booking"?"Réservation restaurant":"Rendez-vous")+(item.party_size?" · "+item.party_size+" pers.":"") ,status:item.status,startKey:localDateKey(item.starts_at),endKey:localDateKey(item.ends_at||item.starts_at),time:localTime(item.starts_at),phone:item.customer_phone});
  for(const item of healthResult.data??[])events.push({id:item.id,type:"healthcare",title:item.patient_name,detail:serviceName(item.service_id)+" · "+practitionerName(item.practitioner_id),status:item.status,startKey:localDateKey(item.starts_at),endKey:localDateKey(item.ends_at),time:localTime(item.starts_at),phone:item.patient_phone});
  for(const item of rentalResult.data??[])events.push({id:item.id,type:"rental",title:item.customer_name,detail:vehicleName(item.vehicle_id)+" · "+dateLabel(item.pickup_date)+" → "+dateLabel(item.return_date),status:item.status,startKey:item.pickup_date,endKey:(()=>{const d=new Date(item.return_date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);})(),phone:item.customer_phone});
  for(const item of maintenanceResult.data??[])events.push({id:item.id,type:"maintenance",title:item.title,detail:vehicleName(item.vehicle_id),status:item.status,startKey:item.scheduled_start,endKey:item.scheduled_end});
  const filtered=events.filter((event)=> (statusFilter==="all"||event.status===statusFilter)&&(typeFilter==="all"||event.type===typeFilter));
  const eventDates=new Map<string,CalendarEvent[]>();
  for(const event of filtered){for(const date of eachDate(event.startKey,event.endKey)){if(date.slice(0,7)!==month)continue;const list=eventDates.get(date)||[];list.push(event);eventDates.set(date,list);}}
  const upcoming=[...filtered].sort((a,b)=>(a.startKey+a.time).localeCompare(b.startKey+b.time));
  const pending=events.filter((event)=>event.status==="pending").length;
  const monthTitle=new Date(first).toLocaleDateString("fr-FR",{timeZone:TZ,month:"long",year:"numeric"});
  const vehicles=vehiclesResult.data??[];
  const practitioners=practitionersResult.data??[];
  const locations=locationsResult.data??[];
  const businessRules=businessRulesResult.data??[];
  const healthRules=healthRulesResult.data??[];

  return <div className="mx-auto max-w-7xl space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-indigo-600">Espace client · {organization?.name||"TouchCard"}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Calendrier & disponibilités</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Centralisez les rendez-vous, locations et périodes d’indisponibilité de votre activité.</p></div>
      <Link href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Retour au tableau de bord</Link>
    </header>

    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Événements du mois" value={events.filter((e)=>e.startKey.slice(0,7)===month).length}/><Metric label="Demandes en attente" value={pending}/><Metric label="Disponibilités actives" value={businessRules.filter((r:any)=>r.is_available).length+healthRules.filter((r:any)=>r.is_available).length}/></div>

    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-black capitalize text-slate-950">{monthTitle}</h2><p className="mt-1 text-xs text-slate-500">Fuseau horaire : Maroc · Africa/Casablanca</p></div>
        <div className="flex items-center gap-2"><Link href={monthHref(shiftMonth(month,-1),statusFilter,typeFilter)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">←</Link><Link href={monthHref(monthFromNow(),"all","all")} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Aujourd’hui</Link><Link href={monthHref(shiftMonth(month,1),statusFilter,typeFilter)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">→</Link></div>
      </div>
      <form method="get" className="mt-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input type="month" name="month" defaultValue={month} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><select name="status" defaultValue={statusFilter} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="all">Tous les statuts</option>{Object.entries(statusLabels).filter(([key])=>key!=="planned").map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><select name="type" defaultValue={typeFilter} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="all">Toutes les activités</option>{Object.entries(typeLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white sm:col-span-3">Appliquer les filtres</button></form>
      <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">{days.map((day)=><div key={day} className="px-1 py-2 text-center text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">{day}</div>)}{Array.from({length:mondayOffset},(_,i)=><div key={"blank-"+i} className="min-h-24 rounded-xl bg-slate-50/60 sm:min-h-28"/>)}
        {Array.from({length:count},(_,i)=>{const date=month+"-"+String(i+1).padStart(2,"0");const dayEvents=eventDates.get(date)||[];return <div key={date} className={"min-h-24 overflow-hidden rounded-xl border p-1.5 sm:min-h-28 sm:p-2 "+(date===localDateKey(new Date())?"border-indigo-300 bg-indigo-50/50":"border-slate-100 bg-white")}><p className="text-xs font-black text-slate-700">{i+1}</p><div className="mt-1 space-y-1">{dayEvents.slice(0,3).map((event,index)=><div key={event.type+"-"+event.id+"-"+date} title={event.title+" · "+event.detail} className={"truncate rounded-md px-1.5 py-1 text-[9px] font-bold sm:text-[10px] "+(event.type==="rental"?"bg-violet-50 text-violet-700":event.type==="healthcare"?"bg-emerald-50 text-emerald-700":event.type==="maintenance"?"bg-amber-50 text-amber-800":"bg-indigo-50 text-indigo-700")}>{event.time?event.time+" ":""}{event.title}</div>)}{dayEvents.length>3&&<p className="px-1 text-[9px] font-bold text-slate-400">+{dayEvents.length-3} autres</p>}</div></div>})}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500"><Legend color="bg-indigo-500" label="Rendez-vous"/><Legend color="bg-emerald-500" label="Santé"/><Legend color="bg-violet-500" label="Location"/><Legend color="bg-amber-500" label="Entretien"/></div>
    </section>

    <section className="space-y-3"><div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-black text-slate-950">Événements du mois</h2><p className="mt-1 text-sm text-slate-500">Consultez les détails et mettez à jour le statut de chaque demande.</p></div><span className="text-xs font-bold text-slate-400">{upcoming.length} résultat(s)</span></div>
      {upcoming.map((event)=><article key={event.type+"-"+event.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{event.title}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{typeLabels[event.type]}</span><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">{statusLabels[event.status]||event.status}</span></div><p className="mt-1 text-xs text-slate-500">{event.startKey===event.endKey?dateLabel(event.startKey):dateLabel(event.startKey)+" → "+dateLabel(event.endKey)}{event.time?" · "+event.time:""} · {event.detail}</p>{event.phone&&<p className="mt-1 text-xs text-slate-500">Téléphone : <a href={"tel:"+event.phone} className="font-semibold text-indigo-700">{event.phone}</a></p>}</div>{event.type==="maintenance"?<span className="text-xs font-semibold text-amber-700">Indisponibilité</span>:<EventStatusForm event={event}/>}</div></article>)}
      {!upcoming.length&&<Empty text="Aucun événement ne correspond à cette période et à ces filtres."/>}
    </section>

    {(canAvailability||canHealth)&&<section className="grid gap-5 xl:grid-cols-2">
      {canAvailability&&<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><Heading title="Horaires généraux" description="Définissez les jours et plages horaires ouverts à la réservation."/>
        <form action={createAvailabilityRule} className="mt-4 grid gap-2 sm:grid-cols-2"><select name="day_of_week" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">{weekdayNames.map((day,index)=><option key={day} value={index}>{day}</option>)}</select><input name="specific_date" type="date" aria-label="Date exceptionnelle" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><label className="text-xs text-slate-500">Ouverture<input name="starts_at" type="time" required defaultValue="09:00" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label><label className="text-xs text-slate-500">Fermeture<input name="ends_at" type="time" required defaultValue="18:00" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label><label className="text-xs text-slate-500">Durée d’un créneau (min)<input name="slot_minutes" type="number" min="5" max="240" defaultValue="30" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label><label className="text-xs text-slate-500">Capacité simultanée<input name="capacity" type="number" min="1" max="500" defaultValue="1" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label><button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white sm:col-span-2">Ajouter cette disponibilité</button></form>
        <div className="mt-4 space-y-2">{businessRules.map((rule:any)=><AvailabilityCard key={rule.id} id={rule.id} title={rule.specific_date||weekdayNames[rule.day_of_week??0]} detail={String(rule.starts_at).slice(0,5)+" – "+String(rule.ends_at).slice(0,5)+" · "+rule.slot_minutes+" min · capacité "+rule.capacity} available={rule.is_available} action={setBusinessAvailabilityRuleState}/>) }{!businessRules.length&&<Empty text="Aucun horaire général configuré."/>}</div>
      </div>}
      {canHealth&&<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><Heading title="Disponibilités des praticiens" description="Configurez des horaires récurrents ou des exceptions par praticien."/>
        <form action={createHealthcareAvailability} className="mt-4 grid gap-2 sm:grid-cols-2"><select name="practitioner_id" required className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Choisir un praticien</option>{practitioners.map((p:any)=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select><select name="location_id" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Lieu non défini</option>{locations.map((l:any)=><option key={l.id} value={l.id}>{l.name}</option>)}</select><select name="day_of_week" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">{weekdayNames.map((day,index)=><option key={day} value={index}>{day}</option>)}</select><input name="specific_date" type="date" aria-label="Date exceptionnelle" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><label className="text-xs text-slate-500">Début<input name="starts_at" type="time" required defaultValue="09:00" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label><label className="text-xs text-slate-500">Fin<input name="ends_at" type="time" required defaultValue="17:00" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label><label className="text-xs text-slate-500">Durée (min)<input name="slot_minutes" type="number" min="5" max="720" defaultValue="30" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label><button disabled={!practitioners.length} className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Enregistrer les horaires</button></form>
        <div className="mt-4 space-y-2">{healthRules.map((rule:any)=>{const practitioner=practitioners.find((p:any)=>p.id===rule.practitioner_id);return <AvailabilityCard key={rule.id} id={rule.id} title={practitioner?.full_name||"Praticien"} detail={(rule.specific_date||weekdayNames[rule.day_of_week??0])+" · "+String(rule.starts_at).slice(0,5)+" – "+String(rule.ends_at).slice(0,5)+" · "+rule.slot_minutes+" min"} available={rule.is_available} action={setHealthcareAvailabilityRuleState}/>})}{!healthRules.length&&<Empty text="Aucun horaire de praticien configuré."/>}</div>
      </div>}
    </section>}
    {canRental&&<section className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><p className="text-sm font-bold text-violet-950">Gestion des locations et entretiens</p><p className="mt-1 text-xs leading-5 text-violet-900">Les réservations et entretiens bloquent les dates concernées. Pour ajouter un véhicule ou planifier un entretien, utilisez la gestion de flotte.</p><Link href="/dashboard/rentals" className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-bold text-violet-800">Ouvrir la gestion de flotte →</Link></section>}
  </div>;
}

function Metric({label,value}:{label:string;value:number}){return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div>}
function Heading({title,description}:{title:string;description:string}){return <div><h2 className="text-lg font-black text-slate-950">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p></div>}
function Empty({text}:{text:string}){return <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">{text}</p>}
function Legend({color,label}:{color:string;label:string}){return <span className="inline-flex items-center gap-1.5"><span className={"h-2 w-2 rounded-full "+color}/>{label}</span>}
function AvailabilityCard({id,title,detail,available,action}:{id:string;title:string;detail:string;available:boolean;action:(data:FormData)=>void|Promise<void>}){return <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"><div className="min-w-0"><p className="text-sm font-bold text-slate-800">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><form action={action}><input type="hidden" name="id" value={id}/><input type="hidden" name="is_available" value={available?"false":"true"}/><button className={"rounded-lg px-3 py-2 text-xs font-bold "+(available?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600")}>{available?"Disponible · Bloquer":"Bloquée · Réactiver"}</button></form></div>}
