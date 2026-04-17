import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import * as Tone from "tone";

/* ═══════════════════════════════════════════
   PERGUNTAS — calibradas, não mexer
   ═══════════════════════════════════════════ */
const DEFAULT_ROUNDS = [
  { normal: "Qual lugar você mais gosta de ir no final de semana?", impostor: "Qual lugar você mais frequenta no final de semana?" },
  { normal: "Qual é a primeira coisa que você faz quando acorda?", impostor: "Qual é a última coisa que você faz antes de dormir?" },
  { normal: "Qual comida de conforto você come quando está triste?", impostor: "Qual comida você come pra comemorar algo?" },
  { normal: "Qual cheiro é o seu favorito?", impostor: "Qual cheiro te traz mais lembranças?" },
  { normal: "Qual hábito do seu dia a dia você mais gosta?", impostor: "Qual hábito do seu dia a dia você faz no automático?" },
  { normal: "O que você mais gosta no seu bairro?", impostor: "O que você mais sentiria falta do seu bairro se mudasse?" },
  { normal: "O que você mais valoriza em uma amizade?", impostor: "Qual é a primeira coisa que você nota em alguém que acabou de conhecer?" },
  { normal: "Qual programa você faria com seu melhor amigo hoje?", impostor: "Qual programa você faria sozinho hoje?" },
  { normal: "Qual assunto você poderia falar por horas?", impostor: "Qual assunto você queria entender melhor?" },
  { normal: "Que tipo de pessoa te atrai numa festa?", impostor: "Que tipo de pessoa você admira de longe numa festa?" },
  { normal: "Se um amigo te ligasse às 3 da manhã, qual seria seu primeiro pensamento?", impostor: "Se um amigo te ligasse às 3 da manhã, por qual motivo você atenderia sem pensar?" },
  { normal: "Se você pudesse morar em outra cidade do Brasil, qual seria?", impostor: "Se você pudesse morar em outro país, qual seria?" },
  { normal: "Se você tivesse que comer uma coisa pelo resto da vida, o que seria?", impostor: "Se pudesse pedir qualquer comida agora, o que seria?" },
  { normal: "O que você faria se encontrasse R$1.000 no chão?", impostor: "O que você faria se ganhasse R$5.000 de presente?" },
  { normal: "Se pudesse voltar a qualquer idade, qual seria?", impostor: "Se pudesse pular pra qualquer idade futura, qual seria?" },
  { normal: "Qual profissão você tentaria se pudesse recomeçar?", impostor: "Qual profissão você admira mas nunca seguiria?" },
  { normal: "Se você fosse famoso, seria por quê?", impostor: "Se seus amigos te descrevessem por uma habilidade, qual seria?" },
  { normal: "Qual filme você recomendaria pra qualquer pessoa?", impostor: "Qual filme mudou a forma como você pensa sobre algo?" },
  { normal: "Qual música embala um rolê de carro?", impostor: "Qual música embala um churrasco?" },
  { normal: "Qual app do seu celular você mais usa?", impostor: "Em qual app do seu celular você gasta mais tempo sem perceber?" },
  { normal: "Qual série você maratonou mais rápido?", impostor: "Qual série você recomendaria pra alguém que nunca assiste série?" },
  { normal: "O que te dá mais orgulho em você?", impostor: "Qual qualidade sua você acha que as pessoas subestimam?" },
  { normal: "Qual conselho você daria pro seu eu de 15 anos?", impostor: "Qual conselho você pediria pro seu eu de 40 anos?" },
  { normal: "Qual é a coisa mais corajosa que você já fez?", impostor: "Qual é a experiência mais marcante que você já viveu?" },
  { normal: "O que te deixa mais feliz no dia a dia?", impostor: "O que no seu dia a dia você acha que deveria agradecer mais?" },
  { normal: "Se você fosse um animal, qual seria?", impostor: "Se você fosse uma comida, qual seria?" },
  { normal: "Qual sua desculpa favorita pra não ir a um evento?", impostor: "Qual sua desculpa favorita pra sair cedo de um evento?" },
  { normal: "O que você faz quando fica entediado?", impostor: "O que você faz quando fica ansioso?" },
  { normal: "Descreva seu domingo perfeito.", impostor: "Descreva sua sexta à noite perfeita." },
  { normal: "Qual é o seu prazer culposo?", impostor: "Qual é a coisa que você faz que ninguém sabe?" },
  { normal: "O que te convence a ir numa festa?", impostor: "Qual é a primeira coisa que você faz quando chega numa festa?" },
];
// Para atualizar perguntas, edite o array DEFAULT_ROUNDS via codigo (deploy).

const STORAGE_KEYS = {
  playerCount: "impostor.playerCount.v1",
  roundCount: "impostor.roundCount.v1",
  muted: "impostor.muted.v1",
};

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

/* ═══════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════ */
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

// Convert hex to rgba string for SVG stroke
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ═══════════════════════════════════════════
   AVATARS — 12 doodle faces
   ═══════════════════════════════════════════ */
