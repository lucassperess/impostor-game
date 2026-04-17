export const PAL=["#F28B82","#81BFDA","#A8D5BA","#C3A6E0","#F7C873","#F4A97F","#8EC8D8","#E8A0BF"];
export const PALD=["#C0635E","#5A8FA8","#6EA586","#8E6FB3","#C99A45","#C07A55","#5E9AAD","#B86C90"];

export function pc(i){return PAL[i%PAL.length];}
export function pcd(i){return PALD[i%PALD.length];}

export const DF="'Fredoka',sans-serif";
export const BF="'Nunito',sans-serif";
export const CR="#FBF7F0";
export const INK="#3D3024";
export const MID="#8C7B6B";
export const LT="#B8A08A";
export const BD="#E8DDD0";
export const W="#fff";

const noise=`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

export const pgStyle={minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",fontFamily:BF,color:INK,background:CR,backgroundImage:noise,backgroundSize:"200px"};

export const cardPat=(c)=>`repeating-linear-gradient(45deg,${c}18 0px,${c}18 8px,transparent 8px,transparent 16px),repeating-linear-gradient(-45deg,${c}12 0px,${c}12 8px,transparent 8px,transparent 16px)`;

export const CSS=`
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

export const SLABELS=["Ler","Discutir","Pergunta","Votar","Resultado"];
