'use client';

import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

// ── Cloudinary Config ─────────────────────────────────────────────────────────
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// ─────────────────────────────────────────────────────────────────────────────

const NAV = '#11223B';
const NAV2 = '#1A3356';
const GLD = '#C9A84C';
const GLD2 = '#E8D5A3';
const WHT = '#FFFFFF';
const OFW = '#FAFAF8';
const CRM = '#F5F2EC';
const MGR = '#7A7670';
const DTX = '#1C1A18';
const RUL = '#D8D4CC';
const ERR = '#B91C1C';

const STEPS = [
  'Agent Info', 'Brand Identity', 'Inspiration', 'Social Access',
  'KW Command CRM', 'Lead Automation', 'Listing Automation',
  'Open House', 'Newsletter', 'Review & Submit'
];

const TONES = [
  'Professional & polished', 'Warm & conversational', 'Bold & direct',
  'Luxury / high-end', 'Friendly & approachable', 'Educational & informative',
  'Community-focused', 'Humorous / light'
];

const LEAD_SRC = [
  'Zillow', 'Realtor.com', 'KW Website', 'Opcity / Agent Pronto',
  'Personal Website', 'Facebook / Instagram Ads', 'Referrals', 'Open Houses', 'Other'
];

const OH_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Primitives ────────────────────────────────────────────────────────────────

const Label = ({ children, required, optional }) => (
  <label style={{
    display: 'block', fontSize: 11, fontWeight: 700, color: NAV,
    textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6
  }}>
    {children}
    {required && <span style={{ color: GLD, marginLeft: 4 }}>*</span>}
    {optional && <span style={{
      color: MGR, fontWeight: 400, letterSpacing: 0,
      textTransform: 'none', fontSize: 11, marginLeft: 6
    }}>(optional)</span>}
  </label>
);

const ErrMsg = ({ msg }) => msg ? <div style={{ color: ERR, fontSize: 11, marginTop: 3 }}>{msg}</div> : null;

const inputBase = (err) => ({
  width: '100%', boxSizing: 'border-box', padding: '10px 13px',
  border: `1.5px solid ${err ? ERR : RUL}`, borderRadius: 6,
  fontSize: 13, color: DTX, background: WHT, outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.2s',
});

function Input({ label, required, optional, error, style = {}, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <Label required={required} optional={optional}>{label}</Label>}
      <input {...rest}
        style={{ ...inputBase(error), borderColor: focused ? GLD : error ? ERR : RUL, ...style }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      <ErrMsg msg={error} />
    </div>
  );
}

function TextArea({ label, required, optional, error, rows = 3, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <Label required={required} optional={optional}>{label}</Label>}
      <textarea {...rest} rows={rows}
        style={{
          ...inputBase(error), borderColor: focused ? GLD : error ? ERR : RUL,
          resize: 'vertical', lineHeight: 1.55
        }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      <ErrMsg msg={error} />
    </div>
  );
}

function Pills({ label, optional, required, options, value, onToggle, error }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label optional={optional} required={required}>{label}</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const sel = value.includes(opt);
          return (
            <button key={opt} onClick={() => onToggle(opt)} type="button"
              style={{
                padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${sel ? GLD : RUL}`,
                background: sel ? NAV : WHT, color: sel ? GLD : MGR, fontSize: 12,
                fontWeight: sel ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s'
              }}>
              {sel ? '✓ ' : ''}{opt}
            </button>
          );
        })}
      </div>
      <ErrMsg msg={error} />
    </div>
  );
}

function Radios({ label, required, options, value, onChange, error }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label required={required}>{label}</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const sel = value === opt;
          return (
            <button key={opt} onClick={() => onChange(opt)} type="button"
              style={{
                padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${sel ? GLD : RUL}`,
                background: sel ? NAV : WHT, color: sel ? GLD : DTX, fontSize: 12,
                fontWeight: sel ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s'
              }}>
              {opt}
            </button>
          );
        })}
      </div>
      <ErrMsg msg={error} />
    </div>
  );
}

function FileZone({ label, optional, hint, accept, multiple, files, onFiles, previews = [] }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);

  const process = (raw) => {
    const incoming = Array.from(raw);
    if (!multiple) {
      const single = [incoming[0]].filter(Boolean);
      const prvs = single.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
      onFiles(single, prvs);
      return;
    }
    const merged = [...files];
    incoming.forEach(newFile => {
      const isDupe = merged.some(f => f.name === newFile.name && f.size === newFile.size);
      if (!isDupe) merged.push(newFile);
    });
    const prvs = merged.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    onFiles(merged, prvs);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Label optional={optional}>{label}</Label>
      {hint && <div style={{ fontSize: 11, color: MGR, marginBottom: 7, lineHeight: 1.5 }}>{hint}</div>}
      <div
        onClick={() => ref.current.click()}
        onDrop={e => { e.preventDefault(); setDrag(false); process(e.dataTransfer.files); }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        style={{
          border: `2px dashed ${drag ? GLD : RUL}`, borderRadius: 8,
          padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
          background: drag ? '#FDF9EE' : OFW, transition: 'all 0.2s'
        }}>
        <div style={{ fontSize: 22, marginBottom: 5 }}>📎</div>
        <div style={{ fontSize: 12, color: MGR }}>
          Drop files here or{' '}
          <span style={{ color: GLD, fontWeight: 700 }}>click to browse</span>
        </div>
        {files.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: NAV, fontWeight: 600 }}>
            {files.length} file{files.length !== 1 ? 's' : ''} selected
            <span
              onClick={e => { e.stopPropagation(); onFiles([], []); }}
              style={{
                marginLeft: 8, color: ERR, cursor: 'pointer', fontWeight: 400,
                fontSize: 11, textDecoration: 'underline'
              }}>
              clear all
            </span>
          </div>
        )}
        <input ref={ref} type="file" accept={accept} multiple={multiple}
          onChange={e => process(e.target.files)} style={{ display: 'none' }} />
      </div>
      {previews.filter(Boolean).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {previews.map((src, i) => src && (
            <div key={i} style={{ position: 'relative' }}>
              <img src={src} alt="" style={{
                width: 68, height: 68, objectFit: 'cover',
                borderRadius: 6, border: `2px solid ${RUL}`
              }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHead({ n, title, desc }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', background: NAV, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: GLD
        }}>{n}</div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: NAV }}>{title}</h2>
      </div>
      {desc && <p style={{ margin: '0 0 0 46px', fontSize: 12, color: MGR, lineHeight: 1.65 }}>{desc}</p>}
    </div>
  );
}

