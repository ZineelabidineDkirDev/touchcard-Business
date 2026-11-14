import {
  submitPublicAppointment, submitPublicGymRegistration, submitPublicSchoolEnrollment,
} from "@/app/actions/public-business-modules";

type CatalogItem = { id: string; item_type: string; name: string; description: string | null; price: number; currency: string; duration_minutes: number | null; capacity: number | null; image_url?: string | null };
type GymPlan = { id: string; name: string; description: string | null; price: number; currency: string; duration_days: number; benefits: string[] };
type SchoolProgram = { id: string; title: string; description: string | null; duration_label: string | null; price: number | null; currency: string; start_date: string | null; end_date: string | null };

export function PublicBusinessModules({ slug, modules, catalog, plans, programs, accent, whatsappPhone }: {
  slug: string; modules: string[]; catalog: CatalogItem[]; plans: GymPlan[]; programs: SchoolProgram[]; accent: string; whatsappPhone?: string;
}) {
  const enabled = (id: string) => modules.includes(id);
  const services = catalog.filter((item) => item.item_type !== "room");
  const rooms = catalog.filter((item) => item.item_type === "room");
  if (!services.length && !rooms.length && !enabled("doctor_appointments") && !enabled("gym_registration") && !enabled("school_registration")) return null;
  const buttonStyle = { backgroundColor: accent };
  const whatsapp = (whatsappPhone || "").replace(/\D/g, "");
  const hasMenu = services.some((item) => item.item_type === "menu");

  return <div className="space-y-3">
    {(enabled("service_catalog") && services.length > 0) && <section className="rounded-2xl bg-white p-4">
      <h2 className="text-base font-black text-slate-950">{hasMenu ? "Notre menu" : "Nos prestations"}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{services.map((item) => {
        const message = hasMenu
          ? `Bonjour, je souhaite commander : ${item.name} — ${Number(item.price).toLocaleString("fr-MA")} ${item.currency}. Pouvez-vous me confirmer la disponibilité ?`
          : `Bonjour, je souhaite demander la prestation : ${item.name} — ${Number(item.price).toLocaleString("fr-MA")} ${item.currency}. Pouvez-vous me renseigner ?`;
        return <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="flex items-start gap-3 p-3">{item.image_url ? <img src={item.image_url} alt={item.name} loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover"/> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-2xl text-slate-300">✦</div>}
            <div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-slate-900">{item.name}</h3>{item.description && <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>}{item.duration_minutes && <p className="mt-1 text-[11px] text-slate-400">{item.duration_minutes} min</p>}<strong className="mt-2 block text-sm" style={{ color: accent }}>{Number(item.price).toLocaleString("fr-MA")} {item.currency}</strong></div>
          </div>
          {whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="mx-3 mb-3 flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold text-white" style={buttonStyle}>{hasMenu ? "Commander sur WhatsApp" : "Demander ce service"}</a>}
        </article>;
      })}</div>
    </section>}
    {(enabled("room_catalog") && rooms.length > 0) && <section className="rounded-2xl bg-white p-4">
      <h2 className="text-base font-black text-slate-950">Nos chambres</h2>
      <div className="mt-3 space-y-3">{rooms.map((item) => <article key={item.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0">{item.image_url && <img src={item.image_url} alt={item.name} loading="lazy" className="h-20 w-24 rounded-xl object-cover"/>}<div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h3 className="text-sm font-bold text-slate-900">{item.name}</h3><strong className="text-sm" style={{ color: accent }}>{Number(item.price).toLocaleString("fr-MA")} {item.currency}</strong></div>{item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}{item.capacity && <p className="mt-1 text-[11px] text-slate-400">Capacité : {item.capacity} personnes</p>}</div></article>)}</div>
    </section>}
    {enabled("doctor_appointments") && <section className="rounded-2xl bg-white p-4">
      <h2 className="text-base font-black text-slate-950">Prendre rendez-vous médical</h2><p className="mt-1 text-xs leading-5 text-slate-500">Envoyez une demande de consultation. Le cabinet vous contactera pour confirmer le créneau.</p>
      <form action={submitPublicAppointment} className="mt-3 space-y-2"><input type="hidden" name="card_slug" value={slug}/><input required name="customer_name" placeholder="Nom complet" maxLength={140} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input required name="customer_phone" type="tel" placeholder="Téléphone" maxLength={40} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input name="customer_email" type="email" placeholder="E-mail (facultatif)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><label className="block text-xs font-semibold text-slate-600">Date et heure souhaitées<input required name="starts_at" type="datetime-local" min={new Date().toISOString().slice(0,16)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></label><textarea name="message" rows={2} placeholder="Motif de consultation (facultatif)" maxLength={1000} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><button className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white" style={buttonStyle}>Envoyer ma demande</button></form>
    </section>}
    {enabled("gym_registration") && <section className="rounded-2xl bg-white p-4">
      <h2 className="text-base font-black text-slate-950">Nos abonnements & inscription</h2>
      {plans.length > 0 && <div className="mt-3 space-y-2">{plans.map((plan) => <label key={plan.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"><input type="radio" name="membership_plan_id" value={plan.id} form="gym-registration-form" className="mt-1"/><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{plan.name}</strong><span className="mt-1 block text-xs text-slate-500">{plan.duration_days} jours · {(plan.benefits ?? []).join(" · ")}</span></span><strong className="shrink-0 text-sm" style={{ color: accent }}>{Number(plan.price).toLocaleString("fr-MA")} {plan.currency}</strong></label>)}</div>}
      <form id="gym-registration-form" action={submitPublicGymRegistration} className="mt-3 space-y-2"><input type="hidden" name="card_slug" value={slug}/><input required name="full_name" placeholder="Nom complet" maxLength={140} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input required name="phone" type="tel" placeholder="Téléphone" maxLength={40} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input name="email" type="email" placeholder="E-mail (facultatif)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input name="preferred_start_date" type="date" aria-label="Date de début souhaitée" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><textarea name="fitness_goals" rows={2} placeholder="Vos objectifs sportifs (facultatif)" maxLength={1000} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><button className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white" style={buttonStyle}>Demander mon inscription</button></form>
    </section>}
    {enabled("school_registration") && <section className="rounded-2xl bg-white p-4">
      <h2 className="text-base font-black text-slate-950">Programmes & préinscription</h2>
      {programs.length > 0 && <div className="mt-3 space-y-2">{programs.map((program) => <label key={program.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"><input type="radio" name="program_id" value={program.id} form="school-enrollment-form" className="mt-1"/><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{program.title}</strong><span className="mt-1 block text-xs text-slate-500">{program.duration_label || "Durée à préciser"}{program.start_date ? " · Début : " + program.start_date : ""}</span>{program.description && <span className="mt-1 block text-xs text-slate-500">{program.description}</span>}</span>{program.price != null && <strong className="shrink-0 text-sm" style={{ color: accent }}>{Number(program.price).toLocaleString("fr-MA")} {program.currency}</strong>}</label>)}</div>}
      <form id="school-enrollment-form" action={submitPublicSchoolEnrollment} className="mt-3 space-y-2"><input type="hidden" name="card_slug" value={slug}/><input required name="student_name" placeholder="Nom complet de l'élève" maxLength={140} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input name="student_birth_date" type="date" aria-label="Date de naissance" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input name="student_phone" type="tel" placeholder="Téléphone de l'élève (facultatif)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input name="student_email" type="email" placeholder="E-mail de l'élève (facultatif)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input name="guardian_name" placeholder="Nom du responsable légal" maxLength={140} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input required name="guardian_phone" type="tel" placeholder="Téléphone du responsable légal" maxLength={40} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><input name="guardian_email" type="email" placeholder="E-mail du responsable (facultatif)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><textarea name="message" rows={2} placeholder="Message (facultatif)" maxLength={1000} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/><button className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white" style={buttonStyle}>Envoyer la préinscription</button></form>
    </section>}
  </div>;
}
