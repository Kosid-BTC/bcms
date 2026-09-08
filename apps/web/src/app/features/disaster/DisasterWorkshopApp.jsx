import React, { useEffect, useMemo, useRef, useState } from "react";
import "./disaster-workshop.css";

const STORAGE_KEY = "bcms.disasterWorkshop.sessions.v1";
const ACTIVE_KEY = "bcms.disasterWorkshop.active.v1";

const SECTION_META = [
  { id: "A", name: "Immediate Fire Response", short: "Response" },
  { id: "B", name: "Evacuation & Smoke Route", short: "Evacuation" },
  { id: "C", name: "Leadership & Decision Making", short: "Leadership" },
  { id: "D", name: "Emergency Communication", short: "Communication" },
  { id: "E", name: "Psychological First Aid — Look, Listen, Link", short: "PFA" },
  { id: "F", name: "Teamwork & Mutual Support", short: "Teamwork" },
];

const QUESTIONS = {
  A: [
    "ตั้งสติและแจ้งเหตุ/ส่งสัญญาณตามแผนเมื่อพบเหตุผิดปกติ",
    "ปฏิบัติตามสัญญาณเตือนและคำสั่งอพยพอย่างเหมาะสม",
    "ไม่ย้อนกลับไปเก็บของหรือเข้าใกล้บริเวณเสี่ยง",
    "สมาชิกปฏิบัติตามคำสั่งของผู้นำทีม",
    "ช่วยเหลือผู้ที่ต้องการความช่วยเหลือตามบทบาทและแผนที่กำหนด",
  ],
  B: [
    "ผู้นำทีมสามารถรวบรวมและควบคุมสมาชิกได้",
    "สมาชิกเริ่มการอพยพโดยไม่เกิดความตื่นตระหนก",
    "มีการตรวจสอบเส้นทางก่อนเคลื่อนย้าย",
    "เมื่อพบควันหรือเส้นทางไม่ปลอดภัย กลุ่มสามารถปรับไปใช้ทางสำรองตามแผน",
    "กลุ่มรักษาการติดต่อกันระหว่างการอพยพ",
    "ไม่มีสมาชิกแยกตัวหรือถูกทิ้งไว้โดยไม่มีการตรวจสอบ",
    "การเคลื่อนย้ายเป็นระเบียบและไม่เพิ่มความเสี่ยงแก่ผู้อื่น",
  ],
  C: [
    "ผู้นำทีมแสดงบทบาทชัดเจน",
    "สามารถจัดลำดับความสำคัญของปัญหาได้",
    "การตัดสินใจคำนึงถึงความปลอดภัยเป็นอันดับแรก",
    "มีการมอบหมายหน้าที่ให้สมาชิกอย่างเหมาะสม",
    "สามารถปรับการตัดสินใจเมื่อได้รับข้อมูลใหม่",
    "ผู้นำรับฟังข้อมูลจากสมาชิกก่อนตัดสินใจเมื่อเหมาะสม",
  ],
  D: [
    "ผู้รายงานเหตุสามารถสรุปสถานการณ์ได้อย่างกระชับ",
    "แยกข้อเท็จจริงออกจากการคาดเดาได้",
    "ระบุสถานที่ เหตุการณ์ และสถานะของกลุ่มได้",
    "รายงานจำนวนสมาชิก ผู้สูญหาย หรือผู้ต้องการความช่วยเหลือได้",
    "ใช้ข้อความสั้น ชัดเจน และเข้าใจง่าย",
    "ไม่มีการเผยแพร่ข่าวลือหรือข้อมูลที่ยังไม่ได้รับการยืนยัน",
  ],
  E: [
    "LOOK — สังเกตความปลอดภัยและความต้องการเร่งด่วนก่อนเข้าไปช่วย",
    "LOOK — สามารถระบุบุคคลที่อาจต้องการความช่วยเหลือเพิ่มเติม",
    "LISTEN — เข้าหาบุคคลด้วยท่าทีสงบและให้เกียรติ",
    "LISTEN — รับฟังโดยไม่เร่งรัดให้บุคคลเล่าเหตุการณ์",
    "LISTEN — หลีกเลี่ยงการตัดสิน ตำหนิ หรือให้คำสัญญาที่ไม่สามารถรับรองได้",
    "LINK — ช่วยเชื่อมบุคคลกับความต้องการพื้นฐานหรือผู้ที่สามารถช่วยได้",
    "LINK — รู้ว่าเมื่อใดควรขอความช่วยเหลือหรือส่งต่อ",
    "ผู้ช่วยสามารถรักษาความสงบของตนเองระหว่างช่วยเหลือบุคคลอื่น",
  ],
  F: [
    "สมาชิกช่วยเหลือกันโดยไม่รอคำสั่งทุกขั้นตอน",
    "มีการแบ่งหน้าที่อย่างเหมาะสม",
    "สมาชิกสามารถเสนอข้อมูลหรือเตือนความเสี่ยงได้",
    "กลุ่มรับฟังความคิดเห็นของสมาชิกทุกคน",
    "ไม่มีการกล่าวโทษสมาชิกเมื่อเกิดข้อผิดพลาด",
    "กลุ่มสามารถกลับมาทำงานร่วมกันหลังเกิดความสับสนได้",
  ],
};

