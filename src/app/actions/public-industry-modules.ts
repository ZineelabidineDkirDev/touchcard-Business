"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function field(data:FormData,key:string,max=500){return String(data.get(key)??"").trim().slice(0,max);}
async function publishedCard(slug:string){
 if(!/^[a-z0-9-]{2,100}$/i.test(slug)) return null;
 const supabase=await createClient();
 const {data:card}=await supabase.from("cards").select("id,organization_id,slug").eq("slug",slug).eq("is_published",true).maybeSingle();
 return card?{supabase,card}:null;
}
function casablancaLocalToIso(value:string){
 const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
 if(!match) return null;
 const [,year,month,day,hour,minute]=match;
 const desired=Date.UTC(Number(year),Number(month)-1,Number(day),Number(hour),Number(minute));
 let guess=new Date(desired);
 for(let i=0;i<3;i++){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Casablanca",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(guess);
  const get=(type:string)=>Number(parts.find((p)=>p.type===type)?.value||0);
  const observed=Date.UTC(get("year"),get("month")-1,get("day"),get("hour"),get("minute"),get("second"));
  guess=new Date(guess.getTime()+desired-observed);
 }
 return guess.toISOString();
}

export async function submitPublicRentalBooking(data:FormData){
 const ctx=await publishedCard(field(data,"card_slug",100));
 if(!ctx) return;
 const vehicleId=field(data,"vehicle_id",80);
 const name=field(data,"customer_name",180);
 const phone=field(data,"customer_phone",40);
 const pickup=field(data,"pickup_date",10);
 const returned=field(data,"return_date",10);
 if(!vehicleId||!name||!phone||!/^\d{4}-\d{2}-\d{2}$/.test(pickup)||!/^\d{4}-\d{2}-\d{2}$/.test(returned)||returned<=pickup) return;
 const locationIds=[field(data,"pickup_location_id",80),field(data,"return_location_id",80)].filter(Boolean);
 if(locationIds.length){
  const {data:locations}=await ctx.supabase.from("rental_locations").select("id")
   .eq("organization_id",ctx.card.organization_id).eq("is_active",true).eq("is_public",true).in("id",locationIds);
  if((locations??[]).length!==new Set(locationIds).size) return;
 }
 const {error}=await ctx.supabase.from("rental_bookings").insert({
  organization_id:ctx.card.organization_id,card_id:ctx.card.id,vehicle_id:vehicleId,
  customer_name:name,customer_phone:phone,customer_email:field(data,"customer_email",180)||null,
  pickup_date:pickup,return_date:returned,
  pickup_location_id:field(data,"pickup_location_id",80)||null,
  return_location_id:field(data,"return_location_id",80)||null,
  customer_message:field(data,"customer_message",1000)||null,status:"pending",
 });
 if(error) console.error("Public rental booking failed",error);
 revalidatePath("/dashboard/rentals");
}

export async function submitPublicHealthcareAppointment(data:FormData){
 const ctx=await publishedCard(field(data,"card_slug",100));
 if(!ctx) return;
 const patientName=field(data,"patient_name",180);
 const patientPhone=field(data,"patient_phone",40);
 const localStart=field(data,"starts_at",16);
 const startsAt=casablancaLocalToIso(localStart);
 if(!patientName||!patientPhone||!startsAt||new Date(startsAt).getTime()<=Date.now()) return;
 const serviceId=field(data,"service_id",80);
 const practitionerId=field(data,"practitioner_id",80);
 const locationId=field(data,"location_id",80);
 let duration=30;
 if(serviceId){
  const {data:service}=await ctx.supabase.from("healthcare_services").select("id,duration_minutes,practitioner_id")
   .eq("id",serviceId).eq("organization_id",ctx.card.organization_id).eq("is_active",true).eq("is_public",true).maybeSingle();
  if(!service) return;
  duration=Number(service.duration_minutes)||30;
  servicePractitionerId=service.practitioner_id;
  if(service.practitioner_id&&practitionerId&&service.practitioner_id!==practitionerId) return;
 }
 const endAt=new Date(new Date(startsAt).getTime()+duration*60000).toISOString();
 const {error}=await ctx.supabase.from("healthcare_appointments").insert({
  organization_id:ctx.card.organization_id,card_id:ctx.card.id,
  practitioner_id:practitionerId||servicePractitionerId||null,service_id:serviceId||null,location_id:locationId||null,
  patient_name:patientName,patient_phone:patientPhone,
  patient_email:field(data,"patient_email",180)||null,
  starts_at:startsAt,ends_at:endAt,
  consultation_mode:field(data,"consultation_mode",30)||"in_person",status:"pending",
 });
 if(error) console.error("Public healthcare appointment failed",error);
 revalidatePath("/dashboard/healthcare");
}