const AVATARS = [
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><circle cx="14" cy="17" r="2.5" fill="#3D3024"/><circle cx="26" cy="17" r="2.5" fill="#3D3024"/><path d="M13 24c3 4 11 4 14 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><circle cx="14" cy="17" r="2.5" fill="#3D3024"/><path d="M23 17h6" stroke="#3D3024" stroke-width="2.5" stroke-linecap="round"/><path d="M13 24c3 4 11 4 14 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><circle cx="14" cy="16" r="3" fill="#3D3024"/><circle cx="26" cy="16" r="3" fill="#3D3024"/><ellipse cx="20" cy="26" rx="3.5" ry="4" fill="#3D3024"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><circle cx="14" cy="17" r="2.5" fill="#3D3024"/><circle cx="26" cy="17" r="2.5" fill="#3D3024"/><path d="M15 25c5 3 10 0 12-1" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><path d="M10 17h8M22 17h8" stroke="#3D3024" stroke-width="2.5" stroke-linecap="round"/><path d="M14 25c3 3 9 3 12 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><circle cx="14" cy="17" r="2.5" fill="#3D3024"/><circle cx="26" cy="17" r="2.5" fill="#3D3024"/><path d="M13 24c3 3 11 3 14 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="28" rx="3" ry="2.5" fill="#F28B82"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><text x="11" y="20" font-size="9" fill="#3D3024">★</text><text x="23" y="20" font-size="9" fill="#3D3024">★</text><path d="M14 25c3 3 9 3 12 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><circle cx="14" cy="16" r="2.5" fill="#3D3024"/><circle cx="26" cy="16" r="2.5" fill="#3D3024"/><path d="M14 24l6 3 6-3" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><circle cx="14" cy="17" r="2" fill="#3D3024"/><circle cx="26" cy="17" r="2" fill="#3D3024"/><ellipse cx="10" cy="22" rx="3.5" ry="2" fill="${hexToRgba('#F28B82',0.3)}"/><ellipse cx="30" cy="22" rx="3.5" ry="2" fill="${hexToRgba('#F28B82',0.3)}"/><path d="M15 25c2.5 2.5 7.5 2.5 10 0" stroke="#3D3024" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><path d="M11 14l6 6m0-6l-6 6" stroke="#3D3024" stroke-width="2" stroke-linecap="round"/><path d="M23 14l6 6m0-6l-6 6" stroke="#3D3024" stroke-width="2" stroke-linecap="round"/><path d="M15 26c2 2 8 2 10 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><path d="M10 18c2-2 6-2 8 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M22 18c2-2 6-2 8 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M16 26c2 1.5 6 1.5 8 0" stroke="#3D3024" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><path d="M10 14l5 2" stroke="#3D3024" stroke-width="2" stroke-linecap="round"/><path d="M30 14l-5 2" stroke="#3D3024" stroke-width="2" stroke-linecap="round"/><circle cx="14" cy="19" r="2.5" fill="#3D3024"/><circle cx="26" cy="19" r="2.5" fill="#3D3024"/><path d="M15 26c2.5 2 7.5 2 10 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><circle cx="14" cy="17" r="2.3" fill="#3D3024"/><circle cx="26" cy="17" r="2.3" fill="#3D3024"/><path d="M13 12c1.5-1 3-1.5 4.5-1.5M22.5 10.5c1.5 0 3 .5 4.5 1.5" stroke="#3D3024" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M14.5 25c3.5 2.5 7.5 2.5 11 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><path d="M11.5 16h5M23.5 16h5" stroke="#3D3024" stroke-width="2.2" stroke-linecap="round"/><circle cx="17.5" cy="24" r="1.8" fill="#3D3024"/><circle cx="22.5" cy="24" r="1.8" fill="#3D3024"/><path d="M16 27h8" stroke="#3D3024" stroke-width="1.8" stroke-linecap="round"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><ellipse cx="14.5" cy="17" rx="2.5" ry="2.1" fill="#3D3024"/><ellipse cx="25.5" cy="17" rx="2.5" ry="2.1" fill="#3D3024"/><path d="M13.5 24.5c2.5 4 10.5 4 13 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="20" cy="23.5" r="1.3" fill="#3D3024"/>`,
  (c) => `<circle cx="20" cy="20" r="16" fill="${c}" stroke="${hexToRgba(c,0.5)}" stroke-width="2"/><path d="M12 18l4-2 4 2M20 18l4-2 4 2" stroke="#3D3024" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M14 26c2-3 10-3 12 0" stroke="#3D3024" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M19 20h2v3h-2z" fill="#3D3024"/>`,
];

const AvatarSVG = memo(function AvatarSVG({ index, color, size = 40 }) {
  const markup = useMemo(() => AVATARS[index % AVATARS.length](color), [index, color]);
  return <svg width={size} height={size} viewBox="0 0 40 40" dangerouslySetInnerHTML={{ __html: markup }} />;
});

/* ═══════════════════════════════════════════
   MUSIC — Tone.js chiptune (ref-based)
   ═══════════════════════════════════════════ */
const MELODY = [
  ["E5","8n"],["D5","8n"],["C5","8n"],["D5","8n"],
  ["E5","8n"],["E5","8n"],["E5","4n"],
  ["D5","8n"],["D5","8n"],["D5","4n"],
  ["E5","8n"],["G5","8n"],["G5","4n"],
  ["E5","8n"],["D5","8n"],["C5","8n"],["D5","8n"],
  ["E5","8n"],["E5","8n"],["E5","8n"],["E5","8n"],
  ["D5","8n"],["D5","8n"],["E5","8n"],["D5","8n"],
  ["C5","2n"],
];
const BASS = ["C3","C3","G3","G3","A3","A3","F3","F3","C3","C3","G3","G3","F3","F3","G3","G3"];

function useMusic() {
  const synthRef = useRef(null);
  const bassRef = useRef(null);
  const seqRef = useRef(null);
  const bassSeqRef = useRef(null);
  const startedRef = useRef(false);
  const mutedRef = useRef(false);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    try {
      await Tone.start();
    } catch(e) { return; }
    
    startedRef.current = true;
    const s = new Tone.Synth({ oscillator:{type:"square"}, envelope:{attack:0.01,decay:0.1,sustain:0.3,release:0.1}, volume:-14 }).toDestination();
    const b = new Tone.Synth({ oscillator:{type:"triangle"}, envelope:{attack:0.01,decay:0.2,sustain:0.4,release:0.2}, volume:-20 }).toDestination();
    synthRef.current = s;
    bassRef.current = b;

    let mi = 0;
    seqRef.current = new Tone.Loop((time) => {
      const [note,dur] = MELODY[mi % MELODY.length];
      s.triggerAttackRelease(note, dur, time);
      mi++;
    }, "8n").start(0);

    let bi = 0;
    bassSeqRef.current = new Tone.Loop((time) => {
      b.triggerAttackRelease(BASS[bi % BASS.length], "4n", time);
      bi++;
    }, "4n").start(0);

    Tone.Transport.bpm.value = 130;
    Tone.Transport.start();
    if (mutedRef.current) Tone.Destination.volume.value = -Infinity;
  }, []);

  const stop = useCallback(() => {
    if (!startedRef.current) return;
    Tone.Transport.stop();
    seqRef.current?.stop(); seqRef.current?.dispose(); seqRef.current = null;
    bassSeqRef.current?.stop(); bassSeqRef.current?.dispose(); bassSeqRef.current = null;
    synthRef.current?.dispose(); synthRef.current = null;
    bassRef.current?.dispose(); bassRef.current = null;
    startedRef.current = false;
  }, []);

  const toggleMute = useCallback((muted) => {
    mutedRef.current = muted;
    try { Tone.Destination.volume.value = muted ? -Infinity : 0; } catch(e) {}
  }, []);

  useEffect(() => { return () => { stop(); }; }, [stop]);

  return { start, stop, toggleMute };
}

