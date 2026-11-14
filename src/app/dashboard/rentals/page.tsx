import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MediaImagePicker } from "@/components/dashboard/media-image-picker";
import {
  createRentalLocation, createRentalVehicle, updateRentalVehicle, archiveRentalVehicle, createRentalMaintenance,
  setRentalVehiclePublished, updateRentalBookingStatus,
} from "@/app/actions/industry-modules";

const money = (value: number, currency = "MAD") => `${Number(value || 0).toLocaleString("fr-MA")} ${currency}`;
const dateLabel = (value: string) => new Date(value + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const statusLabel: Record<string,string> = { pending: "En attente", confirmed: "Confirmée", active: "En cours", cancelled: "Annulée", completed: "Terminée", rejected: "Refusée", planned: "Planifiée", in_progress: "En cours" };

export default async function RentalsPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organization_id,role").eq("user_id",user.id).limit(1).maybeSingle();
  if (!membership?.organization_id) notFound();
  const organizationId = membership.organization_id;
  const { data: organization } = await supabase.from("organizations").select("name,workspace_config").eq("id",organizationId).maybeSingle();
  const config = (organization?.workspace_config ?? {}) as { version?: number; modules?: string[] };
  if (config.version && !config.modules?.includes("car_rental")) notFound();
  const canManage = ["organization_admin","manager","super_admin"].includes(String(membership.role));
  const [vehiclesResult,locationsResult,bookingsResult,maintenanceResult,privateResult] = await Promise.all([
    supabase.from("rental_vehicles").select("*").eq("organization_id",organizationId).order("created_at",{ascending:false}),
    supabase.from("rental_locations").select("*").eq("organization_id",organizationId).order("is_primary",{ascending:false}),
    supabase.from("rental_bookings").select("*").eq("organization_id",organizationId).order("created_at",{ascending:false}).limit(100),
    supabase.from("rental_maintenance").select("*").eq("organization_id",organizationId).order("scheduled_start"),
    canManage ? supabase.from("rental_vehicle_private").select("*").eq("organization_id",organizationId) : Promise.resolve({data:[] as any[]}),
  ]);
  const allVehicles = vehiclesResult.data ?? [];
  const vehicles = allVehicles.filter((vehicle: any) => vehicle.is_active !== false);
  const archivedVehiclesCount = allVehicles.length - vehicles.length;
  const locations = locationsResult.data ?? [];
  const bookings = bookingsResult.data ?? [];
  const maintenance = maintenanceResult.data ?? [];
  const privateByVehicle = new Map((privateResult.data ?? []).map((item:any)=>[item.vehicle_id,item]));
  const locationName = (id:string|null) => locations.find((location:any)=>location.id===id)?.name ?? "Non renseigné";
  const pending = bookings.filter((booking:any)=>booking.status==="pending").length;
  const activeMaintenance = maintenance.filter((item:any)=>["planned","in_progress"].includes(item.status)).length;

  return <div className="mx-auto max-w-7xl space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-indigo-600">Espace client · {organization?.name || "TouchCard"}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Gestion de flotte</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Gérez vos véhicules, agences, demandes de location et opérations d’entretien depuis un espace dédié.</p></div>
      <a href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Retour au tableau de bord</a>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Véhicules" value={vehicles.length} hint="Dans votre flotte"/>
      <Metric label="Annonces publiées" value={vehicles.filter((v:any)=>v.is_published&&v.is_active).length} hint="Visibles sur votre carte NFC"/>
      <Metric label="Demandes en attente" value={pending} hint="À traiter"/>
      <Metric label="Entretiens planifiés" value={activeMaintenance} hint="Véhicules temporairement indisponibles"/>
      <Metric label="Véhicules archivés" value={archivedVehiclesCount} hint="Historique conservé, non publiés"/>
    </div>

    {canManage && <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeading title="Agences & points de retrait" description="Ajoutez les lieux de départ et de retour proposés aux clients."/>
        <form action={createRentalLocation} className="mt-4 grid gap-3">
          <input name="name" required placeholder="Nom de l’agence" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          <input name="address" placeholder="Adresse" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          <div className="grid grid-cols-2 gap-2"><input name="city" placeholder="Ville" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/><input name="phone" placeholder="Téléphone" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></div>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="is_primary"/> Agence principale</label>
          <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Ajouter l’agence</button>
        </form>
        <div className="mt-5 space-y-2">{locations.map((location:any)=><div key={location.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-bold text-slate-900">{location.name} {location.is_primary&&<span className="ml-1 text-[10px] font-black uppercase text-indigo-600">Principale</span>}</p><p className="mt-1 text-xs text-slate-500">{[location.address,location.city].filter(Boolean).join(", ")||"Adresse à compléter"}</p></div>)}{!locations.length&&<Empty text="Aucune agence configurée."/>}</div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeading title="Ajouter un véhicule" description="Les informations administratives du véhicule restent privées et ne sont jamais publiées sur la carte NFC."/>
        <form action={createRentalVehicle} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="brand" required placeholder="Marque (ex. Dacia)" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          <input name="model" required placeholder="Modèle (ex. Duster)" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          <select name="category" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="economy">Économique</option><option value="compact">Compacte</option><option value="suv">SUV / 4x4</option><option value="premium">Premium</option><option value="van">Utilitaire / Van</option><option value="luxury">Luxe</option></select>
          <input name="model_year" type="number" min="1950" max="2100" placeholder="Année" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          <select name="transmission" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="manual">Manuelle</option><option value="automatic">Automatique</option><option value="other">Autre</option></select>
          <select name="fuel_type" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="petrol">Essence</option><option value="diesel">Diesel</option><option value="hybrid">Hybride</option><option value="electric">Électrique</option><option value="other">Autre</option></select>
          <input name="seats" type="number" min="1" max="60" defaultValue="5" placeholder="Places" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          <div className="grid grid-cols-[1fr_90px] gap-2"><input name="daily_rate" required type="number" min="0" step="0.01" placeholder="Prix / jour" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/><input name="currency" maxLength={3} defaultValue="MAD" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></div>
          <select name="base_location_id" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:col-span-2"><option value="">Agence de rattachement (facultatif)</option>{locations.map((location:any)=><option key={location.id} value={location.id}>{location.name}</option>)}</select>
          <textarea name="description" rows={2} placeholder="Description publique : équipements, climatisation, boîte, conditions…" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:col-span-2"/>
          <div className="sm:col-span-2"><MediaImagePicker organizationId={organizationId} name="image_url" label="Photo du véhicule"/></div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 sm:col-span-2"><p className="text-xs font-bold text-amber-900">Informations internes — non visibles par les visiteurs</p><div className="mt-2 grid gap-2 sm:grid-cols-3"><input name="registration_number" placeholder="Immatriculation" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/><input name="vin" placeholder="Numéro VIN" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/><input name="current_mileage" type="number" min="0" placeholder="Kilométrage" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></div></div>
          <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:col-span-2">Enregistrer le véhicule</button>
        </form>
      </div>
    </section>}

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeading title="Parc automobile" description="Activez la publication d’un véhicule pour le présenter sur votre carte NFC."/>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{vehicles.map((vehicle:any)=>{
        const privateInfo:any=privateByVehicle.get(vehicle.id);
        return <article key={vehicle.id} className="overflow-hidden rounded-2xl border border-slate-200">
          {vehicle.image_url?<img src={vehicle.image_url} alt={vehicle.brand+" "+vehicle.model} className="h-44 w-full object-cover"/>:<div className="flex h-44 items-center justify-center bg-slate-100 text-4xl">🚘</div>}
          <div className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-black text-slate-950">{vehicle.brand} {vehicle.model}</h3><p className="mt-1 text-xs text-slate-500">{vehicle.model_year||"Année non précisée"} · {vehicle.seats} places · {vehicle.transmission==="automatic"?"Automatique":"Manuelle"}</p></div><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700">{vehicle.category}</span></div>
          <p className="text-xl font-black text-indigo-700">{money(vehicle.daily_rate,vehicle.currency)} <span className="text-xs font-semibold text-slate-400">/ jour</span></p>
          <p className="text-xs text-slate-500">Agence : {locationName(vehicle.base_location_id)}</p>
          {privateInfo&&<div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Immatriculation : <strong className="text-slate-800">{privateInfo.registration_number||"—"}</strong><span className="mx-2">·</span>Kilométrage : <strong className="text-slate-800">{privateInfo.current_mileage?.toLocaleString("fr-MA")||"—"} km</strong></div>}
          {canManage&&<form action={setRentalVehiclePublished} className="flex items-center justify-between border-t border-slate-100 pt-3"><input type="hidden" name="id" value={vehicle.id}/><input type="hidden" name="is_published" value={vehicle.is_published?"false":"true"}/><span className="text-xs font-bold text-slate-600">{vehicle.is_published?"Publié sur la carte":"Non publié"}</span><button className={vehicle.is_published?"rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50":"rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"}>{vehicle.is_published?"Retirer":"Publier"}</button></form>}
           {canManage&&<details className="border-t border-slate-100 pt-3"><summary className="cursor-pointer text-xs font-bold text-indigo-700">Modifier la fiche véhicule</summary><form action={updateRentalVehicle} className="mt-3 grid gap-2 sm:grid-cols-2"><input type="hidden" name="id" value={vehicle.id}/><input name="brand" required defaultValue={vehicle.brand} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Marque"/><input name="model" required defaultValue={vehicle.model} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Modèle"/><select name="category" defaultValue={vehicle.category} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="economy">Économique</option><option value="compact">Compacte</option><option value="suv">SUV / 4x4</option><option value="premium">Premium</option><option value="van">Utilitaire / Van</option><option value="luxury">Luxe</option></select><input name="model_year" type="number" defaultValue={vehicle.model_year||""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Année"/><select name="transmission" defaultValue={vehicle.transmission} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="manual">Manuelle</option><option value="automatic">Automatique</option><option value="other">Autre</option></select><select name="fuel_type" defaultValue={vehicle.fuel_type} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="petrol">Essence</option><option value="diesel">Diesel</option><option value="hybrid">Hybride</option><option value="electric">Électrique</option><option value="other">Autre</option></select><input name="seats" type="number" min="1" defaultValue={vehicle.seats} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Places"/><input name="daily_rate" type="number" min="0" step="0.01" required defaultValue={vehicle.daily_rate} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Tarif journalier"/><input name="currency" maxLength={3} defaultValue={vehicle.currency||"MAD"} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"/><select name="base_location_id" defaultValue={vehicle.base_location_id||""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Sans agence</option>{locations.map((l:any)=><option key={l.id} value={l.id}>{l.name}</option>)}</select><textarea name="description" defaultValue={vehicle.description||""} rows={2} className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" placeholder="Description publique"/><input type="hidden" name="image_url" value={vehicle.image_url||""}/><button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white sm:col-span-2">Enregistrer les modifications</button></form><form action={archiveRentalVehicle} className="mt-3"><input type="hidden" name="id" value={vehicle.id}/><button className="text-xs font-bold text-rose-600">Archiver ce véhicule (conserve son historique)</button></form></details>}
          </div></article>;
      })}</div>{!vehicles.length&&<Empty text="Ajoutez votre premier véhicule pour commencer à constituer votre flotte."/>}
    </section>

    {canManage&&<section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeading title="Entretien & vidanges" description="Planifiez les immobilisations et les prochaines échéances."/>
        <form action={createRentalMaintenance} className="mt-4 grid gap-3">
          <select name="vehicle_id" required className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="">Choisir un véhicule</option>{vehicles.map((v:any)=><option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}</select>
          <select name="maintenance_type" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="oil_change">Vidange</option><option value="service">Entretien périodique</option><option value="repair">Réparation</option><option value="inspection">Contrôle technique</option><option value="tires">Pneumatiques</option><option value="insurance">Assurance</option><option value="other">Autre</option></select>
          <input name="title" required placeholder="Intitulé de l’intervention" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          <div className="grid grid-cols-2 gap-2"><label className="text-xs text-slate-500">Début<input name="scheduled_start" type="date" required className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 mt-1"/></label><label className="text-xs text-slate-500">Fin<input name="scheduled_end" type="date" required className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 mt-1"/></label></div>
          <div className="grid grid-cols-2 gap-2"><input name="current_mileage" type="number" min="0" placeholder="Kilométrage actuel" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/><input name="next_due_mileage" type="number" min="0" placeholder="Prochaine vidange (km)" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></div>
          <input name="next_due_date" type="date" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" aria-label="Prochaine échéance"/>
          <textarea name="description" rows={2} placeholder="Notes d’entretien" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          <button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Planifier l’entretien</button>
        </form>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeading title="Calendrier d’entretien" description="Les périodes planifiées ou en cours bloquent la confirmation d’une location sur ces dates."/>
        <div className="mt-4 space-y-3">{maintenance.map((item:any)=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4"><div><p className="font-bold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{vehicles.find((v:any)=>v.id===item.vehicle_id)?.brand} {vehicles.find((v:any)=>v.id===item.vehicle_id)?.model} · {dateLabel(item.scheduled_start)} – {dateLabel(item.scheduled_end)}</p>{item.next_due_mileage&&<p className="mt-1 text-xs text-slate-500">Prochaine échéance : {item.next_due_mileage.toLocaleString("fr-MA")} km</p>}</div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{statusLabel[item.status]||item.status}</span></div>)}{!maintenance.length&&<Empty text="Aucun entretien planifié pour le moment."/>}</div>
      </div>
    </section>}

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeading title="Demandes de location" description="Les réservations confirmées sont protégées contre les chevauchements de dates au niveau de la base de données."/>
      <div className="mt-4 space-y-3">{bookings.map((booking:any)=><article key={booking.id} className="grid gap-3 rounded-2xl border border-slate-100 p-4 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-950">{booking.customer_name}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{statusLabel[booking.status]||booking.status}</span></div><p className="mt-1 text-xs text-slate-500">{vehicles.find((v:any)=>v.id===booking.vehicle_id)?.brand} {vehicles.find((v:any)=>v.id===booking.vehicle_id)?.model} · {dateLabel(booking.pickup_date)} – {dateLabel(booking.return_date)}</p><p className="mt-1 text-xs text-slate-500">{booking.customer_phone} {booking.customer_email?"· "+booking.customer_email:""} · {money(booking.total_amount,booking.currency)}</p></div>
      {canManage&&<form action={updateRentalBookingStatus} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={booking.id}/><select name="status" defaultValue={booking.status} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 min-w-36"><option value="pending">En attente</option><option value="confirmed">Confirmer</option><option value="active">En cours</option><option value="completed">Terminée</option><option value="rejected">Refuser</option><option value="cancelled">Annuler</option></select><button className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Mettre à jour</button></form>}</article>)}{!bookings.length&&<Empty text="Les demandes de location reçues depuis votre carte apparaîtront ici."/>}</div>
    </section>
  </div>;
}

function Metric({label,value,hint}:{label:string;value:number;hint:string}) {
 return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-[11px] text-slate-400">{hint}</p></div>;
}
function SectionHeading({title,description}:{title:string;description:string}) {
 return <div><h2 className="text-lg font-black text-slate-950">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p></div>;
}
function Empty({text}:{text:string}) {
 return <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{text}</p>;
}
