import React, { useEffect, useMemo, useState } from "react";
import { SUPABASE_ANON, SUPABASE_URL } from "../../config/platform";
import "./workshop-attendance.css";

const STATUS = [
  { id: "present", label: "มา", tone: "green" },
  { id: "late", label: "สาย", tone: "amber" },
  { id: "absent", label: "ขาด", tone: "red" },
  { id: "excused", label: "ลา", tone: "blue" },
];

function authSession() {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const session = parsed?.currentSession || parsed?.session || parsed;
      if (session?.access_token) return session;
    }
  } catch (_) {}
  return null;
}

function jwtSub(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).sub || null;
  } catch (_) {
    return null;
  }
}

async function rest(path, { method = "GET", body, prefer } = {}) {
  const session = authSession();
  if (!session?.access_token) throw new Error("AUTH_REQUIRED");
  const headers = {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return text ? JSON.parse(text) : null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function WorkshopAttendanceApp({ tenant }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState(tenant?.org_id || null);
  const [people, setPeople] = useState([]);
  const [units, setUnits] = useState({});
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [attendance, setAttendance] = useState({});
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [savingId, setSavingId] = useState("");
  const [form, setForm] = useState({
    session_date: today(),
    title: "Disaster Response Workshop",
    scenario: "เพลิงไหม้ในสำนักงาน",
    location: "",
    group_name: "",
  });

  const currentSession = sessions.find((s) => s.id === sessionId) || null;

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap() {
    setLoading(true);
    setError("");
    try {
      const session = authSession();
      if (!session?.access_token) throw new Error("AUTH_REQUIRED");
      let resolvedOrg = tenant?.org_id || null;
      if (!resolvedOrg) {
        const uid = jwtSub(session.access_token);
        const rows = await rest(`profiles?id=eq.${encodeURIComponent(uid)}&select=org_id&limit=1`);
        resolvedOrg = rows?.[0]?.org_id || null;
      }
      if (!resolvedOrg) throw new Error("ORG_REQUIRED");
      setOrgId(resolvedOrg);
      await Promise.all([loadPeople(resolvedOrg), loadSessions(resolvedOrg)]);
    } catch (e) {
      setError(e.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  async function loadPeople(resolvedOrg = orgId) {
    const [staff, unitRows] = await Promise.all([
      rest(`personnel_profiles?org_id=eq.${resolvedOrg}&select=id,full_name,email,phone,unit_id,status,employment_type&order=full_name.asc`),
      rest(`org_units?org_id=eq.${resolvedOrg}&select=id,unit_name&order=unit_name.asc`),
    ]);
    setPeople((staff || []).filter((p) => p.status !== "inactive"));
    setUnits(Object.fromEntries((unitRows || []).map((u) => [u.id, u.unit_name])));
  }

  async function loadSessions(resolvedOrg = orgId) {
    const rows = await rest(`workshop_sessions?org_id=eq.${resolvedOrg}&select=*&order=session_date.desc,created_at.desc&limit=50`);
    setSessions(rows || []);
    if (rows?.length) {
      setSessionId(rows[0].id);
      await loadAttendance(rows[0].id);
    }
  }

  async function loadAttendance(id) {
    if (!id) return;
    const rows = await rest(`workshop_attendance?session_id=eq.${id}&select=id,personnel_id,attendance_status,checked_at,note`);
    setAttendance(Object.fromEntries((rows || []).map((r) => [r.personnel_id, r])));
  }

  async function selectSession(id) {
    setSessionId(id);
    setAttendance({});
    await loadAttendance(id);
  }

  async function createSession(e) {
    e.preventDefault();
    setError("");
    try {
      if (!orgId) throw new Error("ORG_REQUIRED");
      const auth = authSession();
      const uid = jwtSub(auth?.access_token || "");
      const created = await rest("workshop_sessions", {
        method: "POST",
        prefer: "return=representation",
        body: [{ ...form, org_id: orgId, status: "open", observer_profile_id: uid || null }],
      });
      const row = created?.[0];
      if (!row) throw new Error("ไม่สามารถสร้าง Session ได้");
      setSessions((old) => [row, ...old]);
      setSessionId(row.id);
      setAttendance({});
    } catch (e2) {
      setError(e2.message || "สร้าง Session ไม่สำเร็จ");
    }
  }

  async function setStatus(person, status) {
    if (!sessionId || !orgId) return;
    setSavingId(person.id);
    setError("");
    try {
      const auth = authSession();
      const uid = jwtSub(auth?.access_token || "");
      const existing = attendance[person.id];
      const payload = {
        org_id: orgId,
        session_id: sessionId,
        personnel_id: person.id,
        attendance_status: status,
        checked_at: new Date().toISOString(),
        checked_by: uid || null,
      };
      let rows;
      if (existing?.id) {
        rows = await rest(`workshop_attendance?id=eq.${existing.id}`, {
          method: "PATCH",
          prefer: "return=representation",
          body: payload,
        });
      } else {
        rows = await rest("workshop_attendance", {
          method: "POST",
          prefer: "return=representation",
          body: [payload],
        });
      }
      const row = rows?.[0] || { ...existing, ...payload };
      setAttendance((old) => ({ ...old, [person.id]: row }));
    } catch (e) {
      setError(e.message || "บันทึกเช็กชื่อไม่สำเร็จ");
    } finally {
      setSavingId("");
    }
  }

  async function markVisiblePresent() {
    if (!sessionId) return;
    for (const person of filteredPeople) {
      if (attendance[person.id]?.attendance_status === "present") continue;
      // sequential by design to avoid conflicting writes and provide deterministic feedback
      // eslint-disable-next-line no-await-in-loop
      await setStatus(person, "present");
    }
  }

  const unitOptions = useMemo(() => {
    const ids = [...new Set(people.map((p) => p.unit_id).filter(Boolean))];
    return ids.map((id) => ({ id, name: units[id] || "ไม่ระบุหน่วยงาน" })).sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [people, units]);

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("th");
    return people.filter((p) => {
      if (unitFilter !== "all" && p.unit_id !== unitFilter) return false;
      if (!q) return true;
      return [p.full_name, p.email, p.phone, units[p.unit_id]].filter(Boolean).some((v) => String(v).toLocaleLowerCase("th").includes(q));
    });
  }, [people, search, unitFilter, units]);

  const counts = useMemo(() => {
    const c = { total: people.length, present: 0, late: 0, absent: 0, excused: 0, unchecked: 0 };
    people.forEach((p) => {
      const s = attendance[p.id]?.attendance_status;
      if (s && c[s] != null) c[s] += 1;
      else c.unchecked += 1;
    });
    return c;
  }, [people, attendance]);

  if (loading) return <div className="wa-loading">กำลังเชื่อมข้อมูลบุคลากรจาก BCMS...</div>;

  if (error === "AUTH_REQUIRED") {
    return (
      <div className="wa-shell wa-centered">
        <div className="wa-empty-card">
          <div className="wa-empty-icon">🔐</div>
          <h2>กรุณาเข้าสู่ระบบ BCMS ก่อน</h2>
          <p>ระบบเช็กชื่อใช้บัญชีและสิทธิ์ของระบบใหญ่ เพื่อไม่ให้รายชื่อพนักงานรั่วข้ามองค์กร</p>
          <a className="wa-primary-link" href="/">กลับไปเข้าสู่ระบบ BCMS</a>
        </div>
      </div>
    );
  }

  return (
    <div className="wa-shell">
      <header className="wa-header">
        <div>
          <div className="wa-eyebrow">BCMS · Disaster Response Workshop</div>
          <h1>เช็กชื่อผู้เข้าร่วม</h1>
          <p>{tenant?.org_name || "องค์กรของคุณ"} · เชื่อมกับ Personnel Master</p>
        </div>
        <div className="wa-header-actions">
          <a href="/disaster-workshop" className="wa-secondary-link">← แบบประเมิน Workshop</a>
          <button className="wa-refresh" onClick={bootstrap}>รีเฟรชข้อมูล</button>
        </div>
      </header>

      {error && error !== "AUTH_REQUIRED" && <div className="wa-alert">{error}</div>}

      <section className="wa-grid-top">
        <div className="wa-card">
          <h2>Session</h2>
          <label className="wa-label">เลือก Session ที่มีอยู่</label>
          <select className="wa-input" value={sessionId} onChange={(e) => selectSession(e.target.value)}>
            <option value="">— เลือก Session —</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.session_date} · {s.group_name || s.title} · {s.location || "ไม่ระบุสถานที่"}</option>
            ))}
          </select>
          {currentSession && (
            <div className="wa-session-meta">
              <strong>{currentSession.group_name || currentSession.title}</strong>
              <span>{currentSession.scenario}</span>
              <span>{currentSession.location || "ไม่ระบุสถานที่"}</span>
            </div>
          )}
        </div>

        <form className="wa-card" onSubmit={createSession}>
          <h2>สร้าง Session ใหม่</h2>
          <div className="wa-form-grid">
            <label>วันที่<input className="wa-input" type="date" value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} /></label>
            <label>กลุ่ม<input className="wa-input" placeholder="เช่น Group A" value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} /></label>
            <label>สถานที่<input className="wa-input" placeholder="อาคาร / ชั้น / จุดรวมพล" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label>Scenario<input className="wa-input" value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} /></label>
          </div>
          <button className="wa-primary" type="submit">+ สร้าง Session</button>
        </form>
      </section>

      <section className="wa-stats">
        <Stat label="Personnel" value={counts.total} />
        <Stat label="มา" value={counts.present} tone="green" />
        <Stat label="สาย" value={counts.late} tone="amber" />
        <Stat label="ขาด" value={counts.absent} tone="red" />
        <Stat label="ลา" value={counts.excused} tone="blue" />
        <Stat label="ยังไม่เช็ก" value={counts.unchecked} tone="gray" />
      </section>

      <section className="wa-card wa-roster-card">
        <div className="wa-roster-toolbar">
          <div>
            <h2>รายชื่อจากระบบใหญ่</h2>
            <p>อ้างอิง Personnel Master โดยตรง ไม่สร้างชื่อซ้ำใน Workshop</p>
          </div>
          <div className="wa-toolbar-actions">
            <input className="wa-input wa-search" placeholder="ค้นหาชื่อ อีเมล โทรศัพท์..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="wa-input" value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)}>
              <option value="all">ทุกหน่วยงาน</option>
              {unitOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button className="wa-secondary" disabled={!sessionId || !filteredPeople.length} onClick={markVisiblePresent}>เช็ก “มา” ทั้งรายการที่เห็น</button>
          </div>
        </div>

        {!sessionId ? (
          <div className="wa-empty-inline">เลือกหรือสร้าง Session ก่อนเริ่มเช็กชื่อ</div>
        ) : !filteredPeople.length ? (
          <div className="wa-empty-inline">ไม่พบรายชื่อที่ตรงกับเงื่อนไข</div>
        ) : (
          <div className="wa-roster">
            {filteredPeople.map((p, index) => {
              const row = attendance[p.id];
              const selected = row?.attendance_status || "";
              return (
                <div className="wa-person" key={p.id}>
                  <div className="wa-person-num">{index + 1}</div>
                  <div className="wa-person-main">
                    <strong>{p.full_name}</strong>
                    <span>{units[p.unit_id] || "ไม่ระบุหน่วยงาน"}{p.email ? ` · ${p.email}` : ""}</span>
                  </div>
                  <div className="wa-statuses">
                    {STATUS.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        disabled={savingId === p.id}
                        className={`wa-status wa-${s.tone} ${selected === s.id ? "active" : ""}`}
                        onClick={() => setStatus(p, s.id)}
                      >
                        {savingId === p.id && selected !== s.id ? "…" : s.label}
                      </button>
                    ))}
                  </div>
                  <div className="wa-time">{row?.checked_at ? new Date(row.checked_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="wa-footer">
        <span>ข้อมูลเช็กชื่อถูกเก็บใน BCMS-Automate และถูกจำกัดตาม Organization/Tenant</span>
        <span>Workshop Session → Attendance → Personnel Profile</span>
      </footer>
    </div>
  );
}

function Stat({ label, value, tone = "" }) {
  return <div className={`wa-stat ${tone ? `wa-stat-${tone}` : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}
