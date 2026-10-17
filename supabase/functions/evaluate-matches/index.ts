import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const norm = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase("tr-TR");
const numeric = (value: unknown) => value == null || value === "" ? null : Number(value);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return respond({ error: "Server is not configured" }, 500);
  const authorization = req.headers.get("Authorization");
  if (!authorization) return respond({ error: "Unauthorized" }, 401);

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await userClient.auth.getUser();
  if (authError || !auth.user) return respond({ error: "Unauthorized" }, 401);

  let body: { officeId?: string; customerId?: string; propertyId?: string };
  try { body = await req.json(); } catch { return respond({ error: "Invalid JSON body" }, 400); }
  const officeId = body.officeId?.trim();
  const customerId = body.customerId?.trim();
  const propertyId = body.propertyId?.trim();
  if (!officeId || (!customerId && !propertyId)) return respond({ error: "officeId ve customerId veya propertyId zorunludur." }, 400);

  const { data: membership, error: membershipError } = await admin.from("office_members")
    .select("role,status").eq("office_id", officeId).eq("user_id", auth.user.id).maybeSingle();
  if (membershipError) return respond({ error: "Membership check failed" }, 500);
  if (!membership || membership.status !== "active" || !["owner", "agent"].includes(membership.role)) {
    return respond({ error: "Bu ofiste eşleştirme yapma yetkiniz yok." }, 403);
  }

  let customerQuery = admin.from("customers").select("id,office_id,assigned_agent_id,is_active").eq("office_id", officeId).eq("is_active", true);
  if (customerId) customerQuery = customerQuery.eq("id", customerId);
  const { data: customers, error: customerError } = await customerQuery;
  if (customerError) return respond({ error: "Customers query failed" }, 500);
  if (customerId && !customers?.length) return respond({ error: "Müşteri bulunamadı veya bu ofise ait değil." }, 404);

  let propertyQuery = admin.from("properties").select("id,office_id,owner_agent_id,title,listing_type,status,price,rooms,area_m2,property_type,city,district,neighborhood")
    .eq("office_id", officeId).eq("status", "active");
  if (propertyId) propertyQuery = propertyQuery.eq("id", propertyId);
  const { data: properties, error: propertyError } = await propertyQuery;
  if (propertyError) return respond({ error: "Properties query failed" }, 500);
  if (propertyId && !properties?.length) return respond({ error: "Aktif ilan bulunamadı veya bu ofise ait değil." }, 404);

  const customerIds = (customers || []).map(c => c.id);
  const { data: requirements, error: requirementError } = await admin.from("customer_requirements")
    .select("id,office_id,customer_id,intent,property_type,city,district,neighborhood,min_price,max_price,min_area_m2,max_area_m2,rooms,is_active")
    .eq("office_id", officeId).eq("is_active", true).in("customer_id", customerIds.length ? customerIds : ["00000000-0000-0000-0000-000000000000"]);
  if (requirementError) return respond({ error: "Requirements query failed" }, 500);

  const customerById = new Map((customers || []).map(c => [c.id, c]));
  const generated: Array<{id:string; kind:string; score:number}> = [];
  for (const requirement of requirements || []) {
    const customer = customerById.get(requirement.customer_id);
    if (!customer) continue;
    for (const property of properties || []) {
      if (requirement.intent !== property.listing_type) continue;
      const reasons: string[] = [];
      const exactFailures: string[] = [];
      const cityReq = norm(requirement.city), cityProp = norm(property.city);
      const districtReq = norm(requirement.district), districtProp = norm(property.district);
      const typeReq = norm(requirement.property_type);
      const reqMax = numeric(requirement.max_price), reqMin = numeric(requirement.min_price);
      const price = numeric(property.price) ?? 0;
      const reqRooms: string[] = Array.isArray(requirement.rooms) ? requirement.rooms.map(norm) : [];
      const propRooms = norm(property.rooms);
      const minArea = numeric(requirement.min_area_m2), maxArea = numeric(requirement.max_area_m2);
      const area = numeric(property.area_m2);
      if (cityReq && cityProp && cityReq !== cityProp) exactFailures.push("İl farklı");
      else if (cityReq) reasons.push("İl uyuyor");
      if (districtReq && districtProp && districtReq !== districtProp) exactFailures.push("İlçe farklı");
      else if (districtReq) reasons.push("İlçe uyuyor");
      if (typeReq && typeReq !== "any" && typeReq !== norm(property.property_type)) exactFailures.push("Gayrimenkul tipi farklı");
      else if (typeReq && typeReq !== "any") reasons.push("Gayrimenkul tipi uyuyor");
      if (reqMin != null && price < reqMin) exactFailures.push("Fiyat alt bütçenin altında");
      if (reqMax != null && price > reqMax) {
        if (price <= reqMax * 1.1) {
          exactFailures.push("Fiyat bütçeyi aşıyor");
          reasons.push("Fiyat bütçeyi en fazla %10 aşıyor");
        } else exactFailures.push("Fiyat bütçeyi %10'dan fazla aşıyor");
      } else if (reqMax != null) reasons.push("Bütçe uyuyor");
      if (reqRooms.length && !reqRooms.includes(propRooms)) exactFailures.push("Oda sayısı farklı");
      else if (reqRooms.length) reasons.push("Oda sayısı uyuyor");
      if (minArea != null && (area == null || area < minArea)) exactFailures.push("Metrekare alt sınırın altında");
      if (maxArea != null && (area == null || area > maxArea)) exactFailures.push("Metrekare üst sınırın üzerinde");
      if (minArea != null || maxArea != null) {
        if (area != null && (minArea == null || area >= minArea) && (maxArea == null || area <= maxArea)) reasons.push("Metrekare uyuyor");
      }
      const hardMismatch = exactFailures.some(reason => !["İlçe farklı", "Fiyat bütçeyi %10'dan fazla aşıyor"].includes(reason));
      const alternativeEligible = !hardMismatch && exactFailures.length > 0 &&
        exactFailures.every(reason => reason === "İlçe farklı" || reason === "Fiyat bütçeyi aşıyor") &&
        !(reqMax != null && price > reqMax * 1.1);
      const exact = exactFailures.length === 0;
      if (!exact && !alternativeEligible) continue;
      const kind = exact ? "exact" : "alternative";
      const score = Math.max(0, Math.min(100, 100 - exactFailures.length * 12 - (kind === "alternative" ? 10 : 0)));
      const matchReasons = [...reasons, ...exactFailures.map(reason => "Alternatif: " + reason)];
      const { data: prior, error: priorError } = await admin.from("matches").select("id,match_kind,status")
        .eq("requirement_id", requirement.id).eq("property_id", property.id).maybeSingle();
      if (priorError) return respond({ error: "Match lookup failed" }, 500);
      const payload = {
        office_id: officeId, property_id: property.id, customer_id: customer.id,
        requirement_id: requirement.id, assigned_agent_id: customer.assigned_agent_id,
        match_kind: kind, match_score: score, match_reasons: matchReasons,
      };
      if (prior) {
        const { error: updateError } = await admin.from("matches").update(payload).eq("id", prior.id);
        if (updateError) return respond({ error: "Match update failed" }, 500);
        generated.push({ id: prior.id, kind, score });
      } else {
        const { data: created, error: insertError } = await admin.from("matches").insert(payload).select("id").single();
        if (insertError) return respond({ error: "Match insert failed" }, 500);
        const { error: notificationError } = await admin.from("notifications").insert({
          office_id: officeId, recipient_user_id: customer.assigned_agent_id,
          notification_type: "new_match", title: kind === "exact" ? "Yeni tam eşleşme" : "Yeni alternatif eşleşme",
          body: property.title + " · " + customer.id, match_id: created.id,
          customer_id: customer.id, property_id: property.id,
        });
        if (notificationError) return respond({ error: "Match created but notification failed", matchId: created.id }, 500);
        generated.push({ id: created.id, kind, score });
      }
    }
  }
  return respond({ success: true, evaluatedCustomers: customers?.length || 0, evaluatedProperties: properties?.length || 0, matches: generated.length, results: generated });
});
