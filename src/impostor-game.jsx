import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_ROUNDS } from "./data/rounds";
import { AVATARS } from "./data/avatars";
import { useMusic } from "./hooks/useMusic";
import { canUseStorage, shuffle, STORAGE_KEYS } from "./utils/game-utils";
import { BD, INK, LT, MID, pcd, pc, pgStyle, W } from "./ui/theme";
import { AvatarSVG, Btn, ChatI, Confetti, Fonts, GlobalCSS, SI, TimerIcon, VI } from "./components/shared-ui";
import { Card, CountdownReveal, PauseOverlay, StepBar, TopBar } from "./components/game-components";

const PHASE = {
  MENU: "menu",
  NAMES: "names",
  PLAYING: "playing",
  RESULT: "result",
};

const STEP = {
  READ: 0,
  DISCUSS: 1,
  QUESTION: 2,
  VOTE_PREP: 3,
  REVEAL: 4,
};

const DISCUSSION_SECONDS = 75;
const VOTE_SECONDS = 30;

function loadStoredNumber(key, fallback, validate) {
  if (!canUseStorage()) return fallback;
  const raw = Number(window.localStorage.getItem(key));
  return Number.isFinite(raw) && validate(raw) ? raw : fallback;
}

function loadStoredBoolean(key, fallback = false) {
  if (!canUseStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "1";
}

function normalizeNames(list) {
  return list.map((n) => n.trim());
}

function getNameValidation(names) {
  const cleaned = normalizeNames(names);
  if (cleaned.some((n) => n.length === 0)) return "Preencha todos os nomes.";

  const seen = new Set();
  for (const name of cleaned) {
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) return "Os nomes precisam ser unicos.";
    seen.add(key);
  }

  return "";
}

