import React from 'react'
import ClassicQCMHostView from '../classic_qcm/HostView.jsx'

export default function RechercheInterditeHostView({ step, state, socket }) {
  const searchPrefix = step?.searchPrefix || step?.question || ''

  return (
    <div className="space-y-3">
      <div className="rounded-xl px-4 py-3 flex items-center gap-2"
        style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <span>🔍</span>
        <span className="font-body text-sm" style={{ color: '#2563eb' }}>{searchPrefix}</span>
      </div>
      <ClassicQCMHostView step={step} state={state} socket={socket} />
    </div>
  )
}
