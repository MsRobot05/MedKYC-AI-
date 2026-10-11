import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';

/**
 * ScanIdButton
 * ------------------------------------------------------------
 * Replaces the static "Scan ID to auto-fill" banner with a
 * working one: opens the device camera/file picker, uploads the
 * photo to the backend OCR route, and calls onScanComplete with
 * whatever fields were extracted (dateOfBirth, bloodGroup).
 *
 * Usage inside PatientKYCForm.jsx:
 *   <ScanIdButton onScanComplete={(fields) => {
 *     if (fields.dateOfBirth) setDob(fields.dateOfBirth);
 *     if (fields.bloodGroup) setBloodGroup(fields.bloodGroup);
 *   }} />
 * ------------------------------------------------------------
 */
export default function ScanIdButton({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | scanning | error
  const [errorMsg, setErrorMsg] = useState('');

  function handleClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('scanning');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('idImage', file);

      const token = localStorage.getItem('token'); // adjust to however you store the auth token

      const res = await fetch('/api/patient/scan-id', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setStatus('error');
        setErrorMsg(data.message || data.error || 'Could not read the ID. Try a clearer photo.');
        return;
      }

      setStatus('idle');
      onScanComplete({
        dateOfBirth: data.dateOfBirth,
        bloodGroup: data.bloodGroup,
      });
    } catch (err) {
      console.error('Scan failed:', err);
      setStatus('error');
      setErrorMsg('Something went wrong uploading the image. Check your connection and try again.');
    } finally {
      e.target.value = ''; // allow re-selecting the same file
    }
  }

  return (
    <div className="mb-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'scanning'}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 text-sm font-medium hover:bg-teal-100 transition disabled:opacity-60"
      >
        {status === 'scanning' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Reading ID...
          </>
        ) : (
          <>
            <Camera size={16} />
            Scan ID to auto-fill
          </>
        )}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-600 mt-2 px-1">{errorMsg}</p>
      )}
    </div>
  );
}