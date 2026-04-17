import { memo, useEffect, useRef, useState } from "react";
import { AvatarSVG, Btn, GlobalCSS, SndOff, SndOn } from "./shared-ui";
import { BD, BF, cardPat, DF, INK, LT, MID, pcd, pc, SLABELS, W } from "../ui/theme";
import { ChatI, EyeI, QI, SI, VI } from "./shared-ui";

const SICONS=[EyeI,ChatI,QI,VI,SI];

export function TopBar({onPause,onBack,backLabel,roundInfo,roundNum,totalRounds,muted,onToggleMute}){
  return <div style={{width:"100%",maxWidth:660,boxSizing:"border-box",padding:"14px 8px 6px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
      <Btn bg={W} color={MID} shadow={BD} style={{padding:"7px 14px",fontSize:13}} onClick={onBack}>? {backLabel}</Btn>
      {roundInfo&&<span style={{fontFamily:DF,fontSize:13,fontWeight:600,color:LT,letterSpacing:1.5,textTransform:"uppercase"}}>{roundInfo}</span>}
      <div style={{display:"flex",gap:6}}>
        <Btn bg={W} color={muted?"#ccc":MID} shadow={BD} style={{padding:"7px 10px",fontSize:13,display:"flex",alignItems:"center"}} onClick={onToggleMute}>{muted?<SndOff/>:<SndOn/>}</Btn>
        <Btn bg={W} color={MID} shadow={BD} style={{padding:"7px 14px",fontSize:13}} onClick={onPause}>?</Btn>
      </div>
    </div>
    {totalRounds>0&&<div style={{height:5,borderRadius:3,background:BD,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:"#F7C873",width:`${(roundNum/totalRounds)*100}%`,transition:"width 0.5s ease"}}/></div>}
  </div>;
}

export function PauseOverlay({scores,names,avatars,onResume,onQuit,muted,onToggleMute}){
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
      <Btn bg="#A8D5BA" color="#fff" shadow="#6EA586" style={{padding:"14px 32px",fontSize:16}} onClick={onResume}>? Continuar</Btn>
      <Btn bg={W} color="#F28B82" shadow={BD} style={{padding:"14px 32px",fontSize:16}} onClick={onQuit}>Sair</Btn>
    </div>
  </div>;
}

export const Card = memo(function Card({playerIndex,name,avatar,color,colorDark,question,state,onOpen,onDone,delay}){
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
        <Btn bg={color} color="#fff" shadow={colorDark} style={{padding:"8px 20px",fontSize:13}} onClick={e=>{e.stopPropagation();onDone(playerIndex);}}>? Já li</Btn>
      </div>
    </div>
  </div>;
});

export function StepBar({currentStep}){
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

export function CountdownReveal({onDone}){
  const cbRef = useRef(onDone);
  cbRef.current = onDone;
  const[n,setN]=useState(3);
  useEffect(()=>{
    if(n>0){const t=setTimeout(()=>setN(n-1),700);return()=>clearTimeout(t);}
    const t=setTimeout(()=>cbRef.current(),400);return()=>clearTimeout(t);
  },[n]);
  return <div style={{textAlign:"center",animation:"fadeIn 0.2s ease"}}><div key={n} style={{fontFamily:DF,fontSize:n>0?80:0,fontWeight:700,color:"#F28B82",animation:"countdown 0.6s ease",lineHeight:1,marginBottom:20}}>{n>0?n:""}</div>{n===0&&<div style={{fontFamily:DF,fontSize:22,color:INK,animation:"bounceIn 0.5s ease"}}>Apontem!</div>}</div>;
}
