import React from 'react';
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}
export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal"><div className="row" style={{ justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>{title}</h2><button className="btn" onClick={onClose} aria-label="Close">✕</button></div>{children}</div>
    </div>
  );
}
export function Confirm({ message, onOk, onCancel }: { message: string; onOk: () => void; onCancel: () => void }) {
  return <Modal title="Are you sure?" onClose={onCancel}><p>{message}</p><div className="row"><button className="btn primary" onClick={onOk}>Yes</button><button className="btn" onClick={onCancel}>Cancel</button></div></Modal>;
}
export function AdsBanner({ premium, adsEnabled }: { premium: boolean; adsEnabled: boolean }) {
  // Production default: no ad SDK is configured, so nothing renders.
  // A dev placeholder renders only when explicitly enabled in a dev build.
  if (premium || !adsEnabled) return null;
  return <div className="banner" role="note">Ad placeholder — development only. No real ad is loaded. Premium removes ads.</div>;
}
