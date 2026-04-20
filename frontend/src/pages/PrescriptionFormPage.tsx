// src/pages/PrescriptionFormPage.tsx
//
// Route:  /appointments/:appointmentId/prescribe
// Wired from DoctorAppointmentsPage "Complete & Prescribe" button.

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2, FileText, CalendarCheck } from 'lucide-react';

import { handleApiError } from '../services/api';
import { getDoctorAppointments } from '../services/doctor_api';
import {
  createPrescription,
  FREQUENCY_LABELS,
  INSTRUCTION_LABELS,
  FrequencyChoice,
  InstructionChoice,
  MedicineInput,
} from '../services/prescription_api';
import { DoctorAppointment } from '../types';

// ── Colour tokens (matches existing dashboard palette) ──────────────────────
const C = {
  navy:       '#1a3c6e',
  blue2:      '#2e5fa3',
  lightBg:    '#e8f0f7',
  white:      '#ffffff',
  border:     '#d0dff0',
  label:      '#6b87a8',
  text:       '#1a3c6e',
  subtle:     '#9bb3cc',
  inputBg:    '#f5f8fc',
  red:        '#dc2626',
  redLight:   '#fef2f2',
  redBorder:  '#fecaca',
  green:      '#16a34a',
  greenLight: '#f0fdf4',
  greenBorder:'#bbf7d0',
};

// ── Empty medicine row factory ───────────────────────────────────────────────
const emptyMed = (): MedicineInput => ({
  medicine_name: '',
  dosage:        '',
  frequency:     '',
  duration:      '',
  instructions:  '',
});