const CRITICAL_ITEMS = [
  "ไม่ปฏิบัติตามคำสั่งอพยพ",
  "แยกตัวออกจากกลุ่มโดยไม่มีการแจ้ง",
  "ใช้เส้นทางไม่ปลอดภัยหรือมีควัน",
  "การสื่อสารผิดพลาดที่อาจทำให้เกิดความสับสน",
  "ไม่ตรวจสอบสมาชิกก่อนออกจากพื้นที่/ที่จุดรวมพล",
  "ทิ้งบุคคลที่ต้องการความช่วยเหลือโดยไม่มีการประสานงาน",
  "ช่วยผู้อื่นโดยไม่คำนึงถึงความปลอดภัยของผู้ช่วย",
  "อื่น ๆ",
];

const INJECTS = [
  { no: 1, title: "พบควัน / ได้ยินสัญญาณเตือน", cue: "ให้ผู้เข้าร่วมรับรู้เหตุผิดปกติและเริ่มตอบสนองตามแผนฉุกเฉินของสถานที่" },
  { no: 2, title: "ทางหนีไฟหลักมีควัน", cue: "แจ้งว่าทางหลักไม่ปลอดภัย ให้กลุ่มประเมินและใช้ทางสำรองตามแผน โดยไม่ฝืนเข้าพื้นที่เสี่ยง" },
  { no: 3, title: "จุดรวมพล / Headcount", cue: "ให้ตรวจนับสมาชิกและส่งรายงานสถานการณ์แบบสั้น ชัดเจน และแยก fact ออกจาก assumption" },
  { no: 4, title: "PFA หลังอพยพ", cue: "ให้ทีมช่วยเหลือผู้ที่มีความเครียดด้วย Look, Listen, Link โดยไม่วินิจฉัยหรือกดดันให้เล่าเหตุการณ์" },
];

const scoreOptions = [4, 3, 2, 1, "NO"];
const scoreLabels = { 4: "ดีมาก", 3: "ดี", 2: "ต้องพัฒนา", 1: "เร่งด่วน", NO: "N/O" };

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const today = () => new Date().toISOString().slice(0, 10);

function blankRatings() {
  const out = {};
  SECTION_META.forEach(({ id }) => {
    out[id] = QUESTIONS[id].map(() => ({ score: null, note: "" }));
  });
  return out;
}

function blankSession() {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meta: { date: today(), location: "", group: "", members: "", observer: "", scenario: "เพลิงไหม้ในสำนักงาน" },
    ratings: blankRatings(),
    critical: { none: true, selected: [], detail: "" },
    notes: { strengths: ["", "", ""], priorities: ["", "", ""], evidence: "" },
    aar: { expected: "", actual: "", well: "", improve: "" },
    actions: [{ id: uid(), issue: "", action: "", owner: "", due: "", verification: "", status: "Open" }],
    facilitator: { readiness: "", recommendation: "", nextDrill: "" },
  };
}

