import { submitPublicHealthcareAppointment, submitPublicRentalBooking } from "@/app/actions/public-industry-modules";

type RentalVehicle={id:string;brand:string;model:string;category:string;model_year:number|null;seats:number;transmission:string;fuel_type:string;daily_rate:number;currency:string;description:string|null;image_url:string|null;base_location_id:string|null};
type IndustryLocation={id:string;name:string;city:string|null;address:string|null};
type Practitioner={id:string;full_name:string;professional_title:string|null;specialty:string|null;biography:string|null;avatar_url:string|null;languages:string[]};
type HealthcareService={id:string;name:string;specialty:string|null;description:string|null;duration_minutes:number;price:number|null;currency:string;consultation_mode:string;image_url:string|null;practitioner_id:string|null};
type Availability={id:string;practitioner_id:string;day_of_week:number|null;specific_date:string|null;starts_at:string;ends_at:string;slot_minutes:number};

export function PublicIndustryModules({slug,accent,vehicles,rentalLocations,practitioners,services,healthLocations,availability}:{slug:string;accent:string;vehicles:RentalVehicle[];rentalLocations:IndustryLocation[];practitioners:Practitioner[];services:HealthcareService[];healthLocations:IndustryLocation[];availability:Availability[]}){
 const button={backgroundColor:accent};
 return <>
  {vehicles.length>0&&<section className="rounded-2xl bg-white p-4">
   <div className="flex items-end justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[.16em]" style={{color:accent}}>Location automobile</p><h2 className="mt-1 text-lg font-black text-slate-950">Nos véhicules</h2><p className="mt-1 text-xs text-slate-500">Choisissez votre véhicule et envoyez une demande de location.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{vehicles.length} véhicule{vehicles.length>1?"s":""}</span></div>
   <div className="mt-4 space-y-4">{vehicles.map((vehicle)=> <article key={vehicle.id} className="overflow-hidden rounded-2xl border border-slate-100">
    {vehicle.image_url?<img src={vehicle.image_url} alt={vehicle.brand+" "+vehicle.model} loading="lazy" className="h-44 w-full object-cover"/>:<div className="flex h-36 items-center justify-center bg-slate-50 text-5xl">🚘</div>}
    <div className="p-3"><div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-black text-slate-950">{vehicle.brand} {vehicle.model}</h3><p className="mt-1 text-[11px] text-slate-500">{vehicle.model_year||"Récent"} · {vehicle.seats} places · {vehicle.transmission==="automatic"?"Automatique":"Manuelle"} · {vehicle.fuel_type}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{vehicle.category}</span></div>
     {vehicle.description&&<p className="mt-2 text-xs leading-5 text-slate-600">{vehicle.description}</p>}
     <p className="mt-3 text-lg font-black" style={{color:accent}}>{Number(vehicle.daily_rate).toLocaleString("fr-MA")} {vehicle.currency}<span className="ml-1 text-[10px] font-semibold text-slate-400">/ jour</span></p>
     <details className="mt-3"><summary className="flex cursor-pointer list-none items-center justify-center rounded-xl px-4 py-3 text-xs font-black text-white" style={button}>Demander une location</summary>
      <form action={submitPublicRentalBooking} className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
       <input type="hidden" name="card_slug" value={slug}/><input type="hidden" name="vehicle_id" value={vehicle.id}/>
       <div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-semibold text-slate-500">Retrait<input name="pickup_date" type="date" required className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"/></label><label className="text-[10px] font-semibold text-slate-500">Retour<input name="return_date" type="date" required className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"/></label></div>
       {rentalLocations.length>0&&<div className="grid grid-cols-2 gap-2"><select name="pickup_location_id" className="min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"><option value="">Lieu de retrait</option>{rentalLocations.map((l)=><option key={l.id} value={l.id}>{l.name}{l.city?" · "+l.city:""}</option>)}</select><select name="return_location_id" className="min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"><option value="">Lieu de retour</option>{rentalLocations.map((l)=><option key={l.id} value={l.id}>{l.name}{l.city?" · "+l.city:""}</option>)}</select></div>}
       <input name="customer_name" required placeholder="Nom complet" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/>
       <div className="grid grid-cols-2 gap-2"><input name="customer_phone" required type="tel" placeholder="Téléphone" className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/><input name="customer_email" type="email" placeholder="E-mail" className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/></div>
       <textarea name="customer_message" rows={2} placeholder="Message (facultatif)" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/>
       <button className="w-full rounded-xl px-3 py-3 text-xs font-black text-white" style={button}>Envoyer ma demande</button>
       <p className="text-[10px] leading-4 text-slate-400">Le tarif estimatif sera calculé automatiquement. La réservation reste en attente de confirmation.</p>
      </form>
     </details>
    </div>
   </article>)}</div>
  </section>}

  {(practitioners.length>0||services.length>0)&&<section className="rounded-2xl bg-white p-4">
   <p className="text-[10px] font-black uppercase tracking-[.16em]" style={{color:accent}}>Santé & consultations</p><h2 className="mt-1 text-lg font-black text-slate-950">Prendre rendez-vous</h2><p className="mt-1 text-xs text-slate-500">Consultez les praticiens et prestations disponibles, puis envoyez une demande.</p>
   {practitioners.length>0&&<div className="mt-4 space-y-2">{practitioners.map((p)=><div key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">{p.avatar_url?<img src={p.avatar_url} alt={p.full_name} loading="lazy" className="h-12 w-12 rounded-full object-cover"/>:<div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-black text-indigo-700">{p.full_name.slice(0,1)}</div>}<div className="min-w-0"><p className="text-sm font-bold text-slate-900">{p.professional_title?p.professional_title+" ":""}{p.full_name}</p><p className="text-xs text-slate-500">{p.specialty||"Praticien"}</p>{p.languages?.length>0&&<p className="mt-1 text-[10px] text-slate-400">{p.languages.join(" · ")}</p>}</div></div>)}</div>}
   {services.length>0&&<div className="mt-4 grid gap-2">{services.map((s)=><div key={s.id} className="flex gap-3 rounded-xl border border-slate-100 p-3">{s.image_url&&<img src={s.image_url} alt={s.name} loading="lazy" className="h-16 w-16 rounded-lg object-cover"/>}<div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-900">{s.name}</p>{s.description&&<p className="mt-1 text-[11px] leading-4 text-slate-500">{s.description}</p>}<p className="mt-1 text-[10px] text-slate-400">{s.duration_minutes} min · {s.consultation_mode==="teleconsultation"?"Téléconsultation":s.consultation_mode==="home_visit"?"À domicile":"Au cabinet"}</p><p className="mt-1 text-xs font-black" style={{color:accent}}>{s.price===null?"Sur devis":Number(s.price).toLocaleString("fr-MA")+" "+s.currency}</p></div></div>)}</div>}
   {availability.length>0&&<div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-800">Horaires de consultation</p><div className="mt-2 grid grid-cols-2 gap-2">{availability.slice(0,8).map((a)=><div key={a.id} className="text-[10px] text-slate-500"><span className="font-bold text-slate-700">{a.specific_date?new Date(a.specific_date+"T12:00:00").toLocaleDateString("fr-FR"):["Dim.","Lun.","Mar.","Mer.","Jeu.","Ven.","Sam."][a.day_of_week??0]}</span><br/>{String(a.starts_at).slice(0,5)} – {String(a.ends_at).slice(0,5)}</div>)}</div></div>}
   <details className="mt-4" open><summary className="cursor-pointer rounded-xl px-4 py-3 text-center text-xs font-black text-white" style={button}>Demander un rendez-vous</summary>
    <form action={submitPublicHealthcareAppointment} className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
     <input type="hidden" name="card_slug" value={slug}/>
     <select name="service_id" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="">Consultation générale</option>{services.map((s)=><option key={s.id} value={s.id}>{s.name} · {s.duration_minutes} min</option>)}</select>
     <select name="practitioner_id" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="">Praticien (au choix)</option>{practitioners.map((p)=><option key={p.id} value={p.id}>{p.full_name}{p.specialty?" · "+p.specialty:""}</option>)}</select>
     {healthLocations.length>0&&<select name="location_id" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="">Lieu de consultation</option>{healthLocations.map((l)=><option key={l.id} value={l.id}>{l.name}{l.city?" · "+l.city:""}</option>)}</select>}
     <select name="consultation_mode" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="in_person">Au cabinet</option><option value="teleconsultation">Téléconsultation</option><option value="home_visit">À domicile</option></select>
     <label className="block text-[10px] font-semibold text-slate-500">Date et heure souhaitées<input name="starts_at" type="datetime-local" required className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/></label>
     <input name="patient_name" required placeholder="Nom complet" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/>
     <div className="grid grid-cols-2 gap-2"><input name="patient_phone" required type="tel" placeholder="Téléphone" className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/><input name="patient_email" type="email" placeholder="E-mail" className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"/></div>
     <button className="w-full rounded-xl px-3 py-3 text-xs font-black text-white" style={button}>Envoyer la demande de rendez-vous</button>
     <p className="text-[10px] leading-4 text-slate-400">Votre demande sera transmise à l’établissement. Le rendez-vous n’est confirmé qu’après validation.</p>
    </form>
   </details>
  </section>}
 </>;
}
