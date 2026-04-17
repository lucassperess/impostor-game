import { memo, useMemo } from "react";
import { AVATARS } from "../data/avatars";
import { BD, BF, CR, CSS, DF, INK, MID, PAL, W } from "../ui/theme";

export function Fonts(){
  return <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet"/>;
}

export function GlobalCSS() {
  return <style>{CSS}</style>;
}

export const AvatarSVG = memo(function AvatarSVG({ index, color, size = 40 }) {
  const markup = useMemo(() => AVATARS[index % AVATARS.length](color), [index, color]);
  return <svg width={size} height={size} viewBox="0 0 40 40" dangerouslySetInnerHTML={{ __html: markup }} />;
});

export function Btn({bg,color,shadow,children,style,...p}){
  return <button className="pbtn" style={{background:bg,color,boxShadow:`0 4px 0 ${shadow},0 6px 12px rgba(0,0,0,0.07)`,...style}} {...p}>{children}</button>;
}

export const Confetti = memo(function Confetti(){
  const pieces = useMemo(() =>
    Array(45).fill(0).map(() => ({
      l: Math.random() * 100,
      d: Math.random() * 2,
      t: 2 + Math.random() * 2,
      c: PAL[Math.floor(Math.random() * PAL.length)],
      s: 5 + Math.random() * 9,
      r: Math.random() * 360,
    })), []);
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1000,overflow:"hidden"}}>{pieces.map((p,i)=><div key={i} style={{position:"absolute",top:-20,left:`${p.l}%`,width:p.s,height:p.s,background:p.c,borderRadius:p.s>10?"50%":"2px",animation:`confetti ${p.t}s ${p.d}s ease-in forwards`,transform:`rotate(${p.r}deg)`}}/>)}</div>;
});

export const EyeI=()=><svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><path d="M2 16s5-8 14-8 14 8 14 8-5 8-14 8S2 16 2 16z"/><circle cx="16" cy="16" r="4"/></svg>;
export const ChatI=()=><svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><path d="M4 6h24a2 2 0 012 2v12a2 2 0 01-2 2H12l-6 5v-5H4a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>;
export const QI=()=><svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><circle cx="16" cy="16" r="13"/><path d="M12 12a4 4 0 014-4 4 4 0 014 4c0 2-2 3-4 4v1"/><circle cx="16" cy="24" r=".5" fill={INK}/></svg>;
export const VI=()=><svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="20" height="24" rx="2"/><path d="M11 14l3 3 7-7"/></svg>;
export const SI=({size=28})=><svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><circle cx="16" cy="14" r="8"/><path d="M8 14h16"/><circle cx="12" cy="14" r="3" fill={CR}/><circle cx="20" cy="14" r="3" fill={CR}/><circle cx="12" cy="14" r="1.5" fill={INK}/><circle cx="20" cy="14" r="1.5" fill={INK}/><path d="M10 26c0-4 3-6 6-6s6 2 6 6"/></svg>;
export const SndOn=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>;
export const SndOff=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>;

export const TimerIcon=()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MID} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 13l3-2"/><path d="M9 2h6"/></svg>;

export const CARD_EMPTY_STYLE = { background: W, borderRadius: 14, border: `2px solid ${BD}`, boxShadow: `0 2px 0 ${BD}` };