function makeDemo(name, base, critical = false) {
  const s = blankSession();
  s.meta = { date: today(), location: "สำนักงานใหญ่", group: name, members: "8", observer: "Demo Observer", scenario: "เพลิงไหม้ในสำนักงาน" };
  SECTION_META.forEach(({ id }, sectionIndex) => {
    s.ratings[id] = QUESTIONS[id].map((_, i) => ({ score: Math.max(1, Math.min(4, base + ((i + sectionIndex) % 3 === 0 ? -1 : 0))), note: "" }));
  });
  if (critical) s.critical = { none: false, selected: [CRITICAL_ITEMS[3]], detail: "ตัวอย่างข้อมูลเพื่อทดสอบ dashboard" };
  s.notes.strengths = ["รวมกลุ่มได้รวดเร็ว", "รายงาน Headcount ชัดเจน", "ช่วยเหลือกันดี"];
  s.notes.priorities = ["ฝึกเส้นทางสำรอง", "ทำข้อความรายงานให้สั้นลง", "ทบทวนบทบาทหัวหน้าทีม"];
  return s;
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [makeDemo("Group A", 4, false), makeDemo("Group B", 3, true)];
}

function pctForSection(session, sectionId) {
  const rows = session.ratings?.[sectionId] || [];
  const observed = rows.filter((x) => typeof x.score === "number");
  if (!observed.length) return null;
  const earned = observed.reduce((sum, x) => sum + x.score, 0);
  return Math.round((earned / (observed.length * 4)) * 100);
}

function overallPct(session) {
  const all = SECTION_META.flatMap(({ id }) => session.ratings?.[id] || []);
  const observed = all.filter((x) => typeof x.score === "number");
  if (!observed.length) return null;
  return Math.round((observed.reduce((s, x) => s + x.score, 0) / (observed.length * 4)) * 100);
}

function readiness(pct) {
  if (pct == null) return { label: "ยังไม่มีคะแนน", tone: "neutral" };
  if (pct >= 90) return { label: "มีความพร้อมสูง", tone: "good" };
  if (pct >= 80) return { label: "มีความพร้อมดี", tone: "good" };
  if (pct >= 70) return { label: "ผ่าน แต่ควรพัฒนาบางประเด็น", tone: "warn" };
  if (pct >= 60) return { label: "ต้องมีแผนพัฒนาและฝึกซ้ำ", tone: "warn" };
  return { label: "ควรทบทวนและฝึกเพิ่มเติม", tone: "danger" };
}

function ratedCount(session) {
  return SECTION_META.reduce((n, { id }) => n + (session.ratings?.[id] || []).filter((x) => x.score !== null).length, 0);
}

const totalCount = SECTION_META.reduce((n, { id }) => n + QUESTIONS[id].length, 0);

function Icon({ children }) { return <span aria-hidden="true" className="dw-icon">{children}</span>; }