/* ═══════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════ */
const PAL=["#F28B82","#81BFDA","#A8D5BA","#C3A6E0","#F7C873","#F4A97F","#8EC8D8","#E8A0BF"];
const PALD=["#C0635E","#5A8FA8","#6EA586","#8E6FB3","#C99A45","#C07A55","#5E9AAD","#B86C90"];
function pc(i){return PAL[i%PAL.length];}
function pcd(i){return PALD[i%PALD.length];}

const DF="'Fredoka',sans-serif";const BF="'Nunito',sans-serif";
const CR="#FBF7F0";const INK="#3D3024";const MID="#8C7B6B";const LT="#B8A08A";const BD="#E8DDD0";const W="#fff";

function Fonts(){return <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet"/>;}

const noise=`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;
const pgStyle={minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",fontFamily:BF,color:INK,background:CR,backgroundImage:noise,backgroundSize:"200px"};
const cardPat=(c)=>`repeating-linear-gradient(45deg,${c}18 0px,${c}18 8px,transparent 8px,transparent 16px),repeating-linear-gradient(-45deg,${c}12 0px,${c}12 8px,transparent 8px,transparent 16px)`;

const CSS=`
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes popIn{0%{opacity:0;transform:scale(0.8)}60%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
@keyframes bounceIn{0%{opacity:0;transform:scale(0.3)}50%{transform:scale(1.08)}70%{transform:scale(0.95)}100%{opacity:1;transform:scale(1)}}
@keyframes scorePop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(420px) rotate(720deg);opacity:0}}
@keyframes countdown{0%{transform:scale(0.5);opacity:0}20%{transform:scale(1.2);opacity:1}40%{transform:scale(1)}100%{transform:scale(1);opacity:1}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.pbtn{border-radius:14px;border:none;font-weight:700;cursor:pointer;font-family:${DF};transition:transform 0.1s,box-shadow 0.1s}
.pbtn:active{transform:translateY(3px)!important;box-shadow:0 1px 0 rgba(0,0,0,0.15),0 2px 4px rgba(0,0,0,0.06)!important}
.card-enter{animation:popIn 0.4s ease both}
.score-pop{animation:scorePop 0.25s ease}
input:focus{outline:none;box-shadow:0 0 0 3px rgba(242,139,130,0.3)}
`;

/* Icons */
const EyeI=()=><svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><path d="M2 16s5-8 14-8 14 8 14 8-5 8-14 8S2 16 2 16z"/><circle cx="16" cy="16" r="4"/></svg>;
const ChatI=()=><svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><path d="M4 6h24a2 2 0 012 2v12a2 2 0 01-2 2H12l-6 5v-5H4a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>;
const QI=()=><svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><circle cx="16" cy="16" r="13"/><path d="M12 12a4 4 0 014-4 4 4 0 014 4c0 2-2 3-4 4v1"/><circle cx="16" cy="24" r=".5" fill={INK}/></svg>;
const VI=()=><svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="20" height="24" rx="2"/><path d="M11 14l3 3 7-7"/></svg>;
const SI=()=><svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round"><circle cx="16" cy="14" r="8"/><path d="M8 14h16"/><circle cx="12" cy="14" r="3" fill={CR}/><circle cx="20" cy="14" r="3" fill={CR}/><circle cx="12" cy="14" r="1.5" fill={INK}/><circle cx="20" cy="14" r="1.5" fill={INK}/><path d="M10 26c0-4 3-6 6-6s6 2 6 6"/></svg>;
const SndOn=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>;
const SndOff=()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>;

const SICONS=[EyeI,ChatI,QI,VI,SI];
const SLABELS=["Ler","Discutir","Pergunta","Votar","Resultado"];

function Btn({bg,color,shadow,children,style,...p}){return <button className="pbtn" style={{background:bg,color,boxShadow:`0 4px 0 ${shadow},0 6px 12px rgba(0,0,0,0.07)`,...style}} {...p}>{children}</button>;}

const Confetti = memo(function Confetti(){
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

function GlobalCSS() { return <style>{CSS}</style>; }

/* ═══════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════ */
function TopBar({onPause,onBack,backLabel,roundInfo,roundNum,totalRounds,muted,onToggleMute}){
  return <div style={{width:"100%",maxWidth:660,boxSizing:"border-box",padding:"14px 8px 6px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
      <Btn bg={W} color={MID} shadow={BD} style={{padding:"7px 14px",fontSize:13}} onClick={onBack}>← {backLabel}</Btn>
      {roundInfo&&<span style={{fontFamily:DF,fontSize:13,fontWeight:600,color:LT,letterSpacing:1.5,textTransform:"uppercase"}}>{roundInfo}</span>}
      <div style={{display:"flex",gap:6}}>
        <Btn bg={W} color={muted?"#ccc":MID} shadow={BD} style={{padding:"7px 10px",fontSize:13,display:"flex",alignItems:"center"}} onClick={onToggleMute}>{muted?<SndOff/>:<SndOn/>}</Btn>
        <Btn bg={W} color={MID} shadow={BD} style={{padding:"7px 14px",fontSize:13}} onClick={onPause}>⏸</Btn>
      </div>
    </div>
    {totalRounds>0&&<div style={{height:5,borderRadius:3,background:BD,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:"#F7C873",width:`${(roundNum/totalRounds)*100}%`,transition:"width 0.5s ease"}}/></div>}
  </div>;
}

function PauseOverlay({scores,names,avatars,onResume,onQuit,muted,onToggleMute}){
  return <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(251,247,240,0.97)",backdropFilter:"blur(8px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:BF,color:INK,padding:24,animation:"fadeIn 0.2s ease"}}>
    <GlobalCSS/>
    <h2 style={{fontFamily:DF,fontSize:26,margin:"0 0 24px"}}>Jogo Pausado</h2>
    <div style={{background:W,borderRadius:16,padding:20,marginBottom:20,border:`2px solid ${BD}`,width:"100%",maxWidth:320,boxShadow:`0 4px 0 ${BD}`}}>
      <p style={{margin:"0 0 14px",fontSize:12,color:LT,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",fontFamily:DF}}>Placar</p>
      {names.map((n,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<names.length-1?`1px dashed ${BD}`:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><AvatarSVG index={avatars[i]} color={pc(i)} size={28}/><span style={{fontWeight:700,fontSize:15}}>{n}</span></div>
        <span style={{fontFamily:DF,fontWeight:700,fontSize:20}}>{scores[i]}</span>
      </div>)}
    </div>
    <Btn bg={W} color={muted?"#ccc":MID} shadow={BD} style={{padding:"10px 20px",fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:8}} onClick={onToggleMute}>{muted?<SndOff/>:<SndOn/>}{muted?"Música desligada":"Música ligada"}</Btn>
    <div style={{display:"flex",gap:12}}>
      <Btn bg="#A8D5BA" color="#fff" shadow="#6EA586" style={{padding:"14px 32px",fontSize:16}} onClick={onResume}>▶ Continuar</Btn>
      <Btn bg={W} color="#F28B82" shadow={BD} style={{padding:"14px 32px",fontSize:16}} onClick={onQuit}>Sair</Btn>
    </div>
  </div>;
}

const Card = memo(function Card({playerIndex,name,avatar,color,colorDark,question,state,onOpen,onDone,delay}){
  const flip=state==="open",done=state==="done",lock=state==="locked",tap=state==="waiting";
  return <div className="card-enter" style={{perspective:"900px",width:"100%",maxWidth:260,height:210,cursor:tap?"pointer":"default",userSelect:"none",opacity:done?0.5:lock?0.55:1,transition:"opacity 0.3s",animationDelay:`${delay}s`}} onClick={()=>{if(tap)onOpen(playerIndex);}}>
    <div style={{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",transition:"transform 0.7s cubic-bezier(.4,0,.2,1)",transform:flip?"rotateY(180deg)":"rotateY(0deg)"}}>
      <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",borderRadius:18,background:done?"#F0EBE3":`${cardPat(color)},${color}`,border:done?"2px dashed #D5CBBD":`3px solid ${colorDark}`,boxShadow:done?"none":`0 4px 0 ${colorDark},0 6px 16px rgba(0,0,0,0.07)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,overflow:"hidden"}}>
        {done?<><div style={{background:"#A8D5BA",borderRadius:"50%",border:"2px solid #6EA586",overflow:"hidden"}}><AvatarSVG index={avatar} color="#A8D5BA" size={48}/></div><span style={{fontFamily:DF,fontWeight:600,fontSize:13,color:"#6EA586"}}>{name}</span><span style={{fontSize:11,color:LT}}>Já leu</span></>
        :<><div style={{borderRadius:"50%",border:lock?"2px solid #D5CBBD":`3px solid ${colorDark}`,overflow:"hidden",background:lock?"#E8DDD0":"transparent",animation:tap?"float 3s ease-in-out infinite":"none"}}><AvatarSVG index={avatar} color={lock?"#D5CBBD":color} size={52}/></div><span style={{fontFamily:DF,color:lock?LT:"#fff",fontWeight:600,fontSize:14,textShadow:lock?"none":"0 1px 2px rgba(0,0,0,0.15)"}}>{name}</span><span style={{fontSize:11,color:lock?"#C5B8A8":"#ffffffcc"}}>{lock?"Aguardando...":"Toque para virar"}</span></>}
      </div>
      <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:18,background:W,border:`3px solid ${colorDark}`,boxShadow:`0 4px 0 ${colorDark},0 6px 16px rgba(0,0,0,0.07)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 16px",gap:10}}>
        <div style={{position:"absolute",top:0,left:20,right:20,height:6,background:color,borderRadius:"0 0 4px 4px"}}/>
        <span style={{fontFamily:DF,fontSize:11,fontWeight:600,color:colorDark,textTransform:"uppercase",letterSpacing:1.5}}>{name}</span>
        <p style={{color:INK,fontSize:14,fontWeight:600,textAlign:"center",lineHeight:1.5,margin:0,fontFamily:BF}}>{question}</p>
        <Btn bg={color} color="#fff" shadow={colorDark} style={{padding:"8px 20px",fontSize:13}} onClick={e=>{e.stopPropagation();onDone(playerIndex);}}>✓ Já li</Btn>
      </div>
    </div>
  </div>;
});

function StepBar({currentStep}){
  return <div style={{display:"flex",alignItems:"center",width:"100%",maxWidth:440,margin:"0 auto 18px",background:W,borderRadius:14,padding:"5px 8px",border:`2px solid ${BD}`,boxShadow:`0 2px 0 ${BD}`}}>
    {SLABELS.map((l,i)=>{const Ic=SICONS[i];const a=i===currentStep;const p=i<currentStep;return <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
      <div style={{flex:1,textAlign:"center",padding:"5px 2px",borderRadius:10,background:a?"#F7C87340":"transparent",transition:"background 0.3s"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:1,opacity:a?1:p?0.6:0.25,transform:`scale(${a?1:0.8})`,transition:"all 0.3s"}}><Ic/></div>
        <div style={{fontFamily:DF,fontSize:8,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase",color:a?INK:p?MID:"#C5B8A8"}}>{l}</div>
      </div>
      {i<4&&<div style={{width:14,height:2,background:p?"#A8D5BA":BD,borderRadius:1,flexShrink:0,transition:"background 0.3s"}}/>}
    </div>;})}
  </div>;
}

function CountdownReveal({onDone}){
  const cbRef = useRef(onDone);
  cbRef.current = onDone;
  const[n,setN]=useState(3);
  useEffect(()=>{
    if(n>0){const t=setTimeout(()=>setN(n-1),700);return()=>clearTimeout(t);}
    else{const t=setTimeout(()=>cbRef.current(),400);return()=>clearTimeout(t);}
  },[n]);
  return <div style={{textAlign:"center",animation:"fadeIn 0.2s ease"}}><div key={n} style={{fontFamily:DF,fontSize:n>0?80:0,fontWeight:700,color:"#F28B82",animation:"countdown 0.6s ease",lineHeight:1,marginBottom:20}}>{n>0?n:""}</div>{n===0&&<div style={{fontFamily:DF,fontSize:22,color:INK,animation:"bounceIn 0.5s ease"}}>Apontem!</div>}</div>;
}

/* ═══════════════════════════════════════════
   MAIN GAME
   ═══════════════════════════════════════════ */
export default function ImpostorGame(){
  const[phase,setPhase]=useState("menu");
  const[playerCount,setPlayerCount]=useState(()=>{
    if(!canUseStorage()) return 4;
    const raw=Number(window.localStorage.getItem(STORAGE_KEYS.playerCount));
    return Number.isFinite(raw)&&raw>=3&&raw<=8?raw:4;
  });
  const[roundCount,setRoundCount]=useState(()=>{
    if(!canUseStorage()) return 10;
    const raw=Number(window.localStorage.getItem(STORAGE_KEYS.roundCount));
    return Number.isFinite(raw)&&raw>=3?raw:10;
  });
  const[names,setNames]=useState([]);
  const[avatars,setAvatars]=useState([]);
  const[currentRound,setCurrentRound]=useState(0);
  const[roundOrder,setRoundOrder]=useState([]);
  const[impIdx,setImpIdx]=useState(-1);
  const[cardOrder,setCardOrder]=useState([]);
  const[cardStates,setCardStates]=useState([]);
  const[scores,setScores]=useState([]);
  const[paused,setPaused]=useState(false);
  const[roundHistory,setRoundHistory]=useState([]);
  const[step,setStep]=useState(0);
  const[showCountdown,setShowCountdown]=useState(false);
  const[revealReady,setRevealReady]=useState(false);
  const[scorePop,setScorePop]=useState(-1);
  const[muted,setMuted]=useState(()=>{
    if(!canUseStorage()) return false;
    return window.localStorage.getItem(STORAGE_KEYS.muted)==="1";
  });
  const scorePopTimeoutRef = useRef(null);
  
  const { start: startMusic, stop: stopMusic, toggleMute: toggleMusicMute } = useMusic();

  const roundsBank=DEFAULT_ROUNDS;
  const maxRounds=roundsBank.length;
  const N=names.length;
  const allDone=useMemo(()=>cardStates.length>0&&cardStates.every(s=>s==="done"),[cardStates]);
  const anyOpen=useMemo(()=>cardStates.some(s=>s==="open"),[cardStates]);
  const openCardIndex=useMemo(()=>cardStates.findIndex(s=>s==="open"),[cardStates]);
  const doneCards=useMemo(()=>cardStates.filter(s=>s==="done").length,[cardStates]);
  const totalRounds=roundOrder.length;
  const roundChoices=useMemo(()=>{
    const base=[5,10,15,20].filter((v)=>v<=maxRounds);
    if(maxRounds>=3&&!base.includes(maxRounds)) base.push(maxRounds);
    return base.length>0?base.sort((a,b)=>a-b):[3];
  },[maxRounds]);
  const cleanedNames=useMemo(()=>names.map((n)=>n.trim()),[names]);
  const hasDuplicateNames=useMemo(()=>{
    const used=new Set();
    for(const name of cleanedNames){
      const key=name.toLocaleLowerCase();
      if(!key) continue;
      if(used.has(key)) return true;
      used.add(key);
    }
    return false;
  },[cleanedNames]);
  const nameValidationMsg=useMemo(()=>{
    if(cleanedNames.some((n)=>n.length===0)) return "Preencha todos os nomes.";
    if(hasDuplicateNames) return "Os nomes precisam ser unicos.";
    return "";
  },[cleanedNames,hasDuplicateNames]);

  const toggleMute=useCallback(()=>{const next=!muted;setMuted(next);toggleMusicMute(next);},[muted,toggleMusicMute]);

  const setupRound=useCallback(()=>{if(N===0)return;setImpIdx(Math.floor(Math.random()*N));setCardStates(Array(N).fill("waiting"));setCardOrder(shuffle([...Array(N).keys()]));setStep(0);setShowCountdown(false);setRevealReady(false);},[N]);

  const goToNames=useCallback(()=>{
    setNames(Array(playerCount).fill(""));
    setAvatars(shuffle([...Array(AVATARS.length).keys()]).slice(0,playerCount));
    setPhase("names");
  },[playerCount]);
  const startGame=useCallback(()=>{
    const rc=Math.min(roundCount,roundsBank.length);
    setNames(cleanedNames);
    setRoundOrder(shuffle([...Array(roundsBank.length).keys()]).slice(0,rc));
    setCurrentRound(0);setScores(Array(N).fill(0));setRoundHistory([]);setPhase("playing");
    startMusic();
  },[roundCount,N,startMusic,roundsBank,cleanedNames]);

  useEffect(()=>{if(phase==="playing")setupRound();},[currentRound,phase,setupRound]);
  useEffect(()=>{if(step===0&&allDone){const t=setTimeout(()=>setStep(1),600);return()=>clearTimeout(t);}},[step,allDone]);
  useEffect(()=>()=>{if(scorePopTimeoutRef.current)clearTimeout(scorePopTimeoutRef.current);},[]);
  useEffect(()=>{toggleMusicMute(muted);},[muted,toggleMusicMute]);
  useEffect(()=>{if(canUseStorage())window.localStorage.setItem(STORAGE_KEYS.playerCount,String(playerCount));},[playerCount]);
  useEffect(()=>{if(canUseStorage())window.localStorage.setItem(STORAGE_KEYS.roundCount,String(roundCount));},[roundCount]);
  useEffect(()=>{if(canUseStorage())window.localStorage.setItem(STORAGE_KEYS.muted,muted?"1":"0");},[muted]);
  useEffect(()=>{if(roundCount>maxRounds)setRoundCount(maxRounds);},[roundCount,maxRounds]);

  const cycleAvatar=useCallback((i)=>{
    setAvatars((current)=>{
      const next=[...current];
      const taken=new Set(next.filter((_,idx)=>idx!==i));
      let candidate=next[i];
      for(let count=0;count<AVATARS.length;count++){
        candidate=(candidate+1)%AVATARS.length;
        if(!taken.has(candidate)){next[i]=candidate;break;}
      }
      return next;
    });
  },[]);
  const randomizeAvatars=useCallback(()=>{
    setAvatars(shuffle([...Array(AVATARS.length).keys()]).slice(0,playerCount));
  },[playerCount]);
  const openCard=useCallback((pi)=>{setCardStates(prev=>{if(prev.some(s=>s==="open")||prev[pi]!=="waiting")return prev;return prev.map((s,i)=>i===pi?"open":s==="done"?"done":"locked");});},[]);
  const doneCard=useCallback((pi)=>{setCardStates(prev=>prev.map((s,i)=>i===pi?"done":s==="locked"?"waiting":s));},[]);
  const flashScore=useCallback((i)=>{setScorePop(i);if(scorePopTimeoutRef.current)clearTimeout(scorePopTimeoutRef.current);scorePopTimeoutRef.current=setTimeout(()=>setScorePop(-1),300);},[]);
  const addPt=useCallback((i)=>{setScores(s=>{const n=[...s];n[i]++;return n;});flashScore(i);},[flashScore]);
  const rmPt=useCallback((i)=>{setScores(s=>{const n=[...s];n[i]=Math.max(0,n[i]-1);return n;});flashScore(i);},[flashScore]);
  const nextRound=useCallback(()=>{setRoundHistory(h=>[...h,{round:currentRound,scores:[...scores]}]);if(currentRound+1>=totalRounds)setPhase("result");else{setCurrentRound(r=>r+1);setPhase("playing");}},[currentRound,scores,totalRounds]);
  const goBack=useCallback(()=>{if(step>0){setStep(s=>s-1);setShowCountdown(false);setRevealReady(false);return;}if(roundHistory.length>0){const p=roundHistory[roundHistory.length-1];setRoundHistory(h=>h.slice(0,-1));setCurrentRound(p.round);setScores(p.scores);setPhase("playing");}else setPhase("names");},[step,roundHistory]);
  const quit=useCallback(()=>{setPaused(false);stopMusic();setPhase("menu");},[stopMusic]);

  const rd=useMemo(()=>roundOrder.length>0&&currentRound<roundOrder.length?roundsBank[roundOrder[currentRound]]:null,[roundOrder,currentRound,roundsBank]);
  const ok=useMemo(()=>names.length>=3&&cleanedNames.every(n=>n.length>0)&&!hasDuplicateNames,[names,cleanedNames,hasDuplicateNames]);
  const vs=useCallback((pi)=>{const s=cardStates[pi];if(s==="open"||s==="done")return s;if(anyOpen)return"locked";return"waiting";},[cardStates,anyOpen]);
  const gc=useMemo(()=>N<=4?2:N<=6?3:4,[N]);
  const sortedScores=useMemo(()=>scores.map((s,i)=>({score:s,index:i})).sort((a,b)=>b.score-a.score),[scores]);

  /* ─── MENU ─── */
  if(phase==="menu"){return <div style={{...pgStyle,justifyContent:"center",padding:24}}>
    <Fonts/><GlobalCSS/>
    <div style={{textAlign:"center",maxWidth:420,animation:"fadeUp 0.5s ease"}}>
      <div style={{background:W,borderRadius:24,padding:"36px 28px 28px",marginBottom:28,border:`3px solid ${BD}`,boxShadow:`0 6px 0 ${BD},0 8px 24px rgba(0,0,0,0.05)`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-4,left:"50%",transform:"translateX(-50%) rotate(-2deg)",width:80,height:28,background:"#F7C873",borderRadius:4,opacity:0.85}}/>
        <div style={{marginBottom:16,marginTop:8}}><SI/></div>
        <h1 style={{fontFamily:DF,fontSize:42,margin:"0 0 6px",color:INK}}>Impostor</h1>
        <p style={{color:MID,fontSize:14,lineHeight:1.6,margin:0,fontWeight:600}}>Todos recebem a mesma pergunta — menos um.<br/>Descubram quem respondeu outra coisa!</p>
      </div>
      <div style={{background:W,borderRadius:18,padding:"18px 22px",marginBottom:28,border:`2px solid ${BD}`,boxShadow:`0 3px 0 ${BD}`,textAlign:"left"}}>
        <span style={{fontFamily:DF,fontSize:13,fontWeight:600,color:"#F7C873",letterSpacing:1,textTransform:"uppercase"}}>Como jogar</span>
        <ol style={{margin:"10px 0 0",paddingLeft:20,color:"#5C4E40",fontSize:13,lineHeight:2,fontWeight:600}}>
          <li>Vire <span style={{color:INK,fontWeight:800}}>seu card em segredo</span></li>
          <li>Escrevam no papel e leiam <span style={{color:INK,fontWeight:800}}>em voz alta</span></li>
          <li>A <span style={{color:INK,fontWeight:800}}>pergunta correta é revelada</span></li>
          <li>Votem e descubram o impostor!</li>
        </ol>
      </div>
      <div style={{display:"flex",gap:16,marginBottom:28,justifyContent:"center",flexWrap:"wrap"}}>
        <div style={{textAlign:"center"}}><p style={{color:MID,fontSize:13,marginBottom:8,fontFamily:DF,fontWeight:600}}>Jogadores</p>
          <div style={{display:"flex",gap:6}}>{[3,4,5,6,7,8].map(n=><Btn key={n} bg={playerCount===n?"#F28B82":W} color={playerCount===n?"#fff":MID} shadow={playerCount===n?"#C0635E":BD} style={{width:42,height:42,padding:0,fontSize:18,borderRadius:12}} onClick={()=>setPlayerCount(n)}>{n}</Btn>)}</div>
        </div>
        <div style={{textAlign:"center"}}><p style={{color:MID,fontSize:13,marginBottom:8,fontFamily:DF,fontWeight:600}}>Rodadas</p>
          <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>{roundChoices.map(n=><Btn key={n} bg={roundCount===n?"#81BFDA":W} color={roundCount===n?"#fff":MID} shadow={roundCount===n?"#5A8FA8":BD} style={{width:42,height:42,padding:0,fontSize:16,borderRadius:12}} onClick={()=>setRoundCount(n)}>{n}</Btn>)}</div>
        </div>
      </div>
      <p style={{color:LT,fontSize:11,margin:"-8px 0 16px"}}>{maxRounds} perguntas disponiveis no codigo</p>
      <Btn bg="#F28B82" color="#fff" shadow="#C0635E" style={{padding:"16px 48px",fontSize:19}} onClick={goToNames}>Escolher Nomes →</Btn>
    </div>
  </div>;}

  /* ─── NAMES + AVATARS ─── */
  if(phase==="names"){return <div style={{...pgStyle,justifyContent:"center",padding:24}}>
    <Fonts/><GlobalCSS/>
    <div style={{textAlign:"center",maxWidth:420,width:"100%",animation:"fadeUp 0.4s ease"}}>
      <Btn bg={W} color={MID} shadow={BD} style={{padding:"8px 16px",fontSize:13,marginBottom:24}} onClick={()=>setPhase("menu")}>← Menu</Btn>
      <h2 style={{fontFamily:DF,fontSize:26,margin:"0 0 6px"}}>Quem vai jogar?</h2>
      <p style={{color:MID,fontSize:13,margin:"0 0 6px",fontWeight:600}}>{names.length} jogadores · {roundCount} rodadas</p>
      <p style={{color:LT,fontSize:11,margin:"0 0 8px"}}>Toque no avatar para trocar</p>
      <Btn bg={W} color={MID} shadow={BD} style={{padding:"7px 12px",fontSize:12,marginBottom:16}} onClick={randomizeAvatars}>Aleatorizar Avatares</Btn>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
        {names.map((name,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:W,borderRadius:14,padding:"6px 8px",border:`2px solid ${pc(i)}`,boxShadow:`0 3px 0 ${pcd(i)}`,animation:"fadeUp 0.4s ease",animationDelay:`${i*0.06}s`,animationFillMode:"both"}}>
          <div onClick={()=>cycleAvatar(i)} style={{cursor:"pointer",borderRadius:"50%",border:`2px solid ${pcd(i)}`,overflow:"hidden",flexShrink:0,transition:"transform 0.15s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <AvatarSVG index={avatars[i]} color={pc(i)} size={40}/>
          </div>
          <input type="text" value={name} onChange={e=>{const next=[...names];next[i]=e.target.value;setNames(next);}} onKeyDown={e=>{if(e.key==="Enter"&&ok)startGame();}} placeholder={`Jogador ${i+1}`} maxLength={16}
            style={{flex:1,background:"transparent",border:"none",color:INK,fontSize:16,fontWeight:700,fontFamily:BF,padding:"10px 6px",borderRadius:8}}/>
        </div>)}
      </div>
      {!ok&&<p style={{color:"#C0635E",fontSize:12,fontWeight:700,margin:"0 0 12px"}}>{nameValidationMsg}</p>}
      <Btn bg={ok?"#A8D5BA":"#E8DDD0"} color={ok?"#fff":LT} shadow={ok?"#6EA586":"#D5CBBD"} style={{padding:"14px 40px",fontSize:17,cursor:ok?"pointer":"not-allowed"}} onClick={ok?startGame:undefined}>Iniciar Partida →</Btn>
    </div>
  </div>;}

  /* ─── PLAYING ─── */
  if(phase==="playing"&&rd){
    return <div style={{...pgStyle,padding:"0 16px 32px"}}>
      <Fonts/><GlobalCSS/>
      {paused&&<PauseOverlay scores={scores} names={names} avatars={avatars} onResume={()=>setPaused(false)} onQuit={quit} muted={muted} onToggleMute={toggleMute}/>}
      <TopBar onPause={()=>setPaused(true)} onBack={goBack} backLabel={step>0?"Voltar":roundHistory.length>0?"Voltar":"Menu"} roundInfo={`${currentRound+1}/${totalRounds}`} roundNum={currentRound+1} totalRounds={totalRounds} muted={muted} onToggleMute={toggleMute}/>
      <StepBar currentStep={step}/>

      {step===0&&<div style={{width:"100%",maxWidth:720,display:"flex",flexDirection:"column",alignItems:"center"}}>
        <h2 style={{fontFamily:DF,fontSize:18,fontWeight:600,margin:"0 0 4px",textAlign:"center",color:anyOpen?pcd(openCardIndex):INK,transition:"color 0.3s"}}>
          {anyOpen?`${names[openCardIndex]}, leia em segredo`:allDone?"Todos leram!":doneCards===0?"Passe o celular — cada um vira seu card":`${doneCards}/${N} leram · Passe para o próximo`}
        </h2>
        {!anyOpen&&doneCards===0&&<p style={{color:LT,fontSize:12,margin:"4px 0 12px",fontWeight:600}}>Só um card abre por vez</p>}
        <div style={{display:"grid",gridTemplateColumns:`repeat(${gc},1fr)`,gap:12,width:"100%",justifyItems:"center",marginTop:10}}>
          {cardOrder.map((pi,idx)=><Card key={pi} playerIndex={pi} name={names[pi]} avatar={avatars[pi]} color={pc(pi)} colorDark={pcd(pi)} question={pi===impIdx?rd.impostor:rd.normal} state={vs(pi)} onOpen={openCard} onDone={doneCard} delay={idx*0.08}/>)}
        </div>
        <div style={{display:"flex",gap:8,marginTop:18}}>{Array(N).fill(0).map((_,i)=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:cardStates[i]==="done"?"#A8D5BA":"#E8DDD0",border:cardStates[i]==="done"?"2px solid #6EA586":"2px solid #D5CBBD",transition:"all 0.3s"}}/>)}</div>
      </div>}

      {step===1&&<div style={{textAlign:"center",maxWidth:420,width:"100%",animation:"fadeUp 0.4s ease"}}>
        <div style={{marginBottom:14,transform:"scale(1.3)"}}><ChatI/></div>
        <h2 style={{fontFamily:DF,fontSize:24,fontWeight:700,margin:"0 0 14px"}}>Hora de discutir!</h2>
        <div style={{background:W,borderRadius:16,padding:20,marginBottom:28,border:`2px solid ${BD}`,boxShadow:`0 3px 0 ${BD}`,textAlign:"left"}}>
          <p style={{margin:0,color:"#5C4E40",fontSize:14,lineHeight:1.9,fontWeight:600}}>1. Escrevam <span style={{color:INK,fontWeight:800}}>no papel</span><br/>2. Leiam <span style={{color:INK,fontWeight:800}}>em voz alta</span><br/>3. Quem parece suspeito?</p>
        </div>
        <Btn bg="#F7C873" color={INK} shadow="#C99A45" style={{padding:"14px 36px",fontSize:17}} onClick={()=>setStep(2)}>Revelar Pergunta</Btn>
      </div>}

      {step===2&&<div style={{textAlign:"center",maxWidth:420,width:"100%",animation:"fadeUp 0.4s ease"}}>
        <h2 style={{fontFamily:DF,fontSize:22,fontWeight:700,margin:"0 0 20px"}}>A pergunta correta era:</h2>
        <div style={{background:W,borderRadius:18,padding:"24px 20px",border:"3px solid #A8D5BA",boxShadow:"0 4px 0 #6EA586",marginBottom:24,animation:"popIn 0.4s ease"}}>
          <p style={{margin:0,fontSize:17,color:INK,lineHeight:1.5,fontWeight:700,fontFamily:BF}}>{rd.normal}</p>
        </div>
        <div style={{background:W,borderRadius:14,padding:16,marginBottom:24,border:`2px solid ${BD}`,textAlign:"left"}}>
          <p style={{margin:0,color:"#5C4E40",fontSize:13,lineHeight:1.7,fontWeight:600}}>O impostor recebeu uma <span style={{color:"#F28B82",fontWeight:800}}>pergunta diferente</span>.<br/><br/>Cada jogador se defende: por que sua resposta faz sentido?</p>
        </div>
        <Btn bg="#81BFDA" color="#fff" shadow="#5A8FA8" style={{padding:"14px 36px",fontSize:17}} onClick={()=>{setStep(3);setShowCountdown(false);setRevealReady(false);}}>Votar no Impostor</Btn>
      </div>}

      {step===3&&<div style={{textAlign:"center",maxWidth:420,width:"100%",animation:"fadeUp 0.4s ease"}}>
        {!showCountdown&&!revealReady&&<><div style={{marginBottom:14,transform:"scale(1.3)"}}><VI/></div><h2 style={{fontFamily:DF,fontSize:24,fontWeight:700,margin:"0 0 14px"}}>Hora de votar!</h2><p style={{color:"#5C4E40",fontSize:15,marginBottom:24,fontWeight:600}}>Quando prontos, comecem a contagem!</p><Btn bg="#F28B82" color="#fff" shadow="#C0635E" style={{padding:"14px 36px",fontSize:17}} onClick={()=>setShowCountdown(true)}>3, 2, 1... Apontem!</Btn></>}
        {showCountdown&&!revealReady&&<CountdownReveal onDone={()=>{setShowCountdown(false);setRevealReady(true);}}/>}
        {revealReady&&<div style={{animation:"bounceIn 0.5s ease"}}><p style={{fontFamily:DF,fontSize:18,color:MID,marginBottom:20}}>Todos apontaram?</p><Btn bg="#F28B82" color="#fff" shadow="#C0635E" style={{padding:"14px 36px",fontSize:17,animation:"shake 0.5s ease 0.3s"}} onClick={()=>setStep(4)}>Revelar o Impostor</Btn></div>}
      </div>}

      {step===4&&<div style={{textAlign:"center",maxWidth:420,width:"100%",animation:"fadeUp 0.5s ease"}}>
        <div style={{background:W,borderRadius:20,padding:"24px 20px",border:`3px solid ${pcd(impIdx)}`,boxShadow:`0 5px 0 ${pcd(impIdx)}`,marginBottom:22,position:"relative",overflow:"hidden",animation:"bounceIn 0.6s ease"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:6,background:pc(impIdx)}}/>
          <div style={{display:"flex",justifyContent:"center",marginBottom:8,marginTop:4}}><AvatarSVG index={avatars[impIdx]} color={pc(impIdx)} size={56}/></div>
          <p style={{margin:"0 0 2px",fontSize:13,color:MID,fontWeight:600}}>O impostor era...</p>
          <p style={{margin:0,fontFamily:DF,fontSize:30,fontWeight:700,color:pcd(impIdx)}}>{names[impIdx]}</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          <div style={{background:W,borderRadius:12,padding:"12px 14px",border:"2px solid #A8D5BA",textAlign:"left"}}><p style={{margin:"0 0 3px",fontFamily:DF,fontSize:10,fontWeight:600,color:"#6EA586",letterSpacing:1,textTransform:"uppercase"}}>Pergunta da maioria</p><p style={{margin:0,fontSize:13,color:INK,lineHeight:1.4,fontWeight:600}}>{rd.normal}</p></div>
          <div style={{background:W,borderRadius:12,padding:"12px 14px",border:"2px solid #F28B82",textAlign:"left"}}><p style={{margin:"0 0 3px",fontFamily:DF,fontSize:10,fontWeight:600,color:"#C0635E",letterSpacing:1,textTransform:"uppercase"}}>Pergunta de {names[impIdx]}</p><p style={{margin:0,fontSize:13,color:INK,lineHeight:1.4,fontWeight:600}}>{rd.impostor}</p></div>
        </div>
        <p style={{fontSize:13,color:MID,marginBottom:10,fontFamily:DF,fontWeight:600}}>Quem acertou?</p>
        <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:24,maxHeight:260,overflowY:"auto"}}>
          {names.map((name,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:12,background:W,border:`2px solid ${pc(i)}`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}><AvatarSVG index={avatars[i]} color={pc(i)} size={24}/><span style={{fontWeight:700,fontSize:13}}>{name}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <Btn bg={W} color={MID} shadow={BD} style={{width:30,height:30,padding:0,fontSize:15,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>rmPt(i)}>−</Btn>
              <span className={scorePop===i?"score-pop":""} style={{fontFamily:DF,fontWeight:700,fontSize:18,minWidth:22,textAlign:"center",color:INK}}>{scores[i]}</span>
              <Btn bg={pc(i)} color="#fff" shadow={pcd(i)} style={{width:30,height:30,padding:0,fontSize:15,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>addPt(i)}>+</Btn>
            </div>
          </div>)}
        </div>
        <Btn bg="#81BFDA" color="#fff" shadow="#5A8FA8" style={{padding:"14px 36px",fontSize:17,width:"100%"}} onClick={nextRound}>{currentRound+1>=totalRounds?"Ver Resultado Final":"Próxima Rodada →"}</Btn>
      </div>}
    </div>;
  }

  /* ─── RESULT ─── */
  if(phase==="result"){
    return <div style={{...pgStyle,justifyContent:"center",padding:24}}>
      <Fonts/><GlobalCSS/><Confetti/>
      <div style={{textAlign:"center",maxWidth:400,animation:"fadeUp 0.5s ease",position:"relative",zIndex:1}}>
        <div style={{background:W,borderRadius:24,padding:"28px 22px",marginBottom:24,border:`3px solid ${BD}`,boxShadow:`0 6px 0 ${BD}`}}>
          <h2 style={{fontFamily:DF,fontSize:28,margin:"0 0 20px",color:INK}}>Fim de Jogo!</h2>
          {sortedScores.map(({score,index},rank)=><div key={index} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:14,marginBottom:6,background:rank===0?`${pc(index)}30`:CR,border:rank===0?`2px solid ${pc(index)}`:`2px solid ${BD}`,boxShadow:rank===0?`0 3px 0 ${pcd(index)}`:"none",animation:"fadeUp 0.4s ease",animationDelay:`${rank*0.1}s`,animationFillMode:"both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20,minWidth:24}}>{rank<3?["🥇","🥈","🥉"][rank]:""}</span>
              <AvatarSVG index={avatars[index]} color={pc(index)} size={30}/>
              <span style={{fontWeight:700,fontSize:15,color:INK}}>{names[index]}</span>
            </div>
            <span style={{fontFamily:DF,fontSize:22,fontWeight:700,color:INK}}>{score}</span>
          </div>)}
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn bg="#F28B82" color="#fff" shadow="#C0635E" style={{padding:"14px 28px",fontSize:16}} onClick={startGame}>Jogar Novamente</Btn>
          <Btn bg={W} color={MID} shadow={BD} style={{padding:"14px 28px",fontSize:16}} onClick={quit}>Menu Inicial</Btn>
        </div>
      </div>
    </div>;
  }
  return null;
}