// ── Shared input style ───────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '8px 10px',
  borderRadius: '7px',
  border:       `1px solid ${C.border}`,
  background:   C.inputBg,
  color:        C.navy,
  fontSize:     '13px',
  outline:      'none',
  boxSizing:    'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize:    'vertical',
  minHeight: '80px',
  lineHeight: '1.55',
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background:   C.white,
        borderRadius: '12px',
        border:       `1px solid ${C.border}`,
        marginBottom: '20px',
        overflow:     'hidden',
        boxShadow:    '0 1px 4px rgba(26,60,110,0.05)',
      }}
    >
      <div
        style={{
          padding:    '11px 20px',
          background: C.lightBg,
          borderBottom: `1px solid ${C.border}`,
          fontWeight: 700,
          fontSize:   '13px',
          color:      C.navy,
          letterSpacing: '0.3px',
        }}
      >
        {title}
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize:    '12px',
        fontWeight:  600,
        color:       C.label,
        marginBottom:'4px',
        letterSpacing: '0.2px',
      }}
    >
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
const PrescriptionFormPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate          = useNavigate();

  const [appointment, setAppointment] = useState<DoctorAppointment | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);

  // form state
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medicines,     setMedicines]     = useState<MedicineInput[]>([emptyMed()]);
  const [labTests,      setLabTests]      = useState('');
  const [advice,        setAdvice]        = useState('');
  const [followUpDate,  setFollowUpDate]  = useState('');

  const today = new Date().toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  });

  // ── load appointment ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const all = await getDoctorAppointments();
        const found = all.find(
          (a) => a.appointment_id === Number(appointmentId),
        );
        if (!found) throw new Error('Appointment not found.');
        if (found.status === 'completed') {
          toast.error('This appointment is already completed.');
          navigate(-1);
          return;
        }
        setAppointment(found);
      } catch (e) {
        toast.error(handleApiError(e));
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId, navigate]);

  // ── medicine row helpers ───────────────────────────────────
  const updateMed = (
    idx: number,
    field: keyof MedicineInput,
    value: string,
  ) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    );
  };

  const addMed    = () => setMedicines((p) => [...p, emptyMed()]);
  const removeMed = (idx: number) =>
    setMedicines((p) => p.filter((_, i) => i !== idx));

  // ── submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    // basic validation
    const filledMeds = medicines.filter(
      (m) => m.medicine_name.trim() !== '',
    );
    if (!clinicalNotes.trim() && filledMeds.length === 0) {
      toast.error('Please fill in at least Clinical Notes or one Medicine.');
      return;
    }
    for (const m of filledMeds) {
      if (!m.medicine_name.trim()) {
        toast.error('Medicine name is required for all rows.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await createPrescription(Number(appointmentId), {
        clinical_notes: clinicalNotes || undefined,
        medicines:      filledMeds,
        lab_tests:      labTests      || undefined,
        advice:         advice        || undefined,
        follow_up_date: followUpDate  || null,
      });

      toast.success('Prescription saved & PDF generated!');

      // open PDF in new tab if available
      if (result.pdf_url) {
        window.open(result.pdf_url, '_blank');
      }
      navigate('/doctor/appointments');
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  // ── loading / not found ────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display:        'flex',
          justifyContent: 'center',
          alignItems:     'center',
          height:         '60vh',
          color:          C.label,
          fontSize:       '15px',
        }}
      >
        Loading appointment…
      </div>
    );
  }

  // ── format appointment display ──────────────────────────────
  function fmt12(t: string | null) {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hr = parseInt(h, 10);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  }

  // ════════════════════════════════════════════════════════════
  return (
    <div
      style={{
        maxWidth:  '860px',
        margin:    '0 auto',
        padding:   '24px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── Page header ─────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
          marginBottom:   '24px',
          flexWrap:       'wrap',
          gap:            '8px',
        }}
      >
        <div>
          <div
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '10px',
              marginBottom: '4px',
            }}
          >
            <FileText size={22} color={C.navy} />
            <h1
              style={{
                margin:     0,
                fontSize:   '22px',
                fontWeight: 700,
                color:      C.navy,
              }}
            >
              Write Prescription
            </h1>
          </div>
          {appointment && (
            <p style={{ margin: 0, fontSize: '13px', color: C.label }}>
              Patient: <strong style={{ color: C.navy }}>{appointment.patient_email}</strong>
              &nbsp;·&nbsp;
              {appointment.slot_date}&nbsp;
              {fmt12(appointment.start_time)} – {fmt12(appointment.end_time)}
            </p>
          )}
        </div>

        {/* Today's date — top right */}
        <div
          style={{
            background:   C.lightBg,
            border:       `1px solid ${C.border}`,
            borderRadius: '8px',
            padding:      '7px 14px',
            fontSize:     '13px',
            color:        C.label,
            fontWeight:   600,
            whiteSpace:   'nowrap',
          }}
        >
          {today}
        </div>
      </div>

      {/* ── Clinical Notes ───────────────────────────────────── */}
      <SectionCard title="Clinical Notes">
        <Label>
          Chief Complaint · Diagnosis · Symptoms · Vitals
        </Label>
        <textarea
          style={textareaStyle}
          placeholder="e.g. Patient presents with fever since 3 days. Diagnosis: Viral fever. Temp 101°F, BP 120/80..."
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          rows={4}
        />
      </SectionCard>

      {/* ── Medicines ────────────────────────────────────────── */}
      <SectionCard title="℞  Prescription / Medicines">
        {/* Table header */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: '2.2fr 1fr 1.4fr 1fr 1.4fr 36px',
            gap:                 '8px',
            marginBottom:        '8px',
          }}
        >
          {['Medicine Name', 'Dosage', 'Frequency', 'Duration', 'Instructions', ''].map(
            (h, i) => (
              <div
                key={i}
                style={{
                  fontSize:    '11px',
                  fontWeight:  700,
                  color:       C.label,
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                {h}
              </div>
            ),
          )}
        </div>

        {/* Medicine rows */}
        {medicines.map((med, idx) => (
          <div
            key={idx}
            style={{
              display:             'grid',
              gridTemplateColumns: '2.2fr 1fr 1.4fr 1fr 1.4fr 36px',
              gap:                 '8px',
              marginBottom:        '8px',
              alignItems:          'center',
            }}
          >
            {/* Name */}
            <input
              style={inputStyle}
              placeholder="e.g. Paracetamol 500mg"
              value={med.medicine_name}
              onChange={(e) => updateMed(idx, 'medicine_name', e.target.value)}
            />

            {/* Dosage */}
            <input
              style={inputStyle}
              placeholder="1 tablet"
              value={med.dosage}
              onChange={(e) => updateMed(idx, 'dosage', e.target.value)}
            />

            {/* Frequency */}
            <select
              style={selectStyle}
              value={med.frequency}
              onChange={(e) =>
                updateMed(idx, 'frequency', e.target.value as FrequencyChoice)
              }
            >
              <option value="">— Select —</option>
              {(Object.entries(FREQUENCY_LABELS) as [FrequencyChoice, string][]).map(
                ([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ),
              )}
            </select>

            {/* Duration */}
            <input
              style={inputStyle}
              placeholder="5 days"
              value={med.duration}
              onChange={(e) => updateMed(idx, 'duration', e.target.value)}
            />

            {/* Instructions */}
            <select
              style={selectStyle}
              value={med.instructions}
              onChange={(e) =>
                updateMed(
                  idx,
                  'instructions',
                  e.target.value as InstructionChoice,
                )
              }
            >
              <option value="">— Select —</option>
              {(Object.entries(INSTRUCTION_LABELS) as [InstructionChoice, string][]).map(
                ([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ),
              )}
            </select>

            {/* Remove */}
            <button
              onClick={() => removeMed(idx)}
              disabled={medicines.length === 1}
              title="Remove row"
              style={{
                background:   medicines.length === 1 ? '#f9fafb' : C.redLight,
                border:       `1px solid ${medicines.length === 1 ? C.border : C.redBorder}`,
                borderRadius: '7px',
                padding:      '6px',
                cursor:       medicines.length === 1 ? 'not-allowed' : 'pointer',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                opacity:      medicines.length === 1 ? 0.4 : 1,
              }}
            >
              <Trash2 size={14} color={medicines.length === 1 ? C.subtle : C.red} />
            </button>
          </div>
        ))}

        {/* Add row button */}
        <button
          onClick={addMed}
          style={{
            marginTop:    '8px',
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '7px 16px',
            borderRadius: '8px',
            border:       `1px dashed ${C.blue2}`,
            background:   'transparent',
            color:        C.blue2,
            cursor:       'pointer',
            fontWeight:   600,
            fontSize:     '13px',
          }}
        >
          <Plus size={14} />
          Add Medicine
        </button>
      </SectionCard>

      {/* ── Lab Tests ────────────────────────────────────────── */}
      <SectionCard title="Lab Tests / Investigations">
        <Label>Recommended tests</Label>
        <textarea
          style={textareaStyle}
          placeholder="e.g. CBC, Blood Sugar (Fasting), Urine R/M, Chest X-Ray..."
          value={labTests}
          onChange={(e) => setLabTests(e.target.value)}
          rows={3}
        />
      </SectionCard>

      {/* ── Doctor's Advice ──────────────────────────────────── */}
      <SectionCard title="Doctor's Advice / Instructions">
        <Label>Dietary, lifestyle & special instructions</Label>
        <textarea
          style={textareaStyle}
          placeholder="e.g. Drink plenty of fluids. Avoid oily food. Rest for 2 days. Return if fever exceeds 103°F."
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          rows={3}
        />
      </SectionCard>

      {/* ── Follow-up ────────────────────────────────────────── */}
      <SectionCard title="Follow-up">
        <Label>Next appointment date (optional)</Label>
        <input
          type="date"
          style={{ ...inputStyle, maxWidth: '240px' }}
          value={followUpDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setFollowUpDate(e.target.value)}
        />
      </SectionCard>

      {/* ── Action bar ───────────────────────────────────────── */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'flex-end',
          gap:            '12px',
          paddingTop:     '4px',
          paddingBottom:  '32px',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          disabled={submitting}
          style={{
            padding:      '10px 24px',
            borderRadius: '8px',
            border:       `1px solid ${C.border}`,
            background:   C.white,
            color:        C.navy,
            cursor:       submitting ? 'not-allowed' : 'pointer',
            fontWeight:   600,
            fontSize:     '14px',
          }}
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding:      '10px 28px',
            borderRadius: '8px',
            border:       'none',
            background:   submitting
              ? C.label
              : `linear-gradient(135deg, ${C.navy}, ${C.blue2})`,
            color:        C.white,
            cursor:       submitting ? 'not-allowed' : 'pointer',
            fontWeight:   700,
            fontSize:     '14px',
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            boxShadow:    submitting
              ? 'none'
              : '0 2px 8px rgba(26,60,110,0.25)',
            transition:   'opacity 0.15s',
          }}
        >
          <CalendarCheck size={16} />
          {submitting ? 'Saving & Generating PDF…' : 'Complete & Generate PDF'}
        </button>
      </div>
    </div>
  );
};

export default PrescriptionFormPage;