export default function DisasterWorkshopApp() {
  const [sessions, setSessions] = useState(loadSessions);
  const [activeId, setActiveId] = useState(() => localStorage.getItem(ACTIVE_KEY) || "");
  const [view, setView] = useState("setup");
  const [section, setSection] = useState("A");
  const [inject, setInject] = useState(1);
  const [sortKey, setSortKey] = useState("overall");
  const importRef = useRef(null);

  useEffect(() => {
    if (!activeId || !sessions.some((s) => s.id === activeId)) setActiveId(sessions[0]?.id || "");
  }, [sessions, activeId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);
  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  const active = sessions.find((s) => s.id === activeId) || sessions[0] || blankSession();
  const overall = overallPct(active);
  const read = readiness(overall);
  const progress = Math.round((ratedCount(active) / totalCount) * 100);

  const updateActive = (fn) => setSessions((prev) => prev.map((s) => s.id === active.id ? { ...fn(s), updatedAt: new Date().toISOString() } : s));
  const updateMeta = (key, value) => updateActive((s) => ({ ...s, meta: { ...s.meta, [key]: value } }));
  const updateRating = (sid, index, patch) => updateActive((s) => ({
    ...s,
    ratings: { ...s.ratings, [sid]: s.ratings[sid].map((r, i) => i === index ? { ...r, ...patch } : r) },
  }));

  function newSession() {
    const s = blankSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setView("setup");
  }
  function duplicateSession() {
    const s = { ...JSON.parse(JSON.stringify(active)), id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), meta: { ...active.meta, group: `${active.meta.group || "Group"} Copy` } };
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
  }
  function clearDemo() {
    const keep = sessions.filter((s) => s.meta.observer !== "Demo Observer");
    if (keep.length) setSessions(keep); else newSession();
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `disaster-workshop-${today()}.json`; a.click(); URL.revokeObjectURL(a.href);
  }
  function importJson(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("invalid");
        setSessions(data); setActiveId(data[0]?.id || "");
      } catch (_) { alert("ไฟล์ JSON ไม่ถูกต้อง"); }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  const dashboardRows = useMemo(() => [...sessions].sort((a, b) => {
    if (sortKey === "group") return (a.meta.group || "").localeCompare(b.meta.group || "", "th");
    return (overallPct(b) ?? -1) - (overallPct(a) ?? -1);
  }), [sessions, sortKey]);

  return (
    <div className="dw-shell">
      <header className="dw-topbar no-print">
        <div className="dw-brand">
          <div className="dw-mark">DR</div>
          <div><strong>Disaster Response Workshop</strong><span>Observation & AAR</span></div>
        </div>
        <div className="dw-actions">
          <button className="dw-btn subtle" onClick={newSession}>+ New Session</button>
          <button className="dw-btn subtle" onClick={duplicateSession}>Duplicate</button>
          <button className="dw-btn subtle" onClick={exportJson}>Export JSON</button>
          <button className="dw-btn subtle" onClick={() => importRef.current?.click()}>Import</button>
          <input ref={importRef} hidden type="file" accept="application/json" onChange={importJson} />
        </div>
      </header>

      <div className="dw-layout">
        <aside className="dw-sidebar no-print">
          <div className="dw-session-switcher">
            <label>Session</label>
            <select value={active.id} onChange={(e) => setActiveId(e.target.value)}>
              {sessions.map((s) => <option value={s.id} key={s.id}>{s.meta.group || "Untitled"} — {s.meta.date}</option>)}
            </select>
          </div>
          <nav>
            {[
              ["setup", "Session Setup", "⚙"], ["observe", "Live Observation", "◎"], ["critical", "Critical Safety", "!"],
              ["notes", "Observer Notes", "✎"], ["aar", "AAR", "↻"], ["actions", "Action Plan", "✓"], ["summary", "Session Summary", "▤"], ["dashboard", "Multi-group Dashboard", "▦"],
            ].map(([id, label, icon]) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon>{icon}</Icon>{label}</button>)}
          </nav>
          <div className="dw-policy">ใช้เพื่อการเรียนรู้และพัฒนา ไม่ใช้เพื่อกล่าวโทษหรือลงโทษผู้เข้าร่วมจากความผิดพลาดระหว่างการฝึก</div>
        </aside>

        <main className="dw-main">
          <section className="dw-hero no-print">
            <div>
              <p className="eyebrow">{active.meta.scenario}</p>
              <h1>{active.meta.group || "Workshop Observation Session"}</h1>
              <p>{active.meta.location || "ยังไม่ได้ระบุสถานที่"} · ผู้ประเมิน {active.meta.observer || "—"}</p>
            </div>
            <div className="dw-scorebox">
              <div className={`dw-ring ${read.tone}`} style={{ "--p": `${overall ?? 0}%` }}><span>{overall == null ? "—" : `${overall}%`}</span></div>
              <div><strong>{read.label}</strong><span>{ratedCount(active)}/{totalCount} รายการประเมินแล้ว</span></div>
            </div>
          </section>

          {view === "setup" && <Setup active={active} updateMeta={updateMeta} setView={setView} />}
          {view === "observe" && <Observation active={active} section={section} setSection={setSection} updateRating={updateRating} progress={progress} inject={inject} setInject={setInject} />}
          {view === "critical" && <Critical active={active} updateActive={updateActive} />}
          {view === "notes" && <Notes active={active} updateActive={updateActive} />}
          {view === "aar" && <AAR active={active} updateActive={updateActive} />}
          {view === "actions" && <Actions active={active} updateActive={updateActive} />}
          {view === "summary" && <Summary active={active} />}
          {view === "dashboard" && <Dashboard rows={dashboardRows} sortKey={sortKey} setSortKey={setSortKey} setActiveId={setActiveId} setView={setView} clearDemo={clearDemo} />}
        </main>
      </div>
    </div>
  );
}