export default function ImpostorGame(){
  const[phase,setPhase]=useState(PHASE.MENU);
  const[playerCount,setPlayerCount]=useState(()=>loadStoredNumber(STORAGE_KEYS.playerCount,4,(v)=>v>=3&&v<=8));
  const[roundCount,setRoundCount]=useState(()=>loadStoredNumber(STORAGE_KEYS.roundCount,10,(v)=>v>=3));
  const[timedMode,setTimedMode]=useState(()=>loadStoredBoolean(STORAGE_KEYS.timedMode,false));

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
  const[step,setStep]=useState(STEP.READ);
  const[showCountdown,setShowCountdown]=useState(false);
  const[revealReady,setRevealReady]=useState(false);
  const[scorePop,setScorePop]=useState(-1);
  const[muted,setMuted]=useState(()=>loadStoredBoolean(STORAGE_KEYS.muted,false));
  const[stepTimer,setStepTimer]=useState(null);

  const[votes,setVotes]=useState([]);
  const[votesApplied,setVotesApplied]=useState(false);

  const scorePopTimeoutRef = useRef(null);
  const { start: startMusic, stop: stopMusic, toggleMute: toggleMusicMute } = useMusic();

  const roundsBank=DEFAULT_ROUNDS;
  const maxRounds=roundsBank.length;
  const N=names.length;
  const cleanedNames=useMemo(()=>normalizeNames(names),[names]);
  const nameValidationMsg=useMemo(()=>getNameValidation(names),[names]);
  const ok=useMemo(()=>names.length>=3&&nameValidationMsg==="",[names,nameValidationMsg]);

  const allDone=useMemo(()=>cardStates.length>0&&cardStates.every(s=>s==="done"),[cardStates]);
  const anyOpen=useMemo(()=>cardStates.some(s=>s==="open"),[cardStates]);
  const openCardIndex=useMemo(()=>cardStates.findIndex(s=>s==="open"),[cardStates]);
  const doneCards=useMemo(()=>cardStates.filter(s=>s==="done").length,[cardStates]);
  const totalRounds=roundOrder.length;
  const gc=useMemo(()=>N<=4?2:N<=6?3:4,[N]);
  const sortedScores=useMemo(()=>scores.map((s,i)=>({score:s,index:i})).sort((a,b)=>b.score-a.score),[scores]);
  const rd=useMemo(()=>roundOrder.length>0&&currentRound<roundOrder.length?roundsBank[roundOrder[currentRound]]:null,[roundOrder,currentRound,roundsBank]);
  const roundChoices=useMemo(()=>{
    const base=[5,10,15,20].filter((v)=>v<=maxRounds);
    if(maxRounds>=3&&!base.includes(maxRounds)) base.push(maxRounds);
    return base.length>0?base.sort((a,b)=>a-b):[3];
  },[maxRounds]);

  const votePoints=useMemo(()=>votes.map((target)=>target===impIdx?1:0),[votes,impIdx]);
  const voteReady=useMemo(()=>votes.length===N&&votes.every((v)=>Number.isInteger(v)&&v>=0&&v<N),[votes,N]);

  const toggleMute=useCallback(()=>{
    const next=!muted;
    setMuted(next);
    toggleMusicMute(next);
  },[muted,toggleMusicMute]);

  const setupRound=useCallback(()=>{
    if(N===0)return;
    setImpIdx(Math.floor(Math.random()*N));
    setCardStates(Array(N).fill("waiting"));
    setCardOrder(shuffle([...Array(N).keys()]));
    setVotes(Array(N).fill(-1));
    setVotesApplied(false);
    setStep(STEP.READ);
    setShowCountdown(false);
    setRevealReady(false);
    setStepTimer(null);
  },[N]);

  const startWithSetup=useCallback((nextNames,nextAvatars)=>{
    const rc=Math.min(roundCount,roundsBank.length);
    setNames(nextNames);
    setAvatars(nextAvatars);
    setRoundOrder(shuffle([...Array(roundsBank.length).keys()]).slice(0,rc));
    setCurrentRound(0);
    setScores(Array(nextNames.length).fill(0));
    setRoundHistory([]);
    setPhase(PHASE.PLAYING);
    startMusic();
  },[roundCount,roundsBank,startMusic]);

  const goToNames=useCallback(()=>{
    setNames(Array(playerCount).fill(""));
    setAvatars(shuffle([...Array(AVATARS.length).keys()]).slice(0,playerCount));
    setPhase(PHASE.NAMES);
  },[playerCount]);

  const startGame=useCallback(()=>{
    if(!ok) return;
    startWithSetup(cleanedNames,avatars);
  },[ok,startWithSetup,cleanedNames,avatars]);

  const quickStart=useCallback(()=>{
    const nextNames=Array(playerCount).fill(0).map((_,i)=>`Jogador ${i+1}`);
    const nextAvatars=shuffle([...Array(AVATARS.length).keys()]).slice(0,playerCount);
    startWithSetup(nextNames,nextAvatars);
  },[playerCount,startWithSetup]);

  useEffect(()=>{if(phase===PHASE.PLAYING)setupRound();},[currentRound,phase,setupRound]);
  useEffect(()=>{if(step===STEP.READ&&allDone){const t=setTimeout(()=>setStep(STEP.DISCUSS),600);return()=>clearTimeout(t);}},[step,allDone]);
  useEffect(()=>()=>{if(scorePopTimeoutRef.current)clearTimeout(scorePopTimeoutRef.current);},[]);

  useEffect(()=>{toggleMusicMute(muted);},[muted,toggleMusicMute]);
  useEffect(()=>{if(canUseStorage())window.localStorage.setItem(STORAGE_KEYS.playerCount,String(playerCount));},[playerCount]);
  useEffect(()=>{if(canUseStorage())window.localStorage.setItem(STORAGE_KEYS.roundCount,String(roundCount));},[roundCount]);
  useEffect(()=>{if(canUseStorage())window.localStorage.setItem(STORAGE_KEYS.muted,muted?"1":"0");},[muted]);
  useEffect(()=>{if(canUseStorage())window.localStorage.setItem(STORAGE_KEYS.timedMode,timedMode?"1":"0");},[timedMode]);
  useEffect(()=>{if(roundCount>maxRounds)setRoundCount(maxRounds);},[roundCount,maxRounds]);

  useEffect(()=>{
    if(phase!==PHASE.PLAYING||paused||!timedMode) {
      setStepTimer(null);
      return;
    }

    const targetSeconds = step===STEP.DISCUSS ? DISCUSSION_SECONDS : (step===STEP.VOTE_PREP && !showCountdown && !revealReady ? VOTE_SECONDS : null);
    if(targetSeconds===null){
      setStepTimer(null);
      return;
    }

    setStepTimer(targetSeconds);
    const interval = setInterval(()=>{
      setStepTimer((prev)=>{
        if(prev===null) return prev;
        if(prev<=1){
          if(step===STEP.DISCUSS) setStep(STEP.QUESTION);
          if(step===STEP.VOTE_PREP&&!showCountdown&&!revealReady) setShowCountdown(true);
          return null;
        }
        return prev-1;
      });
    },1000);

    return ()=>clearInterval(interval);
  },[phase,paused,timedMode,step,showCountdown,revealReady]);

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

  const flashScore=useCallback((i)=>{
    setScorePop(i);
    if(scorePopTimeoutRef.current)clearTimeout(scorePopTimeoutRef.current);
    scorePopTimeoutRef.current=setTimeout(()=>setScorePop(-1),300);
  },[]);

  const addPt=useCallback((i)=>{setScores(s=>{const n=[...s];n[i]++;return n;});flashScore(i);},[flashScore]);
  const rmPt=useCallback((i)=>{setScores(s=>{const n=[...s];n[i]=Math.max(0,n[i]-1);return n;});flashScore(i);},[flashScore]);

  const applyVotes=useCallback(()=>{
    if(!voteReady||votesApplied) return;
    setScores((prev)=>prev.map((score,idx)=>score+votePoints[idx]));
    setVotesApplied(true);
  },[voteReady,votesApplied,votePoints]);

  const nextRound=useCallback(()=>{
    setRoundHistory(h=>[...h,{round:currentRound,scores:[...scores]}]);
    if(currentRound+1>=totalRounds)setPhase(PHASE.RESULT);
    else {
      setCurrentRound(r=>r+1);
      setPhase(PHASE.PLAYING);
    }
  },[currentRound,scores,totalRounds]);

  const goBack=useCallback(()=>{
    if(step>STEP.READ){
      setStep(s=>Math.max(STEP.READ,s-1));
      setShowCountdown(false);
      setRevealReady(false);
      return;
    }
    if(roundHistory.length>0){
      const p=roundHistory[roundHistory.length-1];
      setRoundHistory(h=>h.slice(0,-1));
      setCurrentRound(p.round);
      setScores(p.scores);
      setPhase(PHASE.PLAYING);
    } else setPhase(PHASE.NAMES);
  },[step,roundHistory]);

  const quit=useCallback(()=>{setPaused(false);stopMusic();setPhase(PHASE.MENU);},[stopMusic]);
  const vs=useCallback((pi)=>{const s=cardStates[pi];if(s==="open"||s==="done")return s;if(anyOpen)return"locked";return"waiting";},[cardStates,anyOpen]);

  if(phase===PHASE.MENU){return <div style={{...pgStyle,justifyContent:"center",padding:24}}>
    <Fonts/><GlobalCSS/>
    <div style={{textAlign:"center",maxWidth:420,animation:"fadeUp 0.5s ease"}}>
      <div style={{background:W,borderRadius:24,padding:"36px 28px 28px",marginBottom:28,border:`3px solid ${BD}`,boxShadow:`0 6px 0 ${BD},0 8px 24px rgba(0,0,0,0.05)`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-4,left:"50%",transform:"translateX(-50%) rotate(-2deg)",width:80,height:28,background:"#F7C873",borderRadius:4,opacity:0.85}}/>
        <div style={{marginBottom:16,marginTop:8}}><SI/></div>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:42,margin:"0 0 6px",color:INK}}>Impostor</h1>
        <p style={{color:MID,fontSize:14,lineHeight:1.6,margin:0,fontWeight:600}}>Todos recebem a mesma pergunta - menos um.<br/>Descubram quem respondeu outra coisa!</p>
      </div>
      <div style={{display:"flex",gap:16,marginBottom:20,justifyContent:"center",flexWrap:"wrap"}}>
        <div style={{textAlign:"center"}}><p style={{color:MID,fontSize:13,marginBottom:8,fontFamily:"'Fredoka',sans-serif",fontWeight:600}}>Jogadores</p>
          <div style={{display:"flex",gap:6}}>{[3,4,5,6,7,8].map(n=><Btn key={n} bg={playerCount===n?"#F28B82":W} color={playerCount===n?"#fff":MID} shadow={playerCount===n?"#C0635E":BD} style={{width:42,height:42,padding:0,fontSize:18,borderRadius:12}} onClick={()=>setPlayerCount(n)}>{n}</Btn>)}</div>
        </div>
        <div style={{textAlign:"center"}}><p style={{color:MID,fontSize:13,marginBottom:8,fontFamily:"'Fredoka',sans-serif",fontWeight:600}}>Rodadas</p>
          <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>{roundChoices.map(n=><Btn key={n} bg={roundCount===n?"#81BFDA":W} color={roundCount===n?"#fff":MID} shadow={roundCount===n?"#5A8FA8":BD} style={{width:42,height:42,padding:0,fontSize:16,borderRadius:12}} onClick={()=>setRoundCount(n)}>{n}</Btn>)}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:18,color:MID,fontSize:13,fontWeight:700}}>
        <TimerIcon/> Rodadas com temporizador
        <input type="checkbox" checked={timedMode} onChange={(e)=>setTimedMode(e.target.checked)} />
      </div>
      <p style={{color:LT,fontSize:11,margin:"-8px 0 16px"}}>{maxRounds} perguntas disponiveis no codigo</p>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
        <Btn bg="#F28B82" color="#fff" shadow="#C0635E" style={{padding:"16px 30px",fontSize:18}} onClick={goToNames}>Escolher Nomes ?</Btn>
        <Btn bg="#81BFDA" color="#fff" shadow="#5A8FA8" style={{padding:"16px 24px",fontSize:18}} onClick={quickStart}>Partida Rápida</Btn>
      </div>
    </div>
  </div>;}

  if(phase===PHASE.NAMES){return <div style={{...pgStyle,justifyContent:"center",padding:24}}>
    <Fonts/><GlobalCSS/>
    <div style={{textAlign:"center",maxWidth:420,width:"100%",animation:"fadeUp 0.4s ease"}}>
      <Btn bg={W} color={MID} shadow={BD} style={{padding:"8px 16px",fontSize:13,marginBottom:24}} onClick={()=>setPhase(PHASE.MENU)}>? Menu</Btn>
      <h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:26,margin:"0 0 6px"}}>Quem vai jogar?</h2>
      <p style={{color:MID,fontSize:13,margin:"0 0 6px",fontWeight:600}}>{names.length} jogadores · {roundCount} rodadas</p>
      <p style={{color:LT,fontSize:11,margin:"0 0 8px"}}>Toque no avatar para trocar</p>
      <Btn bg={W} color={MID} shadow={BD} style={{padding:"7px 12px",fontSize:12,marginBottom:16}} onClick={randomizeAvatars}>Aleatorizar Avatares</Btn>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
        {names.map((name,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:W,borderRadius:14,padding:"6px 8px",border:`2px solid ${pc(i)}`,boxShadow:`0 3px 0 ${pcd(i)}`,animation:"fadeUp 0.4s ease",animationDelay:`${i*0.06}s`,animationFillMode:"both"}}>
          <div onClick={()=>cycleAvatar(i)} style={{cursor:"pointer",borderRadius:"50%",border:`2px solid ${pcd(i)}`,overflow:"hidden",flexShrink:0,transition:"transform 0.15s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <AvatarSVG index={avatars[i]} color={pc(i)} size={40}/>
          </div>
          <input type="text" value={name} onChange={e=>{const next=[...names];next[i]=e.target.value;setNames(next);}} onKeyDown={e=>{if(e.key==="Enter"&&ok)startGame();}} placeholder={`Jogador ${i+1}`} maxLength={16}
            style={{flex:1,background:"transparent",border:"none",color:INK,fontSize:16,fontWeight:700,fontFamily:"'Nunito',sans-serif",padding:"10px 6px",borderRadius:8}}/>
        </div>)}
      </div>
      {!ok&&<p style={{color:"#C0635E",fontSize:12,fontWeight:700,margin:"0 0 12px"}}>{nameValidationMsg}</p>}
      <Btn bg={ok?"#A8D5BA":"#E8DDD0"} color={ok?"#fff":LT} shadow={ok?"#6EA586":"#D5CBBD"} style={{padding:"14px 40px",fontSize:17,cursor:ok?"pointer":"not-allowed"}} onClick={ok?startGame:undefined}>Iniciar Partida ?</Btn>
    </div>
  </div>;}

  if(phase===PHASE.PLAYING&&rd){
    return <div style={{...pgStyle,padding:"0 16px 32px"}}>
      <Fonts/><GlobalCSS/>
      {paused&&<PauseOverlay scores={scores} names={names} avatars={avatars} onResume={()=>setPaused(false)} onQuit={quit} muted={muted} onToggleMute={toggleMute}/>}
      <TopBar onPause={()=>setPaused(true)} onBack={goBack} backLabel={step>0?"Voltar":roundHistory.length>0?"Voltar":"Menu"} roundInfo={`${currentRound+1}/${totalRounds}`} roundNum={currentRound+1} totalRounds={totalRounds} muted={muted} onToggleMute={toggleMute}/>
      <StepBar currentStep={step}/>
      {stepTimer!==null&&<p style={{fontSize:12,color:MID,fontWeight:700,display:"flex",alignItems:"center",gap:6,marginTop:-8,marginBottom:10}}><TimerIcon/> {stepTimer}s restantes</p>}

      {step===STEP.READ&&<div style={{width:"100%",maxWidth:720,display:"flex",flexDirection:"column",alignItems:"center"}}>
        <h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:600,margin:"0 0 4px",textAlign:"center",color:anyOpen?pcd(openCardIndex):INK,transition:"color 0.3s"}}>
          {anyOpen?`${names[openCardIndex]}, leia em segredo`:allDone?"Todos leram!":doneCards===0?"Passe o celular - cada um vira seu card":`${doneCards}/${N} leram · Passe para o próximo`}
        </h2>
        {!anyOpen&&doneCards===0&&<p style={{color:LT,fontSize:12,margin:"4px 0 12px",fontWeight:600}}>Só um card abre por vez</p>}
        <div style={{display:"grid",gridTemplateColumns:`repeat(${gc},1fr)`,gap:12,width:"100%",justifyItems:"center",marginTop:10}}>
          {cardOrder.map((pi,idx)=><Card key={pi} playerIndex={pi} name={names[pi]} avatar={avatars[pi]} color={pc(pi)} colorDark={pcd(pi)} question={pi===impIdx?rd.impostor:rd.normal} state={vs(pi)} onOpen={openCard} onDone={doneCard} delay={idx*0.08}/>) }
        </div>
      </div>}

      {step===STEP.DISCUSS&&<div style={{textAlign:"center",maxWidth:420,width:"100%",animation:"fadeUp 0.4s ease"}}>
        <div style={{marginBottom:14,transform:"scale(1.3)"}}><ChatI/></div>
        <h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700,margin:"0 0 14px"}}>Hora de discutir!</h2>
        <div style={{background:W,borderRadius:16,padding:20,marginBottom:28,border:`2px solid ${BD}`,boxShadow:`0 3px 0 ${BD}`,textAlign:"left"}}>
          <p style={{margin:0,color:"#5C4E40",fontSize:14,lineHeight:1.9,fontWeight:600}}>1. Escrevam no papel<br/>2. Leiam em voz alta<br/>3. Quem parece suspeito?</p>
        </div>
        <Btn bg="#F7C873" color={INK} shadow="#C99A45" style={{padding:"14px 36px",fontSize:17}} onClick={()=>setStep(STEP.QUESTION)}>Revelar Pergunta</Btn>
      </div>}

      {step===STEP.QUESTION&&<div style={{textAlign:"center",maxWidth:420,width:"100%",animation:"fadeUp 0.4s ease"}}>
        <h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,fontWeight:700,margin:"0 0 20px"}}>A pergunta correta era:</h2>
        <div style={{background:W,borderRadius:18,padding:"24px 20px",border:"3px solid #A8D5BA",boxShadow:"0 4px 0 #6EA586",marginBottom:24,animation:"popIn 0.4s ease"}}>
          <p style={{margin:0,fontSize:17,color:INK,lineHeight:1.5,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{rd.normal}</p>
        </div>
        <Btn bg="#81BFDA" color="#fff" shadow="#5A8FA8" style={{padding:"14px 36px",fontSize:17}} onClick={()=>{setStep(STEP.VOTE_PREP);setShowCountdown(false);setRevealReady(false);}}>Votar no Impostor</Btn>
      </div>}

      {step===STEP.VOTE_PREP&&<div style={{textAlign:"center",maxWidth:420,width:"100%",animation:"fadeUp 0.4s ease"}}>
        {!showCountdown&&!revealReady&&<><div style={{marginBottom:14,transform:"scale(1.3)"}}><VI/></div><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700,margin:"0 0 14px"}}>Hora de votar!</h2><p style={{color:"#5C4E40",fontSize:15,marginBottom:24,fontWeight:600}}>Quando prontos, comecem a contagem!</p><Btn bg="#F28B82" color="#fff" shadow="#C0635E" style={{padding:"14px 36px",fontSize:17}} onClick={()=>setShowCountdown(true)}>3, 2, 1... Apontem!</Btn></>}
        {showCountdown&&!revealReady&&<CountdownReveal onDone={()=>{setShowCountdown(false);setRevealReady(true);}}/>}
        {revealReady&&<div style={{animation:"bounceIn 0.5s ease"}}><p style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,color:MID,marginBottom:20}}>Todos apontaram?</p><Btn bg="#F28B82" color="#fff" shadow="#C0635E" style={{padding:"14px 36px",fontSize:17,animation:"shake 0.5s ease 0.3s"}} onClick={()=>setStep(STEP.REVEAL)}>Revelar o Impostor</Btn></div>}
      </div>}

      {step===STEP.REVEAL&&<div style={{textAlign:"center",maxWidth:540,width:"100%",animation:"fadeUp 0.5s ease"}}>
        <div style={{background:W,borderRadius:20,padding:"24px 20px",border:`3px solid ${pcd(impIdx)}`,boxShadow:`0 5px 0 ${pcd(impIdx)}`,marginBottom:22,position:"relative",overflow:"hidden",animation:"bounceIn 0.6s ease"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:6,background:pc(impIdx)}}/>
          <div style={{display:"flex",justifyContent:"center",marginBottom:8,marginTop:4}}><AvatarSVG index={avatars[impIdx]} color={pc(impIdx)} size={56}/></div>
          <p style={{margin:"0 0 2px",fontSize:13,color:MID,fontWeight:600}}>O impostor era...</p>
          <p style={{margin:0,fontFamily:"'Fredoka',sans-serif",fontSize:30,fontWeight:700,color:pcd(impIdx)}}>{names[impIdx]}</p>
        </div>

        <div style={{background:W,borderRadius:14,padding:16,marginBottom:16,border:`2px solid ${BD}`}}>
          <p style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:MID,margin:"0 0 10px"}}>Votação estruturada</p>
          <div style={{display:"grid",gap:8}}>
            {names.map((name,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,alignItems:"center"}}>
              <span style={{textAlign:"left",fontWeight:700,fontSize:13}}>{name} votou em</span>
              <select value={votes[i] ?? -1} onChange={(e)=>{const next=[...votes];next[i]=Number(e.target.value);setVotes(next);}} style={{padding:"8px 10px",borderRadius:10,border:`2px solid ${BD}`,fontWeight:700}}>
                <option value={-1}>Escolher</option>
                {names.map((target,j)=><option value={j} key={j}>{target}</option>)}
              </select>
            </div>)}
          </div>
          <div style={{marginTop:12,display:"flex",justifyContent:"center",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            {!votesApplied&&<Btn bg={voteReady?"#A8D5BA":"#E8DDD0"} color={voteReady?"#fff":LT} shadow={voteReady?"#6EA586":"#D5CBBD"} style={{padding:"10px 18px",fontSize:14,cursor:voteReady?"pointer":"not-allowed"}} onClick={voteReady?applyVotes:undefined}>Aplicar Pontos Automáticos</Btn>}
            {votesApplied&&<span style={{fontSize:12,fontWeight:700,color:"#6EA586"}}>Pontos aplicados automaticamente.</span>}
          </div>
        </div>

        <p style={{fontSize:13,color:MID,marginBottom:10,fontFamily:"'Fredoka',sans-serif",fontWeight:600}}>Ajuste manual (opcional)</p>
        <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:24,maxHeight:260,overflowY:"auto"}}>
          {names.map((name,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:12,background:W,border:`2px solid ${pc(i)}`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}><AvatarSVG index={avatars[i]} color={pc(i)} size={24}/><span style={{fontWeight:700,fontSize:13}}>{name}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <Btn bg={W} color={MID} shadow={BD} style={{width:30,height:30,padding:0,fontSize:15,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>rmPt(i)}>-</Btn>
              <span className={scorePop===i?"score-pop":""} style={{fontFamily:"'Fredoka',sans-serif",fontWeight:700,fontSize:18,minWidth:22,textAlign:"center",color:INK}}>{scores[i]}</span>
              <Btn bg={pc(i)} color="#fff" shadow={pcd(i)} style={{width:30,height:30,padding:0,fontSize:15,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>addPt(i)}>+</Btn>
            </div>
          </div>)}
        </div>
        <Btn bg="#81BFDA" color="#fff" shadow="#5A8FA8" style={{padding:"14px 36px",fontSize:17,width:"100%",cursor:votesApplied?"pointer":"not-allowed",opacity:votesApplied?1:0.7}} onClick={votesApplied?nextRound:undefined}>{currentRound+1>=totalRounds?"Ver Resultado Final":"Próxima Rodada ?"}</Btn>
      </div>}
    </div>;
  }

  if(phase===PHASE.RESULT){
    return <div style={{...pgStyle,justifyContent:"center",padding:24}}>
      <Fonts/><GlobalCSS/><Confetti/>
      <div style={{textAlign:"center",maxWidth:400,animation:"fadeUp 0.5s ease",position:"relative",zIndex:1}}>
        <div style={{background:W,borderRadius:24,padding:"28px 22px",marginBottom:24,border:`3px solid ${BD}`,boxShadow:`0 6px 0 ${BD}`}}>
          <h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:28,margin:"0 0 20px",color:INK}}>Fim de Jogo!</h2>
          {sortedScores.map(({score,index},rank)=><div key={index} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:14,marginBottom:6,background:rank===0?`${pc(index)}30`:"#FBF7F0",border:rank===0?`2px solid ${pc(index)}`:`2px solid ${BD}`,boxShadow:rank===0?`0 3px 0 ${pcd(index)}`:"none",animation:"fadeUp 0.4s ease",animationDelay:`${rank*0.1}s`,animationFillMode:"both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20,minWidth:24}}>{rank<3?["??","??","??"][rank]:""}</span>
              <AvatarSVG index={avatars[index]} color={pc(index)} size={30}/>
              <span style={{fontWeight:700,fontSize:15,color:INK}}>{names[index]}</span>
            </div>
            <span style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,fontWeight:700,color:INK}}>{score}</span>
          </div>)}
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn bg="#F28B82" color="#fff" shadow="#C0635E" style={{padding:"14px 28px",fontSize:16}} onClick={quickStart}>Jogar Novamente</Btn>
          <Btn bg={W} color={MID} shadow={BD} style={{padding:"14px 28px",fontSize:16}} onClick={quit}>Menu Inicial</Btn>
        </div>
      </div>
    </div>;
  }

  return null;
}