function ReviewCard({ title, rows }) {
  const filled = rows.filter(([, v]) => v && v !== '—');
  if (!filled.length) return null;
  return (
    <div style={{
      background: WHT, border: `1px solid ${RUL}`, borderRadius: 8,
      overflow: 'hidden', marginBottom: 10
    }}>
      <div style={{
        background: NAV, padding: '7px 14px', fontSize: 10,
        fontWeight: 700, color: GLD, letterSpacing: 1.5
      }}>{title}</div>
      {filled.map(([k, v], i) => (
        <div key={k} style={{
          display: 'flex', gap: 10, padding: '7px 14px',
          borderBottom: i < filled.length - 1 ? `1px solid ${RUL}` : 'none', alignItems: 'flex-start'
        }}>
          <div style={{ fontSize: 11, color: MGR, minWidth: 130, fontWeight: 600, flexShrink: 0 }}>{k}</div>
          <div style={{ fontSize: 12, color: DTX, flex: 1, wordBreak: 'break-word' }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

// ── PDF Generation ───────────────────────────────────────────────────────────

function generatePDF(f) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 20;
  const marginR = 20;
  const maxW = pageW - marginL - marginR;
  let y = 20;

  const checkPage = (needed = 12) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFillColor(17, 34, 59); // NAV
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setTextColor(201, 168, 76); // GLD
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('FWAGENCY', marginL, 14);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Brand Intake Form — Submission Summary', marginL, 22);
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString(), pageW - marginR, 14, { align: 'right' });
  y = 42;

  const sections = [
    ['AGENT INFORMATION', [
      ['Name', [f.firstName, f.lastName].filter(Boolean).join(' ') + (f.preferredName ? ` (${f.preferredName})` : '')],
      ['Phone', f.phone], ['Email', f.email], ['Brokerage', f.brokerage],
      ['Market Center', f.marketCenter], ['Service Area', f.serviceArea],
    ]],
    ['BRAND IDENTITY', [
      ['Brand Guideline', f.guideNames.length ? f.guideNames.join(', ') : ''],
      ['Logo Files', f.logoNames.length ? `${f.logoNames.length} file(s) uploaded` : ''],
      ['Primary Color', f.primaryColor], ['Secondary Color', f.secondaryColor],
      ['Font', f.primaryFont], ['Tone', f.tones.join(', ')],
      ['Always Use', f.alwaysUse], ['Never Use', f.neverUse],
    ]],
    ['INSPIRATION', [
      ['Flyers Uploaded', f.flyerFiles.length ? `${f.flyerFiles.length} file(s)` : ''],
      ['Posts Uploaded', f.postFiles.length ? `${f.postFiles.length} file(s)` : ''],
      ['Instagram', f.instagramProfile], ['Facebook', f.facebookProfile],
      ['Inspiration Notes', f.inspirationNote],
    ]],
    ['SOCIAL MEDIA ACCESS', [
      ['Instagram', f.instagramHandle], ['Facebook', f.facebookHandle], ['LinkedIn', f.linkedInHandle],
      ['Screen Share Date', f.screenShareDate], ['Preferred Time', f.screenShareTime],
    ]],
    ['KW COMMAND CRM', [
      ['Contact Count', f.contactCount], ['Using Command Since', f.commandDuration],
      ['SmartPlans Active', f.smartPlans], ['Tagging System', f.taggingSystem],
      ['Duplicates', f.duplicates], ['Preserve Notes', f.preserveNotes],
      ['Drive Folder', f.driveLink],
    ]],
    ['LEAD AUTOMATION', [
      ['Lead Sources', f.leadSources.join(', ')],
      ['Routing Phone', f.routingPhone], ['Lead Email', f.leadEmail],
      ['Natural Opener', f.naturalOpener], ['Never Automate', f.neverAutomation],
    ]],
    ['LISTING AUTOMATION', [
      ['MLS Length', f.mlsLength], ['Perspective', f.perspective],
      ['Always Highlight', f.alwaysHighlight], ['Avoid', f.avoidListing],
      ['Emojis', f.useEmojis], ['Hashtags', f.hashtags],
      ['CTA', f.standardCTA], ['Flyer Template', f.flyerLink],
    ]],
    ['OPEN HOUSE', [
      ['OH Days', f.ohDays.join(', ')], ['Frequency', f.ohFrequency],
      ['Standard Language', f.ohLanguage], ['Promo Details', f.ohPromoDetails],
    ]],
    ['NEWSLETTER', [
      ['List Size', f.emailListSize], ['Platform', f.emailPlatform],
      ['Topics', f.newsletterTopics], ['Avoid', f.avoidTopics],
      ['Segments', f.recurringSegments], ['Upcoming', f.upcomingListings],
      ['Questions', f.openQuestions],
    ]],
  ];

  sections.forEach(([title, rows]) => {
    const filled = rows.filter(([, v]) => v && v.toString().trim());
    if (!filled.length) return;

    checkPage(20);
    // Section header
    doc.setFillColor(17, 34, 59);
    doc.rect(marginL, y, maxW, 7, 'F');
    doc.setTextColor(201, 168, 76);
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text(title, marginL + 4, y + 5);
    y += 10;

    filled.forEach(([label, val]) => {
      const valStr = String(val);
      const lines = doc.splitTextToSize(valStr, maxW - 48);
      const rowH = Math.max(6, lines.length * 5) + 2;
      checkPage(rowH);
      doc.setTextColor(122, 118, 112);
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.text(label, marginL + 4, y + 4);
      doc.setTextColor(28, 26, 24);
      doc.setFont(undefined, 'normal');
      doc.text(lines, marginL + 48, y + 4);
      y += rowH;
    });
    y += 6;
  });

  const name = [f.firstName, f.lastName].filter(Boolean).join('_') || 'client';
  doc.save(`FWAgency_BrandIntake_${name}.pdf`);
}

// ── Cloudinary Upload ─────────────────────────────────────────────────────────

async function uploadFileToCloudinary(file) {
  console.log('[Cloudinary Debug] cloud_name:', CLOUDINARY_CLOUD_NAME, '| upload_preset:', CLOUDINARY_UPLOAD_PRESET);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('resource_type', 'auto');
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Cloudinary upload failed for ${file.name}: ${data.error?.message ?? res.status}`);
  return data.secure_url;
}

async function uploadAllFiles(f) {
  const groups = [
    { label: 'Brand Guideline', files: f.guideFiles },
    { label: 'Logo',            files: f.logoFiles },
    { label: 'Flyer',           files: f.flyerFiles },
    { label: 'Social Post',     files: f.postFiles },
  ];
  const urls = {};
  await Promise.all(
    groups.map(async ({ label, files }) => {
      if (!files.length) return;
      const uploaded = await Promise.all(files.map(uploadFileToCloudinary));
      urls[label] = uploaded;
    })
  );
  return urls;
}

// ── Formspree Submission ─────────────────────────────────────────────────────

async function submitToFormspree(f, fileUrls) {
  const payload = {};
  const skip = new Set(['guideFiles', 'logoFiles', 'logoPreviews', 'flyerFiles', 'flyerPreviews', 'postFiles', 'postPreviews']);
  for (const [k, v] of Object.entries(f)) {
    if (skip.has(k)) continue;
    if (Array.isArray(v)) {
      if (v.length) payload[k] = v.join(', ');
    } else if (v !== '' && v !== null && v !== undefined) {
      payload[k] = v;
    }
  }
  // Attach Cloudinary URLs
  for (const [label, urls] of Object.entries(fileUrls)) {
    if (urls.length) payload[`Uploaded Files — ${label}`] = urls.join('\n');
  }
  const res = await fetch(process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Submission failed');
  return res.json();
}

// ── Main Component ────────────────────────────────────────────────────────────

const INIT = {
  firstName: '', lastName: '', preferredName: '', phone: '', email: '',
  brokerage: '', marketCenter: '', licenseNumber: '', yearsInRE: '', serviceArea: '',
  guideFiles: [], guideNames: [],
  logoFiles: [], logoPreviews: [], logoNames: [],
  primaryColor: '#11223B', secondaryColor: '#C9A84C', accentColor: '',
  primaryFont: '', tones: [], alwaysUse: '', neverUse: '',
  flyerFiles: [], flyerPreviews: [], flyerNames: [],
  postFiles: [], postPreviews: [], postNames: [],
  instagramProfile: '', facebookProfile: '', linkedInProfile: '', inspirationNote: '',
  instagramHandle: '', facebookHandle: '', linkedInHandle: '',
  screenShareDate: '', screenShareTime: '', socialNotes: '',
  contactCount: '', commandDuration: '', smartPlans: '',
  taggingSystem: '', duplicates: '', preserveNotes: '', driveLink: '',
  leadSources: [], routingPhone: '', leadEmail: '', naturalOpener: '', neverAutomation: '',
  mlsLength: '', perspective: '', alwaysHighlight: '', avoidListing: '',
  useEmojis: '', hashtags: '', standardCTA: '', flyerLink: '',
  ohDays: [], ohFrequency: '', ohLanguage: '', ohPromoDetails: '',
  emailListSize: '', emailPlatform: '', newsletterTopics: '', avoidTopics: '',
  recurringSegments: '', upcomingListings: '', openQuestions: '',
};

export default function BrandIntakeForm() {
  const [screen, setScreen] = useState('welcome');
  const [step, setStep] = useState(0);
  const [f, setF] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [submitting, setSub] = useState(false);
  const topRef = useRef();

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const toggle = (k, v) => setF(p => ({
    ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v]
  }));
  const filesSetter = (fk, pk, nk) => (arr, prvs) =>
    setF(p => ({ ...p, [fk]: arr, [pk]: prvs, [nk]: arr.map(x => x.name) }));

  const validate = s => {
    const e = {};
    if (s === 0) {
      if (!f.firstName.trim()) e.firstName = 'Required';
      if (!f.lastName.trim()) e.lastName = 'Required';
      if (!f.phone.trim()) e.phone = 'Required';
      if (!f.email.trim()) e.email = 'Required';
      if (!f.brokerage.trim()) e.brokerage = 'Required';
    }
    if (s === 3 && !f.screenShareDate) e.screenShareDate = 'Please select a preferred date';
    if (s === 4 && !f.contactCount.trim()) e.contactCount = 'Required';
    if (s === 5) {
      if (!f.leadSources.length) e.leadSources = 'Select at least one lead source';
      if (!f.routingPhone.trim()) e.routingPhone = 'Required';
    }
    if (s === 6) {
      if (!f.mlsLength) e.mlsLength = 'Required';
      if (!f.perspective) e.perspective = 'Required';
    }
    if (s === 7 && !f.ohFrequency) e.ohFrequency = 'Required';
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step === 9) { handleSubmit(); return; }
    setStep(s => s + 1);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const back = () => {
    setErrors({});
    if (step === 0) { setScreen('welcome'); return; }
    setStep(s => s - 1);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSub(true);
    try {
      const fileUrls = await uploadAllFiles(f);
      await submitToFormspree(f, fileUrls);
      generatePDF(f);
      setScreen('confirm');
    } catch (err) {
      console.error('Submit error:', err);
      alert(`Submission error: ${err.message}`);
    } finally {
      setSub(false);
    }
  };

  // ── SECTIONS ──────────────────────────────────────────────────────────────

  const S0 = (
    <div>
      <SectionHead n="01" title="Agent Information"
        desc="Basic contact and professional details. This is how we identify you and stay in touch throughout the build." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        <Input label="First Name" required value={f.firstName} error={errors.firstName}
          onChange={e => set('firstName', e.target.value)} />
        <Input label="Last Name" required value={f.lastName} error={errors.lastName}
          onChange={e => set('lastName', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        <Input label="Preferred Name" optional placeholder="What should we call you?"
          value={f.preferredName} onChange={e => set('preferredName', e.target.value)} />
        <Input label="Phone Number" required value={f.phone} error={errors.phone}
          onChange={e => set('phone', e.target.value)} />
      </div>
      <Input label="Email Address" required type="email" value={f.email} error={errors.email}
        onChange={e => set('email', e.target.value)} />
      <Input label="Brokerage" required value={f.brokerage} error={errors.brokerage}
        onChange={e => set('brokerage', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        <Input label="License Number" optional value={f.licenseNumber}
          onChange={e => set('licenseNumber', e.target.value)} />
        <Input label="Years in Real Estate" optional type="number" value={f.yearsInRE}
          onChange={e => set('yearsInRE', e.target.value)} />
      </div>
      <TextArea label="Primary Service Area" optional rows={2}
        placeholder="Cities, neighborhoods, or zip codes you serve"
        value={f.serviceArea} onChange={e => set('serviceArea', e.target.value)} />
    </div>
  );

  const S1 = (
    <div>
      <SectionHead n="02" title="Brand Identity"
        desc="Help us understand your brand visually and tonally. Everything here shapes how your content looks and sounds." />
      <FileZone label="Brand Guideline" optional
        hint="Upload your brand guideline document if you have one — PDF, Word, or image"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" multiple={false}
        files={f.guideFiles} previews={[]}
        onFiles={filesSetter('guideFiles', '_', 'guideNames')} />
      <FileZone label="Logo Files" optional
        hint="PNG or SVG preferred. Include both light and dark versions if you have them."
        accept="image/*,.svg,.eps,.ai" multiple={true}
        files={f.logoFiles} previews={f.logoPreviews}
        onFiles={filesSetter('logoFiles', 'logoPreviews', 'logoNames')} />
      <div style={{ marginBottom: 16 }}>
        <Label optional>Brand Colors</Label>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['primaryColor', 'Primary'], ['secondaryColor', 'Secondary'], ['accentColor', 'Accent (opt.)']].map(([k, lbl]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={f[k] || '#FFFFFF'} onChange={e => set(k, e.target.value)}
                style={{
                  width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2,
                  background: 'transparent'
                }} />
              <div>
                <div style={{ fontSize: 10, color: MGR, marginBottom: 2, fontWeight: 600 }}>{lbl}</div>
                <input value={f[k]} onChange={e => set(k, e.target.value)}
                  style={{
                    width: 82, fontSize: 11, padding: '4px 7px', border: `1px solid ${RUL}`,
                    borderRadius: 4, fontFamily: 'monospace', color: DTX
                  }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Input label="Primary Font / Typeface" optional
        placeholder="e.g. Playfair Display, Montserrat, or 'Not sure'"
        value={f.primaryFont} onChange={e => set('primaryFont', e.target.value)} />
      <Pills label="Brand Tone" optional options={TONES} value={f.tones}
        onToggle={v => toggle('tones', v)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        <TextArea label="Phrases You Always Use" optional rows={2}
          placeholder={`e.g. "Your home. Your story." or your tagline`}
          value={f.alwaysUse} onChange={e => set('alwaysUse', e.target.value)} />
        <TextArea label="Phrases to Never Use" optional rows={2}
          placeholder="Hard limits or language that feels off-brand"
          value={f.neverUse} onChange={e => set('neverUse', e.target.value)} />
      </div>
    </div>
  );

  const S2 = (
    <div>
      <SectionHead n="03" title="Inspiration & Style References"
        desc="Upload examples of content you love — yours or others. The listing automation learns from these. The more you share, the better the match." />
      <FileZone label="Flyers You Love (3–5 recommended)" optional
        hint="Listing flyers, open house flyers, postcards — anything that represents your aesthetic"
        accept="image/*,.pdf" multiple={true}
        files={f.flyerFiles} previews={f.flyerPreviews}
        onFiles={filesSetter('flyerFiles', 'flyerPreviews', 'flyerNames')} />
      <FileZone label="Social Posts You Love (3–5 recommended)" optional
        hint="Screenshots of posts you love — yours or others — that capture the vibe you want"
        accept="image/*" multiple={true}
        files={f.postFiles} previews={f.postPreviews}
        onFiles={filesSetter('postFiles', 'postPreviews', 'postNames')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
        <Input label="Instagram Profile" optional placeholder="instagram.com/handle"
          value={f.instagramProfile} onChange={e => set('instagramProfile', e.target.value)} />
        <Input label="Facebook Page" optional placeholder="facebook.com/page"
          value={f.facebookProfile} onChange={e => set('facebookProfile', e.target.value)} />
        <Input label="LinkedIn Profile" optional placeholder="linkedin.com/in/name"
          value={f.linkedInProfile} onChange={e => set('linkedInProfile', e.target.value)} />
      </div>
      <TextArea label="What Do You Love About These Examples?" optional rows={3}
        placeholder="Colors, tone, layout, energy, vibe — anything that draws you to them"
        value={f.inspirationNote} onChange={e => set('inspirationNote', e.target.value)} />
    </div>
  );

  const S3 = (
    <div>
      <SectionHead n="04" title="Social Media Access"
        desc="We never need your passwords. You'll grant FWAgency team member or admin access on each platform. We walk through it together on a quick screen share — takes about 15 minutes." />
      <div style={{
        background: `${GLD}12`, border: `1px solid ${GLD}40`,
        borderLeft: `3px solid ${GLD}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: NAV, marginBottom: 5 }}>How access works</div>
        <div style={{ fontSize: 12, color: MGR, lineHeight: 1.7 }}>
          <strong>Instagram & Facebook</strong> — Add FWAgency as Editor in Meta Business Suite<br />
          <strong>LinkedIn</strong> — Add FWAgency as Page Admin in LinkedIn settings<br />
          No passwords shared. You're in control at all times.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
        <Input label="Instagram Handle" placeholder="@handle"
          value={f.instagramHandle} onChange={e => set('instagramHandle', e.target.value)} />
        <Input label="Facebook Page Name" placeholder="Page name or URL"
          value={f.facebookHandle} onChange={e => set('facebookHandle', e.target.value)} />
        <Input label="LinkedIn Page / Profile" placeholder="Page or profile name"
          value={f.linkedInHandle} onChange={e => set('linkedInHandle', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        <Input label="Best Date for Access Screen Share" required type="date"
          value={f.screenShareDate} error={errors.screenShareDate}
          onChange={e => set('screenShareDate', e.target.value)} />
        <Input label="Preferred Time" optional type="time"
          value={f.screenShareTime} onChange={e => set('screenShareTime', e.target.value)} />
      </div>
      <TextArea label="Anything Else About Your Social Accounts" optional rows={2}
        placeholder="e.g. You manage a personal and a business page, or you have a team account"
        value={f.socialNotes} onChange={e => set('socialNotes', e.target.value)} />
    </div>
  );

  const S4 = (
    <div>
      <SectionHead n="05" title="KW Command CRM"
        desc="We need a clear picture of your database before touching anything. You'll receive a full audit summary before any automation runs on top of it." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        <Input label="Approximate Contact Count" required type="number"
          value={f.contactCount} error={errors.contactCount}
          onChange={e => set('contactCount', e.target.value)} />
        <Input label="How Long Have You Used Command?" optional
          placeholder="e.g. 6 months, 2 years"
          value={f.commandDuration} onChange={e => set('commandDuration', e.target.value)} />
      </div>
      <Radios label="Are SmartPlans Currently Active?" required
        options={['Yes', 'No', 'Unsure']} value={f.smartPlans}
        onChange={v => set('smartPlans', v)} />
      <Radios label="Do You Have a Tagging System?" required
        options={['Yes', 'No', "It's a mess"]} value={f.taggingSystem}
        onChange={v => set('taggingSystem', v)} />
      <Radios label="Do You Have Duplicate Contacts?" required
        options={['Yes', 'No', 'Not Sure']} value={f.duplicates}
        onChange={v => set('duplicates', v)} />
      <TextArea label="Anything to Preserve Before We Touch Your CRM" optional rows={2}
        placeholder="Specific tags, SmartPlans already working, notes on key contacts we should know about"
        value={f.preserveNotes} onChange={e => set('preserveNotes', e.target.value)} />
      <div style={{
        background: `${GLD}10`, border: `1px solid ${GLD}35`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 16
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: NAV, letterSpacing: 1, marginBottom: 5 }}>
          GOOGLE DRIVE UPLOAD FOLDER
        </div>
        <div style={{ fontSize: 11, color: MGR, lineHeight: 1.6, marginBottom: 10 }}>
          Forest will create a dedicated Google Drive folder for your account and share the link before your onboarding call.
          Paste it here — all your uploaded assets will land in the right place automatically.
        </div>
        <Input label="Your Client Drive Folder Link" optional
          placeholder="Paste the link Forest shared with you"
          value={f.driveLink} onChange={e => set('driveLink', e.target.value)} />
      </div>
    </div>
  );

  const S5 = (
    <div>
      <SectionHead n="06" title="Lead Automation"
        desc="This section configures how the AI responds to new leads in your voice. Your opener is what the automation is trained on — it should sound exactly like you." />
      <Pills label="Where Do Your Leads Come From?" required
        options={LEAD_SRC} value={f.leadSources}
        onToggle={v => toggle('leadSources', v)} error={errors.leadSources} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        <Input label="Routing Phone Number" required
          placeholder="Number leads and texts should route to"
          value={f.routingPhone} error={errors.routingPhone}
          onChange={e => set('routingPhone', e.target.value)} />
        <Input label="Lead Notification Email" optional
          placeholder="Where should lead alerts be sent?"
          value={f.leadEmail} onChange={e => set('leadEmail', e.target.value)} />
      </div>
      <TextArea label="How Do You Naturally Open a Conversation With a New Lead?" optional rows={3}
        placeholder={`e.g. "Hey [Name], thanks for reaching out! I'd love to help you find the right home. Are you looking to buy or sell?"`}
        value={f.naturalOpener} onChange={e => set('naturalOpener', e.target.value)} />
      <TextArea label="Anything You Never Want in an Automated Message" optional rows={2}
        placeholder="Hard limits, promises you can't keep, language that feels off-brand or too salesy"
        value={f.neverAutomation} onChange={e => set('neverAutomation', e.target.value)} />
    </div>
  );

  const S6 = (
    <div>
      <SectionHead n="07" title="Listing Automation"
        desc="When you submit a new listing, you receive 6 outputs instantly — MLS copy, 3 social posts, flyer copy, and a Just Listed email. This section ensures every output sounds like you." />
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '0 16px', background: OFW, border: `1px solid ${RUL}`,
        borderRadius: 8, padding: '12px 14px', marginBottom: 16,
      }}>
        {['MLS Description', 'Instagram Caption', 'Facebook Post', 'LinkedIn Post', 'Flyer Copy', 'Just Listed Email Blast'].map((o, i) => (
          <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%', background: NAV,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: GLD, flexShrink: 0
            }}>{i + 1}</span>
            <span style={{ fontSize: 11, color: DTX }}>{o}</span>
          </div>
        ))}
      </div>
      <Radios label="MLS Description Length" required
        options={['Short', 'Medium', 'Long', 'Varies']}
        value={f.mlsLength} onChange={v => set('mlsLength', v)} error={errors.mlsLength} />
      <Radios label="First or Third Person?" required
        options={['First — "Welcome to..."', 'Third — "This home features..."', 'Either']}
        value={f.perspective} onChange={v => set('perspective', v)} error={errors.perspective} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        <TextArea label="Features You Always Highlight" optional rows={2}
          placeholder="e.g. natural light, updated kitchen, school district, walkability"
          value={f.alwaysHighlight} onChange={e => set('alwaysHighlight', e.target.value)} />
        <TextArea label="Features / Language to Avoid" optional rows={2}
          placeholder="Words or angles you never want in listing content"
          value={f.avoidListing} onChange={e => set('avoidListing', e.target.value)} />
      </div>
      <Radios label="Do You Use Emojis in Captions?"
        options={['Yes', 'No', 'Occasionally']}
        value={f.useEmojis} onChange={v => set('useEmojis', v)} />
      <TextArea label="Your Standard Hashtag Set" optional rows={2}
        placeholder="#albanyrealtor #capitaldistrict #kwrealty — list all you regularly use"
        value={f.hashtags} onChange={e => set('hashtags', e.target.value)} />
      <TextArea label="Standard Call-to-Action" optional rows={2}
        placeholder={`e.g. "DM me for a private showing" or "Link in bio for details and photos"`}
        value={f.standardCTA} onChange={e => set('standardCTA', e.target.value)} />
      <Input label="Flyer Template Link" optional
        placeholder="Link to your Canva template, Drive folder, or a past flyer — we match every output to this"
        value={f.flyerLink} onChange={e => set('flyerLink', e.target.value)} />
    </div>
  );

  const S7 = (
    <div>
      <SectionHead n="08" title="Open House Preferences"
        desc="Your open house coverage includes a Thursday preview post (for Saturday), a Friday preview post (for Sunday), and day-of posts on both days. Help us match your rhythm." />
      <Pills label="Your Typical Open House Days" optional
        options={OH_DAYS} value={f.ohDays} onToggle={v => toggle('ohDays', v)} />
      <Radios label="How Often Do You Hold Open Houses?" required
        options={['Every week', 'Every other week', 'Once a month', 'Varies by listing']}
        value={f.ohFrequency} onChange={v => set('ohFrequency', v)} error={errors.ohFrequency} />
      <TextArea label="Standard Language You Include in Open House Posts" optional rows={3}
        placeholder={`e.g. "Come see this stunning home this Saturday! Light bites provided. 12–3pm." — anything you always say`}
        value={f.ohLanguage} onChange={e => set('ohLanguage', e.target.value)} />
      <TextArea label="Anything Specific About How You Promote Open Houses" optional rows={2}
        placeholder="Time formats, what to emphasize, what makes yours stand out"
        value={f.ohPromoDetails} onChange={e => set('ohPromoDetails', e.target.value)} />
    </div>
  );

  const S8 = (
    <div>
      <SectionHead n="09" title="Newsletter & Final Notes"
        desc="Newsletter and email marketing are add-on services. Everything in this section is optional — skip anything that doesn't apply to your current package." />
      <div style={{
        background: `${GLD}10`, border: `1px solid ${GLD}30`,
        borderRadius: 8, padding: '10px 14px', marginBottom: 18,
        fontSize: 11, color: MGR, lineHeight: 1.6
      }}>
        All fields in this section are optional. If newsletter services aren't part of your package, you can skip this section and click Next.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        <Input label="Current Email List Size" optional type="number" placeholder="Approx. number"
          value={f.emailListSize} onChange={e => set('emailListSize', e.target.value)} />
        <Input label="Email Platform" optional placeholder="e.g. KW Command, Mailchimp, none"
          value={f.emailPlatform} onChange={e => set('emailPlatform', e.target.value)} />
      </div>
      <TextArea label="Topics You Want in the Newsletter" optional rows={2}
        placeholder="e.g. market updates, new listings, home tips, community events, personal story"
        value={f.newsletterTopics} onChange={e => set('newsletterTopics', e.target.value)} />
      <TextArea label="Topics to Avoid" optional rows={2}
        placeholder="Anything you don't want discussed in client-facing emails"
        value={f.avoidTopics} onChange={e => set('avoidTopics', e.target.value)} />
      <TextArea label="Recurring Segments You'd Like" optional rows={2}
        placeholder={`e.g. "Home of the Week," "Market Stat of the Month," "Client Spotlight"`}
        value={f.recurringSegments} onChange={e => set('recurringSegments', e.target.value)} />
      <TextArea label="Upcoming Listings or Events to Plan Around" optional rows={2}
        placeholder="Anything we should know about for the first few weeks of content"
        value={f.upcomingListings} onChange={e => set('upcomingListings', e.target.value)} />
      <TextArea label="Any Questions Before We Get Started?" optional rows={3}
        placeholder="Anything on your mind — we'll address everything on the kickoff call"
        value={f.openQuestions} onChange={e => set('openQuestions', e.target.value)} />
    </div>
  );

  const S9 = (
    <div>
      <SectionHead n="10" title="Review & Submit"
        desc="Take a moment to review your responses. Once you submit, Forest will be notified and a PDF summary will download to your device." />
      <ReviewCard title="AGENT INFORMATION" rows={[
        ['Name', [f.firstName, f.lastName].filter(Boolean).join(' ') + (f.preferredName ? ` (${f.preferredName})` : '')],
        ['Phone', f.phone], ['Email', f.email], ['Brokerage', f.brokerage],
        ['Market Center', f.marketCenter], ['Service Area', f.serviceArea],
      ]} />
      <ReviewCard title="BRAND IDENTITY" rows={[
        ['Brand Guideline', f.guideNames.length ? f.guideNames.join(', ') : ''],
        ['Logo Files', f.logoNames.length ? `${f.logoNames.length} file(s) uploaded` : ''],
        ['Primary Color', f.primaryColor], ['Secondary Color', f.secondaryColor],
        ['Font', f.primaryFont], ['Tone', f.tones.join(', ')],
        ['Always Use', f.alwaysUse], ['Never Use', f.neverUse],
      ]} />
      <ReviewCard title="INSPIRATION" rows={[
        ['Flyers Uploaded', f.flyerFiles.length ? `${f.flyerFiles.length} file(s)` : ''],
        ['Posts Uploaded', f.postFiles.length ? `${f.postFiles.length} file(s)` : ''],
        ['Instagram', f.instagramProfile], ['Facebook', f.facebookProfile],
        ['Inspiration Notes', f.inspirationNote],
      ]} />
      <ReviewCard title="SOCIAL MEDIA ACCESS" rows={[
        ['Instagram', f.instagramHandle], ['Facebook', f.facebookHandle], ['LinkedIn', f.linkedInHandle],
        ['Screen Share Date', f.screenShareDate], ['Preferred Time', f.screenShareTime],
      ]} />
      <ReviewCard title="KW COMMAND CRM" rows={[
        ['Contact Count', f.contactCount], ['Using Command Since', f.commandDuration],
        ['SmartPlans Active', f.smartPlans], ['Tagging System', f.taggingSystem],
        ['Duplicates', f.duplicates], ['Preserve Notes', f.preserveNotes],
        ['Drive Folder', f.driveLink],
      ]} />
      <ReviewCard title="LEAD AUTOMATION" rows={[
        ['Lead Sources', f.leadSources.join(', ')],
        ['Routing Phone', f.routingPhone], ['Lead Email', f.leadEmail],
        ['Natural Opener', f.naturalOpener], ['Never Automate', f.neverAutomation],
      ]} />
      <ReviewCard title="LISTING AUTOMATION" rows={[
        ['MLS Length', f.mlsLength], ['Perspective', f.perspective],
        ['Always Highlight', f.alwaysHighlight], ['Avoid', f.avoidListing],
        ['Emojis', f.useEmojis], ['Hashtags', f.hashtags],
        ['CTA', f.standardCTA], ['Flyer Template', f.flyerLink],
      ]} />
      <ReviewCard title="OPEN HOUSE" rows={[
        ['OH Days', f.ohDays.join(', ')], ['Frequency', f.ohFrequency],
        ['Standard Language', f.ohLanguage], ['Promo Details', f.ohPromoDetails],
      ]} />
      <ReviewCard title="NEWSLETTER" rows={[
        ['List Size', f.emailListSize], ['Platform', f.emailPlatform],
        ['Topics', f.newsletterTopics], ['Avoid', f.avoidTopics],
        ['Segments', f.recurringSegments], ['Upcoming', f.upcomingListings],
        ['Questions', f.openQuestions],
      ]} />
      <div style={{
        background: `${NAV}08`, border: `1px solid ${RUL}`,
        borderRadius: 8, padding: '12px 16px', marginTop: 16, fontSize: 12, color: MGR, lineHeight: 1.65
      }}>
        By submitting, your completed intake will be sent to Forest at FWAgency. A PDF summary will automatically download to your device.
      </div>
    </div>
  );

  const sections = [S0, S1, S2, S3, S4, S5, S6, S7, S8, S9];

  // ── WELCOME ───────────────────────────────────────────────────────────────
  if (screen === 'welcome') return (
    <div style={{
      minHeight: '100vh', background: OFW, display: 'flex', flexDirection: 'column',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    }}>
      <div style={{ background: NAV, padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 3, height: 30, background: GLD, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: GLD, letterSpacing: 2.5 }}>FWAGENCY</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>AI Automation & Digital Marketing</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ maxWidth: 500, width: '100%' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', background: NAV,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 24, border: `2px solid ${GLD}`,
          }}>✦</div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: GLD, letterSpacing: 2.5,
            textAlign: 'center', marginBottom: 10
          }}>BRAND INTAKE FORM</div>
          <h1 style={{
            fontSize: 26, fontWeight: 700, color: NAV, textAlign: 'center',
            marginBottom: 10, lineHeight: 1.3
          }}>
            Let's build something made for you
          </h1>
          <p style={{ fontSize: 13, color: MGR, lineHeight: 1.7, textAlign: 'center', marginBottom: 28 }}>
            This form takes about <strong style={{ color: NAV }}>8–12 minutes</strong>.
            Your answers shape everything — how your automations sound, how your content looks,
            and how every listing gets marketed.
          </p>
          <div style={{
            background: WHT, border: `1px solid ${RUL}`, borderRadius: 10,
            overflow: 'hidden', marginBottom: 28
          }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 16px', borderBottom: i < STEPS.length - 1 ? `1px solid ${RUL}` : 'none'
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: GLD, minWidth: 22,
                  textAlign: 'right'
                }}>0{i + 1}</span>
                <span style={{ fontSize: 12, color: DTX }}>{s}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setScreen('form')}
            style={{
              width: '100%', background: NAV, color: GLD, border: 'none', borderRadius: 8,
              padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: 0.5, transition: 'background 0.2s'
            }}
            onMouseOver={e => e.target.style.background = NAV2}
            onMouseOut={e => e.target.style.background = NAV}>
            Get Started →
          </button>
          <div style={{ fontSize: 11, color: MGR, textAlign: 'center', marginTop: 12 }}>
            Your responses are sent securely to Forest at FWAgency.
          </div>
        </div>
      </div>
    </div>
  );

  // ── CONFIRMATION ──────────────────────────────────────────────────────────
  if (screen === 'confirm') return (
    <div style={{
      minHeight: '100vh', background: OFW, display: 'flex', flexDirection: 'column',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    }}>
      <div style={{ background: NAV, padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 3, height: 30, background: GLD, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: GLD, letterSpacing: 2.5 }}>FWAGENCY</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>AI Automation & Digital Marketing</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%', background: NAV,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 28, border: `2px solid ${GLD}`
          }}>✓</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: GLD, letterSpacing: 2.5, marginBottom: 10 }}>
            SUBMITTED SUCCESSFULLY
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: NAV, marginBottom: 10 }}>
            You're all set{f.preferredName || f.firstName ? `, ${f.preferredName || f.firstName}` : ''}
          </h2>
          <p style={{ fontSize: 13, color: MGR, lineHeight: 1.7, marginBottom: 24 }}>
            Your brand intake is complete. Forest will review everything before your kickoff call
            and reach out to confirm your screen share date.
          </p>
          <div style={{
            background: WHT, border: `1px solid ${RUL}`, borderRadius: 10,
            overflow: 'hidden', marginBottom: 24, textAlign: 'left'
          }}>
            <div style={{
              background: NAV, padding: '8px 14px', fontSize: 10,
              fontWeight: 700, color: GLD, letterSpacing: 1.5
            }}>WHAT HAPPENS NEXT</div>
            {[
              "Forest reviews your intake before the kickoff call",
              `Screen share for social access — ${f.screenShareDate || 'date you selected'}${f.screenShareTime ? ' at ' + f.screenShareTime : ''}`,
              "CRM audit begins once access is confirmed",
              "All automations built and live by April 30",
              "Marketing launches May 1 — $1,650/month retainer begins",
            ].map((item, i, arr) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '9px 14px',
                borderBottom: i < arr.length - 1 ? `1px solid ${RUL}` : 'none', alignItems: 'flex-start'
              }}>
                <span style={{ color: GLD, fontWeight: 700, fontSize: 11, minWidth: 18 }}>0{i + 1}</span>
                <span style={{ fontSize: 12, color: DTX, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: MGR }}>
            Questions? Contact{' '}
            <span style={{ color: NAV, fontWeight: 600 }}>fwagency22@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── FORM ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: OFW, display: 'flex', flexDirection: 'column',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity:0; transform:translateX(14px); }
          to   { opacity:1; transform:translateX(0); }
        }
        * { box-sizing: border-box; }
        input[type=date]::-webkit-calendar-picker-indicator { opacity:0.6; cursor:pointer; }
        textarea { font-family: inherit; }
      `}</style>

      {/* Top brand bar */}
      <div style={{
        background: NAV, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0
      }}>
        <div style={{ width: 3, height: 26, background: GLD, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: GLD, letterSpacing: 2.5 }}>FWAGENCY</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Brand Intake Form</div>
        </div>
      </div>

      {/* Progress bar */}
      <div ref={topRef} style={{ background: NAV, padding: '10px 22px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: WHT }}>{STEPS[step]}</div>
          <div style={{ fontSize: 11, color: GLD, fontWeight: 600 }}>
            {step + 1} / {STEPS.length}
          </div>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2, background: GLD,
            width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width 0.4s ease'
          }} />
        </div>
        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i <= step ? 8 : 6, height: i <= step ? 8 : 6,
              borderRadius: '50%',
              background: i < step ? GLD : i === step ? WHT : 'rgba(255,255,255,0.25)',
              transition: 'all 0.3s', flexShrink: 0,
            }} />
          ))}
        </div>
      </div>

      {/* Section content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 22px 100px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div key={step} style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {sections[step]}
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: WHT, borderTop: `1px solid ${RUL}`,
        padding: '12px 22px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', zIndex: 50,
      }}>
        <button onClick={back}
          style={{
            background: 'transparent', color: MGR, border: `1.5px solid ${RUL}`,
            borderRadius: 8, padding: '9px 22px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = NAV; e.currentTarget.style.color = NAV; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = RUL; e.currentTarget.style.color = MGR; }}>
          ← Back
        </button>
        <div style={{ fontSize: 11, color: MGR }}>
          {Object.keys(errors).length > 0 && (
            <span style={{ color: ERR, fontWeight: 600 }}>Please complete required fields ↑</span>
          )}
        </div>
        <button onClick={next} disabled={submitting}
          style={{
            background: submitting ? '#888' : NAV, color: GLD, border: 'none',
            borderRadius: 8, padding: '9px 26px', fontSize: 12, fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            transition: 'background 0.15s', minWidth: 110,
          }}
          onMouseOver={e => !submitting && (e.currentTarget.style.background = NAV2)}
          onMouseOut={e => !submitting && (e.currentTarget.style.background = NAV)}>
          {submitting ? 'Submitting...' : step === 9 ? 'Submit Form →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