function Setup({ active, updateMeta, setView }) {
  const fields = [
    ["date", "วันที่ฝึก", "date"], ["location", "สถานที่", "text"], ["group", "ชื่อกลุ่ม", "text"], ["members", "จำนวนสมาชิก", "number"], ["observer", "ผู้ประเมิน", "text"],
  ];
  return <div className="dw-panel">
    <div className="panel-head"><div><p className="eyebrow">01</p><h2>Session Setup</h2><p>ตั้งค่าข้อมูลก่อนเริ่มการสังเกตการณ์</p></div><span className="autosave">● Autosave</span></div>
    <div className="dw-form-grid">
      {fields.map(([key, label, type]) => <label key={key}><span>{label}</span><input type={type} value={active.meta[key]} onChange={(e) => updateMeta(key, e.target.value)} /></label>)}
      <label><span>Scenario</span><select value={active.meta.scenario} onChange={(e) => updateMeta("scenario", e.target.value)}><option>เพลิงไหม้ในสำนักงาน</option><option>แผ่นดินไหว</option><option>กำหนดเอง</option></select></label>
    </div>
    <div className="dw-callout">Fire Drill MVP เน้นการแจ้งเหตุ การอพยพเมื่อมีควัน การตรวจนับที่จุดรวมพล การสื่อสาร และ PFA หลังเหตุการณ์</div>
    <button className="dw-btn primary" onClick={() => setView("observe")}>เริ่ม Live Observation →</button>
  </div>;
}

function Observation({ active, section, setSection, updateRating, progress, inject, setInject }) {
  const meta = SECTION_META.find((x) => x.id === section);
  const sectionPct = pctForSection(active, section);
  return <>
    <div className="dw-progress-card no-print"><div><strong>Live progress</strong><span>{ratedCount(active)}/{totalCount} items rated</span></div><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><b>{progress}%</b></div>
    <div className="dw-injects no-print">
      {INJECTS.map((x) => <button key={x.no} onClick={() => setInject(x.no)} className={inject === x.no ? "active" : ""}>Inject {x.no}</button>)}
      <div className="inject-cue"><strong>{INJECTS[inject - 1].title}</strong><span>{INJECTS[inject - 1].cue}</span></div>
    </div>
    <div className="dw-tabs no-print">{SECTION_META.map((x) => <button key={x.id} onClick={() => setSection(x.id)} className={section === x.id ? "active" : ""}><b>{x.id}</b><span>{x.short}</span><em>{pctForSection(active, x.id) ?? "—"}{pctForSection(active, x.id) != null ? "%" : ""}</em></button>)}</div>
    <div className="dw-panel">
      <div className="panel-head"><div><p className="eyebrow">Section {section}</p><h2>{meta.name}</h2><p>เลือก 1–4 หรือ N/O จากพฤติกรรมที่สังเกตเห็นจริง</p></div><div className="section-score">{sectionPct == null ? "—" : `${sectionPct}%`}</div></div>
      <div className="dw-question-list">{QUESTIONS[section].map((q, index) => {
        const r = active.ratings[section][index];
        return <article className="dw-question" key={q}><div className="q-title"><b>{index + 1}</b><span>{q}</span></div><div className="score-row">{scoreOptions.map((opt) => <button key={opt} className={r.score === opt ? `selected s-${opt}` : ""} onClick={() => updateRating(section, index, { score: opt })}><strong>{opt === "NO" ? "N/O" : opt}</strong><small>{scoreLabels[opt]}</small></button>)}</div><textarea placeholder="ข้อสังเกต / Behavioral Evidence" value={r.note} onChange={(e) => updateRating(section, index, { note: e.target.value })} /></article>;
      })}</div>
    </div>
  </>;
}

