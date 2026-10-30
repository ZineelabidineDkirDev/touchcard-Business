import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PublicCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: card } = await supabase.from("cards")
    .select("id, slug, full_name, job_title, company_name, bio, email, phone, website, avatar_url")
    .eq("slug", slug).eq("is_published", true).maybeSingle();

  if (!card) notFound();
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-12">
      <article className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-300/60">
        <div className="h-32 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-500" />
        <div className="-mt-14 px-7 pb-8">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-indigo-50 text-3xl font-bold text-indigo-700 shadow-lg">
            {card.avatar_url ? <img src={card.avatar_url} alt="" className="h-full w-full object-cover" /> : card.full_name.slice(0, 1).toUpperCase()}
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">{card.full_name}</h1>
          {card.job_title && <p className="mt-1 font-medium text-indigo-700">{card.job_title}</p>}
          {card.company_name && <p className="mt-1 text-sm text-slate-500">{card.company_name}</p>}
          {card.bio && <p className="mt-5 text-sm leading-6 text-slate-600">{card.bio}</p>}
          <div className="mt-7 grid gap-3">
            {card.phone && <a className="btn-primary text-center" href={"tel:" + card.phone}>Appeler</a>}
            {card.email && <a className="btn-secondary text-center" href={"mailto:" + card.email}>E-mail</a>}
            {card.website && <a className="btn-secondary text-center" href={card.website} target="_blank" rel="noreferrer">Site web</a>}
          </div>
          <p className="mt-8 text-center text-xs text-slate-400">Carte digitale propulsée par TouchCard</p>
        </div>
      </article>
    </main>
  );
}