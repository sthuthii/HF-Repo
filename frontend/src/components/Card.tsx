import { useState } from "react";
import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
}

export default function Card({ title, children }: CardProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
      <div 
        className="card-header" 
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(!open)}
      >
        <h2 className="card-title">{title}</h2>
        <div style={{
          width: '32px', height: '32px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.05)', borderRadius: '50%',
          transition: 'transform 0.3s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      <div style={{
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: open ? 1 : 0,
        maxHeight: open ? '2000px' : '0'
      }}>
        {children}
      </div>
    </div>
  );
}