function Critical({ active, updateActive }) {
  const c = active.critical;
  const setNone = (v) => updateActive((s) => ({ ...s, critical: { ...s.critical, none: v, selected: v ? [] : s.critical.selected } }));
  const toggle = (item) => updateActive((s) => ({ ...s, critical: { ...s.critical, none: false, selected: s.critical.selected.includes(item) ? s.critical.selected.filter((x) => x !== item) : [...s.critical.selected, item] } }));
  return <div className="dw-panel"><div className="panel-head"><div><p className="eyebrow">Critical</p><h2>Critical Safety Behaviors</h2><p>บันทึกแยกจากคะแนนรวมเพื่อไม่ให้ความเสี่ยงสำคัญถูกกลบ</p></div>{!c.none && c.selected.length > 0 && <span className="critical-badge">Critical finding</span>}</div>
    <label className="dw-check safe"><input type="checkbox" checked={c.none} onChange={(e) => setNone(e.target.checked)} /><span>ไม่มีพฤติกรรมเสี่ยงสำคัญ</span></label>
    <div className="critical-grid">{CRITICAL_ITEMS.map((item) => <label className={`dw-check ${c.selected.includes(item) ? "hit" : ""}`} key={item}><input type="checkbox" checked={c.selected.includes(item)} onChange={() => toggle(item)} /><span>{item}</span></label>)}</div>
    <label className="stack"><span>รายละเอียดเหตุการณ์</span><textarea rows="6" value={c.detail} onChange={(e) => updateActive((s) => ({ ...s, critical: { ...s.critical, detail: e.target.value } }))} placeholder="บันทึกสิ่งที่เห็น เวลา จุดเกิดเหตุ ผลกระทบ และการตอบสนอง" /></label>
  </div>;
}

function Notes({ active, updateActive }) {
  const setArray = (key, i, value) => updateActive((s) => { const arr = [...s.notes[key]]; arr[i] = value; return { ...s, notes: { ...s.notes, [key]: arr } }; });
  return <div className="dw-panel"><div className="panel-head"><div><p className="eyebrow">Evidence</p><h2>Observer Notes</h2><p>แยกสิ่งที่เห็นออกจากการตีความ และใช้ข้อความที่ตรวจสอบย้อนกลับได้</p></div></div>
    <div className="two-col"><div><h3>3 Strengths</h3>{active.notes.strengths.map((x, i) => <input key={i} value={x} onChange={(e) => setArray("strengths", i, e.target.value)} placeholder={`Strength ${i + 1}`} />)}</div><div><h3>3 Improvement Priorities</h3>{active.notes.priorities.map((x, i) => <input key={i} value={x} onChange={(e) => setArray("priorities", i, e.target.value)} placeholder={`Priority ${i + 1}`} />)}</div></div>
    <label className="stack"><span>Behavioral Evidence</span><textarea rows="8" value={active.notes.evidence} onChange={(e) => updateActive((s) => ({ ...s, notes: { ...s.notes, evidence: e.target.value } }))} placeholder="เช่น หลังได้รับ Inject 2 ทีมใช้เวลาประมาณ 20 วินาทีในการหยุดและเลือกทางสำรอง..." /></label>
  </div>;
}

function AAR({ active, updateActive }) {
  const qs = [["expected", "1. What was expected to happen?", "เราคาดว่าจะต้องทำอะไรเมื่อสถานการณ์เกิดขึ้น?"], ["actual", "2. What actually happened?", "สิ่งที่เกิดขึ้นจริงระหว่างการฝึกคืออะไร?"], ["well", "3. What went well?", "สิ่งใดที่ทำได้ดีและควรรักษาไว้?"], ["improve", "4. What should we improve next time?", "ครั้งต่อไปควรปรับปรุงอะไร?"]];
  return <div className="dw-panel"><div className="panel-head"><div><p className="eyebrow">After Action Review</p><h2>AAR Debrief</h2><p>ใช้คำถามสี่ข้อเพื่อเปลี่ยนประสบการณ์จากการซ้อมเป็น Improvement Action</p></div></div><div className="aar-grid">{qs.map(([key, title, sub]) => <label key={key}><strong>{title}</strong><span>{sub}</span><textarea rows="6" value={active.aar[key]} onChange={(e) => updateActive((s) => ({ ...s, aar: { ...s.aar, [key]: e.target.value } }))} /></label>)}</div></div>;
}

function Actions({ active, updateActive }) {
  const update = (id, key, value) => updateActive((s) => ({ ...s, actions: s.actions.map((a) => a.id === id ? { ...a, [key]: value } : a) }));
  const add = () => updateActive((s) => ({ ...s, actions: [...s.actions, { id: uid(), issue: "", action: "", owner: "", due: "", verification: "", status: "Open" }] }));
  const remove = (id) => updateActive((s) => ({ ...s, actions: s.actions.filter((a) => a.id !== id) }));
  return <div className="dw-panel"><div className="panel-head"><div><p className="eyebrow">Improve</p><h2>Group Improvement Action Plan</h2><p>กำหนดเจ้าของงาน กำหนดเวลา และวิธีตรวจสอบผลให้ครบ</p></div><button className="dw-btn primary" onClick={add}>+ Add Action</button></div><div className="action-list">{active.actions.map((a, i) => <div className="action-card" key={a.id}><div className="action-index">#{i + 1}</div>{[["issue", "ประเด็นที่พบ"], ["action", "การปรับปรุง"], ["owner", "ผู้รับผิดชอบ"], ["due", "กำหนดเวลา"], ["verification", "วิธีตรวจสอบผล"]].map(([key, label]) => <label key={key}><span>{label}</span><input type={key === "due" ? "date" : "text"} value={a[key]} onChange={(e) => update(a.id, key, e.target.value)} /></label>)}<label><span>Status</span><select value={a.status} onChange={(e) => update(a.id, "status", e.target.value)}><option>Open</option><option>In Progress</option><option>Verified</option><option>Closed</option></select></label><button className="icon-btn" onClick={() => remove(a.id)}>ลบ</button></div>)}</div></div>;
}

function Summary({ active }) {
  const overall = overallPct(active); const read = readiness(overall); const hasCritical = !active.critical.none && active.critical.selected.length > 0;
  return <div className="dw-panel print-panel"><div className="panel-head"><div><p className="eyebrow">Session Report</p><h2>{active.meta.group || "Workshop Session"}</h2><p>{active.meta.date} · {active.meta.location} · ผู้ประเมิน {active.meta.observer || "—"}</p></div><button className="dw-btn primary no-print" onClick={() => window.print()}>Print / Save PDF</button></div>
    <div className="summary-kpis"><div><span>Overall</span><strong>{overall == null ? "—" : `${overall}%`}</strong><small>{read.label}</small></div><div><span>Rated</span><strong>{ratedCount(active)}/{totalCount}</strong><small>N/O ไม่ถูกนำไปคิด denominator</small></div><div className={hasCritical ? "danger" : "good"}><span>Critical</span><strong>{hasCritical ? active.critical.selected.length : "0"}</strong><small>{hasCritical ? "ต้องพิจารณาร่วมกับคะแนน" : "ไม่พบ Critical Finding"}</small></div></div>
    <h3>Section Performance</h3><div className="section-bars">{SECTION_META.map((x) => { const p = pctForSection(active, x.id); return <div key={x.id}><span>{x.id}. {x.short}</span><div><i style={{ width: `${p ?? 0}%` }} /></div><b>{p == null ? "—" : `${p}%`}</b></div>; })}</div>
    {hasCritical && <div className="critical-summary"><strong>Critical Safety Findings</strong><ul>{active.critical.selected.map((x) => <li key={x}>{x}</li>)}</ul><p>{active.critical.detail}</p></div>}
    <div className="report-grid"><ReportList title="Strengths" values={active.notes.strengths} /><ReportList title="Improvement Priorities" values={active.notes.priorities} /></div>
    <h3>AAR</h3><div className="aar-report"><p><b>Expected:</b> {active.aar.expected || "—"}</p><p><b>Actual:</b> {active.aar.actual || "—"}</p><p><b>Went well:</b> {active.aar.well || "—"}</p><p><b>Improve:</b> {active.aar.improve || "—"}</p></div>
    <h3>Action Plan</h3><div className="report-table"><table><thead><tr><th>Issue</th><th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>{active.actions.map((a) => <tr key={a.id}><td>{a.issue || "—"}</td><td>{a.action || "—"}</td><td>{a.owner || "—"}</td><td>{a.due || "—"}</td><td>{a.status}</td></tr>)}</tbody></table></div>
    <footer className="print-footer">Generated {new Date().toLocaleString("th-TH")} · Disaster Response Workshop — Observation & AAR</footer>
  </div>;
}

function ReportList({ title, values }) { return <div><h3>{title}</h3><ol>{values.filter(Boolean).length ? values.filter(Boolean).map((x) => <li key={x}>{x}</li>) : <li>—</li>}</ol></div>; }

function Dashboard({ rows, sortKey, setSortKey, setActiveId, setView, clearDemo }) {
  return <div className="dw-panel"><div className="panel-head"><div><p className="eyebrow">Portfolio View</p><h2>Workshop Performance Dashboard</h2><p>เปรียบเทียบหลายกลุ่มและระบุจุดที่ต้องฝึกซ้ำ</p></div><button className="dw-btn subtle" onClick={clearDemo}>Clear Demo Data</button></div><div className="dash-controls no-print"><label>Sort by <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}><option value="overall">Overall score</option><option value="group">Group name</option></select></label></div><div className="report-table"><table className="dashboard-table"><thead><tr><th>Group</th>{SECTION_META.map((x) => <th key={x.id}>{x.short}</th>)}<th>Overall</th><th>Critical</th></tr></thead><tbody>{rows.map((s) => { const o = overallPct(s); const critical = !s.critical.none && s.critical.selected.length; return <tr key={s.id} onClick={() => { setActiveId(s.id); setView("summary"); }}><td><strong>{s.meta.group || "Untitled"}</strong><small>{s.meta.date}</small></td>{SECTION_META.map((x) => <td key={x.id}>{pctForSection(s, x.id) ?? "—"}{pctForSection(s, x.id) != null ? "%" : ""}</td>)}<td><b>{o ?? "—"}{o != null ? "%" : ""}</b></td><td>{critical ? <span className="critical-badge">{critical} finding</span> : <span className="ok-badge">Clear</span>}</td></tr>; })}</tbody></table></div>
    <div className="mini-charts">{rows.slice(0, 5).map((s) => <div key={s.id}><strong>{s.meta.group || "Untitled"}</strong><div className="mini-bar"><i style={{ width: `${overallPct(s) ?? 0}%` }} /></div><span>{overallPct(s) ?? "—"}{overallPct(s) != null ? "%" : ""}</span></div>)}</div>
  </div>;
}
