// GMT Coach v3.0
import React, { useState, useEffect, useRef, useCallback } from "react";

class ErrorBoundary extends React.Component {
  constructor(p){super(p);this.state={err:null};}
  static getDerivedStateFromError(e){return{err:e};}
  componentDidCatch(e,i){console.error("GMT Coach error:",e,i);}
  render(){
    if(this.state.err)return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,background:"#0A0A0B",color:"#F2F2F0",fontFamily:"'DM Sans',sans-serif",textAlign:"center",gap:20}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:"0.1em",color:"#FF0066"}}>GMT COACH</div>
        <div style={{fontSize:14,color:"#9090A0",lineHeight:1.6,maxWidth:280}}>Something went wrong. This is usually fixed by refreshing the app.</div>
        <button onClick={()=>window.location.reload()} style={{background:"#FF0066",border:"none",borderRadius:10,padding:"14px 28px",color:"#fff",fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer"}}>
          Refresh App
        </button>
      </div>
    );
    return this.props.children;
  }
}

// --- DESIGN TOKENS -----------------------------------------------
const C = {
  bg:"#0A0A0B",sur:"#111114",surUp:"#18181D",bdr:"#222228",bdrL:"#2E2E38",
  // Primary UI - clean silver/white (replaces lime green)
  acc:"#E8E8E8",accD:"#A0A0A8",accG:"rgba(232,232,232,0.08)",
  txt:"#F2F2F0",mid:"#9090A0",dim:"#555560",
  // Mode colours - these ARE the brand
  strength:"#FF0066",    // Hot Magenta-Red  - Strength training
  strengthG:"rgba(255,0,102,0.12)",
  hyper:"#0066FF",       // Electric Blue    - Hypertrophy training
  hyperG:"rgba(0,102,255,0.12)",
  recovery:"#00E6B5",    // Complementary Teal - Mobility & Recovery
  recoveryG:"rgba(0,230,181,0.12)",
  red:"#FF4444",ora:"#FF8C42",pur:"#9B7FFF",blu:"#2196F3",bluG:"rgba(33,150,243,0.12)",
};
const fonts=`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');`;
const gStyles=`
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  input, textarea { -webkit-appearance: none; font-size: 16px; }
  button { cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  body { overscroll-behavior: none; -webkit-overflow-scrolling: touch; }
  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; }
*{margin:0;padding:0;box-sizing:border-box;}
body{background:${C.bg};color:${C.txt};font-family:'DM Sans',sans-serif;overflow-x:hidden;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:${C.bdr};border-radius:2px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes ringPulse{0%{transform:scale(1);opacity:1}100%{transform:scale(1.4);opacity:0}}
@keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
.fu{animation:fadeUp 0.35s ease forwards;}
.sir{animation:slideInRight 0.3s ease forwards;}
`;

// --- SHARED COMPONENTS --------------------------------------------
const Tag=({children,color=C.mid,style})=>(
  <span style={{fontSize:10,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",color,border:`1px solid ${color}`,padding:"2px 8px",borderRadius:2,opacity:.9,textTransform:"uppercase",...style}}>{children}</span>
);
const Pill=({children,active,onClick,modeColor})=>{
  const ac=modeColor||C.acc;
  return(<button onClick={onClick} style={{flexShrink:0,background:active?`${ac}15`:C.sur,border:`1px solid ${active?ac:C.bdr}`,borderRadius:20,padding:"8px 16px",cursor:"pointer",color:active?ac:C.mid,fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:active?600:400,whiteSpace:"nowrap",transition:"all 0.15s"}}>{children}</button>);
};
const PBar=({value,max=100,color=C.hyper,h=6})=>(
  <div style={{background:C.bdr,borderRadius:99,overflow:"hidden",height:h}}>
    <div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.5s cubic-bezier(0.4,0,0.2,1)"}}/>
  </div>
);
const RPEBadge=({rpe})=>{const col=rpe>=9?C.strength:rpe>=7?C.ora:C.recovery;return(
  <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:col,background:`${col}18`,padding:"2px 8px",borderRadius:3,border:`1px solid ${col}30`}}>RPE {rpe}</span>
);};
const Btn=({children,onClick,v="primary",style,disabled,small})=>{
  const base={cursor:disabled?"not-allowed":"pointer",border:"none",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:small?13:15,transition:"all 0.15s",padding:small?"8px 16px":"14px 24px",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,opacity:disabled?0.4:1};
  const vs={primary:{background:C.strength,color:"#FFFFFF"},secondary:{background:C.surUp,color:C.txt,border:`1px solid ${C.bdr}`},ghost:{background:"transparent",color:C.mid,border:`1px solid ${C.bdr}`}};
  return(<button onClick={disabled?undefined:onClick} style={{...base,...vs[v],...style}} onMouseEnter={e=>{if(!disabled){e.currentTarget.style.opacity="0.82";e.currentTarget.style.transform="translateY(-1px)";}}} onMouseLeave={e=>{e.currentTarget.style.opacity=disabled?"0.4":"1";e.currentTarget.style.transform="translateY(0)";}}>
    {children}
  </button>);
};
const Spinner=()=><div style={{width:16,height:16,border:`2px solid ${C.dim}`,borderTopColor:C.hyper,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>;

// --- EXERCISE DATA ------------------------------------------------
const EXERCISES = [
  // CHEST
  {id:"bench-press",name:"Barbell Bench Press",muscle:"Chest",secondary:"Anterior Deltoid, Triceps",equipment:"Barbell",category:"compound",difficulty:"intermediate",
   cue:"Set up with a slight arch  not excessive. Shoulder blades pinched and driven into the bench. Bar path travels in a slight diagonal: from lower chest to above your upper chest. Pause 1 second at the chest. Drive through your heels.",
   tempo:"3-1-1-0",sets:"4",reps:"4-6",rest:180,rpe:8,
   grip:"Standard: hands just outside shoulder width. Wide grip (1 hand wider each side): greater pec stretch, less tricep. Close grip: more tricep involvement  keep for tricep work, not chest.",
   alt:{name:"DB Bench Press",desc:"Same mechanics. Each dumbbell moves independently, which increases stability demand and forces even pressing strength. Slightly greater ROM at the bottom.",noAlt:false},
   coachNote:"If you can't feel your chest working, your shoulder blades aren't set. Retract them hard before every set. The squeeze happens when you think about pushing your hands together, not just pushing up."},
  {id:"incline-db-press",name:"Incline DB Press",muscle:"Chest",secondary:"Anterior Deltoid, Triceps",equipment:"Dumbbells",category:"compound",difficulty:"intermediate",
   cue:"Set incline at 30-45. Higher than 45 shifts to shoulders. Shoulder blades retracted throughout. At the bottom, elbows should be at roughly 45-75  to your torso  not flared to 90. Drive through the inner chest.",
   tempo:"3-0-1-1",sets:"3",reps:"8-10",rest:120,rpe:8,
   grip:"Neutral grip (palms facing each other): less shoulder stress. Pronated (traditional): slightly more upper chest activation. Start neutral if shoulders are sensitive.",
   alt:{name:"Incline Barbell Press",desc:"More loading potential. Same angle principles apply.",noAlt:false},
   coachNote:"The squeeze is at the top  think about trying to touch your elbows together above your chest. Don't lock out fully; keep tension on the pec throughout."},
  {id:"cable-fly",name:"Cable Fly (Low to High)",muscle:"Chest",secondary:"Anterior Deltoid",equipment:"Cable Machine",category:"isolation",difficulty:"beginner",
   cue:"Set cables at hip height. Slight forward lean. Arms travel in a wide arc  slight bend in the elbow maintained throughout. The movement is a hug, not a press. Squeeze hard at the top where hands meet.",
   tempo:"3-1-1-1",sets:"3",reps:"12-15",rest:90,rpe:7,
   grip:"Handle grip: keep wrists neutral. Don't allow wrists to bend back under load.",
   alt:{name:"DB Pec Fly (flat or incline)",desc:"Less constant tension than cable  tension drops at the top. Use cables where possible for this exercise.",noAlt:false},
   coachNote:"This is a stretch-and-squeeze exercise. Slow the negative down  that's where you're loading the muscle at its longest point. Don't rush past it."},
  {id:"chest-dip",name:"Chest Dip",muscle:"Chest",secondary:"Triceps, Anterior Deltoid",equipment:"Dip Bars",category:"compound",difficulty:"intermediate",
   cue:"Lean forward 30  this shifts work to chest over triceps. Go deep: upper arms parallel to floor minimum. Drive through the chest at the top. Add weight once bodyweight dips are controlled.",
   tempo:"3-1-1-0",sets:"3",reps:"8-12",rest:120,rpe:8,
   grip:"Bars: shoulder-width or slightly wider. Narrower = more tricep.",
   alt:{name:"Bench Dip (limited)",desc:"Not a great alternative  compresses shoulders badly at depth. If no dip bars, use DB decline press instead.",noAlt:false},
   coachNote:"Most people cheat this by not going deep enough. Depth is where the pec loads. If you can't get deep with control, reduce weight or use bands for assistance."},

  // BACK
  {id:"pull-up",name:"Weighted Pull-Up",muscle:"Back",secondary:"Biceps, Rear Deltoid",equipment:"Pull-Up Bar",category:"compound",difficulty:"advanced",
   cue:"Dead hang to start  full scapular depression before initiating. Pull from your elbows, not your hands. Think about driving your elbows to your hips. Chest to bar is the goal.",
   tempo:"3-1-1-0",sets:"4",reps:"4-6",rest:180,rpe:8,
   grip:"Overhand (pronated): more lat width. Neutral (parallel handles): more comfortable for shoulders, slightly more bicep. Underhand (chin-up): strong bicep involvement, easier for beginners.",
   alt:{name:"Lat Pulldown",desc:"Excellent alternative  same movement pattern. Use a wide overhand grip. Lean back 10-15  and pull to upper chest.",noAlt:false},
   coachNote:"Initiate by pulling your shoulder blades down before your arms bend. That first movement activates your lats. Without it, you're mostly biceps."},
  {id:"pendlay-row",name:"Pendlay Row",muscle:"Back",secondary:"Biceps, Rear Deltoid",equipment:"Barbell",category:"compound",difficulty:"advanced",
   cue:"Horizontal torso  parallel to floor. Bar starts on the floor each rep (this is what separates Pendlay from bent-over row). Explosive pull to lower chest. Bar returns to floor, full dead stop. No hip drive.",
   tempo:"1-0-1-2",sets:"4",reps:"5-6",rest:180,rpe:8,
   grip:"Double overhand: develops grip and keeps bicep honest. Mixed grip acceptable at heavier loads. Hook grip for maximum weight.",
   alt:{name:"DB Bent-Over Row",desc:"Good alternative. Chest-supported DB row is better if lower back fatigues first  removes the stabilisation variable.",noAlt:false},
   coachNote:"The Pendlay row develops back thickness better than almost any other movement because of the full dead stop. Don't round your lower back  McGill says that's where the risk lives. Brace like you're about to take a punch."},
  {id:"cable-row",name:"Seated Cable Row",muscle:"Back",secondary:"Biceps, Rear Deltoid",equipment:"Cable Machine",category:"compound",difficulty:"beginner",
   cue:"Sit tall. Lean forward into the stretch  feel the full lat stretch. Drive elbows straight back. No lower back rocking. Pause at full contraction with elbows behind torso.",
   tempo:"3-1-1-1",sets:"3",reps:"10-12",rest:90,rpe:7,
   grip:"Close V-grip: more lower lat. Wide overhand: more upper back/rhomboids. Both are valid  rotate across blocks.",
   alt:{name:"DB Row (single arm)",desc:"Excellent alternative. Brace against a bench. Full stretch at the bottom, elbow drives up and back.",noAlt:false},
   coachNote:"The stretch at the front is as important as the pull. Let your shoulder blade protract forward on each rep. This is where the lat loads. Don't cheat it by staying rigid."},
  {id:"face-pull",name:"Face Pull",muscle:"Back",secondary:"External Rotators, Rear Deltoid",equipment:"Cable Machine",category:"isolation",difficulty:"beginner",
   cue:"Cable set at or above eye level. Rope attachment. Pull to your face  separate the rope ends, hands going to ears. External rotation happens at the end. This is corrective work as much as training.",
   tempo:"2-1-1-1",sets:"3",reps:"15-20",rest:60,rpe:7,
   grip:"Rope: thumbs forward. Never substitute heavy weight for quality here.",
   alt:{name:"Band Pull-Apart",desc:"Good substitute. Hold band at shoulder height, arms straight, pull apart to full stretch.",noAlt:false},
   coachNote:"Most lifters skip this or rush it. That's how rotator cuffs fail. High volume, low load, every session. This protects your shoulders for every pressing movement you do."},

  // SHOULDERS
  {id:"ohp",name:"Barbell Overhead Press",muscle:"Shoulders",secondary:"Triceps, Upper Chest",equipment:"Barbell",category:"compound",difficulty:"intermediate",
   cue:"Grip just outside shoulder width. Bar rests on upper chest/front delts. Press in a straight vertical line  move your head back slightly as bar passes. Lock out fully at the top. Brace your entire torso.",
   tempo:"2-0-1-0",sets:"4",reps:"4-6",rest:180,rpe:8,
   grip:"Standard: just outside shoulder width. Wider: slightly more front delt, less tricep. Don't go too wide  it limits ROM.",
   alt:{name:"Seated DB Shoulder Press",desc:"Less total load possible, but greater shoulder joint freedom. Slightly different arc. Solid alternative.",noAlt:false},
   coachNote:"Most pressing injuries happen because people arch excessively and turn this into an incline press. Keep your ribs down. This is a pure shoulder movement."},
  {id:"lateral-raise",name:"Cable Lateral Raise",muscle:"Shoulders",secondary:"Supraspinatus",equipment:"Cable Machine",category:"isolation",difficulty:"beginner",
   cue:"Cable set at floor level, cross-body pull. Slight lean away from the cable. Lead with your elbow  not your hand. Arm travels in the plane of the scapula (slightly forward, not directly to the side). Stop at shoulder height.",
   tempo:"2-1-2-0",sets:"4",reps:"15-20",rest:60,rpe:8,
   grip:"D-handle: maintain neutral wrist. Don't cock the wrist up  it shifts load off the medial delt.",
   alt:{name:"DB Lateral Raise",desc:"Works well. Use a slight forward lean and slightly bent elbow. Cable is superior due to constant tension  but DBs are fine.",noAlt:false},
   coachNote:"This is where most people use too much weight and recruit trap. If your traps are sore after lateral raises, your load is too high or your form is wrong. Lighter, stricter, more reps."},
  {id:"rear-delt-fly",name:"Rear Delt Fly",muscle:"Shoulders",secondary:"Rhomboids, Rear Deltoid",equipment:"Dumbbells",category:"isolation",difficulty:"beginner",
   cue:"Hinged forward 90 or chest-supported. Arms slightly bent. Lead with elbows. Pinkies up at the top. Squeeze the rear delt  don't let the trapezius take over by shrugging.",
   tempo:"2-1-1-0",sets:"3",reps:"15-20",rest:60,rpe:7,
   grip:"Neutral or pronated. Pronated (thumbs toward each other) targets rear delt harder.",
   alt:{name:"Reverse Pec Deck",desc:"Machine version. Excellent. More stable, allows better focus on the rear delt contraction.",noAlt:false},
   coachNote:"Rear delts are chronically undertrained. They balance the shoulder girdle and protect against impingement. If your shoulders round forward, this is part of the fix."},

  // LEGS
  {id:"back-squat",name:"Back Squat",muscle:"Legs",secondary:"Glutes, Lower Back",equipment:"Barbell",category:"compound",difficulty:"advanced",
   cue:"Bar sits across the traps  high bar: more quad dominant. Low bar: more hip/posterior. Knees track over toes throughout. Brace your entire core before descent. Descend in control. Break parallel  upper thigh below knee. Drive through mid-foot on ascent.",
   tempo:"3-1-1-0",sets:"4",reps:"4-6",rest:180,rpe:8,
   grip:"High bar: narrower stance, more upright torso, quad emphasis. Low bar: slightly wider, more forward lean, more hip and hamstring.",
   alt:{name:"Goblet Squat or DB Front Squat",desc:"Limited load but teaches excellent mechanics. Good for warm-up or technique work, not a primary compound substitute.",noAlt:false},
   coachNote:"The squat is honest. You can't hide poor mobility or weak glutes in a heavy squat. Find your depth first  then load it. Knees over toes is not dangerous. Knees caving in is."},
  {id:"rdl",name:"Romanian Deadlift",muscle:"Legs",secondary:"Glutes, Lower Back",equipment:"Barbell",category:"compound",difficulty:"intermediate",
   cue:"Hip hinge  not a squat. Soft bend in the knee stays constant throughout. Bar drags down your legs. Feel the hamstrings load. Lower until you feel a strong hamstring stretch  that's your range. Drive hips forward to return.",
   tempo:"3-1-1-0",sets:"3",reps:"8-10",rest:120,rpe:7,
   grip:"Double overhand, just outside legs. Strap up when grip limits the set.",
   alt:{name:"DB Romanian Deadlift",desc:"Identical mechanics. Dumbbells allow a more natural path. Works very well.",noAlt:false},
   coachNote:"Most people don't hinge enough  they squat it. Push your hips back first. The bar should stay within 2cm of your legs the entire way down. Neutral spine is non-negotiable."},
  {id:"leg-press",name:"Leg Press",muscle:"Legs",secondary:"Glutes",equipment:"Leg Press Machine",category:"compound",difficulty:"beginner",
   cue:"Foot placement: high = more hamstring and glute. Mid = balanced quad/posterior. Low = more quad. Full ROM  heels stay on platform. Don't lock out knees. Control the descent.",
   tempo:"3-0-1-0",sets:"3",reps:"10-12",rest:120,rpe:8,
   grip:"N/A. Keep lower back flat against pad throughout.",
   alt:{name:"No direct dumbbell equivalent",desc:"No good free-weight equivalent for the leg press as a bilateral loaded knee flexion pattern. Hack squat or split squat can partially substitute.",noAlt:true},
   coachNote:"Don't ego load this. Half reps with massive weight don't build legs. Full ROM with controlled tempo does. This is a high-volume quad and glute builder  treat it like one."},
  {id:"nordic-curl",name:"Nordic Hamstring Curl",muscle:"Legs",secondary:"Calves",equipment:"Anchor/Partner",category:"isolation",difficulty:"advanced",
   cue:"Kneel, ankles anchored. Body forms a straight line from knees to crown. Lower as slowly as possible  aim for 5 seconds down. Catch yourself with hands at the bottom. Pull back up with hamstrings, assist with hands.",
   tempo:"5-0-1-0",sets:"3",reps:"5-8",rest:120,rpe:9,
   grip:"Hands for push-off only at the bottom. Don't turn this into a push-up.",
   alt:{name:"Lying Leg Curl (machine)",desc:"Not the same stimulus  concentric dominant. Nordic is eccentric dominant, which is where the injury-prevention value lives. Use leg curls as a supplement, not a replacement.",noAlt:false},
   coachNote:"This single exercise has more hamstring injury prevention evidence behind it than almost any other. The eccentric overload is the point. It's meant to be hard. Accept the soreness the first two weeks."},
  {id:"tibialis-raise",name:"Tibialis Raise",muscle:"Legs",secondary:"Shin, Ankle",equipment:"Wall",category:"isolation",difficulty:"beginner",
   cue:"Stand with heels on a small elevation or flat. Back against a wall. Lift toes as high as possible. Hold 1 second. Lower. Simple but chronically neglected.",
   tempo:"1-1-1-0",sets:"3",reps:"20-25",rest:60,rpe:6,
   grip:"N/A.",
   alt:{name:"Seated Tibialis Raise (weight on toes)",desc:"Use a DB balanced across your feet while seated. Adds load progressively.",noAlt:false},
   coachNote:"Ben Patrick's insight: strong tibialis = healthy knees. This balances the calf-dominant lower leg most people develop and directly reduces knee pain over time. It takes 60 seconds. Do it every session."},

  // BICEPS
  {id:"ez-curl",name:"EZ Bar Curl",muscle:"Biceps",secondary:"Brachialis",equipment:"EZ Bar",category:"isolation",difficulty:"beginner",
   cue:"Stand tall. Elbows pinned to your sides  they don't move forward. Curl until full contraction. Lower fully to full extension  feel the stretch at the bottom. No swinging.",
   tempo:"2-1-1-2",sets:"3",reps:"10-12",rest:90,rpe:8,
   grip:"Angled grip on EZ bar reduces wrist strain. Avoid pure supination if wrists are sensitive.",
   alt:{name:"Straight Barbell Curl or DB Curl",desc:"Barbell maximises supination and bicep peak. DB curl allows wrist rotation mid-movement for greater contraction.",noAlt:false},
   coachNote:"The bottom of the curl is where most people cheat by cutting ROM. Extend fully every rep  the stretch at the bottom is where mechanical tension is highest. Own it."},
  {id:"incline-db-curl",name:"Incline DB Curl",muscle:"Biceps",secondary:"Long Head Bicep",equipment:"Dumbbells",category:"isolation",difficulty:"intermediate",
   cue:"Set bench to 6070. Sit back. Arms hang freely behind the torso  this stretches the long head. Curl without letting elbows travel forward. Supinate wrist at the top (pinky up).",
   tempo:"3-1-1-0",sets:"2",reps:"12-15",rest:90,rpe:7,
   grip:"Neutral at start, supinated at top. This is the entire point of the exercise.",
   alt:{name:"Cable Curl (low pulley, standing)",desc:"Constant tension throughout. Different stretch position. Good complement, not a direct substitute.",noAlt:false},
   coachNote:"This is a stretch-biased curl. The long head of the bicep is what creates the peak. You can't fully load it with standard curls  the arm needs to be behind the body for the stretch. This is why this exercise exists."},

  // TRICEPS
  {id:"tricep-pushdown",name:"Tricep Rope Pushdown",muscle:"Triceps",secondary:"Lateral Head Tricep",equipment:"Cable Machine",category:"isolation",difficulty:"beginner",
   cue:"Cable set high. Rope attachment. Elbows at sides, don't move. Push down and separate the rope at the bottom  this increases lateral head activation. Full lockout.",
   tempo:"2-1-1-0",sets:"3",reps:"12-15",rest:90,rpe:7,
   grip:"Rope: neutral grip, separate at the bottom. Straight bar: slightly more medial head.",
   alt:{name:"DB Kickback",desc:"Works well for lateral head. Brace forearm against bench. Full extension is critical.",noAlt:false},
   coachNote:"Elbows stay pinned. The moment they drift forward or backward, you're using your lats and shoulder to assist. This is an isolation movement. Keep it isolated."},
  {id:"overhead-tricep-ext",name:"Overhead Tricep Extension",muscle:"Triceps",secondary:"Long Head Tricep",equipment:"Cable Machine",category:"isolation",difficulty:"intermediate",
   cue:"Cable set at floor, rope or single handle. Face away from cable. Arms overhead, elbows beside ears. Extend. The long head of the tricep only fully loads in the overhead position  don't skip this.",
   tempo:"3-1-1-0",sets:"3",reps:"12-15",rest:90,rpe:7,
   grip:"Rope (double) or single handle (unilateral for better focus).",
   alt:{name:"DB Skull Crusher or Overhead DB Extension",desc:"DB works well. Skull crusher: elbows bend, lower DB behind head. Overhead DB: hold one DB with both hands overhead.",noAlt:false},
   coachNote:"Two-thirds of the tricep is the long head. It only fully contracts when your arm is overhead. If all you do is pushdowns, you're leaving a third of your tricep development on the table."},


  // RUNNING - STRENGTH & PREHAB
  {id:"atg-split-squat",name:"ATG Split Squat",muscle:"Legs",secondary:"Knee, Ankle, Hip Flexor",equipment:"Bodyweight / Dumbbells",category:"compound",difficulty:"intermediate",
   cue:"Front foot flat. Rear toes on elevated surface. Drive front knee as far over toes as possible - the further the better, as long as heel stays down. This is the opposite of what most coaches teach. Full depth: rear knee grazes the floor. Lean torso forward slightly for hip flexor stretch at the bottom.",
   tempo:"3-1-1-0",sets:"3",reps:"8-10 each",rest:90,rpe:7,
   grip:"Bodyweight first. Add DBs at sides when full depth is comfortable. Never rush load.",
   alt:{name:"Assisted ATG Split Squat (holding a pole)",desc:"Hold a vertical pole or TRX strap for balance. Focus on knee travel distance and heel contact, not load. This is the progression tool.",noAlt:false},
   coachNote:"Ben Patrick's foundation movement. Every runner has tight hip flexors and weak tibialis. This addresses both simultaneously. The knee over toe principle is not dangerous - it is the exact range your knee was designed for. Start with zero load and earn it."},
  {id:"patrick-step",name:"Patrick Step",muscle:"Legs",secondary:"Tibialis, Knee",equipment:"Step / Elevation",category:"isolation",difficulty:"beginner",
   cue:"Stand on edge of a step, one foot. Lower the heel of the working leg below step level. Drive toes up, then slowly lower. This loads the tibialis anterior in a stretched position - the most important runner muscle most runners ignore.",
   tempo:"1-1-2-0",sets:"3",reps:"15-20 each",rest:60,rpe:6,
   grip:"Hold something for balance. Focus is entirely on the tibialis, not balance.",
   alt:{name:"Tibialis Raise (floor)",desc:"Stand heels on a small elevation, back against wall. Lift toes as high as possible. Easier version, same muscle. Progress to Patrick Step.",noAlt:false},
   coachNote:"Named after Ben Patrick. This single movement - done consistently for 8 weeks - eliminates shin splints in most runners. The tibialis anterior controls toe clearance during your gait cycle. Strengthen it and your stride efficiency improves. Skip it and shin splints keep returning."},
  {id:"copenhagen-plank",name:"Copenhagen Plank",muscle:"Legs",secondary:"Adductors, Core, Hip",equipment:"Bench / Box",category:"isolation",difficulty:"intermediate",
   cue:"Side plank position. Top foot rests on a bench at knee or ankle height (higher = easier). Bottom leg hangs free or can lightly touch floor. Hold position - do not let hips sag. Progress by lifting bottom leg off the floor.",
   tempo:"hold",sets:"3",reps:"20-30s each side",rest:60,rpe:7,
   grip:"N/A. Forearm on floor, body in straight line.",
   alt:{name:"Side-lying Hip Adduction",desc:"Lie on side. Lift bottom leg up. Much easier, good starting point. Progress to Copenhagen.",noAlt:false},
   coachNote:"Adductor weakness is one of the most common causes of groin strains and IT band issues in runners. This loads the adductors in a long position - where they're weakest - making it highly specific injury prevention. The research on this for runners is strong."},
  {id:"single-leg-calf-raise",name:"Single Leg Calf Raise (Full ROM)",muscle:"Legs",secondary:"Achilles, Ankle",equipment:"Step",category:"isolation",difficulty:"beginner",
   cue:"Stand on one foot on the edge of a step. Heel drops below step level for the stretch. Drive up as high as possible on toes. Full ROM - the full stretch at the bottom is the entire point. Both gastroc and soleus must work through complete range.",
   tempo:"2-1-3-1",sets:"3",reps:"15-20 each",rest:60,rpe:7,
   grip:"Light fingertip balance support only.",
   alt:{name:"Bilateral Calf Raise on step",desc:"Both feet. Easier. Less Achilles-specific. Progress to single leg as soon as possible.",noAlt:false},
   coachNote:"Achilles tendinopathy is the most common overuse injury in distance runners. A 2015 Alfredson study showed heavy eccentric loading here reduced pain in 90% of chronic sufferers. The 3-second eccentric lower is non-negotiable. This is treatment and prevention in one movement."},
  {id:"reverse-nordic",name:"Reverse Nordic Curl",muscle:"Legs",secondary:"Quad, Hip Flexor, Knee",equipment:"Soft surface",category:"isolation",difficulty:"intermediate",
   cue:"Kneel upright, knees on a pad. Keep your body in a straight line from knees to crown - no hip bend. Lean back slowly, as far as you can while maintaining that straight line. Drive back up with quads. This is quad and hip flexor work in one.",
   tempo:"3-0-1-0",sets:"3",reps:"8-12",rest:90,rpe:8,
   grip:"N/A. Arms across chest or extended for counterbalance.",
   alt:{name:"Assisted Reverse Nordic (holding a pole)",desc:"Hold a pole in front for assistance returning upright. Reduces the load but preserves the movement pattern. Start here.",noAlt:false},
   coachNote:"Runners are quad-dominant and hip-flexor tight simultaneously. This addresses both. The ATG protocol uses this as a quad finisher. It also builds the terminal knee extension strength that runners need for push-off efficiency. Harder than it looks."},
  {id:"glute-med-walk",name:"Banded Lateral Walk",muscle:"Legs",secondary:"Glute Medius, Hip Abductors",equipment:"Resistance Band",category:"isolation",difficulty:"beginner",
   cue:"Band around ankles or just above knees. Quarter squat position - stay low throughout. Step laterally, maintaining tension on the band at all times. Do not let feet come fully together. Keep torso upright, knees tracking toes.",
   tempo:"controlled",sets:"3",reps:"15 steps each direction",rest:60,rpe:5,
   grip:"N/A. Hands on hips or out front for balance.",
   alt:{name:"Clamshell (band)",desc:"Lie on side, band above knees. Open top knee like a clamshell. Easier. Targets glute med from a different angle. Good warm-up movement.",noAlt:false},
   coachNote:"Glute medius weakness causes lateral pelvic drop during single-leg stance - which happens on every single stride. That drop is the mechanism behind IT band syndrome, runner's knee, and hip pain. This is not optional prehab. This is the reason half your athletes are injured."},
  {id:"single-leg-rdl",name:"Single Leg RDL",muscle:"Legs",secondary:"Hamstrings, Glutes, Balance",equipment:"Dumbbells / Barbell",category:"compound",difficulty:"intermediate",
   cue:"Stand on one leg, slight bend in the knee. Hinge forward from the hip - let the free leg extend behind you as a counterbalance. Maintain a neutral spine throughout. Reach dumbbell toward the floor. Drive through heel to return. Control every inch.",
   tempo:"3-1-1-0",sets:"3",reps:"8-10 each",rest:90,rpe:7,
   grip:"One or two DBs. Start light - balance is the limiting factor before load.",
   alt:{name:"B-Stance RDL (staggered feet)",desc:"Both feet on the floor, one slightly behind. More stable. Good entry point. Progress to full single leg.",noAlt:false},
   coachNote:"Runners live on one leg at a time. Every stride is a single-leg landing. Bilateral strength does not transfer as directly as unilateral work. The single-leg RDL also develops proprioception and ankle stability - two things that determine how well you handle varied terrain."},
  {id:"hip-flexor-stretch-active",name:"Active Hip Flexor Stretch (90/90)",muscle:"Hips",secondary:"Hip Flexor, Piriformis, Glute",equipment:"Bodyweight",category:"mobility",difficulty:"beginner",
   cue:"Sit on floor. One leg at 90 degrees in front, one at 90 degrees to the side. Sit upright - do not hunch. Lean forward over the front shin to feel the front hip stretch. Then rotate to lean over the rear leg. Active breathing throughout.",
   tempo:"hold 30-60s each position",sets:"2",reps:"2 positions each side",rest:30,rpe:3,
   grip:"N/A. Hands on floor for support.",
   alt:{name:"Half-Kneeling Hip Flexor Stretch",desc:"Kneeling lunge position. Posterior pelvic tilt (squeeze glute of rear leg). Hold 30-60s. Classic hip flexor opener.",noAlt:false},
   coachNote:"Every runner is hip-flexor tight. It is almost universal. Tight hip flexors reduce stride length, increase anterior pelvic tilt, and cause lower back pain on long runs. Ten minutes of active hip flexor work per day changes your gait over 4-6 weeks. Not a nice-to-have."},
  {id:"dead-bug",name:"Dead Bug",muscle:"Legs",secondary:"Core, Hip Flexors, Lumbar",equipment:"Bodyweight",category:"isolation",difficulty:"beginner",
   cue:"Lie on back, arms vertical, knees at 90 degrees above hips. Press lower back flat to the floor - this stays the entire time. Simultaneously lower one arm overhead and opposite leg to just above floor. Return. Keep breathing. Never let lower back arch.",
   tempo:"2-0-2-0",sets:"3",reps:"8-10 each side",rest:60,rpe:5,
   grip:"N/A.",
   alt:{name:"Modified Dead Bug (one limb only)",desc:"Only move one limb at a time instead of opposite pairs. Easier. Build to the full movement.",noAlt:false},
   coachNote:"Running is an anti-rotation sport. Every stride requires your core to resist rotation and keep the pelvis stable. The dead bug builds that specific anti-extension and anti-rotation core stability. Stuart McGill rates this above crunches and sit-ups for spinal health. It is also safe for athletes with existing lower back issues."},
  {id:"box-jump",name:"Box Jump",muscle:"Legs",secondary:"Glutes, Calves, Core",equipment:"Box / Plyo Box",category:"compound",difficulty:"intermediate",
   cue:"Stand arm's length from box. Quarter squat and swing arms. Explode upward and land softly on the box with full foot contact - not just toes. Land in a quarter squat. Step down - do not jump down. Focus is on the explosive drive, not landing height.",
   tempo:"explosive",sets:"4",reps:"5",rest:90,rpe:8,
   grip:"N/A. Arms drive the momentum.",
   alt:{name:"Squat Jump (no box)",desc:"Jump vertically, land softly. Same explosive intent. Focus on triple extension at hips, knees, and ankles. Land with control.",noAlt:false},
   coachNote:"Plyometric training improves running economy directly - multiple studies show 3-6% improvement in economy after 6-8 weeks of plyos. That translates to faster times for the same effort. This is not just a gym movement. This is specific speed work."},
  // WARM-UP / MOBILITY
  {id:"hip-circle",name:"Hip Circle (Active Mobility)",muscle:"Hips",secondary:"Glutes, Hip Flexors",equipment:"Bodyweight",category:"mobility",difficulty:"beginner",
   cue:"Standing, hands on hips. Draw large circles with your hips  both directions. Increase range progressively. This is nervous system priming, not stretching.",
   tempo:"controlled",sets:"2",reps:"10 each direction",rest:0,rpe:3,
   grip:"N/A.",
   alt:{name:"No alternative needed",desc:"This is a basic mobility drill. Do it.",noAlt:true},
   coachNote:"You don't warm up to perform well  you warm up to not break. Every session. Non-negotiable."},
  {id:"band-pull-apart",name:"Band Pull-Apart",muscle:"Back",secondary:"Rear Deltoid, External Rotators",equipment:"Resistance Band",category:"mobility",difficulty:"beginner",
   cue:"Hold band at chest height, arms extended. Pull apart to full spread. Controlled. Shoulder blades pinch at the end.",
   tempo:"2-1-2-0",sets:"3",reps:"15-20",rest:30,rpe:4,
   grip:"Overhand: rear delt. Underhand: lower trap. Both matter.",
   alt:{name:"Face Pull with Band",desc:"Adds external rotation component. Excellent substitute.",noAlt:false},
   coachNote:"Ten minutes of band work before pressing prevents more injuries than any amount of stretching after. Shoulder health lives here."},
,

  // ABS & CORE
  {id:"dead-bug-core",name:"Dead Bug",muscle:"Core",secondary:"Hip Flexors, Lower Back",equipment:"Bodyweight",category:"isolation",difficulty:"beginner",
   cue:"Lie on back, arms vertical, knees 90 degrees above hips. Press lower back flat and keep it there. Lower one arm overhead and opposite leg to just above floor simultaneously. Return. Never let the lower back arch away from the floor.",
   tempo:"2-0-2-0",sets:"3",reps:"8-10 each side",rest:45,rpe:5,
   muscle_group:"abs",
   grip:"N/A.",
   alt:{name:"Modified Dead Bug",desc:"Move one limb at a time instead of opposite pairs. Easier entry point.",noAlt:false},
   coachNote:"Stuart McGill rates this above crunches and sit-ups for spinal safety and function. The anti-extension demand is what your core is actually designed for. If your lower back lifts off the floor at any point, you have lost the movement."},
  {id:"ab-wheel",name:"Ab Wheel Rollout",muscle:"Core",secondary:"Shoulders, Lats",equipment:"Ab Wheel",category:"compound",difficulty:"intermediate",
   cue:"Kneel on a pad. Grip the wheel. Roll forward slowly - keep your lower back flat by bracing your core hard. Go as far as you can without arching the back. Roll back by pulling from the abs and lats. Never let the hips sag.",
   tempo:"3-0-2-0",sets:"3",reps:"8-10",rest:60,rpe:8,
   muscle_group:"abs",
   grip:"Neutral grip on handles. Shoulder-width or slightly wider.",
   alt:{name:"Barbell Rollout",desc:"Same movement with a barbell. Harder to control. Use the same cues.",noAlt:false},
   coachNote:"Athlean-X principle: the rectus abdominis is maximally loaded in the stretched position. No crunch touches this. Start from knees. When you can do 15 controlled reps from knees, progress to standing rollouts."},
  {id:"hollow-hold",name:"Hollow Body Hold",muscle:"Core",secondary:"Hip Flexors, Serratus",equipment:"Bodyweight",category:"isolation",difficulty:"intermediate",
   cue:"Lie on back. Arms overhead. Lift shoulders and legs off the floor. Lower back pressed flat. Hold. The further your legs are from the floor, the harder it is. Find the height where you can maintain a flat lower back.",
   tempo:"hold",sets:"3",reps:"20-30s",rest:45,rpe:7,
   muscle_group:"abs",
   grip:"N/A. Arms straight overhead, hands together.",
   alt:{name:"Hollow Body with bent knees",desc:"Bend the knees to 90 degrees to reduce the lever arm. Same lower back requirement applies.",noAlt:false},
   coachNote:"The gymnastic foundation. This is the position the core must maintain in every overhead lift, press, and ring movement. Build this and every other lift gets stronger. It looks simple. Hold it for 30 seconds properly and you will disagree."},
  {id:"myotatic-crunch",name:"Myotatic Crunch",muscle:"Core",secondary:"Rectus Abdominis",equipment:"BOSU / Rolled Towel",category:"isolation",difficulty:"beginner",
   cue:"Lie over a BOSU ball or a tightly rolled towel placed under your lower back. Arms extended overhead. Let yourself fully extend at the bottom - arms touch the floor. Then crunch slowly to full contraction at the top. The extension at the bottom is the whole point.",
   tempo:"3-1-2-0",sets:"3",reps:"10-12",rest:45,rpe:7,
   muscle_group:"abs",
   grip:"N/A. Arms extended, hands clasped overhead.",
   alt:{name:"Standard crunch on floor",desc:"Less effective due to the absence of the myotatic stretch. But still valid if no BOSU available.",noAlt:false},
   coachNote:"Tim Ferriss Four Hour Body. The pre-stretch activates the myotatic reflex and recruits significantly more motor units than a standard crunch. Studies Ferriss cites show 3x greater activation. Full extension at the bottom is non-negotiable."},
  {id:"pallof-press",name:"Pallof Press",muscle:"Core",secondary:"Obliques, Transverse Abdominis",equipment:"Cable Machine",category:"isolation",difficulty:"beginner",
   cue:"Stand perpendicular to a cable anchored at chest height. Hold handle at chest. Press straight out, hold 1 second, return to chest. The cable is pulling you toward it. Your core resists that rotation the entire time. Do not twist toward the cable.",
   tempo:"2-1-2-0",sets:"3",reps:"12 each side",rest:45,rpe:6,
   muscle_group:"abs",
   grip:"Both hands on handle. Neutral grip.",
   alt:{name:"Pallof Press with band",desc:"Anchor a band at chest height to a rack. Same movement. Travel further from the anchor for more resistance.",noAlt:false},
   coachNote:"Athlean-X anti-rotation essential. The Pallof Press trains the core in its actual function - resisting rotation while the limbs move. This transfers directly to every sport, every carry, and every loaded movement. If you only have time for one cable core exercise, this is it."},
  {id:"l-sit",name:"L-Sit Hold",muscle:"Core",secondary:"Hip Flexors, Triceps",equipment:"Parallel Bars / Bench",category:"isolation",difficulty:"advanced",
   cue:"Support yourself on parallel bars or the edge of a bench with straight arms. Lift your legs to parallel with the floor. Hold. Toes pointed. Hips in line with hands or in front of them. Start with bent knees if full extension is not yet possible.",
   tempo:"hold",sets:"3",reps:"10-20s",rest:60,rpe:8,
   muscle_group:"abs",
   grip:"Parallel bars, dip handles, or edge of a bench. Overhand.",
   alt:{name:"L-Sit from floor",desc:"Place hands on the floor with fists or parallettes. Lift the hips slightly first, then work toward legs parallel.",noAlt:false},
   coachNote:"The L-sit develops hip flexor strength and core compression that no other exercise replicates. If you want a visible core without body fat reduction, you need compression exercises like this. It also reveals any core strength imbalances between left and right sides within the first attempt."},
  {id:"plank-shoulder-tap",name:"Plank with Shoulder Tap",muscle:"Core",secondary:"Obliques, Shoulders",equipment:"Bodyweight",category:"isolation",difficulty:"beginner",
   cue:"High plank position. Feet slightly wider than normal for stability. Lift one hand to touch the opposite shoulder while keeping the hips completely square. No rotation. Return. Alternate. The anti-rotation demand is the entire exercise.",
   tempo:"controlled",sets:"3",reps:"10 each side",rest:45,rpe:6,
   muscle_group:"abs",
   grip:"N/A.",
   alt:{name:"Standard plank",desc:"If shoulder taps are too difficult, hold a standard plank. Progress to shoulder taps over 2-3 weeks.",noAlt:false},
   coachNote:"Every stride, every press, every carry requires the core to resist rotation while the limbs move. This is that demand in the most accessible form. The test is simple: if your hips move when you tap your shoulder, your anti-rotation strength is inadequate for the loads you are lifting."},
];

// --- STOIC QUOTES (daily rotation) ---
const STOIC_QUOTES=[
  {text:"You have power over your mind, not outside events. Realise this, and you will find strength.",author:"Marcus Aurelius"},
  {text:"The impediment to action advances action. What stands in the way becomes the way.",author:"Marcus Aurelius"},
  {text:"Waste no more time arguing about what a good man should be. Be one.",author:"Marcus Aurelius"},
  {text:"He who is brave is free.",author:"Seneca"},
  {text:"It is not the man who has too little, but the man who craves more, that is poor.",author:"Seneca"},
  {text:"Luck is what happens when preparation meets opportunity.",author:"Seneca"},
  {text:"No man is free who is not master of himself.",author:"Epictetus"},
  {text:"Make the best use of what is in your power, and take the rest as it happens.",author:"Epictetus"},
  {text:"Seek not the good in external things; seek it in yourself.",author:"Epictetus"},
  {text:"First say to yourself what you would be; and then do what you have to do.",author:"Epictetus"},
  {text:"Confine yourself to the present.",author:"Marcus Aurelius"},
  {text:"Loss is nothing else but change, and change is Nature's delight.",author:"Marcus Aurelius"},
  {text:"Difficulties strengthen the mind, as labour does the body.",author:"Seneca"},
  {text:"If it is not right, do not do it; if it is not true, do not say it.",author:"Marcus Aurelius"},
  {text:"The whole future lies in uncertainty: live immediately.",author:"Seneca"},
  {text:"Accept the things to which fate binds you.",author:"Marcus Aurelius"},
  {text:"Don't explain your philosophy. Embody it.",author:"Epictetus"},
  {text:"Man is not worried by real problems so much as by his imagined anxieties about real problems.",author:"Epictetus"},
  {text:"How long are you going to wait before you demand the best for yourself?",author:"Epictetus"},
  {text:"Begin at once to live, and count each separate day as a separate life.",author:"Seneca"},
  {text:"Receive without pride, relinquish without struggle.",author:"Marcus Aurelius"},
  {text:"He suffers more than necessary, who suffers before it is necessary.",author:"Seneca"},
  {text:"Know first who you are, and then adorn yourself accordingly.",author:"Epictetus"},
  {text:"Today I escaped anxiety. Or no, I discarded it, because it was within me, in my own perceptions -- not outside.",author:"Marcus Aurelius"},
  {text:"The obstacle is the path.",author:"Marcus Aurelius"},
  {text:"Caretake this moment. Immerse yourself in its particulars.",author:"Epictetus"},
  {text:"Wealth consists not in having great possessions, but in having few wants.",author:"Epictetus"},
  {text:"Every new beginning comes from some other beginning's end.",author:"Seneca"},
  {text:"When you wake up in the morning, tell yourself: the people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous and surly. But I have seen the beauty of good.",author:"Marcus Aurelius"},
  {text:"Very little is needed to make a happy life; it is all within yourself.",author:"Marcus Aurelius"},
];

// Volume Engine targets per muscle group (from GMT doctrine)
const VOLUME_TARGETS={
  Chest:      {hyper:[12,18],strength:[8,12],spec:[16,22]},
  Back:       {hyper:[14,20],strength:[10,16],spec:[18,24]},
  Quads:      {hyper:[10,16],strength:[8,12],spec:[14,20]},
  Hamstrings: {hyper:[8,14], strength:[6,10],spec:[12,18]},
  Glutes:     {hyper:[10,18],strength:[8,12],spec:[16,24]},
  Shoulders:  {hyper:[10,16],strength:[8,12],spec:[14,20]},
  Biceps:     {hyper:[8,14], strength:[6,10],spec:[12,18]},
  Triceps:    {hyper:[8,14], strength:[6,10],spec:[12,18]},
  Calves:     {hyper:[6,12], strength:[4,8], spec:[10,16]},
  Core:       {hyper:[6,12], strength:[6,10],spec:[10,16]},
};

// Muscle volume contribution per exercise (sets * contribution factor)
const MUSCLE_VOLUME_MAP = {
  "Barbell Bench Press":   {Chest:1,   Shoulders:0.5, Triceps:0.5},
  "Incline Dumbbell Press":{Chest:1,   Shoulders:0.5, Triceps:0.3},
  "Chest Dip":             {Chest:1,   Triceps:0.7,   Shoulders:0.3},
  "Cable Chest Fly":       {Chest:1},
  "Weighted Pull-Up":      {Back:1,    Biceps:0.5},
  "Pendlay Row":           {Back:1,    Biceps:0.5},
  "Seated Cable Row":      {Back:1,    Biceps:0.4,    Shoulders:0.2},
  "Face Pull":             {Back:0.5,  Shoulders:0.7},
  "Barbell Overhead Press":{Shoulders:1,Triceps:0.5},
  "Cable Lateral Raise":   {Shoulders:1},
  "Rear Delt Fly":         {Shoulders:0.7,Back:0.3},
  "Back Squat":            {Quads:1,   Glutes:0.7,    Hamstrings:0.3},
  "Romanian Deadlift":     {Hamstrings:1,Glutes:0.7,  Back:0.3},
  "Bulgarian Split Squat": {Quads:1,   Glutes:0.8},
  "Leg Press":             {Quads:1,   Glutes:0.5},
  "Nordic Hamstring Curl": {Hamstrings:1},
  "Single Leg RDL":        {Hamstrings:1,Glutes:0.8},
  "EZ Bar Curl":           {Biceps:1},
  "Incline DB Curl":       {Biceps:1},
  "Tricep Rope Pushdown":  {Triceps:1},
  "Overhead Tricep Extension":{Triceps:1},
  "Dead Bug":              {Core:1},
  "Bird Dog":              {Core:1},
  "Cable Crunch":          {Core:1},
  "Ab Wheel Rollout":      {Core:1},
};

const EXERCISE_DIAGRAMS={
  "Back Squat":{"primary":["quads","glutes"],"secondary":["adductors","abs"],"stabilizer":["erectors"],"view":"front"},
  "Front Squat":{"primary":["quads"],"secondary":["glutes","abs"],"stabilizer":["erectors"],"view":"front"},
  "Safety Bar Squat":{"primary":["quads","glutes"],"secondary":["abs"],"stabilizer":["erectors"],"view":"front"},
  "Hack Squat":{"primary":["quads"],"secondary":["glutes"],"stabilizer":["abs","erectors"],"view":"front"},
  "Leg Press":{"primary":["quads"],"secondary":["glutes"],"stabilizer":["abs","erectors"],"view":"front"},
  "Smith Squat":{"primary":["quads"],"secondary":["glutes"],"stabilizer":["abs","erectors"],"view":"front"},
  "Goblet Squat":{"primary":["quads"],"secondary":["glutes","abs"],"stabilizer":["erectors"],"view":"front"},
  "Box Squat":{"primary":["quads","glutes"],"secondary":["abs"],"stabilizer":["erectors"],"view":"front"},
  "Cyclist Squat":{"primary":["quads"],"secondary":["glutes"],"stabilizer":["abs","erectors"],"view":"front"},
  "Heel-Elevated Squat":{"primary":["quads"],"secondary":["glutes"],"stabilizer":["abs","erectors"],"view":"front"},
  "Bulgarian Split Squat":{"primary":["quads","glutes"],"secondary":["abs"],"stabilizer":["erectors"],"view":"front"},
  "Reverse Lunge":{"primary":["quads","glutes"],"secondary":["abs"],"stabilizer":["erectors"],"view":"front"},
  "Walking Lunge":{"primary":["quads","glutes"],"secondary":["adductors"],"stabilizer":["abs","erectors"],"view":"front"},
  "Step-Up":{"primary":["quads","glutes"],"secondary":["abs"],"stabilizer":["erectors"],"view":"front"},
  "Single-Leg Press":{"primary":["quads"],"secondary":["glutes"],"stabilizer":["abs","erectors"],"view":"front"},
  "Conventional Deadlift":{"primary":["glutes","hamstrings"],"secondary":["lats","traps","erectors","abs"],"stabilizer":[],"view":"back"},
  "Trap Bar Deadlift":{"primary":["glutes","quads"],"secondary":["hamstrings"],"stabilizer":["abs","lats"],"view":"back"},
  "Romanian Deadlift":{"primary":["hamstrings","glutes"],"secondary":["lats","traps","erectors"],"stabilizer":["abs"],"view":"back"},
  "Stiff-Leg Deadlift":{"primary":["hamstrings"],"secondary":["glutes","lats","traps","erectors"],"stabilizer":["abs"],"view":"back"},
  "Good Morning":{"primary":["glutes","hamstrings"],"secondary":["lats","traps","erectors","abs"],"stabilizer":[],"view":"back"},
  "Rack Pull":{"primary":["lats","traps","erectors","glutes"],"secondary":["hamstrings"],"stabilizer":["abs"],"view":"back"},
  "Deficit Deadlift":{"primary":["glutes","hamstrings"],"secondary":["lats","traps","erectors"],"stabilizer":["abs"],"view":"back"},
  "Kettlebell Deadlift":{"primary":["glutes","hamstrings"],"secondary":["abs"],"stabilizer":["lats"],"view":"back"},
  "Dumbbell RDL":{"primary":["hamstrings","glutes"],"secondary":["lats","traps","erectors"],"stabilizer":["abs"],"view":"back"},
  "Single-Leg RDL":{"primary":["hamstrings","glutes"],"secondary":["abs"],"stabilizer":["lats"],"view":"back"},
  "Cable Pull-Through":{"primary":["glutes"],"secondary":["hamstrings"],"stabilizer":["abs","lats"],"view":"back"},
  "45-Degree Back Extension":{"primary":["glutes","hamstrings"],"secondary":["lats","traps","erectors"],"stabilizer":["abs"],"view":"back"},
  "Reverse Hyper":{"primary":["glutes","hamstrings"],"secondary":["lats","traps","erectors"],"stabilizer":["abs"],"view":"back"},
  "Kettlebell Swing":{"primary":["glutes","hamstrings"],"secondary":["abs"],"stabilizer":["lats"],"view":"back"},
  "Bench Press":{"primary":["chest"],"secondary":["triceps","anterior_deltoid"],"stabilizer":["abs"],"view":"front"},
  "Paused Bench Press":{"primary":["chest"],"secondary":["triceps","anterior_deltoid"],"stabilizer":["abs"],"view":"front"},
  "Incline Bench Press":{"primary":["chest"],"secondary":["anterior_deltoid","triceps"],"stabilizer":["abs"],"view":"front"},
  "Dumbbell Bench Press":{"primary":["chest"],"secondary":["triceps"],"stabilizer":["abs"],"view":"front"},
  "Incline Dumbbell Press":{"primary":["chest"],"secondary":["anterior_deltoid","triceps"],"stabilizer":["abs"],"view":"front"},
  "Machine Chest Press":{"primary":["chest"],"secondary":["triceps"],"stabilizer":["abs"],"view":"front"},
  "Smith Incline Press":{"primary":["chest"],"secondary":["triceps","anterior_deltoid"],"stabilizer":["abs"],"view":"front"},
  "Floor Press":{"primary":["chest","triceps"],"secondary":["anterior_deltoid"],"stabilizer":["abs"],"view":"front"},
  "Weighted Push-Up":{"primary":["chest"],"secondary":["triceps","obliques"],"stabilizer":["abs"],"view":"front"},
  "Deficit Push-Up":{"primary":["chest"],"secondary":["triceps"],"stabilizer":["abs"],"view":"front"},
  "Single-Arm Dumbbell Press":{"primary":["chest"],"secondary":["triceps","abs"],"stabilizer":[],"view":"front"},
  "Overhead Press":{"primary":["anterior_deltoid"],"secondary":["triceps","chest"],"stabilizer":["abs","erectors"],"view":"front"},
  "Push Press":{"primary":["anterior_deltoid"],"secondary":["triceps","quads","glutes"],"stabilizer":["abs","erectors"],"view":"front"},
  "Seated Dumbbell Press":{"primary":["anterior_deltoid"],"secondary":["triceps"],"stabilizer":["abs","erectors"],"view":"front"},
  "Arnold Press":{"primary":["anterior_deltoid"],"secondary":["triceps"],"stabilizer":["abs","erectors"],"view":"front"},
  "Machine Shoulder Press":{"primary":["anterior_deltoid"],"secondary":["triceps"],"stabilizer":["abs","erectors"],"view":"front"},
  "Landmine Press":{"primary":["anterior_deltoid"],"secondary":["chest","triceps"],"stabilizer":["abs","erectors"],"view":"front"},
  "Single-Arm Landmine Press":{"primary":["anterior_deltoid"],"secondary":["abs","triceps"],"stabilizer":["erectors"],"view":"front"},
  "Single-Arm Dumbbell Press":{"primary":["anterior_deltoid"],"secondary":["abs","triceps"],"stabilizer":["erectors"],"view":"front"},
  "Barbell Row":{"primary":["lats","traps","rear_delts"],"secondary":["biceps"],"stabilizer":["abs","erectors"],"view":"back"},
  "Pendlay Row":{"primary":["lats","traps","rear_delts"],"secondary":["biceps"],"stabilizer":["abs","erectors"],"view":"back"},
  "Chest-Supported Row":{"primary":["lats","traps","rear_delts"],"secondary":["biceps"],"stabilizer":["abs","erectors"],"view":"back"},
  "Seated Cable Row":{"primary":["lats","traps","rear_delts"],"secondary":["biceps"],"stabilizer":["abs","erectors"],"view":"back"},
  "Machine Row":{"primary":["lats","traps","rear_delts"],"secondary":["biceps"],"stabilizer":["abs","erectors"],"view":"back"},
  "T-Bar Row":{"primary":["lats","traps","rear_delts"],"secondary":[],"stabilizer":["abs","erectors"],"view":"back"},
  "Dumbbell Row":{"primary":["lats"],"secondary":["traps","rear_delts","biceps"],"stabilizer":["abs","erectors"],"view":"back"},
  "Single-Arm Cable Row":{"primary":["lats"],"secondary":["traps","rear_delts","biceps"],"stabilizer":["abs","erectors"],"view":"back"},
  "Inverted Row":{"primary":["lats","traps","rear_delts"],"secondary":["biceps"],"stabilizer":["abs","erectors"],"view":"back"},
  "Band Row":{"primary":["lats","traps","rear_delts"],"secondary":["biceps"],"stabilizer":["abs","erectors"],"view":"back"},
  "Pull-Up":{"primary":["lats"],"secondary":["biceps","traps","rear_delts"],"stabilizer":["abs"],"view":"back"},
  "Weighted Pull-Up":{"primary":["lats"],"secondary":["biceps"],"stabilizer":["abs"],"view":"back"},
  "Chin-Up":{"primary":["lats","biceps"],"secondary":["traps","rear_delts"],"stabilizer":["abs"],"view":"back"},
  "Assisted Pull-Up":{"primary":["lats"],"secondary":["biceps"],"stabilizer":["abs"],"view":"back"},
  "Lat Pulldown":{"primary":["lats"],"secondary":["biceps"],"stabilizer":["abs"],"view":"back"},
  "Neutral-Grip Pulldown":{"primary":["lats"],"secondary":["biceps","traps","rear_delts"],"stabilizer":["abs"],"view":"back"},
  "Single-Arm Pulldown":{"primary":["lats"],"secondary":["biceps"],"stabilizer":["abs"],"view":"back"},
  "Machine Pulldown":{"primary":["lats"],"secondary":["biceps"],"stabilizer":["abs"],"view":"back"},
  "Band Pulldown":{"primary":["lats"],"secondary":["biceps"],"stabilizer":["abs"],"view":"back"},
  "Barbell Hip Thrust":{"primary":["glutes"],"secondary":["hamstrings"],"stabilizer":["abs"],"view":"back"},
  "Smith Hip Thrust":{"primary":["glutes"],"secondary":["hamstrings"],"stabilizer":["abs"],"view":"back"},
  "Machine Hip Thrust":{"primary":["glutes"],"secondary":["hamstrings"],"stabilizer":["abs"],"view":"back"},
  "Glute Bridge":{"primary":["glutes"],"secondary":["hamstrings"],"stabilizer":["abs"],"view":"back"},
  "Single-Leg Hip Thrust":{"primary":["glutes"],"secondary":["hamstrings","abs"],"stabilizer":[],"view":"back"},
  "Frog Pump":{"primary":["glutes"],"secondary":["adductors"],"stabilizer":["abs"],"view":"back"},
  "Cable Kickback":{"primary":["glutes"],"secondary":["hamstrings"],"stabilizer":["abs"],"view":"back"},
  "45-Degree Hip Extension":{"primary":["glutes","hamstrings"],"secondary":["lats","traps","erectors"],"stabilizer":["abs"],"view":"back"},
  "Seated Leg Curl":{"primary":["hamstrings"],"secondary":["calves"],"stabilizer":[],"view":"back"},
  "Lying Leg Curl":{"primary":["hamstrings"],"secondary":["calves"],"stabilizer":[],"view":"back"},
  "Single-Leg Leg Curl":{"primary":["hamstrings"],"secondary":["calves"],"stabilizer":[],"view":"back"},
  "Nordic Curl":{"primary":["hamstrings"],"secondary":["glutes"],"stabilizer":[],"view":"back"},
  "Sliding Leg Curl":{"primary":["hamstrings"],"secondary":["glutes"],"stabilizer":[],"view":"back"},
  "Band Leg Curl":{"primary":["hamstrings"],"secondary":["calves"],"stabilizer":[],"view":"back"},
  "Leg Extension":{"primary":["quads"],"secondary":[],"stabilizer":[],"view":"front"},
  "Single-Leg Extension":{"primary":["quads"],"secondary":[],"stabilizer":[],"view":"front"},
  "Reverse Nordic":{"primary":["quads"],"secondary":["hip_flexors"],"stabilizer":[],"view":"front"},
  "Spanish Squat":{"primary":["quads"],"secondary":["glutes"],"stabilizer":[],"view":"front"},
  "Terminal Knee Extension":{"primary":["quads"],"secondary":[],"stabilizer":[],"view":"front"},
  "Standing Calf Raise":{"primary":["calves"],"secondary":[],"stabilizer":[],"view":"back"},
  "Seated Calf Raise":{"primary":["calves"],"secondary":[],"stabilizer":[],"view":"back"},
  "Single-Leg Calf Raise":{"primary":["calves"],"secondary":[],"stabilizer":[],"view":"back"},
  "Tibialis Raise":{"primary":["tibialis"],"secondary":[],"stabilizer":[],"view":"front"},
  "Backward Sled Drag":{"primary":["quads"],"secondary":["calves","glutes"],"stabilizer":[],"view":"front"},
  "Donkey Calf Raise":{"primary":["calves"],"secondary":[],"stabilizer":[],"view":"back"},
  "Lateral Band Walk":{"primary":["glutes"],"secondary":[],"stabilizer":["abs","obliques"],"view":"back"},
  "Cable Hip Abduction":{"primary":["glutes"],"secondary":[],"stabilizer":["abs","obliques"],"view":"back"},
  "Machine Hip Abduction":{"primary":["glutes"],"secondary":[],"stabilizer":["abs","obliques"],"view":"back"},
  "Side-Lying Abduction":{"primary":["glutes"],"secondary":[],"stabilizer":["abs","obliques"],"view":"back"},
  "Copenhagen Plank":{"primary":["glutes"],"secondary":["obliques"],"stabilizer":["abs"],"view":"back"},
  "Lateral Step-Down":{"primary":["glutes"],"secondary":["abs"],"stabilizer":["obliques"],"view":"back"},
  "Skater Squat":{"primary":["glutes"],"secondary":["abs"],"stabilizer":["obliques"],"view":"back"},
  "Barbell Curl":{"primary":["biceps"],"secondary":[],"stabilizer":[],"view":"front"},
  "Dumbbell Curl":{"primary":["biceps"],"secondary":[],"stabilizer":[],"view":"front"},
  "Hammer Curl":{"primary":["biceps"],"secondary":[],"stabilizer":[],"view":"front"},
  "Incline Curl":{"primary":["biceps"],"secondary":[],"stabilizer":[],"view":"front"},
  "Preacher Curl":{"primary":["biceps"],"secondary":[],"stabilizer":[],"view":"front"},
  "Cable Curl":{"primary":["biceps"],"secondary":[],"stabilizer":[],"view":"front"},
  "Bayesian Curl":{"primary":["biceps"],"secondary":[],"stabilizer":[],"view":"front"},
  "Concentration Curl":{"primary":["biceps"],"secondary":[],"stabilizer":[],"view":"front"},
  "Single-Arm Cable Curl":{"primary":["biceps"],"secondary":[],"stabilizer":[],"view":"front"},
  "Cable Pushdown":{"primary":["triceps"],"secondary":[],"stabilizer":[],"view":"back"},
  "Single-Arm Pushdown":{"primary":["triceps"],"secondary":[],"stabilizer":[],"view":"back"},
  "Overhead Cable Extension":{"primary":["triceps"],"secondary":[],"stabilizer":[],"view":"back"},
  "Single-Arm Overhead Extension":{"primary":["triceps"],"secondary":[],"stabilizer":[],"view":"back"},
  "Skullcrusher":{"primary":["triceps"],"secondary":[],"stabilizer":[],"view":"back"},
  "Close-Grip Bench Press":{"primary":["triceps"],"secondary":["chest","anterior_deltoid"],"stabilizer":[],"view":"front"},
  "Machine Dip":{"primary":["triceps"],"secondary":["anterior_deltoid"],"stabilizer":["chest"],"view":"back"},
  "Dip":{"primary":["triceps"],"secondary":["anterior_deltoid"],"stabilizer":["chest"],"view":"back"},
  "PJR Pullover":{"primary":["triceps"],"secondary":["lats"],"stabilizer":[],"view":"back"},
  "Dumbbell Lateral Raise":{"primary":["anterior_deltoid"],"secondary":["traps"],"stabilizer":["abs"],"view":"front"},
  "Cable Lateral Raise":{"primary":["anterior_deltoid"],"secondary":["traps"],"stabilizer":["abs"],"view":"front"},
  "Machine Lateral Raise":{"primary":["anterior_deltoid"],"secondary":[],"stabilizer":["abs"],"view":"front"},
  "Rear Delt Fly":{"primary":["rear_delts"],"secondary":["lats","traps"],"stabilizer":[],"view":"back"},
  "Reverse Pec Deck":{"primary":["rear_delts"],"secondary":["lats","traps"],"stabilizer":[],"view":"back"},
  "Face Pull":{"primary":["rear_delts"],"secondary":["traps"],"stabilizer":[],"view":"back"},
  "Incline Rear Delt Raise":{"primary":["rear_delts"],"secondary":["lats","traps"],"stabilizer":[],"view":"back"},
  "Y-Raise":{"primary":["rear_delts"],"secondary":["traps"],"stabilizer":[],"view":"back"},
  "McGill Curl-Up":{"primary":["abs"],"secondary":[],"stabilizer":["obliques"],"view":"front"},
  "Bird Dog":{"primary":["erectors","glutes"],"secondary":["abs"],"stabilizer":[],"view":"back"},
  "Dead Bug":{"primary":["abs"],"secondary":["hip_flexors"],"stabilizer":["obliques"],"view":"front"},
  "Plank":{"primary":["abs"],"secondary":["anterior_deltoid"],"stabilizer":["obliques"],"view":"front"},
  "Side Plank":{"primary":["obliques"],"secondary":["abs"],"stabilizer":[],"view":"front"},
  "Pallof Press":{"primary":["abs","obliques"],"secondary":[],"stabilizer":[],"view":"front"},
  "Suitcase Carry":{"primary":["obliques"],"secondary":["abs","glutes"],"stabilizer":[],"view":"front"},
  "Farmer Carry":{"primary":["traps"],"secondary":["abs","obliques"],"stabilizer":[],"view":"front"},
  "Ab Wheel Rollout":{"primary":["abs"],"secondary":["lats"],"stabilizer":["obliques"],"view":"front"},
  "Hollow Body Hold":{"primary":["abs"],"secondary":["hip_flexors"],"stabilizer":["obliques"],"view":"front"},
  "Cable Chop":{"primary":["abs","obliques"],"secondary":[],"stabilizer":[],"view":"front"},
  "Cable Lift":{"primary":["abs","obliques"],"secondary":["anterior_deltoid"],"stabilizer":[],"view":"front"},
  "Box Jump":{"primary":["quads","glutes"],"secondary":["calves","hamstrings"],"stabilizer":["abs"],"view":"back"},
  "Broad Jump":{"primary":["quads","glutes"],"secondary":["calves","hamstrings"],"stabilizer":["abs"],"view":"back"},
  "Med-Ball Slam":{"primary":["abs","anterior_deltoid"],"secondary":["lats","triceps"],"stabilizer":[],"view":"front"},
  "Sprint":{"primary":["glutes","quads"],"secondary":["hamstrings","calves","tibialis"],"stabilizer":["abs"],"view":"back"},
  "Sled Push":{"primary":["quads","glutes"],"secondary":["calves","abs"],"stabilizer":[],"view":"front"},
  "Sled Drag":{"primary":["quads","glutes"],"secondary":["calves","tibialis"],"stabilizer":["abs"],"view":"front"},
  "Bounds":{"primary":["quads","glutes"],"secondary":["calves","hamstrings"],"stabilizer":["abs"],"view":"back"},
  "A-Skip":{"primary":["glutes","quads"],"secondary":["hamstrings","calves","tibialis"],"stabilizer":["abs"],"view":"back"},
  "High Knees":{"primary":["glutes","quads"],"secondary":["hamstrings","calves","tibialis"],"stabilizer":["abs"],"view":"back"},
  "Lateral Shuffle":{"primary":["glutes"],"secondary":["quads","calves"],"stabilizer":["abs"],"view":"back"},
};

const SUBSTITUTION_MATRIX={
  "Back Squat":{busy:"Front Squat",unavailable:"Goblet Squat",fatigued:"Hack Squat",discomfort:"Safety Bar Squat",injury:"Step-Up",complex:"Safety Bar Squat",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Front Squat":{busy:"Safety Bar Squat",unavailable:"Goblet Squat",fatigued:"Hack Squat",discomfort:"Safety Bar Squat",injury:"Back Squat",complex:"Safety Bar Squat",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Safety Bar Squat":{busy:"Hack Squat",unavailable:"Goblet Squat",fatigued:"Hack Squat",discomfort:"Leg Press",injury:"Single-Leg Press",complex:"Leg Press",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Hack Squat":{busy:"Leg Press",unavailable:"Goblet Squat",fatigued:"Goblet Squat",discomfort:"Leg Press",injury:"Safety Bar Squat",complex:"Leg Press",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Leg Press":{busy:"Smith Squat",unavailable:"Goblet Squat",fatigued:"Goblet Squat",discomfort:"Smith Squat",injury:"Goblet Squat",complex:"Smith Squat",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Smith Squat":{busy:"Goblet Squat",unavailable:"Goblet Squat",fatigued:"Goblet Squat",discomfort:"Goblet Squat",injury:"Leg Press",complex:"Goblet Squat",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Goblet Squat":{busy:"Box Squat",unavailable:"Goblet Squat",fatigued:"Box Squat",discomfort:"Box Squat",injury:"Smith Squat",complex:"Box Squat",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Box Squat":{busy:"Cyclist Squat",unavailable:"Goblet Squat",fatigued:"Goblet Squat",discomfort:"Leg Press",injury:"Hack Squat",complex:"Leg Press",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Cyclist Squat":{busy:"Heel-Elevated Squat",unavailable:"Goblet Squat",fatigued:"Goblet Squat",discomfort:"Leg Press",injury:"Box Squat",complex:"Leg Press",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Heel-Elevated Squat":{busy:"Bulgarian Split Squat",unavailable:"Goblet Squat",fatigued:"Goblet Squat",discomfort:"Leg Press",injury:"Cyclist Squat",complex:"Leg Press",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Bulgarian Split Squat":{busy:"Reverse Lunge",unavailable:"Goblet Squat",fatigued:"Goblet Squat",discomfort:"Leg Press",injury:"Heel-Elevated Squat",complex:"Leg Press",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Reverse Lunge":{busy:"Walking Lunge",unavailable:"Goblet Squat",fatigued:"Goblet Squat",discomfort:"Leg Press",injury:"Bulgarian Split Squat",complex:"Leg Press",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Walking Lunge":{busy:"Step-Up",unavailable:"Goblet Squat",fatigued:"Hack Squat",discomfort:"Leg Press",injury:"Reverse Lunge",complex:"Leg Press",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Step-Up":{busy:"Single-Leg Press",unavailable:"Goblet Squat",fatigued:"Goblet Squat",discomfort:"Leg Press",injury:"Walking Lunge",complex:"Leg Press",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Single-Leg Press":{busy:"Back Squat",unavailable:"Goblet Squat",fatigued:"Goblet Squat",discomfort:"Back Squat",injury:"Goblet Squat",complex:"Back Squat",dumbbell:"Goblet Squat",home:"Goblet Squat"},
  "Conventional Deadlift":{busy:"Trap Bar Deadlift",unavailable:"Kettlebell Deadlift",fatigued:"Romanian Deadlift",discomfort:"Trap Bar Deadlift",injury:"Kettlebell Swing",complex:"Trap Bar Deadlift",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Trap Bar Deadlift":{busy:"Romanian Deadlift",unavailable:"Kettlebell Deadlift",fatigued:"Romanian Deadlift",discomfort:"Kettlebell Deadlift",injury:"Reverse Hyper",complex:"Kettlebell Deadlift",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Romanian Deadlift":{busy:"Stiff-Leg Deadlift",unavailable:"Kettlebell Deadlift",fatigued:"Kettlebell Deadlift",discomfort:"Kettlebell Deadlift",injury:"Trap Bar Deadlift",complex:"Kettlebell Deadlift",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Stiff-Leg Deadlift":{busy:"Good Morning",unavailable:"Kettlebell Deadlift",fatigued:"Romanian Deadlift",discomfort:"Trap Bar Deadlift",injury:"Conventional Deadlift",complex:"Trap Bar Deadlift",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Good Morning":{busy:"Rack Pull",unavailable:"Kettlebell Deadlift",fatigued:"Kettlebell Deadlift",discomfort:"Trap Bar Deadlift",injury:"Stiff-Leg Deadlift",complex:"Trap Bar Deadlift",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Rack Pull":{busy:"Deficit Deadlift",unavailable:"Kettlebell Deadlift",fatigued:"Romanian Deadlift",discomfort:"Kettlebell Deadlift",injury:"Romanian Deadlift",complex:"Kettlebell Deadlift",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Deficit Deadlift":{busy:"Kettlebell Deadlift",unavailable:"Kettlebell Deadlift",fatigued:"Romanian Deadlift",discomfort:"Trap Bar Deadlift",injury:"Good Morning",complex:"Trap Bar Deadlift",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Kettlebell Deadlift":{busy:"Dumbbell RDL",unavailable:"Kettlebell Deadlift",fatigued:"Dumbbell RDL",discomfort:"Dumbbell RDL",injury:"Kettlebell Deadlift",complex:"Dumbbell RDL",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Dumbbell RDL":{busy:"Single-Leg RDL",unavailable:"Kettlebell Deadlift",fatigued:"Kettlebell Deadlift",discomfort:"Single-Leg RDL",injury:"Kettlebell Deadlift",complex:"Single-Leg RDL",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Single-Leg RDL":{busy:"Cable Pull-Through",unavailable:"Kettlebell Deadlift",fatigued:"Kettlebell Deadlift",discomfort:"Kettlebell Deadlift",injury:"Rack Pull",complex:"Kettlebell Deadlift",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Cable Pull-Through":{busy:"45-Degree Back Extension",unavailable:"Kettlebell Deadlift",fatigued:"45-Degree Back Extension",discomfort:"45-Degree Back Extension",injury:"Dumbbell RDL",complex:"45-Degree Back Extension",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "45-Degree Back Extension":{busy:"Reverse Hyper",unavailable:"Kettlebell Deadlift",fatigued:"Kettlebell Deadlift",discomfort:"Reverse Hyper",injury:"Cable Pull-Through",complex:"Reverse Hyper",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Reverse Hyper":{busy:"Kettlebell Swing",unavailable:"Kettlebell Deadlift",fatigued:"Kettlebell Swing",discomfort:"Kettlebell Swing",injury:"45-Degree Back Extension",complex:"Kettlebell Swing",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Kettlebell Swing":{busy:"Conventional Deadlift",unavailable:"Kettlebell Deadlift",fatigued:"Kettlebell Deadlift",discomfort:"Kettlebell Deadlift",injury:"Single-Leg RDL",complex:"Kettlebell Deadlift",dumbbell:"Romanian Deadlift",home:"Kettlebell Deadlift"},
  "Bench Press":{busy:"Paused Bench Press",unavailable:"Push-Up",fatigued:"Incline Bench Press",discomfort:"Machine Chest Press",injury:"Deficit Push-Up",complex:"Machine Chest Press",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Paused Bench Press":{busy:"Incline Bench Press",unavailable:"Push-Up",fatigued:"Incline Bench Press",discomfort:"Machine Chest Press",injury:"Bench Press",complex:"Machine Chest Press",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Incline Bench Press":{busy:"Dumbbell Bench Press",unavailable:"Push-Up",fatigued:"Dumbbell Bench Press",discomfort:"Machine Chest Press",injury:"Paused Bench Press",complex:"Machine Chest Press",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Dumbbell Bench Press":{busy:"Incline Dumbbell Press",unavailable:"Push-Up",fatigued:"Incline Dumbbell Press",discomfort:"Machine Chest Press",injury:"Incline Bench Press",complex:"Machine Chest Press",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Incline Dumbbell Press":{busy:"Machine Chest Press",unavailable:"Push-Up",fatigued:"Machine Chest Press",discomfort:"Machine Chest Press",injury:"Dumbbell Bench Press",complex:"Machine Chest Press",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Machine Chest Press":{busy:"Smith Incline Press",unavailable:"Push-Up",fatigued:"Smith Incline Press",discomfort:"Smith Incline Press",injury:"Push-Up",complex:"Smith Incline Press",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Smith Incline Press":{busy:"Floor Press",unavailable:"Push-Up",fatigued:"Floor Press",discomfort:"Floor Press",injury:"Machine Chest Press",complex:"Floor Press",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Floor Press":{busy:"Weighted Push-Up",unavailable:"Push-Up",fatigued:"Weighted Push-Up",discomfort:"Machine Chest Press",injury:"Incline Dumbbell Press",complex:"Machine Chest Press",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Weighted Push-Up":{busy:"Deficit Push-Up",unavailable:"Push-Up",fatigued:"Deficit Push-Up",discomfort:"Deficit Push-Up",injury:"Smith Incline Press",complex:"Deficit Push-Up",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Deficit Push-Up":{busy:"Single-Arm Dumbbell Press",unavailable:"Push-Up",fatigued:"Single-Arm Dumbbell Press",discomfort:"Single-Arm Dumbbell Press",injury:"Weighted Push-Up",complex:"Single-Arm Dumbbell Press",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Single-Arm Dumbbell Press":{busy:"Bench Press",unavailable:"Push-Up",fatigued:"Bench Press",discomfort:"Machine Chest Press",injury:"Floor Press",complex:"Machine Chest Press",dumbbell:"Dumbbell Bench Press",home:"Push-Up"},
  "Overhead Press":{busy:"Push Press",unavailable:"Pike Push-Up",fatigued:"Seated Dumbbell Press",discomfort:"Seated Dumbbell Press",injury:"Single-Arm Landmine Press",complex:"Seated Dumbbell Press",dumbbell:"Seated Dumbbell Press",home:"Pike Push-Up"},
  "Push Press":{busy:"Seated Dumbbell Press",unavailable:"Pike Push-Up",fatigued:"Seated Dumbbell Press",discomfort:"Overhead Press",injury:"Single-Arm Dumbbell Press",complex:"Overhead Press",dumbbell:"Seated Dumbbell Press",home:"Pike Push-Up"},
  "Seated Dumbbell Press":{busy:"Arnold Press",unavailable:"Pike Push-Up",fatigued:"Landmine Press",discomfort:"Arnold Press",injury:"Pike Push-Up",complex:"Arnold Press",dumbbell:"Seated Dumbbell Press",home:"Pike Push-Up"},
  "Arnold Press":{busy:"Machine Shoulder Press",unavailable:"Pike Push-Up",fatigued:"Landmine Press",discomfort:"Seated Dumbbell Press",injury:"Overhead Press",complex:"Seated Dumbbell Press",dumbbell:"Seated Dumbbell Press",home:"Pike Push-Up"},
  "Machine Shoulder Press":{busy:"Landmine Press",unavailable:"Pike Push-Up",fatigued:"Landmine Press",discomfort:"Landmine Press",injury:"Seated Dumbbell Press",complex:"Landmine Press",dumbbell:"Seated Dumbbell Press",home:"Pike Push-Up"},
  "Landmine Press":{busy:"Single-Arm Landmine Press",unavailable:"Pike Push-Up",fatigued:"Single-Arm Landmine Press",discomfort:"Single-Arm Landmine Press",injury:"Machine Shoulder Press",complex:"Single-Arm Landmine Press",dumbbell:"Seated Dumbbell Press",home:"Pike Push-Up"},
  "Single-Arm Landmine Press":{busy:"Single-Arm Dumbbell Press",unavailable:"Pike Push-Up",fatigued:"Single-Arm Dumbbell Press",discomfort:"Single-Arm Dumbbell Press",injury:"Landmine Press",complex:"Single-Arm Dumbbell Press",dumbbell:"Seated Dumbbell Press",home:"Pike Push-Up"},
  "Single-Arm Dumbbell Press":{busy:"Overhead Press",unavailable:"Pike Push-Up",fatigued:"Landmine Press",discomfort:"Seated Dumbbell Press",injury:"Arnold Press",complex:"Seated Dumbbell Press",dumbbell:"Seated Dumbbell Press",home:"Pike Push-Up"},
  "Barbell Row":{busy:"Pendlay Row",unavailable:"Band Row",fatigued:"Single-Arm Cable Row",discomfort:"Chest-Supported Row",injury:"Band Row",complex:"Chest-Supported Row",dumbbell:"Chest-Supported Row",home:"Band Row"},
  "Pendlay Row":{busy:"Chest-Supported Row",unavailable:"Band Row",fatigued:"Barbell Row",discomfort:"Barbell Row",injury:"T-Bar Row",complex:"Barbell Row",dumbbell:"Chest-Supported Row",home:"Band Row"},
  "Chest-Supported Row":{busy:"Seated Cable Row",unavailable:"Band Row",fatigued:"Single-Arm Cable Row",discomfort:"Seated Cable Row",injury:"Band Row",complex:"Seated Cable Row",dumbbell:"Chest-Supported Row",home:"Band Row"},
  "Seated Cable Row":{busy:"Machine Row",unavailable:"Band Row",fatigued:"Single-Arm Cable Row",discomfort:"Machine Row",injury:"Chest-Supported Row",complex:"Machine Row",dumbbell:"Chest-Supported Row",home:"Band Row"},
  "Machine Row":{busy:"T-Bar Row",unavailable:"Band Row",fatigued:"Single-Arm Cable Row",discomfort:"T-Bar Row",injury:"Seated Cable Row",complex:"T-Bar Row",dumbbell:"Chest-Supported Row",home:"Band Row"},
  "T-Bar Row":{busy:"Dumbbell Row",unavailable:"Band Row",fatigued:"Barbell Row",discomfort:"Chest-Supported Row",injury:"Barbell Row",complex:"Chest-Supported Row",dumbbell:"Chest-Supported Row",home:"Band Row"},
  "Dumbbell Row":{busy:"Single-Arm Cable Row",unavailable:"Band Row",fatigued:"Single-Arm Cable Row",discomfort:"Single-Arm Cable Row",injury:"Machine Row",complex:"Single-Arm Cable Row",dumbbell:"Chest-Supported Row",home:"Band Row"},
  "Single-Arm Cable Row":{busy:"Inverted Row",unavailable:"Band Row",fatigued:"Inverted Row",discomfort:"Inverted Row",injury:"Dumbbell Row",complex:"Inverted Row",dumbbell:"Chest-Supported Row",home:"Band Row"},
  "Inverted Row":{busy:"Band Row",unavailable:"Band Row",fatigued:"Band Row",discomfort:"Band Row",injury:"Single-Arm Cable Row",complex:"Band Row",dumbbell:"Chest-Supported Row",home:"Band Row"},
  "Band Row":{busy:"Barbell Row",unavailable:"Band Row",fatigued:"Barbell Row",discomfort:"Barbell Row",injury:"Inverted Row",complex:"Barbell Row",dumbbell:"Chest-Supported Row",home:"Band Row"},
  "Pull-Up":{busy:"Weighted Pull-Up",unavailable:"Band Pulldown",fatigued:"Assisted Pull-Up",discomfort:"Assisted Pull-Up",injury:"Assisted Pull-Up",complex:"Assisted Pull-Up",dumbbell:"Band Pulldown",home:"Band Pulldown"},
  "Weighted Pull-Up":{busy:"Chin-Up",unavailable:"Band Pulldown",fatigued:"Assisted Pull-Up",discomfort:"Assisted Pull-Up",injury:"Pull-Up",complex:"Assisted Pull-Up",dumbbell:"Band Pulldown",home:"Band Pulldown"},
  "Chin-Up":{busy:"Assisted Pull-Up",unavailable:"Band Pulldown",fatigued:"Assisted Pull-Up",discomfort:"Assisted Pull-Up",injury:"Weighted Pull-Up",complex:"Assisted Pull-Up",dumbbell:"Band Pulldown",home:"Band Pulldown"},
  "Assisted Pull-Up":{busy:"Lat Pulldown",unavailable:"Band Pulldown",fatigued:"Single-Arm Pulldown",discomfort:"Lat Pulldown",injury:"Band Pulldown",complex:"Lat Pulldown",dumbbell:"Band Pulldown",home:"Band Pulldown"},
  "Lat Pulldown":{busy:"Neutral-Grip Pulldown",unavailable:"Band Pulldown",fatigued:"Single-Arm Pulldown",discomfort:"Neutral-Grip Pulldown",injury:"Band Pulldown",complex:"Neutral-Grip Pulldown",dumbbell:"Band Pulldown",home:"Band Pulldown"},
  "Neutral-Grip Pulldown":{busy:"Single-Arm Pulldown",unavailable:"Band Pulldown",fatigued:"Single-Arm Pulldown",discomfort:"Single-Arm Pulldown",injury:"Lat Pulldown",complex:"Single-Arm Pulldown",dumbbell:"Band Pulldown",home:"Band Pulldown"},
  "Single-Arm Pulldown":{busy:"Machine Pulldown",unavailable:"Band Pulldown",fatigued:"Machine Pulldown",discomfort:"Machine Pulldown",injury:"Neutral-Grip Pulldown",complex:"Machine Pulldown",dumbbell:"Band Pulldown",home:"Band Pulldown"},
  "Machine Pulldown":{busy:"Band Pulldown",unavailable:"Band Pulldown",fatigued:"Single-Arm Pulldown",discomfort:"Band Pulldown",injury:"Single-Arm Pulldown",complex:"Band Pulldown",dumbbell:"Band Pulldown",home:"Band Pulldown"},
  "Band Pulldown":{busy:"Pull-Up",unavailable:"Band Pulldown",fatigued:"Pull-Up",discomfort:"Pull-Up",injury:"Machine Pulldown",complex:"Pull-Up",dumbbell:"Band Pulldown",home:"Band Pulldown"},
  "Barbell Hip Thrust":{busy:"Smith Hip Thrust",unavailable:"Glute Bridge",fatigued:"Glute Bridge",discomfort:"Smith Hip Thrust",injury:"Glute Bridge",complex:"Smith Hip Thrust",dumbbell:"Single-Leg Hip Thrust",home:"Glute Bridge"},
  "Smith Hip Thrust":{busy:"Machine Hip Thrust",unavailable:"Glute Bridge",fatigued:"Glute Bridge",discomfort:"Machine Hip Thrust",injury:"Barbell Hip Thrust",complex:"Machine Hip Thrust",dumbbell:"Single-Leg Hip Thrust",home:"Glute Bridge"},
  "Machine Hip Thrust":{busy:"Glute Bridge",unavailable:"Glute Bridge",fatigued:"Glute Bridge",discomfort:"Glute Bridge",injury:"Smith Hip Thrust",complex:"Glute Bridge",dumbbell:"Single-Leg Hip Thrust",home:"Glute Bridge"},
  "Glute Bridge":{busy:"Single-Leg Hip Thrust",unavailable:"Glute Bridge",fatigued:"Single-Leg Hip Thrust",discomfort:"Single-Leg Hip Thrust",injury:"Machine Hip Thrust",complex:"Single-Leg Hip Thrust",dumbbell:"Single-Leg Hip Thrust",home:"Glute Bridge"},
  "Single-Leg Hip Thrust":{busy:"Frog Pump",unavailable:"Glute Bridge",fatigued:"Glute Bridge",discomfort:"Barbell Hip Thrust",injury:"45-Degree Hip Extension",complex:"Barbell Hip Thrust",dumbbell:"Single-Leg Hip Thrust",home:"Glute Bridge"},
  "Frog Pump":{busy:"Cable Kickback",unavailable:"Glute Bridge",fatigued:"Cable Kickback",discomfort:"Cable Kickback",injury:"Glute Bridge",complex:"Cable Kickback",dumbbell:"Single-Leg Hip Thrust",home:"Glute Bridge"},
  "Cable Kickback":{busy:"45-Degree Hip Extension",unavailable:"Glute Bridge",fatigued:"45-Degree Hip Extension",discomfort:"45-Degree Hip Extension",injury:"Frog Pump",complex:"45-Degree Hip Extension",dumbbell:"Single-Leg Hip Thrust",home:"Glute Bridge"},
  "45-Degree Hip Extension":{busy:"Barbell Hip Thrust",unavailable:"Glute Bridge",fatigued:"Glute Bridge",discomfort:"Barbell Hip Thrust",injury:"Cable Kickback",complex:"Barbell Hip Thrust",dumbbell:"Single-Leg Hip Thrust",home:"Glute Bridge"},
  "Seated Leg Curl":{busy:"Lying Leg Curl",unavailable:"Sliding Leg Curl",fatigued:"Lying Leg Curl",discomfort:"Lying Leg Curl",injury:"Sliding Leg Curl",complex:"Lying Leg Curl",dumbbell:"Sliding Leg Curl",home:"Sliding Leg Curl"},
  "Lying Leg Curl":{busy:"Single-Leg Leg Curl",unavailable:"Sliding Leg Curl",fatigued:"Single-Leg Leg Curl",discomfort:"Single-Leg Leg Curl",injury:"Seated Leg Curl",complex:"Single-Leg Leg Curl",dumbbell:"Sliding Leg Curl",home:"Sliding Leg Curl"},
  "Single-Leg Leg Curl":{busy:"Nordic Curl",unavailable:"Sliding Leg Curl",fatigued:"Nordic Curl",discomfort:"Nordic Curl",injury:"Lying Leg Curl",complex:"Nordic Curl",dumbbell:"Sliding Leg Curl",home:"Sliding Leg Curl"},
  "Nordic Curl":{busy:"Sliding Leg Curl",unavailable:"Sliding Leg Curl",fatigued:"Seated Leg Curl",discomfort:"Seated Leg Curl",injury:"Sliding Leg Curl",complex:"Seated Leg Curl",dumbbell:"Sliding Leg Curl",home:"Sliding Leg Curl"},
  "Sliding Leg Curl":{busy:"Band Leg Curl",unavailable:"Sliding Leg Curl",fatigued:"Seated Leg Curl",discomfort:"Seated Leg Curl",injury:"Band Leg Curl",complex:"Seated Leg Curl",dumbbell:"Sliding Leg Curl",home:"Sliding Leg Curl"},
  "Band Leg Curl":{busy:"Seated Leg Curl",unavailable:"Sliding Leg Curl",fatigued:"Seated Leg Curl",discomfort:"Seated Leg Curl",injury:"Single-Leg Leg Curl",complex:"Seated Leg Curl",dumbbell:"Sliding Leg Curl",home:"Sliding Leg Curl"},
  "Leg Extension":{busy:"Single-Leg Extension",unavailable:"Reverse Nordic",fatigued:"Single-Leg Extension",discomfort:"Single-Leg Extension",injury:"Reverse Nordic",complex:"Single-Leg Extension",dumbbell:"Reverse Nordic",home:"Reverse Nordic"},
  "Single-Leg Extension":{busy:"Reverse Nordic",unavailable:"Reverse Nordic",fatigued:"Reverse Nordic",discomfort:"Reverse Nordic",injury:"Leg Extension",complex:"Reverse Nordic",dumbbell:"Reverse Nordic",home:"Reverse Nordic"},
  "Reverse Nordic":{busy:"Spanish Squat",unavailable:"Reverse Nordic",fatigued:"Leg Extension",discomfort:"Leg Extension",injury:"Terminal Knee Extension",complex:"Leg Extension",dumbbell:"Reverse Nordic",home:"Reverse Nordic"},
  "Spanish Squat":{busy:"Terminal Knee Extension",unavailable:"Reverse Nordic",fatigued:"Terminal Knee Extension",discomfort:"Terminal Knee Extension",injury:"Single-Leg Extension",complex:"Terminal Knee Extension",dumbbell:"Reverse Nordic",home:"Reverse Nordic"},
  "Terminal Knee Extension":{busy:"Leg Extension",unavailable:"Reverse Nordic",fatigued:"Leg Extension",discomfort:"Leg Extension",injury:"Spanish Squat",complex:"Leg Extension",dumbbell:"Reverse Nordic",home:"Reverse Nordic"},
  "Standing Calf Raise":{busy:"Seated Calf Raise",unavailable:"Single-Leg Calf Raise",fatigued:"Seated Calf Raise",discomfort:"Seated Calf Raise",injury:"Single-Leg Calf Raise",complex:"Seated Calf Raise",dumbbell:"Single-Leg Calf Raise",home:"Single-Leg Calf Raise"},
  "Seated Calf Raise":{busy:"Single-Leg Calf Raise",unavailable:"Single-Leg Calf Raise",fatigued:"Single-Leg Calf Raise",discomfort:"Single-Leg Calf Raise",injury:"Standing Calf Raise",complex:"Single-Leg Calf Raise",dumbbell:"Single-Leg Calf Raise",home:"Single-Leg Calf Raise"},
  "Single-Leg Calf Raise":{busy:"Tibialis Raise",unavailable:"Single-Leg Calf Raise",fatigued:"Tibialis Raise",discomfort:"Tibialis Raise",injury:"Seated Calf Raise",complex:"Tibialis Raise",dumbbell:"Single-Leg Calf Raise",home:"Single-Leg Calf Raise"},
  "Tibialis Raise":{busy:"Backward Sled Drag",unavailable:"Single-Leg Calf Raise",fatigued:"Backward Sled Drag",discomfort:"Backward Sled Drag",injury:"Single-Leg Calf Raise",complex:"Backward Sled Drag",dumbbell:"Single-Leg Calf Raise",home:"Single-Leg Calf Raise"},
  "Backward Sled Drag":{busy:"Donkey Calf Raise",unavailable:"Single-Leg Calf Raise",fatigued:"Standing Calf Raise",discomfort:"Donkey Calf Raise",injury:"Tibialis Raise",complex:"Donkey Calf Raise",dumbbell:"Single-Leg Calf Raise",home:"Single-Leg Calf Raise"},
  "Donkey Calf Raise":{busy:"Standing Calf Raise",unavailable:"Single-Leg Calf Raise",fatigued:"Standing Calf Raise",discomfort:"Standing Calf Raise",injury:"Backward Sled Drag",complex:"Standing Calf Raise",dumbbell:"Single-Leg Calf Raise",home:"Single-Leg Calf Raise"},
  "Lateral Band Walk":{busy:"Cable Hip Abduction",unavailable:"Side-Lying Abduction",fatigued:"Cable Hip Abduction",discomfort:"Cable Hip Abduction",injury:"Side-Lying Abduction",complex:"Cable Hip Abduction",dumbbell:"Lateral Step-Down",home:"Side-Lying Abduction"},
  "Cable Hip Abduction":{busy:"Machine Hip Abduction",unavailable:"Side-Lying Abduction",fatigued:"Machine Hip Abduction",discomfort:"Machine Hip Abduction",injury:"Lateral Band Walk",complex:"Machine Hip Abduction",dumbbell:"Lateral Step-Down",home:"Side-Lying Abduction"},
  "Machine Hip Abduction":{busy:"Side-Lying Abduction",unavailable:"Side-Lying Abduction",fatigued:"Side-Lying Abduction",discomfort:"Side-Lying Abduction",injury:"Cable Hip Abduction",complex:"Side-Lying Abduction",dumbbell:"Lateral Step-Down",home:"Side-Lying Abduction"},
  "Side-Lying Abduction":{busy:"Copenhagen Plank",unavailable:"Side-Lying Abduction",fatigued:"Copenhagen Plank",discomfort:"Copenhagen Plank",injury:"Machine Hip Abduction",complex:"Copenhagen Plank",dumbbell:"Lateral Step-Down",home:"Side-Lying Abduction"},
  "Copenhagen Plank":{busy:"Lateral Step-Down",unavailable:"Side-Lying Abduction",fatigued:"Lateral Band Walk",discomfort:"Lateral Band Walk",injury:"Side-Lying Abduction",complex:"Lateral Band Walk",dumbbell:"Lateral Step-Down",home:"Side-Lying Abduction"},
  "Lateral Step-Down":{busy:"Skater Squat",unavailable:"Side-Lying Abduction",fatigued:"Lateral Band Walk",discomfort:"Lateral Band Walk",injury:"Copenhagen Plank",complex:"Lateral Band Walk",dumbbell:"Lateral Step-Down",home:"Side-Lying Abduction"},
  "Skater Squat":{busy:"Lateral Band Walk",unavailable:"Side-Lying Abduction",fatigued:"Lateral Band Walk",discomfort:"Lateral Band Walk",injury:"Lateral Step-Down",complex:"Lateral Band Walk",dumbbell:"Lateral Step-Down",home:"Side-Lying Abduction"},
  "Barbell Curl":{busy:"Dumbbell Curl",unavailable:"Dumbbell Curl",fatigued:"Dumbbell Curl",discomfort:"Dumbbell Curl",injury:"Dumbbell Curl",complex:"Dumbbell Curl",dumbbell:"Dumbbell Curl",home:"Dumbbell Curl"},
  "Dumbbell Curl":{busy:"Hammer Curl",unavailable:"Dumbbell Curl",fatigued:"Hammer Curl",discomfort:"Hammer Curl",injury:"Barbell Curl",complex:"Hammer Curl",dumbbell:"Dumbbell Curl",home:"Dumbbell Curl"},
  "Hammer Curl":{busy:"Incline Curl",unavailable:"Dumbbell Curl",fatigued:"Incline Curl",discomfort:"Incline Curl",injury:"Dumbbell Curl",complex:"Incline Curl",dumbbell:"Dumbbell Curl",home:"Dumbbell Curl"},
  "Incline Curl":{busy:"Preacher Curl",unavailable:"Dumbbell Curl",fatigued:"Preacher Curl",discomfort:"Preacher Curl",injury:"Hammer Curl",complex:"Preacher Curl",dumbbell:"Dumbbell Curl",home:"Dumbbell Curl"},
  "Preacher Curl":{busy:"Cable Curl",unavailable:"Dumbbell Curl",fatigued:"Cable Curl",discomfort:"Cable Curl",injury:"Incline Curl",complex:"Cable Curl",dumbbell:"Dumbbell Curl",home:"Dumbbell Curl"},
  "Cable Curl":{busy:"Bayesian Curl",unavailable:"Dumbbell Curl",fatigued:"Bayesian Curl",discomfort:"Bayesian Curl",injury:"Preacher Curl",complex:"Bayesian Curl",dumbbell:"Dumbbell Curl",home:"Dumbbell Curl"},
  "Bayesian Curl":{busy:"Concentration Curl",unavailable:"Dumbbell Curl",fatigued:"Concentration Curl",discomfort:"Concentration Curl",injury:"Cable Curl",complex:"Concentration Curl",dumbbell:"Dumbbell Curl",home:"Dumbbell Curl"},
  "Concentration Curl":{busy:"Single-Arm Cable Curl",unavailable:"Dumbbell Curl",fatigued:"Single-Arm Cable Curl",discomfort:"Single-Arm Cable Curl",injury:"Bayesian Curl",complex:"Single-Arm Cable Curl",dumbbell:"Dumbbell Curl",home:"Dumbbell Curl"},
  "Single-Arm Cable Curl":{busy:"Barbell Curl",unavailable:"Dumbbell Curl",fatigued:"Barbell Curl",discomfort:"Barbell Curl",injury:"Concentration Curl",complex:"Barbell Curl",dumbbell:"Dumbbell Curl",home:"Dumbbell Curl"},
  "Cable Pushdown":{busy:"Single-Arm Pushdown",unavailable:"Single-Arm Overhead Extension",fatigued:"Single-Arm Pushdown",discomfort:"Single-Arm Pushdown",injury:"Single-Arm Overhead Extension",complex:"Single-Arm Pushdown",dumbbell:"Single-Arm Overhead Extension",home:"Single-Arm Overhead Extension"},
  "Single-Arm Pushdown":{busy:"Overhead Cable Extension",unavailable:"Single-Arm Overhead Extension",fatigued:"Overhead Cable Extension",discomfort:"Overhead Cable Extension",injury:"Cable Pushdown",complex:"Overhead Cable Extension",dumbbell:"Single-Arm Overhead Extension",home:"Single-Arm Overhead Extension"},
  "Overhead Cable Extension":{busy:"Single-Arm Overhead Extension",unavailable:"Single-Arm Overhead Extension",fatigued:"Single-Arm Overhead Extension",discomfort:"Single-Arm Overhead Extension",injury:"Single-Arm Pushdown",complex:"Single-Arm Overhead Extension",dumbbell:"Single-Arm Overhead Extension",home:"Single-Arm Overhead Extension"},
  "Single-Arm Overhead Extension":{busy:"Skullcrusher",unavailable:"Single-Arm Overhead Extension",fatigued:"Skullcrusher",discomfort:"Skullcrusher",injury:"Overhead Cable Extension",complex:"Skullcrusher",dumbbell:"Single-Arm Overhead Extension",home:"Single-Arm Overhead Extension"},
  "Skullcrusher":{busy:"Close-Grip Bench Press",unavailable:"Single-Arm Overhead Extension",fatigued:"Cable Pushdown",discomfort:"Cable Pushdown",injury:"Machine Dip",complex:"Cable Pushdown",dumbbell:"Single-Arm Overhead Extension",home:"Single-Arm Overhead Extension"},
  "Close-Grip Bench Press":{busy:"Machine Dip",unavailable:"Single-Arm Overhead Extension",fatigued:"Cable Pushdown",discomfort:"Cable Pushdown",injury:"Skullcrusher",complex:"Cable Pushdown",dumbbell:"Single-Arm Overhead Extension",home:"Single-Arm Overhead Extension"},
  "Machine Dip":{busy:"Dip",unavailable:"Single-Arm Overhead Extension",fatigued:"Cable Pushdown",discomfort:"Dip",injury:"Single-Arm Overhead Extension",complex:"Dip",dumbbell:"Single-Arm Overhead Extension",home:"Single-Arm Overhead Extension"},
  "Dip":{busy:"PJR Pullover",unavailable:"Single-Arm Overhead Extension",fatigued:"Cable Pushdown",discomfort:"Cable Pushdown",injury:"PJR Pullover",complex:"Cable Pushdown",dumbbell:"Single-Arm Overhead Extension",home:"Single-Arm Overhead Extension"},
  "PJR Pullover":{busy:"Cable Pushdown",unavailable:"Single-Arm Overhead Extension",fatigued:"Cable Pushdown",discomfort:"Cable Pushdown",injury:"Close-Grip Bench Press",complex:"Cable Pushdown",dumbbell:"Single-Arm Overhead Extension",home:"Single-Arm Overhead Extension"},
  "Dumbbell Lateral Raise":{busy:"Cable Lateral Raise",unavailable:"Dumbbell Lateral Raise",fatigued:"Cable Lateral Raise",discomfort:"Cable Lateral Raise",injury:"Dumbbell Lateral Raise",complex:"Cable Lateral Raise",dumbbell:"Dumbbell Lateral Raise",home:"Dumbbell Lateral Raise"},
  "Cable Lateral Raise":{busy:"Machine Lateral Raise",unavailable:"Dumbbell Lateral Raise",fatigued:"Machine Lateral Raise",discomfort:"Machine Lateral Raise",injury:"Dumbbell Lateral Raise",complex:"Machine Lateral Raise",dumbbell:"Dumbbell Lateral Raise",home:"Dumbbell Lateral Raise"},
  "Machine Lateral Raise":{busy:"Rear Delt Fly",unavailable:"Dumbbell Lateral Raise",fatigued:"Rear Delt Fly",discomfort:"Rear Delt Fly",injury:"Cable Lateral Raise",complex:"Rear Delt Fly",dumbbell:"Dumbbell Lateral Raise",home:"Dumbbell Lateral Raise"},
  "Rear Delt Fly":{busy:"Reverse Pec Deck",unavailable:"Dumbbell Lateral Raise",fatigued:"Reverse Pec Deck",discomfort:"Reverse Pec Deck",injury:"Machine Lateral Raise",complex:"Reverse Pec Deck",dumbbell:"Dumbbell Lateral Raise",home:"Dumbbell Lateral Raise"},
  "Reverse Pec Deck":{busy:"Face Pull",unavailable:"Dumbbell Lateral Raise",fatigued:"Face Pull",discomfort:"Face Pull",injury:"Rear Delt Fly",complex:"Face Pull",dumbbell:"Dumbbell Lateral Raise",home:"Dumbbell Lateral Raise"},
  "Face Pull":{busy:"Incline Rear Delt Raise",unavailable:"Dumbbell Lateral Raise",fatigued:"Incline Rear Delt Raise",discomfort:"Incline Rear Delt Raise",injury:"Reverse Pec Deck",complex:"Incline Rear Delt Raise",dumbbell:"Dumbbell Lateral Raise",home:"Dumbbell Lateral Raise"},
  "Incline Rear Delt Raise":{busy:"Y-Raise",unavailable:"Dumbbell Lateral Raise",fatigued:"Y-Raise",discomfort:"Y-Raise",injury:"Face Pull",complex:"Y-Raise",dumbbell:"Dumbbell Lateral Raise",home:"Dumbbell Lateral Raise"},
  "Y-Raise":{busy:"Dumbbell Lateral Raise",unavailable:"Dumbbell Lateral Raise",fatigued:"Dumbbell Lateral Raise",discomfort:"Dumbbell Lateral Raise",injury:"Incline Rear Delt Raise",complex:"Dumbbell Lateral Raise",dumbbell:"Dumbbell Lateral Raise",home:"Dumbbell Lateral Raise"},
  "McGill Curl-Up":{busy:"Bird Dog",unavailable:"Dead Bug",fatigued:"Bird Dog",discomfort:"Bird Dog",injury:"Dead Bug",complex:"Bird Dog",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Bird Dog":{busy:"Dead Bug",unavailable:"Dead Bug",fatigued:"Dead Bug",discomfort:"Dead Bug",injury:"McGill Curl-Up",complex:"Dead Bug",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Dead Bug":{busy:"Plank",unavailable:"Dead Bug",fatigued:"Plank",discomfort:"Plank",injury:"Bird Dog",complex:"Plank",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Plank":{busy:"Side Plank",unavailable:"Dead Bug",fatigued:"Side Plank",discomfort:"Side Plank",injury:"Dead Bug",complex:"Side Plank",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Side Plank":{busy:"Pallof Press",unavailable:"Dead Bug",fatigued:"Pallof Press",discomfort:"Pallof Press",injury:"Plank",complex:"Pallof Press",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Pallof Press":{busy:"Suitcase Carry",unavailable:"Dead Bug",fatigued:"Suitcase Carry",discomfort:"Suitcase Carry",injury:"Side Plank",complex:"Suitcase Carry",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Suitcase Carry":{busy:"Farmer Carry",unavailable:"Dead Bug",fatigued:"McGill Curl-Up",discomfort:"Farmer Carry",injury:"Pallof Press",complex:"Farmer Carry",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Farmer Carry":{busy:"Ab Wheel Rollout",unavailable:"Dead Bug",fatigued:"McGill Curl-Up",discomfort:"Ab Wheel Rollout",injury:"Suitcase Carry",complex:"Ab Wheel Rollout",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Ab Wheel Rollout":{busy:"Hollow Body Hold",unavailable:"Dead Bug",fatigued:"McGill Curl-Up",discomfort:"McGill Curl-Up",injury:"Cable Lift",complex:"McGill Curl-Up",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Hollow Body Hold":{busy:"Cable Chop",unavailable:"Dead Bug",fatigued:"McGill Curl-Up",discomfort:"McGill Curl-Up",injury:"Ab Wheel Rollout",complex:"McGill Curl-Up",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Cable Chop":{busy:"Cable Lift",unavailable:"Dead Bug",fatigued:"Cable Lift",discomfort:"Cable Lift",injury:"Farmer Carry",complex:"Cable Lift",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Cable Lift":{busy:"McGill Curl-Up",unavailable:"Dead Bug",fatigued:"McGill Curl-Up",discomfort:"McGill Curl-Up",injury:"Cable Chop",complex:"McGill Curl-Up",dumbbell:"Suitcase Carry",home:"Dead Bug"},
  "Box Jump":{busy:"Broad Jump",unavailable:"High Knees",fatigued:"Med-Ball Slam",discomfort:"Med-Ball Slam",injury:"Lateral Shuffle",complex:"Med-Ball Slam",dumbbell:"High Knees",home:"High Knees"},
  "Broad Jump":{busy:"Med-Ball Slam",unavailable:"High Knees",fatigued:"Med-Ball Slam",discomfort:"Med-Ball Slam",injury:"Box Jump",complex:"Med-Ball Slam",dumbbell:"High Knees",home:"High Knees"},
  "Med-Ball Slam":{busy:"Sprint",unavailable:"High Knees",fatigued:"Sprint",discomfort:"Sprint",injury:"High Knees",complex:"Sprint",dumbbell:"High Knees",home:"High Knees"},
  "Sprint":{busy:"Sled Push",unavailable:"High Knees",fatigued:"Box Jump",discomfort:"Box Jump",injury:"Broad Jump",complex:"Box Jump",dumbbell:"High Knees",home:"High Knees"},
  "Sled Push":{busy:"Sled Drag",unavailable:"High Knees",fatigued:"Box Jump",discomfort:"Sled Drag",injury:"Med-Ball Slam",complex:"Sled Drag",dumbbell:"High Knees",home:"High Knees"},
  "Sled Drag":{busy:"Bounds",unavailable:"High Knees",fatigued:"Med-Ball Slam",discomfort:"Bounds",injury:"Sled Push",complex:"Bounds",dumbbell:"High Knees",home:"High Knees"},
  "Bounds":{busy:"A-Skip",unavailable:"High Knees",fatigued:"Med-Ball Slam",discomfort:"Box Jump",injury:"Sprint",complex:"Box Jump",dumbbell:"High Knees",home:"High Knees"},
  "A-Skip":{busy:"High Knees",unavailable:"High Knees",fatigued:"High Knees",discomfort:"High Knees",injury:"Sled Drag",complex:"High Knees",dumbbell:"High Knees",home:"High Knees"},
  "High Knees":{busy:"Lateral Shuffle",unavailable:"High Knees",fatigued:"Med-Ball Slam",discomfort:"Lateral Shuffle",injury:"A-Skip",complex:"Lateral Shuffle",dumbbell:"High Knees",home:"High Knees"},
  "Lateral Shuffle":{busy:"Box Jump",unavailable:"High Knees",fatigued:"Med-Ball Slam",discomfort:"Box Jump",injury:"High Knees",complex:"Box Jump",dumbbell:"High Knees",home:"High Knees"},
};


// --- WORKOUT LIBRARY DATA -----------------------------------------
// sets = actual number of dots shown in workout tracker (use max of range for advanced)
// setsLabel = display string shown in programme view
// Rep schemes adapt via Gary's AI based on training age
const WORKOUT_LIBRARY = [
  {
    id:"runner-strength",cat:"Running",name:"Runner Strength Foundation",sessionCode:"RSF",version:"1.1",tag:"Strength",duration:"45-55 min",
    gary:"Runners who skip strength work get injured. It's not a question of if - it's when. This session is the foundation. We're building the structural capacity your body needs to absorb the forces of running. Every rep here is injury prevention.",
    exercises:[
      {name:"Patrick Step",sets:3,setsLabel:"3",reps:"20 each",note:"Non-negotiable opener. Tibialis anterior is the most neglected muscle in running. This is your shin splint prevention.",rest:60,rpe:6,tempo:"1-1-2-0",type:"recovery"},
      {name:"ATG Split Squat",sets:3,setsLabel:"3",reps:"8-10 each",note:"Knee over toe. Full depth. Hip flexor stretch at bottom. This is your knee health movement. Start bodyweight.",rest:90,rpe:7,tempo:"3-1-1-0",type:"strength"},
      {name:"Single Leg RDL",sets:3,setsLabel:"3",reps:"8-10 each",note:"Every stride is a single-leg movement. Train unilateral. Control the hinge.",rest:90,rpe:7,tempo:"3-1-1-0",type:"hyper"},
      {name:"Single Leg Calf Raise (Full ROM)",sets:3,setsLabel:"3",reps:"15-20 each",note:"Full drop below step. 3s eccentric. Achilles protection. Non-negotiable for any runner.",rest:60,rpe:7,tempo:"2-1-3-1",type:"recovery"},
      {name:"Banded Lateral Walk",sets:3,setsLabel:"3",reps:"15 steps each way",note:"Glute medius. Prevents IT band, runner's knee, hip pain. Stay low throughout.",rest:60,rpe:5,tempo:"controlled",type:"recovery"},
      {name:"Dead Bug",sets:3,setsLabel:"3",reps:"8-10 each side",note:"Anti-rotation core stability. Running is a single-leg anti-rotation sport. Build it here.",rest:60,rpe:5,tempo:"2-0-2-0",type:"recovery"},
    ]
  },
  {
    id:"runner-prehab",cat:"Running",name:"Runner Prehab & Mobility",sessionCode:"RPM",version:"1.1",tag:"Recovery",duration:"30-40 min",
    gary:"This is not stretching. This is targeted loading of the tissues most runners destroy over time. Ben Patrick's knees-over-toes work, active hip work, and achilles loading. Do this session the day before a hard run or after an easy run.",
    exercises:[
      {name:"Active Hip Flexor Stretch (90/90)",sets:2,setsLabel:"2",reps:"60s each side",note:"Runners have chronically tight hip flexors. Tight hip flexors reduce stride length and cause back pain.",rest:30,rpe:3,tempo:"hold",type:"recovery"},
      {name:"Patrick Step",sets:3,setsLabel:"3",reps:"20-25 each",note:"Weighted if comfortable. This is your shin splint and knee health daily practice.",rest:45,rpe:5,tempo:"1-1-2-0",type:"recovery"},
      {name:"Copenhagen Plank",sets:3,setsLabel:"3",reps:"25-30s each side",note:"Adductor and groin protection. IT band prevention. Hold steady, no hip sag.",rest:60,rpe:6,tempo:"hold",type:"recovery"},
      {name:"Single Leg Calf Raise (Full ROM)",sets:3,setsLabel:"3",reps:"20-25 each",note:"High rep. Focus on the full stretch at bottom. Achilles tendon loading at long length.",rest:45,rpe:6,tempo:"2-1-3-1",type:"recovery"},
      {name:"ATG Split Squat",sets:2,setsLabel:"2",reps:"10-15 each",note:"Lighter than strength day. Focus on range of motion. Hip flexor stretch and knee health.",rest:60,rpe:6,tempo:"3-1-1-0",type:"recovery"},
      {name:"Reverse Nordic Curl",sets:2,setsLabel:"2",reps:"10-12",note:"Quad and hip flexor in one. Controls the knee through full range. Important for push-off strength.",rest:60,rpe:7,tempo:"3-0-1-0",type:"recovery"},
    ]
  },
  {
    id:"runner-upper",cat:"Running",name:"Runner Upper Body & Core",sessionCode:"RUC",version:"1.1",tag:"Hypertrophy",duration:"40-50 min",
    gary:"Upper body and core work for runners is about posture, arm drive efficiency, and the anti-rotation strength that keeps your form together at mile 20. Not about size. Every movement here has a direct running application.",
    exercises:[
      {name:"Dead Bug",sets:3,setsLabel:"3",reps:"10 each side",note:"Anti-extension core stability. Your foundation for the session.",rest:60,rpe:5,tempo:"2-0-2-0",type:"recovery"},
      {name:"Barbell Overhead Press",sets:3,setsLabel:"3",reps:"8-10",note:"Shoulder strength and postural endurance. Runners who slump at mile 15 lose efficiency. Build the shoulders to stay upright.",rest:90,rpe:7,tempo:"2-0-1-0",type:"hyper"},
      {name:"Seated Cable Row",sets:3,setsLabel:"3",reps:"10-12",note:"Posture. Runners who have forward rounded shoulders compress their breathing. Row to pull it back.",rest:90,rpe:7,tempo:"3-1-1-1",type:"hyper"},
      {name:"Face Pull",sets:3,setsLabel:"3",reps:"15-20",note:"Rotator cuff and rear delt. Shoulder health for the long haul.",rest:60,rpe:6,tempo:"2-1-1-1",type:"recovery"},
      {name:"Band Pull-Apart",sets:3,setsLabel:"3",reps:"20",note:"Upper back activation. Postural endurance. Do these throughout warm-up too.",rest:30,rpe:4,tempo:"2-1-2-0",type:"recovery"},
      {name:"Dead Bug",sets:3,setsLabel:"3",reps:"10 each side",note:"Finisher. Anti-rotation core. Think about running form and hip stability.",rest:60,rpe:5,tempo:"2-0-2-0",type:"recovery"},
    ]
  },
  {
    id:"runner-power",cat:"Running",name:"Runner Plyometrics & Power",sessionCode:"RPW",version:"1.1",tag:"Strength",duration:"35-45 min",
    gary:"Running economy. That's what this session is about. Six weeks of plyometric training gives most runners a 3-6% improvement in economy - meaning faster times for the same effort. This is the work most runners skip. Don't skip it.",
    exercises:[
      {name:"Patrick Step",sets:2,setsLabel:"2",reps:"15 each",note:"Activation. Tibialis prep before impact work.",rest:45,rpe:5,tempo:"1-1-2-0",type:"recovery"},
      {name:"Box Jump",sets:4,setsLabel:"4",reps:"5",note:"Max intent. Full triple extension. Land soft. Quality over quantity. Rest fully between sets.",rest:90,rpe:8,tempo:"explosive",type:"strength"},
      {name:"Single Leg Calf Raise (Full ROM)",sets:3,setsLabel:"3",reps:"12-15 each",note:"Loaded achilles and calf complex. Eccentric control. Plyometrics need this foundation.",rest:60,rpe:7,tempo:"2-1-3-1",type:"recovery"},
      {name:"ATG Split Squat",sets:3,setsLabel:"3",reps:"8 each",note:"Loaded. This develops the deep knee flexion and hip flexor range that allows a more powerful stride.",rest:90,rpe:8,tempo:"3-1-1-0",type:"strength"},
      {name:"Banded Lateral Walk",sets:2,setsLabel:"2",reps:"20 steps each way",note:"Glute med activation post-plyo. Keep it honest.",rest:60,rpe:5,tempo:"controlled",type:"recovery"},
    ]
  },
  {
    id:"runner-marathon-strength",cat:"Running",name:"Marathon Strength Block",sessionCode:"MSB",version:"1.1",tag:"Hypertrophy",duration:"50-60 min",
    gary:"You're training for distance. That means the strength work needs to be higher rep, lower impact, and focused on the specific muscles that fail late in a marathon - glutes, hip flexors, calves. This is the session that gets you to the finish line strong, not shuffling.",
    exercises:[
      {name:"Patrick Step",sets:3,setsLabel:"3",reps:"25 each",note:"High rep tibialis work. Marathon runners get shin splints from tibialis fatigue at mile 20+. Build the endurance.",rest:45,rpe:5,tempo:"1-1-2-0",type:"recovery"},
      {name:"ATG Split Squat",sets:3,setsLabel:"3",reps:"12-15 each",note:"Higher rep. Muscular endurance in the hip flexors and quads. This is miles 18-26 territory.",rest:90,rpe:7,tempo:"2-1-1-0",type:"hyper"},
      {name:"Single Leg RDL",sets:3,setsLabel:"3",reps:"12-15 each",note:"Hamstring and glute endurance. The glutes fatigue significantly in the second half of a marathon.",rest:90,rpe:7,tempo:"3-1-1-0",type:"hyper"},
      {name:"Single Leg Calf Raise (Full ROM)",sets:4,setsLabel:"4",reps:"20-25 each",note:"High volume. Marathon calves work for 3-6 hours. Build the endurance specifically here.",rest:60,rpe:7,tempo:"2-1-3-0",type:"recovery"},
      {name:"Copenhagen Plank",sets:3,setsLabel:"3",reps:"30-40s each side",note:"Adductor strength for the long haul. Groin protection over 26.2 miles.",rest:60,rpe:6,tempo:"hold",type:"recovery"},
      {name:"Dead Bug",sets:3,setsLabel:"3",reps:"12 each side",note:"Core endurance. Running posture at mile 24 depends on this.",rest:60,rpe:5,tempo:"2-0-2-0",type:"recovery"},
    ]
  },
  {
    id:"warmup",cat:"Warm-Up",name:"Full Body Warm-Up Protocol",tag:"Pre-Session",duration:"15-20 min",
    gary:"Every session, no exceptions. This isn't optional filler  it's your injury insurance policy. Nervous system activation, joint mobilisation, blood flow. Your first working set should feel like the fifth.",
    exercises:[
      {name:"Light Cardio (bike/row/skip)",sets:1,reps:"5 min",note:"Zone 2. Not a sprint. Elevate core temp.",rest:0},
      {name:"Dead Hang",sets:3,reps:"20-30s",note:"Decompress the spine. Retract scapula at top, let it go at bottom. Builds grip and shoulder health.",rest:30},
      {name:"Scapular Retraction Pulls",sets:3,reps:"15",note:"Hang from bar, squeeze shoulder blades together without bending elbows. Activates lower traps and protects rotator cuff.",rest:30},
      {name:"Band Pull-Apart",sets:2,reps:"20",note:"Overhand and underhand. Wake the rear delts.",rest:30},
      {name:"Hip CARs",sets:1,reps:"5 each direction",note:"Slow, deliberate, full range. Load the end range of the hip. Both directions. This is nervous system priming.",rest:0},
      {name:"Shoulder CARs",sets:1,reps:"5 each direction each side",note:"Arm fully extended, draw the largest circle possible. Slow, controlled, no compensation. Primes rotator cuff and full glenohumeral range before pressing or pulling. Both arms, both directions.",rest:0},
      {name:"Bodyweight Squat",sets:2,reps:"15",note:"Full depth. Pause at bottom.",rest:30},
      {name:"Scapular Push-Up",sets:2,reps:"12",note:"Serratus activation. Pressing health.",rest:30},
      {name:"Hip Hinge (bodyweight)",sets:2,reps:"10",note:"Groove the pattern. Neutral spine throughout.",rest:0},
      {name:"90/90 Hip Stretch",sets:1,reps:"60s each side",note:"Internal and external rotation.",rest:0},
      {name:"Tibialis Raise",sets:2,reps:"20",note:"Shin health. Every session.",rest:30},
    ]
  },
  {
    id:"sprint",cat:"Athletic",name:"Sprint Protocol",tag:"Power + Conditioning",duration:"30-40 min",
    gary:"Sprinting is the most athletic thing most people never do. It builds muscle, shreds fat, and forces you to move the way your body was designed. This is not jogging  it's maximal effort with full recovery between every rep. Quality is everything.",
    exercises:[
      {name:"Dynamic Warm-Up",sets:1,reps:"10 min",note:"High knees, butt kicks, leg swings, A-skips, B-skips. Mandatory  sprinting on cold muscles tears hamstrings.",rest:0},
      {name:"Sprint 20m",sets:3,reps:"1",note:"60% effort. Acceleration mechanics only.",rest:90},
      {name:"Sprint 40m",sets:4,reps:"1",note:"80% effort. Upright mechanics at top speed.",rest:120},
      {name:"Sprint 60m",sets:4,reps:"1",note:"95% effort. Full sprint. Full recovery.",rest:180},
      {name:"Sprint 100m",sets:2,reps:"1",note:"100% maximal. Full 3 min recovery. These build speed.",rest:180},
      {name:"Walking Cool-Down",sets:1,reps:"5 min",note:"Walk, don't sit. Keep blood moving.",rest:0},
    ]
  },
  {
    id:"jump",cat:"Athletic",name:"Plyometric Jump Protocol",tag:"Power + Explosiveness",duration:"25-35 min",
    gary:"Jump training is the fastest route to athletic power. The stretch-shortening cycle you build here transfers to every compound lift. Do this before strength work  never after.",
    exercises:[
      {name:"Ankle Hops",sets:3,reps:"20",note:"Minimal ground contact. Stiff ankle.",rest:60},
      {name:"Broad Jump",sets:4,reps:"5",note:"Maximal horizontal distance. Stick the landing.",rest:90},
      {name:"Box Jump",sets:4,reps:"5",note:"Land softly into the hip. Step down.",rest:90},
      {name:"Depth Drop",sets:3,reps:"5",note:"Step off box, absorb. Deceleration drill.",rest:90},
      {name:"Depth Drop to Jump",sets:3,reps:"5",note:"Minimal ground contact time.",rest:120},
      {name:"Vertical Jump",sets:3,reps:"5",note:"Maximal. Arm drive matters.",rest:90},
      {name:"Lateral Bound",sets:3,reps:"6 each side",note:"Single leg. Controls frontal plane.",rest:90},
    ]
  },
  {
    id:"ppl-push",cat:"Bodybuilding",name:"Chest, Shoulders & Triceps",sessionCode:"CST",version:"1.1",tag:"Strength",duration:"45-60 min",
    gary:"One true working set per compound to absolute failure, then done. Intermediate athletes: three sets, last one pushed hard. The number of sets means nothing. The quality of failure means everything.",
    exercises:[
      {name:"Band Pull-Apart",sets:2,setsLabel:"2",reps:"20",note:"Shoulder activation before pressing. Overhand and underhand. Non-negotiable pre-press.",rest:30,rpe:4,tempo:"2-1-2-0",type:"recovery"},
      {name:"Barbell Bench Press",sets:3,setsLabel:"1-3",reps:"6-8",note:"ADVANCED: 1 set to absolute failure. INTERMEDIATE: 3 sets, last to failure. 3s eccentric, 1s pause at chest.",rest:180,rpe:9,tempo:"3-1-1-0",type:"strength"},
      {name:"Incline DB Press",sets:3,setsLabel:"2-3",reps:"8-10",note:"30-45 degree incline. Upper chest stretch at bottom. Last set to failure.",rest:120,rpe:9,tempo:"3-0-1-1",type:"hyper"},
      {name:"Cable Fly (Low to High)",sets:3,setsLabel:"2-3",reps:"10-12",note:"Full pec stretch and squeeze. Slow negative is the stimulus.",rest:90,rpe:8,tempo:"3-1-1-1",type:"hyper"},
      {name:"Seated DB Shoulder Press",sets:3,setsLabel:"1-3",reps:"8-10",note:"ADVANCED: 1-2 sets to failure. Control the eccentric fully.",rest:120,rpe:9,tempo:"2-0-1-1",type:"hyper"},
      {name:"Cable Lateral Raise",sets:3,setsLabel:"3",reps:"15-20",note:"Weak area: always higher volume regardless of level. Lead with elbow, not hand.",rest:60,rpe:8,tempo:"2-1-2-0",type:"hyper"},
      {name:"Overhead Tricep Extension",sets:2,setsLabel:"2",reps:"8-10",note:"Long head. Elbows beside ears. Slow the eccentric.",rest:90,rpe:9,tempo:"3-1-1-0",type:"hyper"},
    ]
  },
  {
    id:"ppl-pull",cat:"Bodybuilding",name:"Back, Biceps & Rear Delts",sessionCode:"BBR",version:"1.1",tag:"Strength",duration:"45-60 min",
    gary:"Pull from the elbow, not the hand. Your back does the work. Biceps are passengers until the direct work. Advanced clients: one true set on each compound to absolute failure is more than enough.",
    exercises:[
      {name:"Lat Pulldown",sets:3,setsLabel:"1-3",reps:"6-8",note:"ADVANCED: 1-2 sets to absolute failure. Full stretch at top. Drive elbows to hips. Weighted pull-ups are the advanced progression when you are ready.",rest:180,rpe:9,tempo:"3-1-1-0",type:"strength"},
      {name:"Pendlay Row",sets:3,setsLabel:"1-3",reps:"6-8",note:"ADVANCED: 1 true working set. Bar from floor each rep. Horizontal torso.",rest:180,rpe:9,tempo:"1-0-1-2",type:"strength"},
      {name:"Seated Cable Row",sets:3,setsLabel:"2-3",reps:"10-12",note:"Full stretch forward. Drive elbows back. No rocking.",rest:90,rpe:8,tempo:"3-1-1-1",type:"hyper"},
      {name:"Face Pull",sets:3,setsLabel:"3",reps:"15-20",note:"Corrective work: always this volume. External rotation at end. Non-negotiable for shoulder health.",rest:60,rpe:7,tempo:"2-1-1-1",type:"recovery"},
      {name:"EZ Bar Curl",sets:2,setsLabel:"2",reps:"8-10",note:"Full ROM. No swing. Bottom stretch is the stimulus.",rest:90,rpe:9,tempo:"2-1-1-2",type:"hyper"},
      {name:"Incline DB Curl",sets:2,setsLabel:"2",reps:"10-12",note:"Long head. Full hang. Supinate at top.",rest:90,rpe:8,tempo:"3-1-1-0",type:"hyper"},
    ]
  },
  {
    id:"ppl-legs",cat:"Bodybuilding",name:"Legs - Quad Dominant",sessionCode:"LQD",version:"1.1",tag:"Strength",duration:"50-65 min",
    gary:"Leg day is where character is built. One true set of squats to absolute failure will humble you and stimulate more growth than five moderate sets ever could. Order matters: squat fresh, hinge warm, isolate when loaded.",
    exercises:[
      {name:"Tibialis Raise",sets:2,setsLabel:"2",reps:"20",note:"Shin and knee activation. Do this before squatting. Strengthens tibialis anterior.",rest:30,rpe:5,tempo:"1-1-1-0",type:"recovery"},
      {name:"Back Squat",sets:3,setsLabel:"1-3",reps:"6-8",note:"ADVANCED: 1 true set to failure. INTERMEDIATE: 3 sets, last to failure. Knees track toes. Break parallel.",rest:180,rpe:9,tempo:"3-1-1-0",type:"strength"},
      {name:"Bulgarian Split Squat",sets:3,setsLabel:"2-3",reps:"8-10 each",note:"Unilateral quad focus. Rear foot elevated. Upright torso. Expose and fix the imbalance.",rest:90,rpe:8,tempo:"3-1-1-0",type:"hyper"},
      {name:"Leg Press",sets:3,setsLabel:"2-3",reps:"10-12",note:"Higher foot placement for quad emphasis. Full ROM. Control the negative.",rest:90,rpe:8,tempo:"3-0-1-0",type:"hyper"},
      {name:"Walking Lunge",sets:3,setsLabel:"3",reps:"12 each leg",note:"Unilateral. Keep torso upright. Full stride. Develops coordination and single-leg strength.",rest:60,rpe:8,tempo:"2-0-1-0",type:"hyper"},
      {name:"Nordic Hamstring Curl",sets:3,setsLabel:"3",reps:"5-8",note:"5s eccentric. Best hamstring injury prevention. Always volume-based.",rest:120,rpe:9,tempo:"5-0-1-0",type:"recovery"},
    ]
  },
  {
    id:"legs-female",cat:"Bodybuilding",name:"Legs - Glute & Posterior",sessionCode:"LGP",version:"1.1",tag:"Hypertrophy",duration:"55-70 min",
    gary:"The hip thrust is the single greatest glute activation movement available. Research is unambiguous on this. We anchor every session around it. Glutes respond to both heavy loading and higher rep isolation work. We use both. This is targeted, intelligent training.",
    exercises:[
      {name:"Hip Thrust (Barbell)",sets:4,setsLabel:"3-4",reps:"8-12",note:"ANCHOR MOVEMENT. Full hip extension at top. 1s squeeze at top. Drive through heels.",rest:150,rpe:9,tempo:"3-0-1-1",type:"strength"},
      {name:"Romanian Deadlift",sets:3,setsLabel:"2-3",reps:"8-10",note:"Posterior chain. Feel the glute-ham tie-in at full hip extension.",rest:120,rpe:8,tempo:"3-1-1-0",type:"hyper"},
      {name:"Bulgarian Split Squat",sets:3,setsLabel:"2-3",reps:"8-10 each",note:"Rear foot elevated. Front foot far forward = more glute. Upright torso.",rest:120,rpe:8,tempo:"3-1-1-0",type:"hyper"},
      {name:"Cable Kickback",sets:3,setsLabel:"3",reps:"15-20",note:"Glute isolation. Higher reps maximise glute fibre recruitment. Full hip extension. Hard squeeze.",rest:60,rpe:8,tempo:"2-1-2-0",type:"hyper"},
      {name:"Abduction Machine / Cable",sets:3,setsLabel:"3",reps:"15-20",note:"Glute medius. Lateral stability. Controlled throughout.",rest:60,rpe:7,tempo:"2-1-2-0",type:"hyper"},
      {name:"Lying Leg Curl",sets:3,setsLabel:"2-3",reps:"10-12",note:"Hamstring isolation. Full ROM. Slow eccentric.",rest:90,rpe:8,tempo:"3-1-1-1",type:"hyper"},
      {name:"Tibialis Raise",sets:2,setsLabel:"2",reps:"20",note:"Knee health. Always.",rest:30,rpe:5,tempo:"1-1-1-0",type:"recovery"},
    ]
  },
  {
    id:"chest-back",cat:"Bodybuilding",name:"Chest & Back",sessionCode:"CB",version:"1.1",tag:"Hypertrophy",duration:"50-65 min",
    gary:"Antagonist pairing: one of the most efficient training structures available. Advanced athletes: pair each compound, take the last set to failure, and leave. Every set earns its place. No filler.",
    exercises:[
      {name:"Face Pull",sets:3,setsLabel:"3",reps:"15-20",note:"Activation before pressing. External rotation. Shoulders warm and healthy before any bench work.",rest:30,rpe:6,tempo:"2-1-1-1",type:"recovery"},
      {name:"A1: Barbell Bench Press",sets:3,setsLabel:"1-3",reps:"6-8",note:"SUPERSET with A2. ADVANCED: 1 set to failure. 3s eccentric. Full pec stretch at bottom.",rest:0,rpe:9,tempo:"3-1-1-0",type:"strength"},
      {name:"A2: Lat Pulldown",sets:3,setsLabel:"1-3",reps:"6-8",note:"SUPERSET with A1. Full stretch at top, drive elbows down. Chest to bar. Rest 120s then repeat A1. Weighted pull-ups are the advanced progression.",rest:120,rpe:9,tempo:"3-1-1-0",type:"strength"},
      {name:"B1: Incline DB Press",sets:3,setsLabel:"2-3",reps:"8-10",note:"SUPERSET with B2. 30-45 degree incline. Upper chest stretch at bottom.",rest:0,rpe:8,tempo:"3-0-1-1",type:"hyper"},
      {name:"B2: Seated Cable Row",sets:3,setsLabel:"2-3",reps:"10-12",note:"SUPERSET with B1. Full stretch forward. Drive elbows back. Rest 90s then repeat B1.",rest:90,rpe:8,tempo:"3-1-1-1",type:"hyper"},
      {name:"C1: Cable Fly",sets:2,setsLabel:"2",reps:"12-15",note:"SUPERSET with C2. Chest isolation. Squeeze hard at peak contraction.",rest:0,rpe:8,tempo:"3-1-1-1",type:"hyper"},
      {name:"C2: Straight-Arm Pulldown",sets:2,setsLabel:"2",reps:"12-15",note:"SUPERSET with C1. Lat isolation. Keep arms straight. Rest 60s then repeat C1.",rest:60,rpe:7,tempo:"3-1-1-0",type:"hyper"},
    ]
  },
  {
    id:"shoulders-arms",cat:"Bodybuilding",name:"Shoulders & Arms",sessionCode:"SA",version:"1.1",tag:"Hypertrophy",duration:"45-60 min",
    gary:"Arms and shoulders are feeling muscles. If you're not feeling it, you're not training it. Two sets per movement to absolute failure is more than enough for advanced athletes.",
    exercises:[
      {name:"Barbell OHP",sets:3,setsLabel:"1-3",reps:"6-8",note:"ADVANCED: 1-2 sets to failure. Drive vertical. Brace the entire torso.",rest:150,rpe:9,tempo:"2-0-1-0",type:"strength"},
      {name:"Cable Lateral Raise",sets:3,setsLabel:"3",reps:"15-20",note:"Weak area: always higher volume regardless of level. Lead with elbow.",rest:60,rpe:8,tempo:"2-1-2-0",type:"hyper"},
      {name:"Rear Delt Fly",sets:3,setsLabel:"3",reps:"15-20",note:"Corrective volume. Pinkies up. Balance the shoulder girdle.",rest:60,rpe:7,tempo:"2-1-1-0",type:"recovery"},
      {name:"EZ Bar Curl",sets:2,setsLabel:"2",reps:"8-10",note:"Full ROM. Bottom stretch is the point. Last set to failure.",rest:90,rpe:9,tempo:"2-1-1-2",type:"hyper"},
      {name:"Incline DB Curl",sets:2,setsLabel:"2",reps:"10-12",note:"Long head. Stretch-biased. Supinate at top.",rest:90,rpe:8,tempo:"3-1-1-0",type:"hyper"},
      {name:"Overhead Tricep Extension",sets:2,setsLabel:"2",reps:"8-10",note:"Long head. 2 sets to failure.",rest:90,rpe:9,tempo:"3-1-1-0",type:"hyper"},
      {name:"Tricep Rope Pushdown",sets:2,setsLabel:"2",reps:"10-12",note:"Lateral head. Separate rope at bottom.",rest:75,rpe:8,tempo:"2-1-1-0",type:"hyper"},
    ]
  },
  {
    id:"legs-posterior",cat:"Bodybuilding",name:"Legs - Hamstrings & Glutes",sessionCode:"LHG",version:"1.1",tag:"Hypertrophy",duration:"50-60 min",
    gary:"The posterior chain is the most undertrained part of most athletes' bodies. Hamstrings, glutes, and hip stability. This session is the counterpart to quad-dominant work. Hip hinge pattern anchors it.",
    exercises:[
      {name:"Romanian Deadlift",sets:3,setsLabel:"1-3",reps:"6-8",note:"ADVANCED: 1-2 sets to absolute failure. Hip hinge anchors this session. Bar stays close. Full hamstring stretch at bottom.",rest:180,rpe:9,tempo:"3-1-1-0",type:"strength"},
      {name:"Hip Thrust (Barbell)",sets:3,setsLabel:"2-3",reps:"8-12",note:"Full hip extension at top. 1s hard squeeze. Drive through heels, not toes.",rest:120,rpe:9,tempo:"3-0-1-1",type:"hyper"},
      {name:"Lying Leg Curl",sets:3,setsLabel:"2-3",reps:"10-12",note:"Hamstring isolation. Full ROM. Slow eccentric.",rest:90,rpe:8,tempo:"3-1-1-1",type:"hyper"},
      {name:"Bulgarian Split Squat",sets:3,setsLabel:"2-3",reps:"8-10 each",note:"Unilateral strength. Rear foot elevated. Forward lean targets glutes. Equal depth both sides.",rest:90,rpe:8,tempo:"3-1-1-0",type:"hyper"},
      {name:"Kettlebell Swing",sets:3,setsLabel:"3",reps:"15-20",note:"Hip hinge power. Drive with glutes and hamstrings. Hike the bell back, explode forward. This is a hip movement, not a squat.",rest:60,rpe:8,tempo:"explosive",type:"strength"},
      {name:"Nordic Hamstring Curl",sets:3,setsLabel:"3",reps:"5-8",note:"5s eccentric. Best hamstring injury prevention. Always this volume.",rest:120,rpe:9,tempo:"5-0-1-0",type:"recovery"},
    ]
  },
  {
    id:"superset-upper",cat:"Bodybuilding",name:"Upper Body Superset",sessionCode:"UBS",version:"1.1",tag:"Hypertrophy",duration:"40-50 min",
    gary:"Supersets: maximum density with minimum time. Opposing muscle groups, back to back. The pump is a side effect of metabolic stress, not the goal. Every set demands a full contraction.",
    exercises:[
      {name:"SUPERSET A1: Incline DB Press",sets:3,setsLabel:"3",reps:"8-10",note:"No rest before A2. Last set to failure.",rest:0,rpe:9,tempo:"3-0-1-1",type:"hyper"},
      {name:"SUPERSET A2: Seated Cable Row",sets:3,setsLabel:"3",reps:"10",note:"Rest 90s after A2, then repeat A1.",rest:90,rpe:8,tempo:"3-1-1-1",type:"hyper"},
      {name:"SUPERSET B1: DB Shoulder Press",sets:3,setsLabel:"3",reps:"8-10",note:"No rest before B2.",rest:0,rpe:8,tempo:"2-0-1-1",type:"hyper"},
      {name:"SUPERSET B2: Face Pull",sets:3,setsLabel:"3",reps:"15-20",note:"Rest 75s. Corrective: always this volume.",rest:75,rpe:7,tempo:"2-1-1-1",type:"recovery"},
      {name:"SUPERSET C1: EZ Bar Curl",sets:2,setsLabel:"2",reps:"8-10",note:"No rest before C2. To failure.",rest:0,rpe:9,tempo:"2-1-1-2",type:"hyper"},
      {name:"SUPERSET C2: Tricep Pushdown",sets:2,setsLabel:"2",reps:"10-12",note:"Rest 75s. Full extension.",rest:75,rpe:8,tempo:"2-1-1-0",type:"hyper"},
      {name:"SUPERSET D1: Cable Fly",sets:2,setsLabel:"2",reps:"10-12",note:"No rest before D2.",rest:0,rpe:8,tempo:"3-1-1-1",type:"hyper"},
      {name:"SUPERSET D2: Cable Lateral Raise",sets:2,setsLabel:"2",reps:"15-20",note:"Rest 60s. Lead with elbow.",rest:60,rpe:8,tempo:"2-1-2-0",type:"hyper"},
    ]
  },
  // BOXING - 9-station circuit, beginner level 1
  {id:"boxing-beg-1",cat:"Boxing",name:"Foundation Fight",sessionCode:"BFD",version:"2.0",tag:"Boxing",duration:"45 min",
    boxingMode:true,
    gary:"Every station is 3 rounds of 60 seconds. You work the full 60, rest 10 seconds, then go again. When all 3 rounds are done, you get 30 seconds to move to the next station. Treadmill first - vary your speed. Then strength. Then the bag. We rotate three times. Stay light on your feet all session.",
    exercises:[
      {name:"Treadmill - Jog Build",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 6-8, incline 0. Warm up the engine. Jog first 20s, build to a run. Arms pumping.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Squat + Punch Out",stationType:"STRENGTH",sets:3,reps:"60s",note:"Squat deep, drive up, throw 1-2 (jab-cross) x5 at eye level. Power from the legs into the hands.",combo:"1,2",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 1,2 Basics",stationType:"BAG",sets:3,reps:"60s",note:"Stand one arm length away. 1 (jab) to measure, 2 (cross) for power. Breathe out on each punch. Reset stance every 4 combos.",combo:"1,2 - jab cross",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Incline Walk",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 5, incline 8-10. Drive with your heels. Arms still boxing - shadow jab as you walk.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Press-Up + Stand + Jab",stationType:"STRENGTH",sets:3,reps:"60s",note:"5 press-ups, spring to feet, throw 1,2,1 (jab-cross-jab). Repeat. Core tight through the press.",combo:"1,2,1",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 1,2,3,2",stationType:"BAG",sets:3,reps:"60s",note:"Jab-cross-hook-cross. The hook rotates from the hip - not the arm. Pivot the lead foot on the hook.",combo:"1,2,3,2 - jab cross hook cross",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Speed Burst",stationType:"TREADMILL",sets:3,reps:"60s",note:"20s at speed 9, 20s at 6, 20s at 9. Simulate the explosive bursts of real round pace.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Plank Shoulder Taps + Bob",stationType:"STRENGTH",sets:3,reps:"60s",note:"20s plank shoulder taps (core stability), 20s standing bob-and-weave. Repeat twice. Core is where your power comes from.",combo:"",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Body + Head",stationType:"BAG",sets:3,reps:"60s",note:"Lead hook to body (5), cross to head (2). Bend the knees to get to body level. The body shot forces the guard down. This is how rounds are won.",combo:"5,2 - body hook, cross",rest:10,type:"cardio",isTimeBased:true},
    ]},
  // BOXING - 9-station circuit, beginner level 2
  {id:"boxing-beg-2",cat:"Boxing",name:"Defense & Flow",sessionCode:"BDF",version:"2.0",tag:"Boxing",duration:"45 min",
    boxingMode:true,
    gary:"Today we add defensive movement. After every combination, you must move. Step left or right. Change your angle. A punch you slip is better than one you block. Stay light, stay moving.",
    exercises:[
      {name:"Treadmill - Lateral Shuffle",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 5-6, incline 0. Every 15 seconds, shadow a slip (head off centreline, left then right). Active movement.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Dumbbell Curl to Press",stationType:"STRENGTH",sets:3,reps:"60s",note:"Light dumbbells. Bicep curl, rotate, press overhead. Builds the shoulder stability needed for sustained combinations.",combo:"",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 1,2 + Slip",stationType:"BAG",sets:3,reps:"60s",note:"Jab-cross, then slip outside right (duck your head to the left of the bag). Come back, throw again. Never stand square.",combo:"1,2 + slip - jab cross then slip",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Hill Run",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 7, incline 5-6. Incline running builds the explosive leg drive needed for ring movement and punching power.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Lateral Lunge + Jab",stationType:"STRENGTH",sets:3,reps:"60s",note:"Step wide to the right, lunge, throw a jab from the low position. Alternate sides. Lateral hip strength = footwork.",combo:"1",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 1,1,2,3",stationType:"BAG",sets:3,reps:"60s",note:"Double jab-cross-hook. First jab is the range finder. Second jab disrupts the guard. Cross through the gap. Hook as they react.",combo:"1,1,2,3 - jab jab cross hook",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Sprint Intervals",stationType:"TREADMILL",sets:3,reps:"60s",note:"10s sprint (speed 10), 20s jog (speed 6), repeat 2 times. 60 seconds total. This is round 10 conditioning.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Mountain Climbers + Roll",stationType:"STRENGTH",sets:3,reps:"60s",note:"20s mountain climbers, 10s standing shoulder roll drill (dip under imaginary hook, U-shape). Repeat twice.",combo:"",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 1,2,3,2,3",stationType:"BAG",sets:3,reps:"60s",note:"Jab-cross-hook-cross-hook. The double hook at the end is a Canelo signature. Second hook comes from a different angle.",combo:"1,2,3,2,3 - jab cross hook cross hook",rest:10,type:"cardio",isTimeBased:true},
    ]},
  // BOXING - intermediate 1
  {id:"boxing-int-1",cat:"Boxing",name:"Power Combinations",sessionCode:"BPC",version:"2.0",tag:"Boxing",duration:"45 min",
    boxingMode:true,
    gary:"Every punch today has bad intentions. Tyson threw the hardest punches in heavyweight history by combining hip rotation with explosive timing. Short. Sharp. Reset immediately. We are building combinations that flow naturally from one punch to the next.",
    exercises:[
      {name:"Treadmill - Speed Build",stationType:"TREADMILL",sets:3,reps:"60s",note:"Start speed 7, increase 1 notch every 15 seconds. Reach 10 by the end. This is fight-pace conditioning.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Dumbbell Squat Press",stationType:"STRENGTH",sets:3,reps:"60s",note:"Dumbbells at shoulders, squat deep, explode up, press overhead. Builds the full-body drive that powers your combinations.",combo:"",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 1,2,3,3",stationType:"BAG",sets:3,reps:"60s",note:"Jab-cross-double hook. The double hook is Tyson. First hook to body (3 to the ribs), second hook to head. Bend knees on body shot.",combo:"1,2,3,3 - jab cross hook hook",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Hill Attack",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 8, incline 8. No holding the rails. Drive with your arms as if throwing uppercuts. Pure cardiovascular power.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Core Power Circuit",stationType:"STRENGTH",sets:3,reps:"60s",note:"15 Russian twists (rotate fully, both sides count), 5 V-ups, 10 bicycle crunches. Rotational core = punch power.",combo:"",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 2,3,2,4",stationType:"BAG",sets:3,reps:"60s",note:"Cross-hook-cross-right hook. Tyson combo. The 4 (right hook) is the finisher - throw it over the guard. Weight transfer is everything.",combo:"2,3,2,4 - cross hook cross right hook",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Max Effort",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 10+, incline 0. All out. This is championship conditioning. The third round is where fights are won.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Burpee to Uppercut",stationType:"STRENGTH",sets:3,reps:"60s",note:"1 burpee, spring up, throw 6,5,2 (right uppercut, left uppercut, cross). The explosive drive from the floor mirrors the power in uppercuts.",combo:"6,5,2",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 1,2,5,2,3",stationType:"BAG",sets:3,reps:"60s",note:"Jab-cross-body hook-cross-hook. The 5 (body hook) drops the guard. The 2 (cross) goes to the now-open head. Canelo favourite.",combo:"1,2,5,2,3 - jab cross body hook cross hook",rest:10,type:"cardio",isTimeBased:true},
    ]},
  // BOXING - intermediate 2
  {id:"boxing-int-2",cat:"Boxing",name:"Speed & Movement",sessionCode:"BSM",version:"2.0",tag:"Boxing",duration:"45 min",
    boxingMode:true,
    gary:"Mayweather output 40-50 punches per round, mostly jabs. His speed came from relaxation between punches. Stay loose. The punch accelerates at the end and snaps back immediately. Every combination finishes with a pivot to a new angle.",
    exercises:[
      {name:"Treadmill - Footwork Pace",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 7, incline alternates 0 and 4 every 15 seconds. Simulates the constant change of pace in a real round.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Speed Shadowbox",stationType:"STRENGTH",sets:3,reps:"60s",note:"No equipment. Maximum hand speed. 1,1,2 (jab jab cross) for 20s, then 1,2,3 (jab cross hook) for 20s, then 1,2,3,2 for 20s. Count your reps.",combo:"1,1,2 then 1,2,3",rest:10,type:"cardio",isTimeBased:true},
      {name:"Heavy Bag: Speed Ladder",stationType:"BAG",sets:3,reps:"60s",note:"Throw: 1 punch, then 2, then 3, then 4 in rapid sequence. Rest 5 seconds, repeat. The ladder builds combination flow.",combo:"1 then 1,2 then 1,2,3 then 1,2,3,4",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Incline Sprint",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 9, incline 6. Explosive combination of incline and speed. Your legs drive punch power as much as your arms.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Dumbbell Row + Uppercut",stationType:"STRENGTH",sets:3,reps:"60s",note:"Single arm row (pulling power for the cross), then transition to dumbbell uppercut motion. 30s each arm. Back power transfers to punching.",combo:"6,5",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 1,2,3,2 + Pivot",stationType:"BAG",sets:3,reps:"60s",note:"Jab-cross-hook-cross, then pivot 45 degrees off the bag, throw 2 (cross). The pivot puts you at the new angle. Mayweather won rounds this way.",combo:"1,2,3,2 + pivot, 2",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Fartlek",stationType:"TREADMILL",sets:3,reps:"60s",note:"Your choice: vary speed freely, no fixed intervals. 60 seconds of intelligent self-paced effort. Build where you have energy.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Jump Squat + Body Combo",stationType:"STRENGTH",sets:3,reps:"60s",note:"3 jump squats, then throw 5,5,2 (double body hook, cross) at standing height. Explosive leg drive into immediate punching.",combo:"5,5,2",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 1,2,3,2,3,2",stationType:"BAG",sets:3,reps:"60s",note:"Six-punch combo. Jab-cross-hook-cross-hook-cross. This is the full combination sequence. Throw it in bursts of 3, rest 5 seconds, repeat.",combo:"1,2,3,2,3,2 - full six combo",rest:10,type:"cardio",isTimeBased:true},
    ]},
  // BOXING - advanced 1
  {id:"boxing-adv-1",cat:"Boxing",name:"Championship Rounds",sessionCode:"BCR",version:"2.0",tag:"Boxing",duration:"45 min",
    boxingMode:true,
    gary:"Championship fighters do not tire. They have conditioned every energy system. Today we push all three. Treadmill at fight pace. Strength at explosive pace. Bag work at competition intensity. The goal is to maintain technique when your body is screaming to quit.",
    exercises:[
      {name:"Treadmill - Fight Pace",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 10-11, incline 0. Championship round pace. Every champion trains beyond what they expect to face.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Weighted Punch Circuit",stationType:"STRENGTH",sets:3,reps:"60s",note:"Light dumbbells (2-3kg). Throw 1,2 (jab-cross) continuously for 20s, then 3,2 (hook-cross) for 20s, then 6,5 (uppercuts) for 20s. Shoulder endurance.",combo:"1,2 then 3,2 then 6,5",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Mayweather Jab Clinic",stationType:"BAG",sets:3,reps:"60s",note:"Jab only. But every jab has a different purpose: 1 to measure distance, 1,1 double jab to disrupt, 1 to the body. Vary height. The jab wins rounds.",combo:"1 variations - measuring, double, body",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Max Incline",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 7, incline 12. Quad and hip flexor power. Maximum incline running simulates cutting off the ring.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Explosive Power Compound",stationType:"STRENGTH",sets:3,reps:"60s",note:"5 dumbbell clean and press, 5 jump squats, 5 renegade rows each side. Total athletic power for a complete fighter.",combo:"",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Shoulder Roll Counter",stationType:"BAG",sets:3,reps:"60s",note:"Simulate incoming jab: lead shoulder rolls up to protect chin, counter with 2,3 (cross-hook). This is the Mayweather shoulder roll. Drill it until it becomes a reflex.",combo:"shoulder roll, 2,3",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Interval Championship",stationType:"TREADMILL",sets:3,reps:"60s",note:"15s sprint (11), 15s jog (6), 15s sprint, 15s jog. Four intervals in 60 seconds. This is the hardest treadmill round of the session.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Pull-Up + Body Attack",stationType:"STRENGTH",sets:3,reps:"60s",note:"3-5 pull-ups or inverted rows, then immediately 6 body punches (5,5,5,5,5,5 continuous body hooks). The pulling power behind your hooks comes from your lats.",combo:"5,5,5,5",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 12-Punch Combo",stationType:"BAG",sets:3,reps:"60s",note:"The championship combo: 1,2,3,2,1,2,5,2,3,2,6,3. Breathe out on every punch. Set feet after punch 6. This is 12 punches. Championship fighters can throw this in under 4 seconds.",combo:"1,2,3,2,1,2,5,2,3,2,6,3",rest:10,type:"cardio",isTimeBased:true},
    ]},
  // BOXING - advanced 2
  {id:"boxing-adv-2",cat:"Boxing",name:"Iron Pressure",sessionCode:"BIP",version:"2.0",tag:"Boxing",duration:"45 min",
    boxingMode:true,
    gary:"Tyson was 5 foot 10 in a heavyweight division of 6 foot 4 fighters. He won by using his height as an advantage - constant forward pressure, working underneath, attacking the body. Today we are Tyson. We go forward. We never let the opponent settle. Relentless.",
    exercises:[
      {name:"Treadmill - Incline Pressure",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 8, incline 10-12. This simulates cutting off the ring - relentless forward pressure. Your legs cannot fail.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Peek-A-Boo + Bob Circuit",stationType:"STRENGTH",sets:3,reps:"60s",note:"Hands by temples, chin down. Continuous bob and weave (L-R-L-R). Every time you come up on the right, throw 3 (left hook). Tyson drilled this daily.",combo:"bob-weave + 3",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Body First Attack",stationType:"BAG",sets:3,reps:"60s",note:"Exclusively body shots for first 30s: 5,2,5 (body hook, cross to body, body hook). Last 30s: 5,2,3 (body hook opens the guard, cross, hook to head).",combo:"5,2,5 then 5,2,3",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Explosive Sprint",stationType:"TREADMILL",sets:3,reps:"60s",note:"Speed 11, incline 0. Maximum effort sprint. Champions train faster than they fight. Your body must know what elite pace feels like.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Dumbbell Power Row + Press",stationType:"STRENGTH",sets:3,reps:"60s",note:"5 explosive rows each arm (snap the elbow back fast - this is your cross mechanics), 10 push press. Build the pulling and pressing power Tyson used for his hooks.",combo:"",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Pressure Combination",stationType:"BAG",sets:3,reps:"60s",note:"Move forward into the bag, throw: 1,5,2,5,3. Jab-body hook-cross-body hook-hook. The two body shots build the combination and lower the guard for the final hook.",combo:"1,5,2,5,3 - jab body-hook cross body-hook hook",rest:10,type:"cardio",isTimeBased:true},
      {name:"Treadmill - Variable Beast",stationType:"TREADMILL",sets:3,reps:"60s",note:"Athlete controlled. Push when you have strength, sustain when you do not. 60 seconds of maximum intelligent effort.",combo:"",rest:10,type:"cardio",isTimeBased:true},
      {name:"Iron Core Circuit",stationType:"STRENGTH",sets:3,reps:"60s",note:"Hollow body hold 15s, bicycle crunch 15s, plank-to-push-up 10 reps, Russian twist 15s. Tyson had some of the strongest abdominals in boxing history.",combo:"",rest:10,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Rounds of 8",stationType:"BAG",sets:3,reps:"60s",note:"8 punches all-out (any combination), 8 seconds rest, repeat for 60 seconds. The 8-second rest mimics the micro-breathers in real rounds. Choose your combos: make them 1,2,3,2,1,2,5,2 or your own.",combo:"8 punches, 8s rest x rounds",rest:10,type:"cardio",isTimeBased:true},
    ]},

  // ---- BOXING --------------------------------------------------------
  // -- WARMUP: UPPER BODY (BACK FOCUS) --------------------------------
  {id:"warmup-upper-back",cat:"Warm-Up",name:"Upper Body Warm-Up: Back",sessionCode:"WUB",version:"1.0",tag:"Warm-Up",duration:"12-15 min",
    gary:"Before any pulling session, we need to prime the posterior chain and get the scapulae moving. This warm-up activates your rotator cuff, opens the thoracic spine, and turns on the rear delts and lower traps before they are needed under load.",
    exercises:[
      {name:"Shoulder CARs",sets:2,reps:"5 each direction each arm",note:"Controlled articular rotation. Full range of glenohumeral joint. Slow and deliberate. This is your rotator cuff check-in.",rest:0,type:"recovery"},
      {name:"Scapular Retraction Pulls",sets:2,reps:"15",note:"Hang from bar if available. Squeeze shoulder blades together without bending elbows. Activates lower traps. Non-negotiable before pulling.",rest:15,type:"recovery"},
      {name:"Band Pull-Apart",sets:3,reps:"20",note:"Overhand then underhand. Full spread. Control the return. Rear delt and external rotator primer.",rest:15,type:"recovery"},
      {name:"Dead Hang",sets:2,reps:"30s",note:"Decompress the spine. Let everything hang. Retract at the top to feel the lat engage.",rest:20,type:"recovery"},
      {name:"Hip Hinge (bodyweight)",sets:2,reps:"10",note:"Set the posterior chain before loading it. Drive hips back, maintain neutral spine. Feel the hamstrings load.",rest:0,type:"recovery"},
      {name:"Scapular Push-Up",sets:2,reps:"10",note:"Protract and retract the shoulder blades in a plank. No elbow bend. Pure serratus and trap activation.",rest:0,type:"recovery"},
    ]},
  // -- WARMUP: UPPER BODY (CHEST FOCUS) -------------------------------
  {id:"warmup-upper-chest",cat:"Warm-Up",name:"Upper Body Warm-Up: Push",sessionCode:"WUC",version:"1.0",tag:"Warm-Up",duration:"12-15 min",
    gary:"Pressing sessions get most injuries from cold shoulders and lazy scapular control. We are going to open the pec minor, prime the rotator cuff, and activate serratus anterior before any load goes through the shoulder. Do this every time. No exceptions.",
    exercises:[
      {name:"Shoulder CARs",sets:2,reps:"5 each direction each arm",note:"Full range. Slow. Controlled. This is non-negotiable before pressing.",rest:0,type:"recovery"},
      {name:"Band Pull-Apart",sets:3,reps:"15",note:"Rear delt activation before anterior delt loading. Classic push-pull warm-up principle.",rest:15,type:"recovery"},
      {name:"Scapular Push-Up",sets:2,reps:"12",note:"Serratus anterior activation. This muscle stabilises the scapula during pressing. If it is asleep, your shoulder is unprotected.",rest:15,type:"recovery"},
      {name:"Bodyweight Squat",sets:1,reps:"10",note:"Full body temperature raise. Blood flow before pressing.",rest:0,type:"recovery"},
      {name:"90/90 Hip Stretch",sets:1,reps:"60s each side",note:"Open the hips before any bench work. A tight posterior chain causes excessive arch and back strain during pressing.",rest:0,type:"recovery"},
      {name:"Hip Circle (Active Mobility)",sets:1,reps:"10 each way",note:"Thoracic mobility and total body activation. Final primer before pressing.",rest:0,type:"recovery"},
    ]},
  // -- WARMUP: LOWER BODY FOCUS ----------------------------------------
  {id:"warmup-lower",cat:"Warm-Up",name:"Lower Body Warm-Up",sessionCode:"WLB",version:"1.0",tag:"Warm-Up",duration:"15 min",
    gary:"Lower body training without a proper warm-up is where most knee and hip injuries happen. We are going to activate the glutes, mobilise the hips, and get the tibialis and calves working before loading the legs. This sequence is non-negotiable.",
    exercises:[
      {name:"Hip CARs",sets:2,reps:"5 each direction each leg",note:"Controlled articular rotation of the hip joint. Load the end range. This is the single best hip warm-up movement available.",rest:0,type:"recovery"},
      {name:"90/90 Hip Stretch",sets:2,reps:"60s each side",note:"Active positions. Sit upright. Two positions per side: forward fold over front shin, then rear shin. Open both hip positions before loading.",rest:10,type:"recovery"},
      {name:"Bodyweight Squat",sets:2,reps:"15",note:"Full depth, heels flat, knees tracking toes. Slow descent. This is a movement assessment and warm-up in one.",rest:20,type:"recovery"},
      {name:"Tibialis Raise",sets:2,reps:"20",note:"Tibialis anterior activation. Prevents knee pain and shin splints. 30 seconds of work that saves your knees long-term.",rest:0,type:"recovery"},
      {name:"Banded Lateral Walk",sets:2,reps:"15 steps each way",note:"Glute medius activation. Prevents lateral pelvic drop under load. Required before any single-leg or squat work.",rest:20,type:"recovery"},
      {name:"Hip Hinge (bodyweight)",sets:2,reps:"10",note:"Hamstring and glute activation. Practice the hinge pattern before loading it. Find the position here.",rest:0,type:"recovery"},
    ]},
  // -- WARMUP: RUNNING -------------------------------------------------
  {id:"warmup-running",cat:"Warm-Up",name:"Running Warm-Up",sessionCode:"WRN",version:"1.0",tag:"Warm-Up",duration:"10-12 min",
    gary:"Cold muscles and unprepared tendons are the leading cause of running injuries. This warm-up progressively loads your tibialis, calf, and Achilles before you ask them to absorb thousands of impacts. Do not skip this. It takes 10 minutes and prevents weeks off training.",
    exercises:[
      {name:"Tibialis Raise",sets:2,reps:"20",note:"First movement every time. Activates tibialis anterior. Prevents shin splints. 60 seconds of work that saves your shins.",rest:0,type:"recovery"},
      {name:"Hip CARs",sets:1,reps:"5 each direction each leg",note:"Open the hip joint fully before running. Running on stiff hips creates compensatory knee and lower back issues.",rest:0,type:"recovery"},
      {name:"Patrick Step",sets:2,reps:"15 each leg",note:"Tibialis and ankle warm-up specific to running load. This is the movement that most directly prepares the lower leg for impact.",rest:10,type:"recovery"},
      {name:"Single Leg Calf Raise (Full ROM)",sets:2,reps:"10 each leg",note:"Slow eccentric. Achilles and calf warm-up. Full ROM - heel drop at the bottom is the point. Never load an unwarmed Achilles.",rest:20,type:"recovery"},
      {name:"Banded Lateral Walk",sets:2,reps:"10 steps each way",note:"Glute medius activation before single-leg loading. Every running stride requires this muscle to fire. Wake it up first.",rest:0,type:"recovery"},
      {name:"Hip Hinge (bodyweight)",sets:1,reps:"10",note:"Hamstring activation and posterior chain priming before the impact of running loads it.",rest:0,type:"recovery"},
    ]},
  // -- WARMUP: PLYOMETRIC ----------------------------------------------
  {id:"warmup-plyo",cat:"Warm-Up",name:"Plyometric Warm-Up",sessionCode:"WPL",version:"1.0",tag:"Warm-Up",duration:"15 min",
    gary:"Plyometric training is the highest-force activity most athletes will ever do. Landing from a jump produces 3-8x bodyweight through the joints. The warm-up before a plyometric session must progressively load the tendons and joints from low to high impact. This sequence does exactly that.",
    exercises:[
      {name:"Hip CARs",sets:2,reps:"5 each direction each leg",note:"Full hip range. Slow. Prime every plane before explosive loading.",rest:0,type:"recovery"},
      {name:"Tibialis Raise",sets:2,reps:"20",note:"The tibialis controls dorsiflexion in landing. Warm it up before any jumping or bounding.",rest:0,type:"recovery"},
      {name:"Bodyweight Squat",sets:2,reps:"15",note:"Full depth. Slow eccentric. This is a joint and tendon warm-up. Do not rush it.",rest:15,type:"recovery"},
      {name:"Single Leg Calf Raise (Full ROM)",sets:2,reps:"10 each leg",note:"Calf and Achilles must be fully warmed before explosive calf loading in jumps and bounds.",rest:15,type:"recovery"},
      {name:"Hip Circle (Active Mobility)",sets:2,reps:"10 each way",note:"Dynamic hip mobility. Transition from slow controlled movements to slightly more dynamic loading.",rest:0,type:"recovery"},
      {name:"Box Jump",sets:3,reps:"3",note:"Sub-maximal warm-up jumps. 60-70% effort. Land softly, control the landing, step down. These are not max effort - they are tendon and joint priming.",rest:30,type:"recovery"},
    ]},

  // -- ABS & CORE --------------------------------------------------------
  {id:"abs-core",cat:"Strength",name:"Core & Abs Protocol",sessionCode:"ABS",version:"1.0",tag:"Strength",duration:"25-30 min",
    gary:"Most abs training is useless. Crunches create flexion under load, which is exactly what Stuart McGill says causes disc injury. The best abs training is anti-movement: resist rotation, resist extension, resist lateral flexion. We also train the core in its functional role as a force transmitter. Tim Ferriss identified the myotatic crunch as one of the most effective abs movements available. Jeff Cavaliere proved that absence of lower back pain correlates directly with core strength. We are building a functional midsection.",
    exercises:[
      {name:"Dead Bug",sets:3,reps:"8-10 each side",note:"The McGill-approved foundational anti-extension movement. Lower back pressed flat throughout. This is the safest and most functional ab exercise. Never skip it.",rest:45,rpe:5,tempo:"2-0-2-0",type:"strength"},
      {name:"Plank with Shoulder Tap",sets:3,reps:"10 each side",note:"Anti-rotation core stability. Every tap requires the core to resist rotation. This is the functional demand of running, lifting, and sport. Hips stay square throughout.",rest:45,rpe:6,tempo:"controlled",type:"strength"},
      {name:"Ab Wheel Rollout",sets:3,reps:"8-10",note:"Athlean-X principle: the rectus abdominis works hardest in the fully stretched position. The rollout maximises this stretch. Start from knees. Keep lower back flat and breathe out on the rollout. Never let the back arch.",rest:60,rpe:8,tempo:"3-0-2-0",type:"strength"},
      {name:"Hollow Body Hold",sets:3,reps:"20-30s",note:"The gymnast foundation. Arms overhead, lower back pressed to floor, legs at 30-45 degrees. This is the most demanding anti-extension isometric available. Progress by lowering leg height.",rest:45,rpe:7,tempo:"hold",type:"strength"},
      {name:"Myotatic Crunch",sets:3,reps:"10-12",note:"Tim Ferriss Four Hour Body: performed on a BOSU or rolled towel under the lower back. Full extension at bottom - arms overhead touching floor. Then crunch slowly to peak contraction. The pre-stretch activates the myotatic reflex for maximum motor unit recruitment. 2-3x more effective than standard crunch per rep.",rest:45,rpe:7,tempo:"3-1-2-0",type:"strength"},
      {name:"Pallof Press",sets:3,reps:"12 each side",note:"Athlean-X anti-rotation essential. Cable or band anchored at chest height. Press out, hold 1 second, return. The core must resist the rotational pull the entire time. This is how your core actually functions in sport and life.",rest:45,rpe:6,tempo:"2-1-2-0",type:"strength"},
      {name:"L-Sit Hold (bench or floor)",sets:3,reps:"10-20s",note:"Hip flexor and core compression strength. Hands on bench, legs extended parallel to floor. This loads the hip flexors and core simultaneously in a compressed position. Progress from bent knee to full leg extension.",rest:45,rpe:7,tempo:"hold",type:"strength"},
    ]},

  // -- FEMALE GLUTE: ADD UNILATERAL -------------------------------------
  {id:"glute-unilateral",cat:"Glutes",name:"Glute Unilateral Protocol",sessionCode:"GUP",version:"1.0",tag:"Strength",duration:"45 min",
    gary:"Bilateral training builds strength. Unilateral training builds functional strength. Every step, every stride, every acceleration happens on one leg. If your glutes are not trained to fire hard on each leg independently, you have a strength gap that bilateral work will never fix. This session identifies and corrects left-right imbalances. Expect one side to feel weaker. That is the entire point.",
    exercises:[
      {name:"Bulgarian Split Squat",sets:4,reps:"8-10 each",note:"Rear foot elevated on bench. Front foot far enough forward that your knee does not travel excessively over toes at the bottom. Full depth: rear knee grazes the floor. Lead through the heel to bias glutes over quads.",rest:90,rpe:8,tempo:"3-1-1-0",type:"strength"},
      {name:"Reverse Lunge",sets:3,reps:"10-12 each",note:"Step back into the lunge. Control the descent with the front leg. Drive up through the front heel. The reverse lunge is safer on the knee than forward lunge and allows better glute loading through hip extension.",rest:75,rpe:7,tempo:"3-1-1-0",type:"strength"},
      {name:"Single Leg RDL",sets:3,reps:"8-10 each",note:"Stand on one leg, hinge from the hip. Rear leg extends as counterbalance. Full hip hinge - feel the hamstring and glute load. Neutral spine throughout. This is the single best unilateral posterior chain exercise available.",rest:75,rpe:7,tempo:"3-1-1-0",type:"strength"},
      {name:"Cable Kickback",sets:3,reps:"15 each",note:"Cable at floor level, ankle strap on working leg. Slight forward lean, hinge at hip. Drive the leg back and slightly up - hip extension is the movement, not knee extension. Squeeze at full extension. Return slowly under control. This isolates the gluteus maximus. Both sides - the stretched feeling at the front tells you it is working.",rest:60,rpe:7,tempo:"2-1-2-1",type:"hyper"},
      {name:"Lateral Lunge",sets:3,reps:"10 each",note:"Step laterally, sit back into the hip of the stepping leg. Inside of foot flat on floor. Knee tracks toes. Drive through the heel to return. This loads the adductors and glutes in a lateral plane - a position most training ignores.",rest:60,rpe:6,tempo:"3-1-1-0",type:"strength"},
      {name:"Single Leg Glute Bridge",sets:3,reps:"15 each",note:"Lie on back, one knee bent foot flat, one leg extended. Drive through the grounded heel to elevate hips. Full hip extension at the top, squeeze the glute. Do not let the pelvis drop on the unloaded side. Progress by elevating the foot.",rest:45,rpe:6,tempo:"2-1-2-1",type:"hyper"},
    ]},

];

const STEPS=[
  {id:"trainingAge",title:"Training Experience",sub:"How long have you trained consistently?",type:"select",opts:["Less than 1 year","1-2 years","2-4 years","4-7 years","7+ years"]},
  {id:"age",title:"Your Age",sub:"Age significantly shapes how we programme recovery, intensity and volume.",type:"select",opts:["16-20","21-29","30-39","40-49","50+"]},
  {id:"gender",title:"One More Thing",sub:"This shapes how we structure your programme.",type:"select",opts:["Male","Female","Prefer not to say"]},
  {id:"frequency",title:"Weekly Frequency",sub:"How many days per week can you commit?",type:"select",opts:["3 days","4 days","5 days","6 days"]},
  {id:"goals",title:"Your Goals",sub:"Select all that apply. We build your programme around every one.",type:"multi",opts:["Hypertrophy (muscle size & density)","Strength (max force output)","Aesthetics (lean, proportional physique)","Body Recomposition (lose fat, build muscle)","Athletic Performance","Glute & Lower Body Focus","Marathon / Ultra Running","Long Distance Running","Recreational / 5K-10K Running"]},
  {id:"unit",title:"Units",sub:"Choose your preferred units. All measurements throughout the app will use these.",type:"select",opts:["Metric (kg / km / cm)","Imperial (lbs / miles / ft)"]},
  {id:"bodyStats",title:"Height & Weight",sub:"This helps us contextualise your strength numbers and build the right programme for your body.",type:"inputs",fields:[{key:"height",label:"Height"},{key:"weight",label:"Bodyweight"}]},
  {id:"runningContext",title:"Your Running",sub:"Tell us about your running. Skip if running is not a goal.",type:"inputs",fields:[{key:"weeklyMiles",label:"Weekly mileage"},{key:"longestRun",label:"Longest recent run"},{key:"raceGoal",label:"Next race distance (e.g. 10K, half, marathon)",unit:""}],optional:true},
  {id:"benchmarks",title:"Strength Benchmarks",sub:"Approximate 5-rep max. Honest estimates are fine. Skip if new to lifting.",type:"inputs",fields:[{key:"squat",label:"Back Squat"},{key:"bench",label:"Bench Press"},{key:"deadlift",label:"Deadlift"},{key:"ohp",label:"OHP"}],optional:true},
  {id:"equipment",title:"Equipment Access",sub:"Tell us what equipment you have available. This shapes every session we build.",type:"equipment",optional:false},
  {id:"limitations",title:"Pain / Limitations",sub:"Select any current concerns.",type:"multi",opts:["Lower back","Knees","Shoulders","Hips","Neck","Shin Splints","IT Band","Achilles / Calf","Plantar Fasciitis","None"]},
  {id:"recovery",title:"Recovery Baseline",sub:"Honest answers change the programme.",type:"inputs",fields:[{key:"sleep",label:"Avg sleep per night",unit:"hrs"},{key:"stress",label:"Daily stress level",unit:"/10"}]},
];

const Onboarding=({onComplete})=>{
  const[step,setStep]=useState(0);
  const[ans,setAns]=useState({});
  const[fv,setFv]=useState({});
  const[ms,setMs]=useState([]);
  const cur=STEPS[step];
  const progress=(step/STEPS.length)*100;
  const next=()=>{
    const m={...ans};
    if(cur.type==="select")m[cur.id]=ans[cur.id];
    if(cur.type==="inputs"||cur.type==="bodyStats")m[cur.id]=fv;
    if(cur.type==="multi")m[cur.id]=ms;
    if(cur.type==="equipment")m[cur.id]=fv.equipment||"";
    setAns(m);
    if(step<STEPS.length-1){setStep(s=>s+1);setFv({});setMs([]);}
    else onComplete(m);
  };
  const canNext=cur.optional?true:cur.type==="select"?!!ans[cur.id]:cur.type==="multi"?ms.length>0:cur.type==="equipment"?true:true;
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",padding:"40px 24px 32px",maxWidth:480,margin:"0 auto"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:"0.15em",color:C.txt,marginBottom:32}}>GMT COACH</div>
      <PBar value={progress}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:8,marginBottom:40}}>
        <span style={{fontSize:12,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{step+1}/{STEPS.length}</span>
        <Tag color={C.hyper}>ASSESSMENT</Tag>
      </div>
      <div key={step} className="fu" style={{flex:1}}>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:42,lineHeight:1,letterSpacing:"0.04em",marginBottom:10}}>{cur.title}</h2>
        <p style={{color:C.mid,fontSize:15,marginBottom:36,lineHeight:1.6}}>{cur.sub}</p>
        {cur.type==="select"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {cur.opts.map(o=>{const s=ans[cur.id]===o;return(
            <button key={o} onClick={()=>setAns(a=>({...a,[cur.id]:o}))} style={{background:s?"rgba(0,102,255,0.12)":C.sur,border:`1px solid ${s?"#0066FF":C.bdr}`,borderRadius:8,padding:"16px 20px",cursor:"pointer",textAlign:"left",color:s?"#0066FF":C.txt,fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:s?600:400,transition:"all 0.15s",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              {o}{s&&<span></span>}
            </button>
          );})}
        </div>}
        {cur.type==="multi"&&<div style={{display:"flex",flexWrap:"wrap",gap:10}}>
          {cur.opts.map(o=>{const s=ms.includes(o);return(
            <button key={o} onClick={()=>setMs(m=>s?m.filter(x=>x!==o):[...m,o])} style={{background:s?"rgba(0,102,255,0.12)":C.sur,border:`1px solid ${s?"#0066FF":C.bdr}`,borderRadius:8,padding:"12px 20px",cursor:"pointer",color:s?C.hyper:C.txt,fontSize:14,fontFamily:"'DM Sans',sans-serif",fontWeight:s?600:400,transition:"all 0.15s"}}>{o}</button>
          );})}
        </div>}
        {cur.type==="inputs"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
          {cur.fields.map(f=>{
            const isImp=String(ans.unit||"").includes("Imperial");
            const lbl=(f.label||"").toLowerCase();
            if(f.key==="height"&&isImp) return(
              <div key={f.key}>
                <label style={{fontSize:11,color:C.mid,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",display:"block",marginBottom:8}}>HEIGHT</label>
                <div style={{display:"flex",gap:8}}>
                  {[{k:"heightFt",ph:"5",unit:"ft"},{k:"heightIn",ph:"10",unit:"in"}].map(fi=>(
                    <div key={fi.k} style={{flex:1,display:"flex",alignItems:"center",background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:8,overflow:"hidden"}}>
                      <input type="number" inputMode="numeric" placeholder={fi.ph} value={fv[fi.k]||""} onChange={e=>{
                        const nv={...fv,[fi.k]:e.target.value};
                        const totalCm=(parseFloat(nv.heightFt||0)*30.48+parseFloat(nv.heightIn||0)*2.54).toFixed(1);
                        setFv({...nv,height:totalCm});
                      }} style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"16px 12px",color:C.txt,fontSize:20,fontFamily:"'Space Mono',monospace"}}/>
                      <span style={{padding:"0 12px",color:C.dim,fontSize:13,fontFamily:"'Space Mono',monospace"}}>{fi.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
            return(
              <div key={f.key} style={{marginBottom:4}}>
                <label style={{fontSize:11,color:C.mid,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",display:"block",marginBottom:8}}>{(f.label||"").toUpperCase()}</label>
                <div style={{display:"flex",alignItems:"center",background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:8,overflow:"hidden"}}>
                  <input type={f.type||"text"} inputMode={f.type==="number"?"numeric":"text"} placeholder={f.placeholder||""} value={fv[f.key]||""} onChange={e=>setFv(v=>({...v,[f.key]:e.target.value}))} style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"16px 12px",color:C.txt,fontSize:20,fontFamily:"'Space Mono',monospace"}}/>
                  {f.unit&&<span style={{padding:"0 12px",color:C.dim,fontSize:13,fontFamily:"'Space Mono',monospace"}}>{f.unit}</span>}
                </div>
              </div>
            );
          })}
        </div>}
        {cur.type==="equipment"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:4}}>
            {["Full Gym","Dumbbells","Barbell + Rack","Pull-Up Bar","Cables / Machines","Resistance Bands","Treadmill","Heavy Bag","Kettlebells","Home / Bodyweight Only"].map(eq=>{
              const selected=(fv.equipment||"").includes(eq);
              return <button key={eq} onClick={()=>{
                const cur=(fv.equipment||"");
                const arr=cur?cur.split(",").map(s=>s.trim()).filter(Boolean):[];
                const next=selected?arr.filter(x=>x!==eq):[...arr,eq];
                setFv({...fv,equipment:next.join(", ")});
              }} style={{background:selected?"rgba(0,102,255,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${selected?"#0066FF":"rgba(255,255,255,0.1)"}`,borderRadius:20,padding:"8px 14px",cursor:"pointer",fontSize:13,color:selected?"#0066FF":C.mid,fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}>{eq}</button>;
            })}
          </div>
          <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid rgba(255,255,255,0.08)`,borderRadius:10,padding:14}}>
            <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",marginBottom:8}}>OR DESCRIBE YOUR SETUP</div>
            <textarea value={fv.equipment||""} onChange={e=>setFv({...fv,equipment:e.target.value})} placeholder="e.g. Home gym with squat rack, dumbbells and cables..." style={{width:"100%",background:"transparent",border:"none",outline:"none",color:C.txt,fontSize:14,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,resize:"none",minHeight:80}} rows={3}/>
          </div>
        </div>}
      </div>
      <div style={{marginTop:32}}>
        <Btn onClick={next} disabled={!canNext} style={{width:"100%"}}>{step<STEPS.length-1?"Continue":"Build My Programme"}</Btn>
        {cur.optional&&<button onClick={()=>{setStep(s=>s+1);setFv({});}} style={{width:"100%",background:"transparent",border:"none",color:C.dim,cursor:"pointer",padding:"12px",fontSize:13,marginTop:4}}>{cur.id==="runningContext"?"Skip  -  running isn't a goal":"Skip  -  I'll add this later"}</button>}
        {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{width:"100%",background:"transparent",border:"none",color:C.dim,cursor:"pointer",padding:"14px",fontSize:14,marginTop:4}}> Back</button>}
      </div>
    </div>
  );
};

// --- DAY PICKER ---------------------------------------------------
const ALL_DAYS=["MON","TUE","WED","THU","FRI","SAT","SUN"];
const SESSION_LABELS=["Chest, Shoulders & Triceps","Back, Biceps & Rear Delts","Legs - Quad Dominant","Shoulders & Arms","Chest & Back","Legs - Hamstrings & Glutes","Legs - Glute & Posterior","Runner Strength Foundation","Runner Prehab & Mobility","Runner Upper Body & Core","Runner Plyometrics & Power","Marathon Strength Block"];
const DayPicker=({frequency,onConfirm,profile})=>{
  const max=parseInt(frequency)||4;
  const isFemale=profile?.gender==="Female"||(Array.isArray(profile?.goals)&&profile.goals.some(g=>g.includes("Glute")));
  // For female clients, swap quad-dominant leg day for glute-focused
  const isRunnerSchedule=Array.isArray(profile?.goals)&&profile.goals.some(g=>g.toLowerCase().includes("run")||g.toLowerCase().includes("marathon")||g.toLowerCase().includes("endurance"));
  const goals=Array.isArray(profile?.goals)?profile.goals:[];
  const hasGlute=goals.some(g=>g.includes("Glute")||g.includes("Lower Body"));
  const hasHypertrophy=goals.some(g=>g.includes("Hypertrophy"));
  const hasStrength=goals.some(g=>g.includes("Strength"));
  const hasRecomp=goals.some(g=>g.includes("Recomposition"));

  // Build a smart modular schedule based on goals + frequency
  const getSmartSchedule=(freq,isFemale,hasGlute,hasHypertrophy,hasStrength)=>{
    // Female or glute-focused: more leg days, less upper isolation
    if(isFemale||hasGlute){
      const gluteSchedules={
        3:["Legs - Glute & Posterior","Chest, Shoulders & Triceps","Legs - Hamstrings & Glutes"],
        4:["Legs - Glute & Posterior","Back, Biceps & Rear Delts","Legs - Hamstrings & Glutes","Chest, Shoulders & Triceps"],
        5:["Legs - Glute & Posterior","Back, Biceps & Rear Delts","Legs - Hamstrings & Glutes","Chest, Shoulders & Triceps","Legs - Glute & Posterior"],
        6:["Legs - Glute & Posterior","Back, Biceps & Rear Delts","Legs - Hamstrings & Glutes","Chest, Shoulders & Triceps","Legs - Glute & Posterior","Shoulders & Arms"],
      };
      return gluteSchedules[freq]||gluteSchedules[4];
    }
    // Strength-focused: more compound days
    if(hasStrength&&!hasHypertrophy){
      const strengthSchedules={
        3:["Chest, Shoulders & Triceps","Legs - Quad Dominant","Back, Biceps & Rear Delts"],
        4:["Chest, Shoulders & Triceps","Legs - Quad Dominant","Back, Biceps & Rear Delts","Legs - Hamstrings & Glutes"],
        5:["Chest, Shoulders & Triceps","Legs - Quad Dominant","Back, Biceps & Rear Delts","Chest & Back","Legs - Hamstrings & Glutes"],
        6:["Chest, Shoulders & Triceps","Legs - Quad Dominant","Back, Biceps & Rear Delts","Chest & Back","Legs - Hamstrings & Glutes","Shoulders & Arms"],
      };
      return strengthSchedules[freq]||strengthSchedules[4];
    }
    // Default balanced hypertrophy
    const defaultSchedules={
      3:["Chest, Shoulders & Triceps","Back, Biceps & Rear Delts","Legs - Quad Dominant"],
      4:["Chest, Shoulders & Triceps","Back, Biceps & Rear Delts","Legs - Quad Dominant","Shoulders & Arms"],
      5:["Chest, Shoulders & Triceps","Back, Biceps & Rear Delts","Legs - Quad Dominant","Chest & Back","Legs - Hamstrings & Glutes"],
      6:["Chest, Shoulders & Triceps","Back, Biceps & Rear Delts","Legs - Quad Dominant","Chest & Back","Legs - Hamstrings & Glutes","Shoulders & Arms"],
    };
    return defaultSchedules[freq]||defaultSchedules[4];
  };

  const runnerSchedule=["Runner Strength Foundation","Runner Prehab & Mobility","Runner Upper Body & Core","Runner Plyometrics & Power","Marathon Strength Block","Runner Strength Foundation","Runner Prehab & Mobility"];
  const smartSchedule=getSmartSchedule(max,isFemale,hasGlute,hasHypertrophy,hasStrength);
  const baseLabels=isRunnerSchedule?runnerSchedule:smartSchedule;
  // Extend if user selects more days than schedule has
  const extendedLabels=[...baseLabels,...baseLabels,...baseLabels].slice(0,7);
  const sessionLabels=extendedLabels;
  const[sel,setSel]=useState([]);
  const toggle=d=>{if(sel.includes(d))setSel(s=>s.filter(x=>x!==d));else if(sel.length<max)setSel(s=>[...s,d]);};
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",padding:"48px 24px 40px",maxWidth:480,margin:"0 auto"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:"0.15em",color:C.txt,marginBottom:40}}>GMT COACH</div>
      <div className="fu">
        <Tag>SCHEDULE</Tag>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:42,lineHeight:1,letterSpacing:"0.04em",margin:"12px 0 8px"}}>PICK YOUR DAYS</h2>
        <p style={{color:C.mid,fontSize:15,marginBottom:4,lineHeight:1.6}}>Choose {max} training days. Sessions assign in order.</p>
        <p style={{color:C.dim,fontSize:12,marginBottom:12}}>You can adjust this every week.</p>
        {isRunnerSchedule&&<div style={{background:"rgba(0,230,181,0.06)",border:"1px solid rgba(0,230,181,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:20}}>
          <p style={{fontSize:12,color:C.recovery,lineHeight:1.6}}>Runner schedule detected. We recommend alternating strength and prehab sessions, with rest or easy run days between. Avoid heavy strength the day before long runs.</p>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:24}}>
          {ALL_DAYS.map(d=>{const s=sel.includes(d);const idx=sel.indexOf(d);return(
            <div key={d} onClick={()=>toggle(d)} style={{cursor:"pointer",borderRadius:10,padding:"14px 4px 12px",background:s?"rgba(0,102,255,0.12)":C.sur,border:`1px solid ${s?"#0066FF":C.bdr}`,textAlign:"center",transition:"all 0.15s",userSelect:"none"}}>
              <div style={{fontSize:9,fontFamily:"'Space Mono',monospace",color:s?C.hyper:C.dim,marginBottom:8}}>{d}</div>
              <div style={{width:22,height:22,borderRadius:6,margin:"0 auto",background:s?C.hyper:C.bdr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:s?"#FFFFFF":C.dim,fontFamily:"'Space Mono',monospace"}}>{s?idx+1:""}</div>
            </div>
          );})}
        </div>
        {sel.length>0&&<div className="fu" style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em"}}>SESSION MAP</div>
            {(isFemale||hasGlute)&&<div style={{fontSize:10,color:C.recovery,fontFamily:"'Space Mono',monospace"}}>GLUTE PROTOCOL</div>}
            {isRunnerSchedule&&<div style={{fontSize:10,color:C.recovery,fontFamily:"'Space Mono',monospace"}}>RUNNER SCHEDULE</div>}
          </div>
          {sel.map((d,i)=>{
            const label=sessionLabels[i]||`Session ${i+1}`;
            const isLeg=label.toLowerCase().includes("leg")||label.toLowerCase().includes("glute")||label.toLowerCase().includes("posterior")||label.toLowerCase().includes("hamstring");
            return(
            <div key={d} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<sel.length-1?`1px solid ${C.bdr}`:"none"}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:C.mid}}>{d}</span>
              <span style={{fontSize:13,fontWeight:600,color:isLeg&&(isFemale||hasGlute)?C.strength:C.txt}}>{label}</span>
            </div>
          );})}
        </div>}
        {(isFemale||hasGlute)&&sel.length>0&&<div style={{background:C.strengthG,border:`1px solid ${C.strength}30`,borderRadius:8,padding:"10px 14px",marginBottom:16}}>
          <p style={{fontSize:12,color:C.mid,lineHeight:1.6}}>Programme customised around your glute and lower body goals. More leg days, less upper isolation. You can adjust individual days after setup.</p>
        </div>}
        <div style={{color:C.dim,fontSize:11,fontFamily:"'Space Mono',monospace",marginBottom:24,textAlign:"center"}}>{sel.length}/{max} days selected</div>
      </div>
      <Btn disabled={sel.length!==max} onClick={()=>{const sch=sel.reduce((a,d,i)=>{a[d]=sessionLabels[i%sessionLabels.length]||`Session ${i+1}`;return a;},{});onConfirm(sch);}} style={{width:"100%",marginTop:"auto"}}>Confirm Week </Btn>
    </div>
  );
};

// --- PROGRAMMING LOGIC BY LEVEL ---------------------------------
const getLevel=(trainingAge)=>{
  if(trainingAge==="7+ years")return"advanced";
  if(trainingAge==="4-7 years")return"advanced";
  if(trainingAge==="2-4 years")return"intermediate";
  if(trainingAge==="1-2 years")return"beginner";
  return"beginner";
};

// Returns adapted prescription based on athlete level + movement type
// weakMovements = corrective/isolation work that always uses science-based volume regardless of level
const getPrescription=(level,movementType)=>{
  // Corrective and weak-area movements always use volume approach regardless of level
  if(movementType==="corrective"||movementType==="mobility"){
    return{sets:"3",reps:"15-20",rpe:6,rest:60,note:"Science-based volume. Not intensity work."};
  }
  // Glute isolation  sports science research supports higher reps for max fibre recruitment
  if(movementType==="glute-iso"){
    return{sets:"3-4",reps:"12-20",rpe:8,rest:60,note:"Full squeeze at top. the protocol."};
  }
  if(level==="advanced"){
    if(movementType==="compound")return{sets:"12",reps:"6-8",rpe:10,rest:180,note:"One true working set. Absolute failure. Mentzer/Yates HIT."};
    if(movementType==="accessory")return{sets:"2",reps:"8-10",rpe:9,rest:120,note:"To failure or one rep shy. No junk volume."};
    if(movementType==="isolation")return{sets:"2",reps:"8-10",rpe:9,rest:90,note:"Full contraction to failure. Squeeze is everything."};
  }
  if(level==="intermediate"){
    if(movementType==="compound")return{sets:"3",reps:"6-10",rpe:8,rest:150,note:"Last set to failure or near-failure."};
    if(movementType==="accessory")return{sets:"3",reps:"8-12",rpe:8,rest:90,note:"Controlled. Last set pushed hard."};
    if(movementType==="isolation")return{sets:"3",reps:"10-12",rpe:8,rest:75,note:"MMC first. Squeeze every rep."};
  }
  // beginner
  if(movementType==="compound")return{sets:"3",reps:"8-10",rpe:7,rest:150,note:"Learn the pattern. RPE 7 max."};
  if(movementType==="accessory")return{sets:"3",reps:"10-12",rpe:7,rest:90,note:"Technique over load."};
  return{sets:"3",reps:"10-12",rpe:7,rest:75,note:"Feel the muscle. Not the weight."};
};

// --- GARY SYSTEM PROMPT -------------------------------------------
const sanitise=(s)=>String(s||"").replace(/[\u0000-\u001F]/g," ");
const stripMd=(s)=>String(s||"").replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/^#+\s/gm,"").replace(/^-\s/gm,"").trim();
const buildPrompt=(profile,introMode=false,workoutCtx=null)=>{
  const b=profile?.benchmarks||{};
  const unitLabel=String(profile?.unit||"").includes("Imperial")?"lbs":"kg";
  const distLabel=String(profile?.unit||"").includes("Imperial")?"miles":"km";
  const heightLabel=String(profile?.unit||"").includes("Imperial")?"ft/in":"cm";
  const lims=(profile?.limitations||[]).filter(x=>x!=="None");
  const rec=profile?.recovery||{};
  const gender=sanitise(profile?.gender||"not specified");
  const isFemale=gender==="Female";
  const hasGluteGoal=Array.isArray(profile?.goals)&&profile.goals.some(g=>g.includes("Glute"));
  const isRunnerProfile=Array.isArray(profile?.goals)&&profile.goals.some(g=>g.toLowerCase().includes("run")||g.toLowerCase().includes("marathon")||g.toLowerCase().includes("endurance"));
  const runCtx=profile?.runningContext||{};
  const level=getLevel(profile?.trainingAge);
  const age=sanitise(profile?.trainingAge||"unknown");
  const freq=sanitise(profile?.frequency||"4 days");
  const goal=sanitise(profile?.goals||"Aesthetics");

  const base=[
    "You are Gary Mulholland -- an elite strength, physique, and performance coach. Your coaching is a synthesis of the greatest training minds:",
    "Arnold Schwarzenegger (golden era aesthetics, mind-muscle connection), Dorian Yates + Mike Mentzer (intensity-first, stimulus over volume), Chris Bumstead (precision hypertrophy, modern physique standards), Mike Thurston (balanced aesthetics, practical programming), Jeff Nippard (evidence-based method, stimulus-to-fatigue ratio), Charles Poliquin (structural balance, antagonist pairing, German Volume Training), Pavel Tsatsouline (tension efficiency, strength-skill, grease the groove), Brett Contreras (glute science, hip thrust biomechanics), Ben Patrick / Knees Over Toes (tibialis work, ATG squat, connective tissue longevity), Stuart McGill (spinal mechanics, anti-rotation core, Big 3), Andrew Huberman (circadian performance, recovery science, dopamine-driven motivation), Jeff Brigham (athleticism, explosive output, unilateral stability).",
    "",
    "GMT DOCTRINE: Train like an athlete. Build like a bodybuilder. Recover like a specialist. Think like a scientist.",
    "Core principles: (1) Training is stimulus -- not exhaustion. Every set must have purpose. (2) Strength is the foundation -- even in hypertrophy phases. (3) Hypertrophy is precision engineering -- full ROM, controlled eccentrics, stretch-biased loading. (4) Athleticism protects the system -- unilateral work, explosive output, joint integrity. (5) Longevity is non-negotiable -- McGill spinal mechanics, Ben Patrick joint loading, connective tissue adaptation. (6) Recovery drives adaptation -- sleep, nutrition, stress, active recovery.",
    "",
    "COACHING PHILOSOPHY: RPE 7-9 on working sets. Failure used selectively on isolation. Intensity methods (drop sets, rest-pause, tempo) applied late in sessions. Strength and hypertrophy are integrated, not competing goals.",
    "",
    "TONE - CRITICAL:",
    "- Firm, direct, and genuinely encouraging. You believe in this athlete.",
    "- Challenge them, but always with the energy of someone who knows they can do it.",
    "- Never condescending. Never harsh. Never dismissive.",
    "- When correcting, acknowledge the effort first, then redirect. Example: 1-2 RIR is a solid safety margin for most people. At your level and with your numbers, we can push further. True failure on the working set is where the real growth signal lives.",
    "- Short sentences. One follow-up question. Directive first.",
    "- NEVER use markdown asterisks (**) in your responses. Plain text only. No bold, no headers, no bullet symbols.",
    "- Never say: great question, absolutely, certainly, of course.",
    "",
    "MIND-MUSCLE CONNECTION - NON-NEGOTIABLE:",
    "- Find the squeeze before you move the weight.",
    "- If you cannot feel it, you are not training it.",
    "- Slow the eccentric. Own every inch.",
    "",
    "COMMUNICATION STYLE:",
    "- Direct. Dense. No filler.",
    "- Use we for the programme.",
    "- Use proper punctuation always. Use commas, dashes, and full stops correctly. Never leave double spaces instead of a dash.",
    "- Format responses as clean plain paragraphs. No asterisks. No markdown. Just sentences and paragraphs.",
    "",
    "CLIENT PROFILE:",
    "- Gender: "+gender,
    "- Age range: "+sanitise(profile?.age||"not specified"),"- Training experience: "+age+" / Level: "+level.toUpperCase(),
    "- Frequency: "+freq,
    "- Goals: "+(Array.isArray(profile?.goals)?profile.goals.join(", "):goal),
    "- 5RMs: Squat "+sanitise(b.squat||"?")+unitLabel+", Bench "+sanitise(b.bench||"?")+unitLabel+", Deadlift "+sanitise(b.deadlift||"?")+unitLabel+", OHP "+sanitise(b.ohp||"?")+unitLabel+"",
    "- Height: "+sanitise(profile?.bodyStats?.height||"?")+heightLabel+", Bodyweight: "+sanitise(profile?.bodyStats?.weight||"?")+unitLabel+",",
    "- Body context: Use height and weight to contextualise strength numbers (e.g. relative strength = lift / bodyweight). A 70kg athlete squatting 120kg is different from a 100kg athlete squatting 120kg.",
    "- Limitations: "+(lims.length?lims.join(", "):"None"),
    "- Sleep: "+sanitise(rec.sleep||"?")+"hrs, Stress: "+sanitise(rec.stress||"?")+"/10",
    ...(isRunnerProfile?[
      "- Runner profile: YES",
      "- Weekly mileage: "+sanitise(runCtx.weeklyMiles||"not provided"),
      "- Longest recent run: "+sanitise(runCtx.longestRun||"not provided"),
      "- Race goal: "+sanitise(runCtx.raceGoal||"not specified"),
    ]:[]),
  ];

  const advanced=[
    "",
    "PROGRAMMING - ADVANCED CLIENT (7+ years of real training):",
    "This is an athlete. Treat them accordingly.",
    "1-2 true working sets per compound. To absolute failure. 6-8 reps on compounds.",
    "2 sets on accessories, 8-10 reps, to failure or one rep shy.",
    "Corrective work: science-based volume always (15-20 reps, 3 sets).",
    "Intensity is everything. Volume is the enemy of intensity at this level.",
    "When referencing their experience, say 7+ years or more - never just 7.",
  ];
  const intermediate=[
    "",
    "PROGRAMMING - INTERMEDIATE CLIENT:",
    "Compound: 3 sets, 6-10 reps, last set to near-failure.",
    "Accessories: 3 sets, 8-12 reps, last set pushed hard.",
    "Isolation: 3 sets, 10-12 reps, MMC first.",
    "Corrective work: science-based volume always.",
  ];
  const beginner=[
    "",
    "PROGRAMMING - DEVELOPING CLIENT:",
    "Compound: 3 sets, 8-10 reps, RPE 7-8. Pattern first.",
    "Accessories: 3 sets, 10-12 reps, technique over load.",
    "Do not push to failure yet.",
  ];
  const runnerBlock=isRunnerProfile?[
    "",
    "RUNNER CLIENT - PROGRAMMING PRIORITIES:",
    "This athlete is a runner. Strength and prehab work must complement their running, not compete with it.",
    "",
    "STRENGTH TRAINING PHILOSOPHY FOR RUNNERS:",
    "1. Injury prevention first. Tibialis, achilles, adductors, glute medius are the most commonly neglected and most commonly injured.",
    "2. Ben Patrick / ATG principles: knee-over-toe training is not dangerous - it is exactly what the knee needs. ATG split squat, Patrick Step, full ROM calf raises are non-negotiable.",
    "3. Unilateral work is priority over bilateral. Every running stride is a single-leg event. Single-leg RDL, single-leg calf raise, ATG split squat.",
    "4. Plyometric work improves running economy by 3-6%. Box jumps, bounding, and reactive work should be included 1x per week.",
    "5. Heavy lifting is appropriate. Strong glutes, hamstrings and calves reduce ground contact time and improve efficiency.",
    "6. Core work is anti-rotation, not flexion. Dead bug, Copenhagen plank, pallof press. Crunches are not the goal.",
    "",
    "SCHEDULING FOR RUNNERS:",
    "- Strength sessions ideally done AFTER easy runs, not before hard runs.",
    "- Prehab/mobility sessions work well as active recovery the day after hard running.",
    "- Never prescribe heavy leg strength the day before a long run or race.",
    "- Recovery weeks every 3-4 weeks are more important for runners than for lifters.",
    "",
    "RUNNING-SPECIFIC INJURIES TO ADDRESS:",
    "Shin splints = tibialis anterior weakness and overload. Patrick Step and tibialis raises are the fix.",
    "Runner's knee (PFPS) = weak VMO and glute medius. ATG split squat and banded lateral walks.",
    "IT band syndrome = weak glute medius and hip abductors. Copenhagen plank and lateral work.",
    "Achilles tendinopathy = eccentric calf work. Single-leg calf raises with slow eccentric.",
    "Plantar fasciitis = calf tightness and foot weakness. Full ROM calf work and intrinsic foot strengthening.",
    "Hamstring strain = Nordic curl eccentric work. Single-leg RDL.",
    "",
    "KEY COACHES AND REFERENCES:",
    "Ben Patrick (ATG Training): knees-over-toes protocol, tibialis work, full range lower body health.",
    "Stuart McGill: spine hygiene, anti-rotation core, dead bug over crunches.",
    "Alfredson protocol: eccentric heel drop for achilles tendinopathy.",
    "Jack Daniels: running phases - base, build, quality, taper. Strength work complements each phase.",
  ]:[];
  const femaleBlock=[
    "",
    "FEMALE CLIENT - GLUTE-FOCUSED PROTOCOL:",
    "Hip thrust anchors every leg session. It is the highest-priority movement.",
    "Glutes respond to both heavy loading (8-12 reps) and higher-rep isolation (15-20 reps). Use both.",
    "Prioritise: glutes, hamstrings, upper back posture. Shoulder width is rarely the goal.",
    "Do not patronise with light weights. Progressive overload applies fully.",
  ];
  const introBlock=[
    "",
    "INTRO MODE: You just received this assessment.",
    "1. Pick ONE interesting or specific detail from their profile to open with - something that shows you actually read it.",
    "2. Ask ONE clarifying question that will help you programme better for them.",
    "3. When the conversation feels complete, ask: Ready to get to work?",
    "4. When they confirm ready, respond warmly and transition: short, energising, forward-looking.",
    "One question per message. Keep it conversational. Build confidence.",
    "IMPORTANT: When a client says they are ready or confirms equipment, accept it and move forward. Do not interrogate or repeat questions.",
  ];
  const age_range=sanitise(profile?.age||"");
  const ageBlock=age_range==="40-49"||age_range==="50+"?[
    "",
    "AGE-AWARE PROGRAMMING ("+age_range+"):",
    "This athlete is in the "+age_range+" range. Key adjustments:",
    "- Recovery takes longer. Never programme two consecutive high-intensity days.",
    "- Joint health is paramount. Prioritise tempo, form, and range of motion over load.",
    "- Hormonal context means progressive overload still works but adaptation is slower.",
    "- Sleep and stress management are amplified in importance.",
    "- Warm-up and mobility work are non-negotiable, not optional.",
  ]:age_range==="16-20"?[
    "",
    "AGE-AWARE PROGRAMMING (16-20):",
    "Young athlete. Prioritise movement quality and habit formation above all else.",
    "Progressive overload works extremely well at this age. Do not rush to failure training.",
    "Technique errors at this age become lifelong patterns. Correct them early.",
  ]:[];
  const ongoingBlock=[
    "",
    "ONGOING MODE: Active programme. Daily coach. Reactive, precise, context-aware.",
  ];
  const workoutBlock=workoutCtx?[
    "",
    "ACTIVE WORKOUT:",
    "Session: "+sanitise(workoutCtx.name),
    "Exercise: "+sanitise(workoutCtx.currentExercise||"warming up"),
    "Sets done: "+sanitise(workoutCtx.completedSets||0),
    "Notes: "+sanitise(workoutCtx.notes||"none"),
    "Be brief. One cue. One question. Never lecture mid-set.",
  ]:[];

  const lines=[
    ...base,
    ...(level==="advanced"?advanced:level==="intermediate"?intermediate:beginner),
    ...((isFemale||hasGluteGoal)?femaleBlock:[]),
    ...runnerBlock,
    ...ageBlock,
    ...workoutBlock,
    ...(introMode?introBlock:ongoingBlock),
  ];
  return lines.join("\n");
};


// --- TEMPO TIMER ---------------------------------------------------
// Guides athlete through each phase of a lift rep-by-rep
// Tempo format: E-I-C-P (eccentric-isometric-concentric-pause)
// e.g. "3-1-1-0" = 3s down, 1s pause, 1s up, 0s reset
const parseTempoStr=(tempo)=>{
  const parts=String(tempo||"2-0-1-0").split("-").map(Number);
  return{ecc:parts[0]||2,iso:parts[1]||0,con:parts[2]||1,pause:parts[3]||0};
};
const TEMPO_PHASES=[
  {key:"ecc",label:"LOWER",color:"#0066FF",hint:"Resist on the way down"},
  {key:"iso",label:"PAUSE",color:"#FF8C00",hint:"Hold at bottom"},
  {key:"con",label:"LIFT",color:"#00E676",hint:"Drive through the muscle"},
  {key:"pause",label:"RESET",color:"#AA00FF",hint:"Reset and breathe"},
];

const TempoTimer=({ex,reps,onDone,onSkip,onNext,setNumber,totalSets})=>{
  const tempo=parseTempoStr(ex?.tempo);
  const totalReps=parseInt(String(reps||"8").split("-")[0])||8;
  const[repsDone,setRepsDone]=React.useState(0);
  const[phaseIdx,setPhaseIdx]=React.useState(0);
  const[phaseSec,setPhaseSec]=React.useState(0);
  const[running,setRunning]=React.useState(false);
  const[done,setDone]=React.useState(false);
  const phases=TEMPO_PHASES.filter(p=>tempo[p.key]>0);
  const totalRepTime=TEMPO_PHASES.reduce((s,p)=>s+(tempo[p.key]||0),0);
  const phase=phases[phaseIdx]||phases[0];
  const phaseDur=tempo[phase?.key||"ecc"]||1;
  
  // Circular progress
  const R=80,circ=2*Math.PI*R;
  const progress=running?(phaseDur-phaseSec)/phaseDur:0;
  const dash=circ*progress;
  
  React.useEffect(()=>{
    if(!running||done)return;
    if(phaseSec>=phaseDur){
      // Move to next phase
      const nextPhaseIdx=(phaseIdx+1)%phases.length;
      if(phaseIdx===phases.length-1){
        // Completed one rep
        const newReps=repsDone+1;
        if(newReps>=totalReps){
          setDone(true);
          setRunning(false);
          setTimeout(onDone,300);
          return;
        }
        setRepsDone(newReps);
        setPhaseIdx(0);
        setPhaseSec(0);
      } else {
        setPhaseIdx(nextPhaseIdx);
        setPhaseSec(0);
      }
      return;
    }
    const t=setTimeout(()=>setPhaseSec(s=>s+1),1000);
    return()=>clearTimeout(t);
  },[running,phaseSec,phaseIdx,repsDone,done]);
  
  const handleStart=()=>{setRunning(true);setPhaseIdx(0);setPhaseSec(0);setRepsDone(0);setDone(false);};
  const phaseColor=phase?.color||C.hyper;
  
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"60px 24px 24px",maxWidth:480,margin:"0 auto"}}>
      {/* Header */}
      <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <button onClick={onSkip} style={{background:"none",border:"none",color:C.dim,fontSize:13,cursor:"pointer",fontFamily:"'Space Mono',monospace"}}>Exit</button>
        <span style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em"}}>SET {setNumber} / {totalSets}</span>
      </div>
      <div style={{fontSize:10,color:C.mid,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:6,textAlign:"center"}}>TEMPO GUIDE</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:"0.04em",textAlign:"center",marginBottom:4,color:C.txt}}>{ex?.name}</div>
      <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:24,textAlign:"center"}}>TEMPO {String(ex?.tempo||"2-0-1-0")} &bull; {totalReps} REPS &bull; REP {Math.min(repsDone+1,totalReps)}/{totalReps}</div>
      
      {/* Circular timer */}
      <div style={{position:"relative",width:200,height:200,marginBottom:24}}>
        <svg width="200" height="200" style={{transform:"rotate(-90deg)"}}>
          <circle cx="100" cy="100" r={R} fill="none" stroke={C.sur} strokeWidth="12"/>
          <circle cx="100" cy="100" r={R} fill="none" stroke={phaseColor} strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{transition:"stroke-dasharray 0.8s linear,stroke 0.3s"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          {running?(
            <>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:54,lineHeight:1,color:phaseColor,letterSpacing:"0.02em"}}>{phaseDur-phaseSec}</div>
              <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.15em",marginTop:2}}>{phase?.label}</div>
            </>
          ):(
            <>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,lineHeight:1,color:C.hyper,letterSpacing:"0.02em"}}>{done?"DONE":String(ex?.tempo||"2-0-1-0")}</div>
              <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginTop:2}}>{done?"SET COMPLETE":"PRESS START"}</div>
            </>
          )}
        </div>
      </div>
      
      {/* Phase breakdown */}
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap",justifyContent:"center"}}>
        {TEMPO_PHASES.map((p,i)=>{
          const dur=tempo[p.key];
          const isActive=running&&phases[phaseIdx]?.key===p.key;
          const isDone=running&&(phaseIdx>phases.indexOf(p)||(repsDone>0));
          return(
            <div key={p.key} style={{background:isActive?p.color+"22":C.sur,border:`1px solid ${isActive?p.color:C.bdr}`,borderRadius:8,padding:"6px 12px",textAlign:"center",minWidth:56,transition:"all 0.2s"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:isActive?p.color:dur===0?C.dim:C.txt,lineHeight:1}}>{dur||0}</div>
              <div style={{fontSize:8,color:isActive?p.color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em"}}>{p.label}</div>
            </div>
          );
        })}
      </div>
      
      {/* Cue */}
      {running&&<div style={{fontSize:13,color:C.mid,fontFamily:"'DM Sans',sans-serif",textAlign:"center",marginBottom:24,minHeight:20,fontStyle:"italic"}}>{phase?.hint}</div>}
      
      {/* Rep progress dots */}
      <div style={{display:"flex",gap:6,marginBottom:32}}>
        {Array.from({length:totalReps}).map((_,i)=>(
          <div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<repsDone?C.hyper:i===repsDone&&running?phaseColor:C.bdr,transition:"all 0.3s"}}/>
        ))}
      </div>
      
      {/* Controls */}
      {!running&&!done&&<button onClick={handleStart} style={{width:"100%",maxWidth:320,padding:"16px",background:C.hyperG,border:"none",borderRadius:12,cursor:"pointer",fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:"0.08em",color:C.txt}}>START SET</button>}
      {!running&&done&&(
        <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={onNext} style={{width:"100%",padding:"16px",background:C.hyperG,border:"none",borderRadius:12,cursor:"pointer",fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.08em",color:C.txt}}>Next Exercise</button>
          <button onClick={onDone} style={{width:"100%",padding:"12px",background:"none",border:`1px solid ${C.bdr}`,borderRadius:12,cursor:"pointer",fontFamily:"'Space Mono',monospace",fontSize:12,color:C.mid}}>Rest Timer</button>
        </div>
      )}
      {running&&<button onClick={()=>{setRunning(false);}} style={{padding:"10px 28px",background:"none",border:`1px solid ${C.bdr}`,borderRadius:10,cursor:"pointer",fontFamily:"'Space Mono',monospace",fontSize:11,color:C.dim}}>Pause</button>}
    </div>
  );
};

// --- REST TIMER ---------------------------------------------------
const RestTimer=({seconds,onDone,onSkip,logEx,logData,onUpdateLog,unitLabel})=>{
  const[remaining,setRemaining]=useState(seconds);
  useEffect(()=>{
    if(remaining<=0){onDone();return;}
    const t=setInterval(()=>setRemaining(r=>r-1),1000);
    return()=>clearInterval(t);
  },[remaining]);
  const pct=(remaining/seconds)*100;
  const radius=44;const circ=2*Math.PI*radius;
  const lastSetIdx=logEx?(logData?.setsCompleted||1)-1:null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(10,10,11,0.94)",backdropFilter:"blur(20px)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:"0 32px"}}>
      <div style={{fontSize:10,color:C.hyper,fontFamily:"'Space Mono',monospace",letterSpacing:"0.2em"}}>REST</div>
      <div style={{position:"relative",width:110,height:110}}>
        <svg width="110" height="110" style={{transform:"rotate(-90deg)"}}>
          <circle cx="55" cy="55" r={radius} fill="none" stroke={C.bdr} strokeWidth="4"/>
          <circle cx="55" cy="55" r={radius} fill="none" stroke={C.hyper} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,lineHeight:1,color:remaining<=10?C.red:C.txt}}>{remaining}</span>
          <span style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>SEC</span>
        </div>
      </div>
      {logEx&&lastSetIdx>=0&&onUpdateLog&&<div style={{width:"100%",maxWidth:320,background:C.sur,border:`1px solid ${C.bdrL}`,borderRadius:12,padding:"14px 16px"}}>
        <div style={{fontSize:9,color:C.hyper,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>LOG SET {lastSetIdx+1} - {String(logEx.name||"").toUpperCase()}</div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:4}}>REPS</div>
            <input type="number" inputMode="numeric" placeholder="reps" value={logData?.sets?.[lastSetIdx]?.reps||""} onChange={e=>onUpdateLog(lastSetIdx,"reps",e.target.value)} style={{width:"100%",background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px",color:C.txt,fontSize:18,fontFamily:"'Space Mono',monospace",outline:"none",textAlign:"center"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:4}}>{(unitLabel||"kg").toUpperCase()}</div>
            <input type="number" inputMode="decimal" placeholder={unitLabel||"kg"} value={logData?.sets?.[lastSetIdx]?.weight||""} onChange={e=>onUpdateLog(lastSetIdx,"weight",e.target.value)} style={{width:"100%",background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px",color:C.txt,fontSize:18,fontFamily:"'Space Mono',monospace",outline:"none",textAlign:"center"}}/>
          </div>
        </div>
        <div style={{fontSize:10,color:C.dim,textAlign:"center",marginTop:8,fontFamily:"'Space Mono',monospace"}}>Log now, lift again in {remaining}s</div>
      </div>}
      <button onClick={onSkip} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px 32px",color:C.mid,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Skip Rest</button>
    </div>
  );
};


// --- MUSCLE DIAGRAM -------------------------------------------------
// Maps exercise muscle names to SVG body region highlights
const MUSCLE_MAP = {
  // Capitalised aliases (from EXERCISES array)
  "chest":           {front:["chest"],back:[]},
  "back":            {front:[],back:["lats","upper-back","traps"]},
  "legs":            {front:["quads","adductors"],back:["hamstrings","glutes","calves"]},
  "shoulders":       {front:["front-delt"],back:["rear-delt","traps"]},
  "biceps":          {front:["biceps"],back:[]},
  "triceps":         {front:[],back:["triceps"]},
  "hips":            {front:["hip-flexors","adductors"],back:["glutes"]},
  "shoulders":       {front:["front-delt"],back:["rear-delt","traps"]},
  "hips":            {front:["hip-flexors","adductors"],back:["glutes"]},
  "biceps":          {front:["biceps"],back:[]},
  "triceps":         {front:[],back:["triceps"]},
  // Chest
  "chest":           {front:["chest"],back:[]},
  "pectorals":       {front:["chest"],back:[]},
  // Back
  "lats":            {front:[],back:["lats"]},
  "upper back":      {front:[],back:["upper-back"]},
  "lower back":      {front:[],back:["lower-back"]},
  "rhomboids":       {front:[],back:["upper-back"]},
  "traps":           {front:[],back:["traps"]},
  // Shoulders
  "shoulders":       {front:["front-delt"],back:["rear-delt"]},
  "front delt":      {front:["front-delt"],back:[]},
  "rear delt":       {front:[],back:["rear-delt"]},
  "rotator cuff":    {front:["front-delt"],back:["rear-delt"]},
  // Arms
  "biceps":          {front:["biceps"],back:[]},
  "triceps":         {front:[],back:["triceps"]},
  "forearms":        {front:["forearms"],back:[]},
  // Core
  "core":            {front:["abs","obliques"],back:["lower-back"]},
  "abs":             {front:["abs"],back:[]},
  "obliques":        {front:["obliques"],back:[]},
  // Legs
  "quads":           {front:["quads"],back:[]},
  "hamstrings":      {front:[],back:["hamstrings"]},
  "glutes":          {front:[],back:["glutes"]},
  "calves":          {front:[],back:["calves"]},
  "hip flexors":     {front:["hip-flexors"],back:[]},
  "adductors":       {front:["adductors"],back:[]},
  "tibialis":        {front:["tibialis"],back:[]},
};

// SVG path data for each body region (simplified anatomical shapes)
const BODY_PATHS = {
  // FRONT view
  head:       "M110,10 Q130,8 140,20 Q148,35 145,55 Q140,70 130,75 Q120,78 110,75 Q100,78 90,75 Q80,70 75,55 Q72,35 80,20 Q90,8 110,10 Z",
  neck:       "M100,75 Q110,72 120,75 L118,95 Q110,92 102,95 Z",
  chest:      "M72,95 Q110,88 148,95 L152,145 Q130,155 110,152 Q90,155 68,145 Z",
  "front-delt":"M60,90 Q72,85 78,100 L75,130 Q62,135 55,120 Q50,105 60,90 Z M148,90 Q158,105 145,120 Q138,135 125,130 L122,100 Q128,85 140,90 Z",
  biceps:     "M52,128 Q62,125 68,140 L65,175 Q55,178 48,165 Q44,150 52,128 Z M148,128 Q156,150 152,165 Q145,178 135,175 L132,140 Q138,125 148,128 Z",
  forearms:   "M46,173 Q56,170 62,180 L58,215 Q50,218 44,208 Q40,195 46,173 Z M154,173 Q160,195 156,208 Q150,218 142,215 L138,180 Q144,170 154,173 Z",
  abs:        "M85,152 Q110,148 135,152 L132,210 Q110,215 88,210 Z",
  obliques:   "M68,148 Q85,152 88,210 L80,225 Q65,215 62,195 Q60,175 68,148 Z M132,210 Q135,152 152,148 Q158,175 158,195 Q155,215 140,225 Z",
  "hip-flexors":"M85,208 Q110,215 135,208 L138,245 Q110,250 82,245 Z",
  quads:      "M80,245 Q98,242 105,260 L100,320 Q88,325 78,315 Q70,300 80,245 Z M120,245 Q130,300 122,315 Q112,325 100,320 L115,260 Q122,242 120,245 Z",
  adductors:  "M103,260 Q110,258 117,260 L115,320 Q110,322 105,320 Z",
  tibialis:   "M82,320 Q90,318 92,330 L90,375 Q84,378 80,368 Q76,350 82,320 Z M108,320 Q114,350 110,368 Q106,378 100,375 L98,330 Q100,318 108,320 Z",
  // BACK view
  traps:      "M72,95 Q110,88 148,95 L145,120 Q110,112 75,120 Z",
  "upper-back":"M72,120 Q110,112 148,120 L148,165 Q110,170 72,165 Z",
  "lower-back":"M75,165 Q110,170 145,165 L142,210 Q110,215 78,210 Z",
  lats:       "M60,115 Q75,120 72,165 L68,195 Q55,185 52,165 Q48,140 60,115 Z M160,115 Q172,140 168,165 Q165,185 152,195 L148,165 Q145,120 160,115 Z",
  "rear-delt":"M55,90 Q68,85 75,100 L72,125 Q60,128 52,115 Q48,100 55,90 Z M145,90 Q152,100 148,115 Q140,128 128,125 L125,100 Q132,85 145,90 Z",
  triceps:    "M50,128 Q58,125 65,140 L62,175 Q52,178 46,165 Q42,148 50,128 Z M150,128 Q158,148 154,165 Q148,178 138,175 L135,140 Q142,125 150,128 Z",
  glutes:     "M75,210 Q110,215 145,210 L142,260 Q110,268 78,260 Z",
  hamstrings: "M80,260 Q96,258 100,275 L96,335 Q84,340 76,328 Q70,310 80,260 Z M120,260 Q130,310 124,328 Q116,340 104,335 L100,275 Q104,258 120,260 Z",
  calves:     "M80,335 Q90,332 95,348 L92,390 Q84,393 78,382 Q74,365 80,335 Z M105,335 Q112,365 108,382 Q102,393 94,390 L91,348 Q96,332 105,335 Z",
};

const MuscleDiagram=({exercise,expanded=false,onExpand})=>{
  const [hov,setHov]=React.useState(null);
  if(!exercise||!exercise.muscle)return null;
  const exDiag=EXERCISE_DIAGRAMS[exercise.name]||null;
  const tag=String(exercise.tag||exercise.type||"").toLowerCase();
  const primaryCol=tag.includes("hyper")?"#1D7BFF":tag.includes("recovery")||tag.includes("stretch")?"#12D7C8":"#FF2B6E";

  const GROUP_MAP={
    chest:["pec-l","pec-r"],
    quads:["quad-rf-l","quad-rf-r","quad-vl-l","quad-vl-r"],
    glutes:["glute-l","glute-r"],
    hamstrings:["ham-l","ham-r"],
    lats:["lat-l","lat-r"],
    traps:["trap-l","trap-r"],
    biceps:["bicep-l","bicep-r"],
    triceps:["tricep-l","tricep-r"],
    abs:["abs-l","abs-r"],
    obliques:["oblique-l","oblique-r"],
    erectors:["erector-l","erector-r"],
    anterior_deltoid:["delt-ant-l","delt-ant-r"],
    lateral_deltoid:["delt-lat-l","delt-lat-r"],
    rear_delts:["rear-delt-l","rear-delt-r"],
    shoulders:["delt-ant-l","delt-ant-r","delt-lat-l","delt-lat-r"],
    adductors:["adductor-l","adductor-r"],
    calves:["calf-l","calf-r"],
    serratus:["serratus-l","serratus-r"],
    rhomboids:["rhomboid-l","rhomboid-r"],
    teres:["teres-l","teres-r"],
    forearms:["forearm-l","forearm-r"],
    hip_flexors:["hip-flex-l","hip-flex-r"],
  };

  const resolveIds=(groups=[])=>{
    if(!groups||!groups.length)return[];
    const ids=[];
    groups.forEach(g=>{const m=GROUP_MAP[g];if(m)ids.push(...m);else ids.push(g);});
    return ids;
  };

  const fallback=(()=>{
    const p=String(exercise.muscle||"").toLowerCase();
    if(p.includes("chest"))return["chest"];
    if(p.includes("back")||p.includes("lat"))return["lats"];
    if(p.includes("shoulder")||p.includes("delt"))return["shoulders"];
    if(p.includes("quad"))return["quads"];
    if(p.includes("hamstring"))return["hamstrings"];
    if(p.includes("glute"))return["glutes"];
    if(p.includes("bicep"))return["biceps"];
    if(p.includes("tricep"))return["triceps"];
    if(p.includes("calf"))return["calves"];
    if(p.includes("core")||p.includes("ab"))return["abs"];
    return[];
  })();

  const primaryIds=resolveIds(exDiag?.primary||fallback);
  const secondaryIds=resolveIds(exDiag?.secondary||[]);
  const stabIds=resolveIds(exDiag?.stabilizer||[]);

  const getState=(id)=>{
    if(primaryIds.includes(id))return"primary";
    if(secondaryIds.includes(id))return"secondary";
    if(stabIds.includes(id))return"stab";
    return"none";
  };

  const pStop0=primaryCol==="#1D7BFF"?"#5599FF":primaryCol==="#12D7C8"?"#40FFE8":"#FF5C93";
  const pStop1=primaryCol;

  const Defs=({suffix})=>React.createElement("defs",null,
    React.createElement("linearGradient",{id:`bG${suffix}`,x1:"0%",y1:"0%",x2:"0%",y2:"100%"},
      React.createElement("stop",{offset:"0%",stopColor:"#2A3042"}),
      React.createElement("stop",{offset:"55%",stopColor:"#181C27"}),
      React.createElement("stop",{offset:"100%",stopColor:"#0D1119"})
    ),
    React.createElement("linearGradient",{id:`pG${suffix}`,x1:"0%",y1:"0%",x2:"100%",y2:"100%"},
      React.createElement("stop",{offset:"0%",stopColor:pStop0}),
      React.createElement("stop",{offset:"100%",stopColor:pStop1})
    ),
    React.createElement("linearGradient",{id:`sG${suffix}`,x1:"0%",y1:"0%",x2:"100%",y2:"100%"},
      React.createElement("stop",{offset:"0%",stopColor:"#FFC066"}),
      React.createElement("stop",{offset:"100%",stopColor:"#FF9F1A"})
    ),
    React.createElement("linearGradient",{id:`stG${suffix}`,x1:"0%",y1:"0%",x2:"100%",y2:"100%"},
      React.createElement("stop",{offset:"0%",stopColor:"#4499FF"}),
      React.createElement("stop",{offset:"100%",stopColor:"#1D7BFF"})
    ),
    React.createElement("filter",{id:`gP${suffix}`,x:"-40%",y:"-40%",width:"180%",height:"180%"},
      React.createElement("feGaussianBlur",{stdDeviation:"5",result:"blur"}),
      React.createElement("feMerge",null,React.createElement("feMergeNode",{in:"blur"}),React.createElement("feMergeNode",{in:"SourceGraphic"}))
    ),
    React.createElement("filter",{id:`gS${suffix}`,x:"-40%",y:"-40%",width:"180%",height:"180%"},
      React.createElement("feGaussianBlur",{stdDeviation:"3.5",result:"blur"}),
      React.createElement("feMerge",null,React.createElement("feMergeNode",{in:"blur"}),React.createElement("feMergeNode",{in:"SourceGraphic"}))
    )
  );

  const BODY_LINE="rgba(255,255,255,0.10)";
  const TORSO="M128,138 C112,152 100,170 94,194 C82,204 74,222 74,246 C74,280 84,308 96,334 C104,352 108,372 110,390 C116,436 124,506 128,642 L162,642 L170,552 L180,470 L190,552 L198,642 L232,642 C236,506 244,436 250,390 C252,372 256,352 264,334 C276,308 286,280 286,246 C286,222 278,204 266,194 C260,170 248,152 232,138 Z";
  const ARM_L="M102,188 C74,202 60,236 60,286 C60,344 66,390 76,434 C82,456 94,466 108,458 C112,420 116,372 116,316 C116,256 112,212 102,188 Z";
  const ARM_R="M258,188 C286,202 300,236 300,286 C300,344 294,390 284,434 C278,456 266,466 252,458 C248,420 244,372 244,316 C244,256 248,212 258,188 Z";
  const LEG_L_U="M132,390 C112,426 104,488 108,566 C112,620 126,652 148,652 C158,620 160,546 156,470 C154,434 146,404 132,390 Z";
  const LEG_R_U="M228,390 C248,426 256,488 252,566 C248,620 234,652 212,652 C202,620 200,546 204,470 C206,434 214,404 228,390 Z";
  const LEG_L_D="M146,648 C136,672 132,714 138,746 C142,758 152,762 160,754 C164,714 160,678 154,650 Z";
  const LEG_R_D="M214,648 C224,672 228,714 222,746 C218,758 208,762 200,754 C196,714 200,678 206,650 Z";
  const HEAD="M164,106 L160,138 L200,138 L196,106 Z";
  const NECK="M164,106 L160,138 L200,138 L196,106 Z";

  const MPath=({id,d,suffix,opacity=1})=>{
    const state=getState(id);
    const fill=state==="primary"?`url(#pG${suffix})`:state==="secondary"?`url(#sG${suffix})`:state==="stab"?`url(#stG${suffix})`:(hov===id?"rgba(255,255,255,0.10)":"rgba(255,255,255,0.04)");
    const filter=state==="primary"?`url(#gP${suffix})`:state==="secondary"||state==="stab"?`url(#gS${suffix})`:undefined;
    const stroke=state!=="none"?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.06)";
    return React.createElement("path",{d,fill,stroke,strokeWidth:0.9,opacity,filter,
      style:{cursor:"crosshair",transition:"fill 0.25s"},
      onMouseEnter:()=>setHov(id),onMouseLeave:()=>setHov(null)
    });
  };

  const mkFront=()=>React.createElement("svg",{viewBox:"0 0 360 760",style:{width:"100%",display:"block"}},
    React.createElement(Defs,{suffix:"F"}),
    // Body segments
    React.createElement("ellipse",{cx:180,cy:72,rx:34,ry:44,fill:"url(#bGF)",stroke:BODY_LINE,strokeWidth:1.2}),
    React.createElement("path",{d:HEAD,fill:"url(#bGF)",stroke:BODY_LINE,strokeWidth:1.2}),
    React.createElement("path",{d:TORSO,fill:"url(#bGF)",stroke:BODY_LINE,strokeWidth:1.2}),
    React.createElement("path",{d:ARM_L,fill:"url(#bGF)",stroke:BODY_LINE}),
    React.createElement("path",{d:ARM_R,fill:"url(#bGF)",stroke:BODY_LINE}),
    React.createElement("path",{d:LEG_L_U,fill:"url(#bGF)",stroke:BODY_LINE}),
    React.createElement("path",{d:LEG_R_U,fill:"url(#bGF)",stroke:BODY_LINE}),
    React.createElement("path",{d:LEG_L_D,fill:"url(#bGF)",stroke:BODY_LINE}),
    React.createElement("path",{d:LEG_R_D,fill:"url(#bGF)",stroke:BODY_LINE}),
    // Contour lines
    React.createElement("g",{fill:"none",stroke:"rgba(255,255,255,0.07)",strokeWidth:1.2},
      React.createElement("path",{d:"M180 138 L180 386"}),
      React.createElement("path",{d:"M128 218 C148 224,164 226,180 226 C196 226,212 224,232 218"}),
      React.createElement("path",{d:"M136 274 C152 278,166 280,180 280 C194 280,208 278,224 274"}),
      React.createElement("path",{d:"M144 324 C156 328,168 330,180 330 C192 330,204 328,216 324"})
    ),
    // Muscles  -  Front
    React.createElement(MPath,{id:"pec-l",suffix:"F",d:"M176,156 C148,142 110,146 92,168 C84,180 84,204 92,220 C104,240 130,252 154,250 C166,248 174,242 180,232 C180,202 180,176 176,156 Z"}),
    React.createElement(MPath,{id:"pec-r",suffix:"F",d:"M184,156 C212,142 250,146 268,168 C276,180 276,204 268,220 C256,240 230,252 206,250 C194,248 186,242 180,232 C180,202 180,176 184,156 Z"}),
    React.createElement(MPath,{id:"delt-ant-l",suffix:"F",d:"M106,154 C86,162 76,180 78,202 C84,220 98,228 112,222 C122,214 126,188 122,166 C118,158 114,154 106,154 Z"}),
    React.createElement(MPath,{id:"delt-ant-r",suffix:"F",d:"M254,154 C274,162 284,180 282,202 C278,222 264,232 248,228 C238,214 234,188 238,166 C242,158 246,154 254,154 Z"}),
    React.createElement(MPath,{id:"delt-lat-l",suffix:"F",d:"M84,190 C68,206 64,240 70,270 C76,286 88,290 98,280 C100,250 96,214 88,190 Z",opacity:0.75}),
    React.createElement(MPath,{id:"delt-lat-r",suffix:"F",d:"M276,190 C292,206 296,240 290,270 C284,286 272,290 262,280 C260,250 264,214 272,190 Z",opacity:0.75}),
    React.createElement(MPath,{id:"tricep-l",suffix:"F",d:"M84,254 C74,280 74,322 82,360 C90,378 102,384 112,374 C114,334 110,290 100,252 Z",opacity:0.72}),
    React.createElement(MPath,{id:"tricep-r",suffix:"F",d:"M276,254 C286,280 286,322 278,360 C270,378 258,384 248,374 C246,334 250,290 260,252 Z",opacity:0.72}),
    React.createElement(MPath,{id:"bicep-l",suffix:"F",d:"M94,198 C82,212 76,248 82,284 C88,298 100,300 108,290 C110,258 108,222 100,200 Z",opacity:0.8}),
    React.createElement(MPath,{id:"bicep-r",suffix:"F",d:"M266,198 C278,212 284,248 278,284 C272,298 260,300 252,290 C250,258 252,222 260,200 Z",opacity:0.8}),
    React.createElement(MPath,{id:"forearm-l",suffix:"F",d:"M90,296 C78,316 76,354 82,390 C86,408 96,414 106,406 C108,370 106,330 100,298 Z",opacity:0.68}),
    React.createElement(MPath,{id:"forearm-r",suffix:"F",d:"M270,296 C282,316 284,354 278,390 C274,408 264,414 254,406 C252,370 254,330 260,298 Z",opacity:0.68}),
    React.createElement(MPath,{id:"serratus-l",suffix:"F",d:"M128,250 C118,262 114,280 118,296 C126,300 136,296 142,286 C140,272 136,260 128,250 Z",opacity:0.64}),
    React.createElement(MPath,{id:"serratus-r",suffix:"F",d:"M232,250 C242,262 246,280 242,296 C234,300 224,296 218,286 C220,272 224,260 232,250 Z",opacity:0.64}),
    React.createElement(MPath,{id:"abs-l",suffix:"F",d:"M144,238 C136,256 135,296 140,330 C146,350 158,358 168,352 C172,330 170,290 165,258 C162,240 150,234 144,238 Z",opacity:0.72}),
    React.createElement(MPath,{id:"abs-r",suffix:"F",d:"M216,238 C224,256 225,296 220,330 C214,350 202,358 192,352 C188,330 190,290 195,258 C198,240 210,234 216,238 Z",opacity:0.72}),
    React.createElement(MPath,{id:"oblique-l",suffix:"F",d:"M120,252 C112,272 110,308 114,338 C118,354 130,360 140,352 C138,322 136,284 132,258 Z",opacity:0.6}),
    React.createElement(MPath,{id:"oblique-r",suffix:"F",d:"M240,252 C248,272 250,308 246,338 C242,354 230,360 220,352 C222,322 224,284 228,258 Z",opacity:0.6}),
    React.createElement(MPath,{id:"quad-rf-l",suffix:"F",d:"M138,400 C124,432 118,492 122,550 C126,582 138,598 152,594 C160,566 158,506 154,456 C150,420 144,398 138,400 Z"}),
    React.createElement(MPath,{id:"quad-rf-r",suffix:"F",d:"M222,400 C236,432 242,492 238,550 C234,582 222,598 208,594 C200,566 202,506 206,456 C210,420 216,398 222,400 Z"}),
    React.createElement(MPath,{id:"quad-vl-l",suffix:"F",d:"M118,402 C104,438 100,500 106,560 C110,590 124,604 138,598 C134,562 132,500 134,450 C135,420 124,398 118,402 Z",opacity:0.85}),
    React.createElement(MPath,{id:"quad-vl-r",suffix:"F",d:"M242,402 C256,438 260,500 254,560 C250,590 236,604 222,598 C226,562 228,500 226,450 C225,420 236,398 242,402 Z",opacity:0.85}),
    React.createElement(MPath,{id:"adductor-l",suffix:"F",d:"M154,400 C146,430 144,480 148,530 C152,558 162,568 170,560 C172,530 170,476 166,436 Z",opacity:0.6}),
    React.createElement(MPath,{id:"adductor-r",suffix:"F",d:"M206,400 C214,430 216,480 212,530 C208,558 198,568 190,560 C188,530 190,476 194,436 Z",opacity:0.6}),
    React.createElement(MPath,{id:"calf-l",suffix:"F",d:"M126,664 C116,692 114,730 120,758 C124,768 136,770 142,760 C144,732 140,698 136,668 Z",opacity:0.82}),
    React.createElement(MPath,{id:"calf-r",suffix:"F",d:"M234,664 C244,692 246,730 240,758 C236,768 224,770 218,760 C216,732 220,698 224,668 Z",opacity:0.82}),
    React.createElement(MPath,{id:"hip-flex-l",suffix:"F",d:"M148,366 C138,382 136,402 140,420 C148,428 158,424 162,412 C162,396 158,376 148,366 Z",opacity:0.7}),
    React.createElement(MPath,{id:"hip-flex-r",suffix:"F",d:"M212,366 C222,382 224,402 220,420 C212,428 202,424 198,412 C198,396 202,376 212,366 Z",opacity:0.7})
  );

  const mkBack=()=>React.createElement("svg",{viewBox:"0 0 360 760",style:{width:"100%",display:"block"}},
    React.createElement(Defs,{suffix:"B"}),
    React.createElement("ellipse",{cx:180,cy:72,rx:34,ry:44,fill:"url(#bGB)",stroke:BODY_LINE,strokeWidth:1.2}),
    React.createElement("path",{d:HEAD,fill:"url(#bGB)",stroke:BODY_LINE,strokeWidth:1.2}),
    React.createElement("path",{d:TORSO,fill:"url(#bGB)",stroke:BODY_LINE,strokeWidth:1.2}),
    React.createElement("path",{d:ARM_L,fill:"url(#bGB)",stroke:BODY_LINE}),
    React.createElement("path",{d:ARM_R,fill:"url(#bGB)",stroke:BODY_LINE}),
    React.createElement("path",{d:LEG_L_U,fill:"url(#bGB)",stroke:BODY_LINE}),
    React.createElement("path",{d:LEG_R_U,fill:"url(#bGB)",stroke:BODY_LINE}),
    React.createElement("path",{d:LEG_L_D,fill:"url(#bGB)",stroke:BODY_LINE}),
    React.createElement("path",{d:LEG_R_D,fill:"url(#bGB)",stroke:BODY_LINE}),
    React.createElement("g",{fill:"none",stroke:"rgba(255,255,255,0.065)",strokeWidth:1.1},
      React.createElement("path",{d:"M180 138 L180 390"}),
      React.createElement("path",{d:"M132 164 C150 174,164 178,180 178 C196 178,210 174,228 164"}),
      React.createElement("path",{d:"M142 252 C156 260,166 264,180 264 C194 264,204 260,218 252"})
    ),
    // Back muscles
    React.createElement(MPath,{id:"trap-l",suffix:"B",d:"M180,138 C160,144 138,158 126,178 C120,190 122,208 132,218 C148,226 164,220 174,206 C180,192 180,164 180,138 Z"}),
    React.createElement(MPath,{id:"trap-r",suffix:"B",d:"M180,138 C200,144 222,158 234,178 C240,190 238,208 228,218 C212,226 196,220 186,206 C180,192 180,164 180,138 Z"}),
    React.createElement(MPath,{id:"rear-delt-l",suffix:"B",d:"M110,164 C92,170 84,184 88,202 C94,214 106,220 118,214 C124,200 122,180 110,164 Z"}),
    React.createElement(MPath,{id:"rear-delt-r",suffix:"B",d:"M250,164 C268,170 276,184 272,202 C266,214 254,220 242,214 C236,200 238,180 250,164 Z"}),
    React.createElement(MPath,{id:"lat-l",suffix:"B",d:"M120,196 C102,220 96,264 100,310 C104,340 116,356 130,350 C138,328 136,280 132,240 C130,216 124,194 120,196 Z"}),
    React.createElement(MPath,{id:"lat-r",suffix:"B",d:"M240,196 C258,220 264,264 260,310 C256,340 244,356 230,350 C222,328 224,280 228,240 C230,216 236,194 240,196 Z"}),
    React.createElement(MPath,{id:"rhomboid-l",suffix:"B",d:"M180,162 C166,168 154,180 154,196 C154,208 162,216 174,214 C178,196 180,178 180,162 Z",opacity:0.8}),
    React.createElement(MPath,{id:"rhomboid-r",suffix:"B",d:"M180,162 C194,168 206,180 206,196 C206,208 198,216 186,214 C182,196 180,178 180,162 Z",opacity:0.8}),
    React.createElement(MPath,{id:"teres-l",suffix:"B",d:"M118,198 C106,212 104,234 110,252 C118,262 130,262 136,252 C136,232 130,212 118,198 Z",opacity:0.75}),
    React.createElement(MPath,{id:"teres-r",suffix:"B",d:"M242,198 C254,212 256,234 250,252 C242,262 230,262 224,252 C224,232 230,212 242,198 Z",opacity:0.75}),
    React.createElement(MPath,{id:"erector-l",suffix:"B",d:"M166,220 C160,248 158,300 162,354 C164,378 172,390 180,388 C180,360 180,300 178,248 C177,226 170,218 166,220 Z",opacity:0.78}),
    React.createElement(MPath,{id:"erector-r",suffix:"B",d:"M194,220 C200,248 202,300 198,354 C196,378 188,390 180,388 C180,360 180,300 182,248 C183,226 190,218 194,220 Z",opacity:0.78}),
    React.createElement(MPath,{id:"tricep-l",suffix:"B",d:"M86,254 C76,280 76,320 84,356 C92,372 102,378 110,370 C112,332 108,290 100,254 Z",opacity:0.6}),
    React.createElement(MPath,{id:"tricep-r",suffix:"B",d:"M274,254 C284,280 284,320 276,356 C268,372 258,378 250,370 C248,332 252,290 260,254 Z",opacity:0.6}),
    React.createElement(MPath,{id:"glute-l",suffix:"B",d:"M116,370 C100,396 96,432 102,466 C108,490 124,502 140,496 C152,470 150,426 144,390 C138,366 122,362 116,370 Z"}),
    React.createElement(MPath,{id:"glute-r",suffix:"B",d:"M244,370 C260,396 264,432 258,466 C252,490 236,502 220,496 C208,470 210,426 216,390 C222,366 238,362 244,370 Z"}),
    React.createElement(MPath,{id:"ham-l",suffix:"B",d:"M128,502 C114,534 110,578 116,618 C122,642 138,652 152,644 C158,614 154,566 148,530 C142,504 132,498 128,502 Z"}),
    React.createElement(MPath,{id:"ham-r",suffix:"B",d:"M232,502 C246,534 250,578 244,618 C238,642 222,652 208,644 C202,614 206,566 212,530 C218,504 228,498 232,502 Z"}),
    React.createElement(MPath,{id:"calf-l",suffix:"B",d:"M126,664 C114,692 112,730 118,758 C122,768 134,770 140,760 C142,732 138,698 134,668 Z",opacity:0.82}),
    React.createElement(MPath,{id:"calf-r",suffix:"B",d:"M234,664 C246,692 248,730 242,758 C238,768 226,770 220,760 C218,732 222,698 226,668 Z",opacity:0.82}),
    React.createElement(MPath,{id:"forearm-l",suffix:"B",d:"M88,296 C76,316 74,354 80,390 C84,408 94,414 104,406 C106,370 104,330 98,298 Z",opacity:0.68}),
    React.createElement(MPath,{id:"forearm-r",suffix:"B",d:"M272,296 C284,316 286,354 280,390 C276,408 266,414 256,406 C254,370 256,330 262,298 Z",opacity:0.68})
  );

  const activeCount=primaryIds.length+secondaryIds.length+stabIds.length;
  const hovName=hov?hov.replace(/-[lr]$/,"").replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase()):null;

  return React.createElement("div",{
    style:{background:"rgba(13,16,24,0.98)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"10px 10px 8px",marginBottom:12,cursor:onExpand?"pointer":"default"},
    onClick:onExpand?onExpand:undefined
  },
    // Header
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}},
      React.createElement("div",{style:{fontSize:9,color:"rgba(255,255,255,0.4)",fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em"}},
        "MUSCLE ACTIVATION"+(activeCount>0?`  -  ${activeCount} active`:"")
      ),
      hovName&&React.createElement("div",{style:{fontSize:9,color:"rgba(255,255,255,0.55)",fontFamily:"'Space Mono',monospace",background:"rgba(255,255,255,0.06)",padding:"2px 8px",borderRadius:4}},hovName)
    ),
    // Figures side by side
    React.createElement("div",{style:{display:"flex",gap:0,alignItems:"stretch"}},
      React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column"}},
        React.createElement("div",{style:{fontSize:7,color:"rgba(255,255,255,0.25)",fontFamily:"monospace",letterSpacing:".12em",textAlign:"center",marginBottom:3,paddingTop:2}},"ANTERIOR"),
        React.createElement("div",{style:{flex:1}},mkFront())
      ),
      React.createElement("div",{style:{width:1,background:"rgba(255,255,255,0.07)",margin:"20px 4px"}}),
      React.createElement("div",{style:{flex:1,display:"flex",flexDirection:"column"}},
        React.createElement("div",{style:{fontSize:7,color:"rgba(255,255,255,0.25)",fontFamily:"monospace",letterSpacing:".12em",textAlign:"center",marginBottom:3,paddingTop:2}},"POSTERIOR"),
        React.createElement("div",{style:{flex:1}},mkBack())
      )
    ),
    // Legend
    activeCount>0&&React.createElement("div",{style:{display:"flex",gap:12,marginTop:6,paddingTop:6,borderTop:"1px solid rgba(255,255,255,0.06)",flexWrap:"wrap"}},
      primaryIds.length>0&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:5}},
        React.createElement("div",{style:{width:8,height:8,borderRadius:2,background:primaryCol,boxShadow:`0 0 5px ${primaryCol}70`}}),
        React.createElement("span",{style:{fontSize:9,color:"rgba(255,255,255,0.45)",fontFamily:"'Space Mono',monospace"}}),"Primary"
      ),
      secondaryIds.length>0&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:5}},
        React.createElement("div",{style:{width:8,height:8,borderRadius:2,background:"#FF9F1A"}}),
        React.createElement("span",{style:{fontSize:9,color:"rgba(255,255,255,0.45)",fontFamily:"'Space Mono',monospace"}}),"Secondary"
      ),
      stabIds.length>0&&React.createElement("div",{style:{display:"flex",alignItems:"center",gap:5}},
        React.createElement("div",{style:{width:8,height:8,borderRadius:2,background:"#1D7BFF"}}),
        React.createElement("span",{style:{fontSize:9,color:"rgba(255,255,255,0.45)",fontFamily:"'Space Mono',monospace"}}),"Stabiliser"
      )
    )
  );
};




const ExerciseDetailModal=({ex,onClose,onAskGary})=>{
  const [diagramExpanded,setDiagramExpanded]=React.useState(false);
  if(!ex)return null;
  let libEx=null;
  try{libEx=EXERCISES.find(e=>e.name===ex.name||e.id===ex.id)||null;}catch(e){}
  const safeNote=(libEx?.coachNote||"");
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(10,10,11,0.96)",backdropFilter:"blur(20px)",zIndex:300,overflowY:"auto"}}>
      <div style={{maxWidth:480,margin:"0 auto",padding:"0 0 40px"}}>
        <div style={{position:"sticky",top:0,background:`${C.bg}F8`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.bdr}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,zIndex:10}}>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:20,padding:4,lineHeight:1}}>{String.fromCharCode(8592)}</button>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:"0.06em"}}>{String(ex.name||"")}</div>
            {libEx&&<div style={{fontSize:11,color:C.mid,fontFamily:"'Space Mono',monospace"}}>{libEx.muscle} {String.fromCharCode(183)} {libEx.equipment}</div>}
          </div>
          {onAskGary&&<button onClick={()=>{onClose();onAskGary("Give me the key coaching cues and technique notes for "+String(ex.name||"this exercise")+".");}} style={{background:C.hyperG,border:`1px solid ${C.hyper}40`,borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:11,color:C.hyper,fontFamily:"'DM Sans',sans-serif",fontWeight:600,flexShrink:0}}>Ask Gary</button>}
        </div>
        <div style={{padding:"20px 20px 0"}}>
          {libEx?(
            <>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                <Tag>{String(libEx.muscle||"")}</Tag>
                <Tag color={C.blu}>{String(libEx.equipment||"")}</Tag>
                <Tag color={C.pur}>{String(libEx.category||"")}</Tag>
                {libEx.secondary&&<Tag color={C.dim}>+{String(libEx.secondary||"")}</Tag>}
              </div>
              <div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"18px",marginBottom:12}}>
                <div style={{fontSize:10,color:C.recovery,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>TECHNIQUE</div>
                <p style={{fontSize:14,color:C.txt,lineHeight:1.8}}>{String(libEx.cue||"")}</p>
              </div>
              <div style={{background:C.surUp,border:`1px solid ${C.bdrL}`,borderLeft:`3px solid ${C.recovery}`,borderRadius:10,padding:"14px 16px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:10,color:C.recovery,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em"}}>GARY'S NOTE</div>
                </div>
                <p style={{fontSize:14,color:C.mid,lineHeight:1.7,marginBottom:10}}>{safeNote}</p>
                {onAskGary&&safeNote&&<button onClick={()=>{onClose();onAskGary("Tell me more about this note for "+String(ex.name||"")+": "+safeNote.slice(0,100));}} style={{background:C.hyperG,border:`1px solid ${C.hyper}40`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,color:C.hyper,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Discuss this with Gary {String.fromCharCode(8594)}</button>}
              </div>
              {libEx.grip&&<div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"18px",marginBottom:12}}>
                <div style={{fontSize:10,color:C.blu,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>GRIP & ANGLE VARIATIONS</div>
                <p style={{fontSize:14,color:C.txt,lineHeight:1.8}}>{String(libEx.grip||"")}</p>
              </div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
                {[["SETS",ex.setsLabel||libEx.sets],["REPS",ex.reps||libEx.reps],["TEMPO",ex.tempo||libEx.tempo]].map(([l,v])=>(
                  <div key={l} style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:4}}>{l}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.hyper}}>{String(v||"--")}</div>
                  </div>
                ))}
              </div>
              {libEx.alt&&!libEx.alt.noAlt&&<div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"18px",marginBottom:16}}>
                <div style={{fontSize:10,color:C.ora,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>LIMITED EQUIPMENT ALTERNATIVE</div>
                <div style={{fontSize:15,fontWeight:600,color:C.txt,marginBottom:6}}>{String(libEx.alt.name||"")}</div>
                <p style={{fontSize:13,color:C.mid,lineHeight:1.7}}>{String(libEx.alt.desc||"")}</p>
              </div>}
            
              {/* GMT Smart Substitutions */}
              {SUBSTITUTION_MATRIX[ex.name]&&<div style={{background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:10,padding:"14px 16px",marginBottom:12}}>
                <div style={{fontSize:10,color:"#FF8C00",fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>GMT SMART SUBSTITUTIONS</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    {label:"Equipment unavailable",key:"unavailable"},
                    {label:"If fatigued",key:"fatigued"},
                    {label:"Prefer dumbbell",key:"dumbbell"},
                    {label:"Home option",key:"home"},
                    {label:"Too complex today",key:"complex"},
                  ].filter(s=>SUBSTITUTION_MATRIX[ex.name][s.key]).map(s=>(
                    <div key={s.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{s.label.toUpperCase()}</span>
                      <span style={{fontSize:12,color:C.mid,fontWeight:600}}>{SUBSTITUTION_MATRIX[ex.name][s.key]}</span>
                    </div>
                  ))}
                </div>
              </div>}
</>
          ):(
            <div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"24px",marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:600,color:C.txt,marginBottom:8}}>{String(ex.name||"")}</div>
              <p style={{fontSize:13,color:C.mid,lineHeight:1.7,marginBottom:12}}>{String(ex.note||"Perform this exercise with controlled form. Focus on the target muscle throughout each rep.")}</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
                {[["SETS",ex.setsLabel||ex.sets],["REPS",ex.reps],["REST",ex.rest?(ex.rest+"s"):"--"]].map(([l,v])=>(
                  <div key={l} style={{background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:4}}>{l}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:C.hyper}}>{String(v||"--")}</div>
                  </div>
                ))}
              </div>
              {onAskGary&&<button onClick={()=>{onClose();onAskGary("Coach me on "+String(ex.name||"this exercise")+" - full technique breakdown, key cues, and what to watch for.");}} style={{background:C.hyperG,border:`1px solid ${C.hyper}40`,borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:12,color:C.hyper,fontFamily:"'DM Sans',sans-serif",fontWeight:600,width:"100%"}}>Ask Gary about this exercise {String.fromCharCode(8594)}</button>}
            </div>
          )}
          <button onClick={onClose} style={{width:"100%",background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"14px",cursor:"pointer",fontSize:14,color:C.mid,fontFamily:"'DM Sans',sans-serif"}}>Close</button>
        </div>
      </div>
    </div>
  );
};

// --- BOXING SESSION TIMER ------------------------------------------
// Auto-flow: 60s work -> 10s rest -> 60s work -> 10s rest -> 60s work -> 30s station rest -> repeat
// 9 stations total (3x rotation of Treadmill / Strength / Bag)
const BoxingSessionTimer=({exercises,onBack})=>{
  // Build flat phase list from exercises
  // Each exercise = 1 station = 3 rounds
  const buildPhases=(exs)=>{
    const phases=[];
    exs.forEach((ex,si)=>{
      for(let r=0;r<3;r++){
        phases.push({type:"work",station:si,round:r,ex,label:`ROUND ${r+1}/3`,sublabel:ex.name,next:r<2?`REST 10s then Round ${r+2}`:si<exs.length-1?`STATION BREAK - ${exs[si+1].name}`:"FINAL ROUND"});
        if(r<2) phases.push({type:"rest-rounds",station:si,round:r,ex,duration:10,label:"REST",sublabel:`Round ${r+2} next`,next:ex.name});
      }
      if(si<exs.length-1){
        phases.push({type:"rest-station",station:si,round:2,ex,duration:30,label:"STATION CHANGE",sublabel:`Next: ${exs[si+1].name}`,next:exs[si+1].name,stationType:exs[si+1].stationType||""});
      }
    });
    phases.push({type:"done",label:"SESSION COMPLETE"});
    return phases;
  };

  const phases=React.useMemo(()=>buildPhases(exercises),[exercises]);
  const[phaseIdx,setPhaseIdx]=React.useState(0);
  const[sec,setSec]=React.useState(null);
  const[running,setRunning]=React.useState(false);
  const[started,setStarted]=React.useState(false);
  const phase=phases[phaseIdx]||phases[phases.length-1];

  const phaseDuration=phase.type==="work"?60:phase.type==="rest-rounds"?10:phase.type==="rest-station"?30:0;

  React.useEffect(()=>{
    if(sec===null) setSec(phaseDuration);
  },[phaseIdx]);

  React.useEffect(()=>{
    if(!running||sec===null) return;
    if(sec<=0){
      // Advance to next phase
      if(phaseIdx<phases.length-1){
        setPhaseIdx(p=>p+1);
        setSec(null);
      } else {
        setRunning(false);
      }
      return;
    }
    const t=setTimeout(()=>setSec(s=>s-1),1000);
    return()=>clearTimeout(t);
  },[running,sec,phaseIdx,phases.length]);

  // Station progress
  const stationCount=exercises.length;
  const currentStation=phase.station||0;
  const currentRound=phase.round||0;

  // Type colours
  const typeCol=phase.type==="work"?C.red:phase.type==="rest-rounds"?C.hyper:phase.type==="rest-station"?C.ora:C.strength;
  const stationType=(phase.ex?.stationType||"").toUpperCase();
  const stationIcon=stationType==="TREADMILL"?"":stationType==="BAG"?"":stationType==="STRENGTH"?"":"";

  if(phase.type==="done") return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40}}>
      <div style={{fontSize:60,marginBottom:16}}>-</div>
      <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,letterSpacing:"0.04em",marginBottom:8}}>Session Complete</h1>
      <p style={{color:C.mid,marginBottom:32,textAlign:"center",lineHeight:1.6}}>All {stationCount} stations complete. Hydrate, stretch, and recover.</p>
      <Btn onClick={onBack}>Back to Workout</Btn>
    </div>
  );

  if(!started) return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",padding:"48px 24px 32px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:20,textAlign:"left",marginBottom:24}}>&#8592; Back</button>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:"0.04em",marginBottom:8}}>BOXING CIRCUIT</div>
      <div style={{fontSize:13,color:C.mid,marginBottom:32,lineHeight:1.6}}>{stationCount} stations - 3 rounds - 60s - 10s rest between rounds - 30s between stations</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:32}}>
        {exercises.map((ex,i)=>(
          <div key={i} style={{display:"flex",gap:12,alignItems:"center",background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px 16px"}}>
            <div style={{width:32,height:32,borderRadius:8,background:ex.stationType==="TREADMILL"?C.hyperG:ex.stationType==="BAG"?`${C.red}20`:C.strengthG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
              {ex.stationType==="TREADMILL"?"":ex.stationType==="BAG"?"":""}</div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:C.txt}}>{ex.name}</div>
              <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{ex.stationType} - 3 - 60s</div>
            </div>
          </div>
        ))}
      </div>
      <Btn onClick={()=>{setStarted(true);setSec(60);setRunning(true);}}>Start Session</Btn>
    </div>
  );

  const circumference=2*Math.PI*80;
  const dashOffset=circumference*(1-(sec||0)/phaseDuration);

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 24px 40px",maxWidth:480,margin:"0 auto"}}>
      {/* Header */}
      <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <button onClick={()=>{setRunning(false);onBack();}} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:14,fontFamily:"'Space Mono',monospace"}}>EXIT</button>
        <div style={{display:"flex",gap:4}}>
          {exercises.map((_,i)=>(
            <div key={i} style={{width:i===currentStation?16:6,height:6,borderRadius:3,background:i<currentStation?C.mid:i===currentStation?typeCol:C.bdr,transition:"all 0.3s"}}/>
          ))}
        </div>
        <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>STN {currentStation+1}/{stationCount}</div>
      </div>

      {/* Station type badge */}
      <div style={{background:phase.type==="work"?(phase.ex?.stationType==="TREADMILL"?C.hyperG:phase.ex?.stationType==="BAG"?`${C.red}20`:C.strengthG):`${typeCol}15`,border:`1px solid ${typeCol}40`,borderRadius:20,padding:"6px 16px",fontSize:11,color:typeCol,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:16}}>
        {phase.type==="work"?`${stationIcon} ${phase.ex?.stationType||"STATION"}`:`${phase.label}`}
      </div>

      {/* Phase label */}
      <div style={{fontSize:13,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:8}}>{phase.label}</div>

      {/* Round dots */}
      {(phase.type==="work"||phase.type==="rest-rounds")&&<div style={{display:"flex",gap:8,marginBottom:16}}>
        {[0,1,2].map(r=>(
          <div key={r} style={{width:10,height:10,borderRadius:"50%",background:r<currentRound?C.mid:r===currentRound?typeCol:C.bdr,transition:"all 0.3s"}}/>
        ))}
      </div>}

      {/* Timer ring */}
      <div style={{position:"relative",width:200,height:200,marginBottom:24}}>
        <svg width="200" height="200" style={{transform:"rotate(-90deg)"}}>
          <circle cx="100" cy="100" r="80" fill="none" stroke={C.bdr} strokeWidth="8"/>
          <circle cx="100" cy="100" r="80" fill="none" stroke={typeCol} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            strokeLinecap="round" style={{transition:"stroke-dashoffset 0.9s linear"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:64,lineHeight:1,color:sec<=5&&phase.type==="work"?C.red:C.txt}}>{sec||0}</div>
          <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>SEC</div>
        </div>
      </div>

      {/* Exercise name */}
      {phase.ex&&<div style={{textAlign:"center",marginBottom:8}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:"0.04em",lineHeight:1.1}}>{phase.ex.name}</div>
        {phase.ex.combo&&<div style={{fontSize:13,color:typeCol,fontFamily:"'Space Mono',monospace",marginTop:4}}>{phase.ex.combo}</div>}
        {phase.type==="work"&&phase.ex.note&&<div style={{fontSize:11,color:C.mid,marginTop:6,lineHeight:1.5,maxWidth:300}}>{phase.ex.note}</div>}
      </div>}

      {/* Next up */}
      {phase.next&&<div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px 16px",marginBottom:24,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:3}}>NEXT UP</div>
        <div style={{fontSize:13,color:C.mid}}>{phase.next}</div>
      </div>}

      {/* Controls */}
      <div style={{display:"flex",gap:12,width:"100%"}}>
        <button onClick={()=>setRunning(r=>!r)} style={{flex:1,background:running?C.sur:C.hyperG,border:`1px solid ${running?C.bdr:C.hyper}`,borderRadius:12,padding:"16px",cursor:"pointer",fontSize:16,color:running?C.mid:C.hyper,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
          {running?"PAUSE":"RESUME"}
        </button>
        <button onClick={()=>{if(phaseIdx<phases.length-1){setPhaseIdx(p=>p+1);setSec(null);}}} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:12,padding:"16px 20px",cursor:"pointer",fontSize:13,color:C.dim,fontFamily:"'Space Mono',monospace"}}>
          SKIP
        </button>
      </div>
    </div>
  );
};

// --- BOXING TIMER ---------------------------------------------------
// Auto-flowing 9-station timer. No-touch operation after start.
// Per-round: 60s work, 10s inter-round rest, 30s inter-station rest.
const BoxingTimerView=({session,onBack,profile})=>{
  const stations=session.stations||[];
  const totalStations=stations.length;
  // Phase: "work" | "round-rest" | "station-rest" | "done"
  const [stationIdx,setStationIdx]=React.useState(0);
  const [roundIdx,setRoundIdx]=React.useState(0);
  const [phase,setPhase]=React.useState("work"); // "work"|"round-rest"|"station-rest"|"done"
  const [timeLeft,setTimeLeft]=React.useState(60);
  const [running,setRunning]=React.useState(false);
  const [started,setStarted]=React.useState(false);
  const timerRef=React.useRef(null);

  const WORK_SECS=60;
  const ROUND_REST=10;
  const STATION_REST=30;

  const station=stations[stationIdx]||stations[0];
  const round=station?.rounds?.[roundIdx];
  const nextStation=stations[stationIdx+1];
  const nextRound=station?.rounds?.[roundIdx+1];

  const phaseTotal=phase==="work"?WORK_SECS:phase==="round-rest"?ROUND_REST:STATION_REST;
  const progress=timeLeft/phaseTotal;

  const stationType=station?.type||"bag";
  const typeColor=stationType==="treadmill"?"#00C9B1":stationType==="dumbbell"?"#FF8C00":C.red;
  const typeLabel=stationType==="treadmill"?"TREADMILL":stationType==="dumbbell"?"STRENGTH":"HEAVY BAG";

  const advance=React.useCallback(()=>{
    const maxRounds=(station?.rounds?.length||3)-1;
    const isLastRound=roundIdx>=maxRounds;
    const isLastStation=stationIdx>=totalStations-1;
    if(phase==="work"){
      if(isLastRound){
        if(isLastStation){setPhase("done");setRunning(false);}
        else{setPhase("station-rest");setTimeLeft(STATION_REST);}
      } else {
        setPhase("round-rest");setTimeLeft(ROUND_REST);
      }
    } else if(phase==="round-rest"){
      setRoundIdx(r=>r+1);
      setPhase("work");setTimeLeft(WORK_SECS);
    } else if(phase==="station-rest"){
      setStationIdx(s=>s+1);
      setRoundIdx(0);
      setPhase("work");setTimeLeft(WORK_SECS);
    }
  },[phase,roundIdx,stationIdx,station,totalStations]);

  React.useEffect(()=>{
    if(!running)return;
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){advance();return phase==="work"?WORK_SECS:phase==="round-rest"?ROUND_REST:STATION_REST;}
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current);
  },[running,advance,phase]);

  const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
  const circumference=2*Math.PI*80;
  const dashOffset=circumference*(1-progress);

  if(phase==="done") return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,background:C.bg,textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:16}}>-</div>
      <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,letterSpacing:"0.04em",color:C.txt,marginBottom:8}}>SESSION COMPLETE</h2>
      <p style={{color:C.mid,fontSize:15,marginBottom:8}}>9 stations. 27 rounds. Done.</p>
      <p style={{color:C.dim,fontSize:12,fontFamily:"'Space Mono',monospace",marginBottom:32}}>Gary will note this session.</p>
      <Btn onClick={onBack} style={{width:"100%",maxWidth:320}}>Back to Workout</Btn>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.bdr}`}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.dim,fontSize:13,cursor:"pointer",fontFamily:"'Space Mono',monospace"}}>Exit</button>
        <div style={{fontSize:11,color:C.mid,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em"}}>
          STATION {stationIdx+1}/{totalStations} - RD {roundIdx+1}/{station?.rounds?.length||3}
        </div>
        <div style={{fontSize:11,color:typeColor,fontFamily:"'Space Mono',monospace"}}>{typeLabel}</div>
      </div>

      {/* Main content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 20px",gap:0}}>

        {/* Station name */}
        <div style={{fontSize:12,color:typeColor,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:6,textAlign:"center"}}>{station?.name}</div>

        {/* Current exercise */}
        <div style={{background:C.surUp,border:`2px solid ${phase==="work"?typeColor:C.bdr}`,borderRadius:14,padding:"16px 20px",marginBottom:20,width:"100%",maxWidth:400,textAlign:"center",transition:"border-color 0.3s"}}>
          <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:6}}>
            {phase==="work"?"ROUND "+String(roundIdx+1)+" - WORKING":phase==="round-rest"?"REST - NEXT ROUND IN":"REST - NEXT STATION IN"}
          </div>
          {phase==="work"?(
            <p style={{fontSize:14,color:C.txt,lineHeight:1.6,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{round?.exercise}</p>
          ):(
            <div>
              <p style={{fontSize:12,color:C.mid,lineHeight:1.5,margin:"0 0 8px",fontFamily:"'DM Sans',sans-serif"}}>
                {phase==="round-rest"
                  ?`Next: Round ${roundIdx+2} - ${nextRound?.exercise||""}`
                  :`Next Station: ${nextStation?.name||""}`}
              </p>
              {phase==="station-rest"&&nextStation&&(
                <div style={{fontSize:11,color:typeColor,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em"}}>
                  {(nextStation.type==="treadmill"?"TREADMILL":nextStation.type==="dumbbell"?"STRENGTH":"HEAVY BAG")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timer circle */}
        <div style={{position:"relative",width:200,height:200,marginBottom:20}}>
          <svg width="200" height="200" style={{transform:"rotate(-90deg)"}}>
            <circle cx="100" cy="100" r="80" fill="none" stroke={C.bdr} strokeWidth="10"/>
            <circle cx="100" cy="100" r="80" fill="none"
              stroke={phase==="work"?typeColor:phase==="round-rest"?C.hyper:C.recovery}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{transition:"stroke-dashoffset 1s linear, stroke 0.3s"}}
            />
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:52,fontWeight:700,color:C.txt,fontFamily:"'Space Mono',monospace",lineHeight:1}}>{fmt(timeLeft)}</div>
            <div style={{fontSize:10,color:phase==="work"?typeColor:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginTop:4}}>
              {phase==="work"?"WORK":phase==="round-rest"?"ROUND REST":"STATION REST"}
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {stations.map((s,i)=>(
            <div key={i} style={{width:i===stationIdx?24:8,height:8,borderRadius:4,background:i<stationIdx?C.recovery:i===stationIdx?typeColor:C.bdr,transition:"all 0.3s"}}/>
          ))}
        </div>

        {/* Round dots */}
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {(station?.rounds||[]).map((_,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:4,background:i<roundIdx?"#fff":i===roundIdx?typeColor:C.bdr}}/>
          ))}
        </div>

        {/* Controls */}
        {!started?(
          <Btn onClick={()=>{setStarted(true);setRunning(true);}} style={{width:"100%",maxWidth:320,fontSize:18}}>
            START SESSION
          </Btn>
        ):(
          <div style={{display:"flex",gap:12,width:"100%",maxWidth:320}}>
            <button onClick={()=>setRunning(r=>!r)} style={{flex:1,padding:"16px",background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:12,cursor:"pointer",color:C.txt,fontSize:14,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
              {running?"Pause":"Resume"}
            </button>
            <button onClick={advance} style={{flex:1,padding:"16px",background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:12,cursor:"pointer",color:C.dim,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- WORKOUT VIEW ------------------------------------------------
const modeColor=(type)=>{if(type==="strength")return C.strength;if(type==="recovery")return C.recovery;return C.hyper;};
const modeGlow=(type)=>{if(type==="strength")return C.strengthG;if(type==="recovery")return C.recoveryG;return C.hyperG;};
const isTimeBased=(reps)=>{const s=String(reps||'');return (/hold/i).test(s)||/[0-9]+\s*min/i.test(s)||/[0-9]+s\b/i.test(s)||/[0-9]+:[0-9]{2}/.test(s);};
const parseSeconds=(reps)=>{
  const s=String(reps||"");
  const minMatch=s.match(/(\d+)\s*min/i);if(minMatch)return parseInt(minMatch[1])*60;
  const mmssMatch=s.match(/(\d+):(\d{2})/);if(mmssMatch)return parseInt(mmssMatch[1])*60+parseInt(mmssMatch[2]);
  const secMatch=s.match(/(\d+)\s*s\b/i);if(secMatch)return parseInt(secMatch[1]);
  return 30;
};

const WorkoutView=({session,day,onBack,profile,onWarmup})=>{
  // All hooks must come before any conditional returns (Rules of Hooks)
  const isWarmup=session?.id==="warmup";
  const exercises=(session?.exercises)||[];
  const[completedSets,setCompletedSets]=useState({});
  const[currentEx,setCurrentEx]=useState(0);
  const[timer,setTimer]=useState(0);
  const[resting,setResting]=useState(false);
  const[restSec,setRestSec]=useState(90);
  const[sessionNotes,setSessionNotes]=useState("");
  const[showNotes,setShowNotes]=useState(false);
  const[coachMsg,setCoachMsg]=useState(null);
  const[coachLoading,setCoachLoading]=useState(false);
  const[showChat,setShowChat]=useState(false);
  const[chatInput,setChatInput]=useState("");
  const[chatHistory,setChatHistory]=useState([]);
  const[detailEx,setDetailEx]=useState(null);
  const[tempoEx,setTempoEx]=useState(null);
  const[activeTimer,setActiveTimer]=useState(null); // {exIdx, remaining, total}
  // Weight/rep log: {exIdx_setIdx: {weight, reps}}
  const[setLog,setSetLog]=useState(()=>{
    try{const k="gmt_setlog_"+session.id;return JSON.parse(localStorage.getItem(k)||"{}");}catch{return{};}
  });
  const timerRef=useRef(null);
  const chatRef=useRef(null);
  const setsOf=(ex)=>typeof ex.sets==="number"?ex.sets:parseInt(ex.sets)||3;
  const totalSets=exercises.reduce((a,e)=>a+setsOf(e),0);
  const doneSets=Object.values(completedSets).reduce((a,v)=>a+v,0);

  useEffect(()=>{timerRef.current=setInterval(()=>setTimer(t=>t+1),1000);return()=>clearInterval(timerRef.current);},[]);
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // Save set log to localStorage
  useEffect(()=>{
    try{localStorage.setItem("gmt_setlog_"+session.id,JSON.stringify(setLog));}catch{}
  },[setLog,session.id]);

  const tapSet=(exIdx)=>{
    const ex=exercises[exIdx];
    const cur=(completedSets[exIdx]||0);
    const total=setsOf(ex);
    if(cur>=total)return;
    const next=cur+1;
    setCompletedSets(s=>({...s,[exIdx]:next}));
    if(next===total&&exIdx<exercises.length-1)setCurrentEx(exIdx+1);
    if(ex.rest>0){setRestSec(ex.rest);setResting(true);}
    if((doneSets+1)%3===0&&doneSets>0)fetchCoachCheckin(ex.name,next,total);
  };

  const updateLog=(exIdx,setIdx,field,val)=>{
    const key=exIdx+"_"+setIdx;
    setSetLog(l=>({...l,[key]:{...(l[key]||{}), [field]:val}}));
  };

  const startExTimer=(exIdx)=>{
    const ex=exercises[exIdx];
    const secs=parseSeconds(ex.reps);
    setActiveTimer({exIdx,remaining:secs,total:secs});
  };

  useEffect(()=>{
    if(!activeTimer)return;
    if(activeTimer.remaining<=0){
      tapSet(activeTimer.exIdx);
      setActiveTimer(null);
      return;
    }
    const t=setTimeout(()=>setActiveTimer(a=>a?{...a,remaining:a.remaining-1}:null),1000);
    return()=>clearTimeout(t);
  },[activeTimer]);

  const fetchCoachCheckin=async(exName,setNum,totalS)=>{
    setCoachLoading(true);
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:100,system:buildPrompt(profile,false,{name:session.name,currentExercise:exName,completedSets:doneSets,notes:sessionNotes}),messages:[{role:"user",content:"Just completed set "+setNum+"/"+totalS+" of "+exName+". One brief coaching cue or observation. Max 2 sentences. No markdown."}]})});
      if(!res.ok)return;
      const d=await res.json();
      const txt=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();
      if(txt)setCoachMsg(stripMd(txt));
    }catch(e){}finally{setCoachLoading(false);}
  };

  const sendChat=async()=>{
    if(!chatInput.trim())return;
    const userMsg={from:"user",text:chatInput};
    const hist=[...chatHistory,userMsg];
    setChatHistory(hist);setChatInput("");setShowChat(true);
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:200,system:buildPrompt(profile,false,{name:session.name,currentExercise:exercises[currentEx]?.name,completedSets:doneSets,notes:sessionNotes}),messages:hist.map(m=>({role:m.from==="user"?"user":"assistant",content:m.text}))})});
      if(!res.ok){setChatHistory(h=>[...h,{from:"coach",text:"Connection issue."}]);return;}
      const d=await res.json();
      const txt=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();
      if(txt){setChatHistory(h=>[...h,{from:"coach",text:stripMd(txt)}]);setShowChat(true);}
    }catch(e){setChatHistory(h=>[...h,{from:"coach",text:"Connection issue. Try again."}]);setShowChat(true);}
    setTimeout(()=>chatRef.current?.scrollTo(0,99999),100);
  };

  const pct=totalSets>0?(doneSets/totalSets)*100:0;
  const sessionTag=session.tag||"Hypertrophy";
  const tagColor=isWarmup?C.recovery:sessionTag==="Strength"?C.strength:sessionTag.includes("Recovery")||sessionTag.includes("Mobility")?C.recovery:C.hyper;

  return(
    <div style={{minHeight:"100vh",paddingBottom:160}}>
      {tempoActive&&<TempoTimer
        ex={exercises[tempoActive.exIdx]}
        reps={exercises[tempoActive.exIdx]?.reps}
        setNumber={tempoActive.setNum}
        totalSets={exercises[tempoActive.exIdx]?.sets||3}
        onDone={()=>{
          // After set done, trigger rest timer
          const ex=exercises[tempoActive.exIdx];
          const restSecs=ex?.rest||90;
          tapSet(tempoActive.exIdx);
          setTempoActive(null);
          setActiveTimer(tempoActive.exIdx);
          setRestSec(restSecs);
          setResting(true);
        }}
        onNext={()=>{
          tapSet(tempoActive.exIdx);
          setTempoActive(null);
          const nextEx=exercises.findIndex((e,i)=>i>tempoActive.exIdx&&!(completedSets[i]>=(e.sets||3)));
          if(nextEx>=0)setCurrentEx(nextEx);
        }}
        onSkip={()=>setTempoActive(null)}
      />}
      {resting&&<RestTimer seconds={restSec} onDone={()=>setResting(false)} onSkip={()=>setResting(false)}
    logEx={exercises[currentEx]||null}
    logData={{setsCompleted:completedSets[currentEx]||0,sets:Object.fromEntries(Object.entries(setLog).filter(([k])=>k.startsWith(currentEx+"_")).map(([k,v])=>[parseInt(k.split("_")[1]),v]))}}
    onUpdateLog={(setIdx,field,val)=>updateLog(currentEx,setIdx,field,val)}
    unitLabel={String(profile?.unit||"").includes("Imperial")?"lbs":"kg"}
  />}
      {detailEx&&<ExerciseDetailModal ex={detailEx} onClose={()=>setDetailEx(null)} onAskGary={(q)=>{setChatInput(q);setShowChat(true);}}/>}
      {tempoEx&&<TempoPopup tempo={tempoEx} onClose={()=>setTempoEx(null)}/>}
      {activeTimer&&(
        <div style={{position:"fixed",inset:0,background:"rgba(10,10,11,0.92)",backdropFilter:"blur(16px)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
          <div style={{fontSize:11,color:C.recovery,fontFamily:"'Space Mono',monospace",letterSpacing:"0.15em"}}>{exercises[activeTimer.exIdx]?.name?.toUpperCase()}</div>
          <div style={{position:"relative",width:140,height:140}}>
            <svg width="140" height="140" style={{transform:"rotate(-90deg)"}}>
              <circle cx="70" cy="70" r="60" fill="none" stroke={C.bdr} strokeWidth="4"/>
              <circle cx="70" cy="70" r="60" fill="none" stroke={C.recovery} strokeWidth="4" strokeDasharray={2*Math.PI*60} strokeDashoffset={2*Math.PI*60*(1-(activeTimer.remaining/activeTimer.total))} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear"}}/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,lineHeight:1,color:C.txt}}>{fmt(activeTimer.remaining)}</span>
              <span style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>REMAINING</span>
            </div>
          </div>
          <button onClick={()=>setActiveTimer(null)} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px 24px",color:C.mid,cursor:"pointer",fontSize:13}}>Cancel</button>
        </div>
      )}

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:10,background:`${C.bg}EE`,backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.bdr}`,padding:"12px 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:20,padding:4,display:"flex",alignItems:"center"}}>{String.fromCharCode(8592)}</button>
          <div style={{textAlign:"center",flex:1,margin:"0 12px"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:"0.1em",lineHeight:1.2}}>{session.name}</div>
            <div style={{fontSize:9,color:tagColor,fontFamily:"'Space Mono',monospace",letterSpacing:"0.06em"}}>{day} {String.fromCharCode(183)} {fmt(timer)}</div>
          </div>
          <button onClick={()=>setShowNotes(n=>!n)} style={{background:showNotes?`${tagColor}20`:"transparent",border:`1px solid ${showNotes?tagColor:C.bdr}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:10,color:showNotes?tagColor:C.mid,fontFamily:"'Space Mono',monospace",flexShrink:0}}>NOTES</button>
        </div>
        {!isWarmup&&<button onClick={onWarmup} style={{width:"100%",marginBottom:6,background:C.recoveryG,border:`1px solid ${C.recovery}40`,borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,color:C.recovery,fontFamily:"'DM Sans',sans-serif",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          + Specific Warm-Up (optional)
        </button>}
        {isWarmup&&<button onClick={onBack} style={{width:"100%",marginBottom:6,background:C.recoveryG,border:`1px solid ${C.recovery}`,borderRadius:8,padding:"9px 14px",cursor:"pointer",fontSize:13,color:C.recovery,fontFamily:"'DM Sans',sans-serif",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          Warm-Up Complete {String.fromCharCode(8594)} Start Session
        </button>}
        <PBar value={pct} h={3} color={tagColor}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
          <span style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{doneSets}/{totalSets} sets</span>
          <span style={{fontSize:10,color:tagColor,fontFamily:"'Space Mono',monospace"}}>{Math.round(pct)}%</span>
        </div>
      </div>

      {showNotes&&<div className="fu" style={{margin:"12px 20px 0",background:C.sur,border:`1px solid ${C.bdrL}`,borderRadius:10,padding:14}}>
        <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:8,letterSpacing:"0.1em"}}>SESSION NOTES</div>
        <textarea value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)} placeholder="Energy, soreness, anything worth logging..." rows={3} style={{width:"100%",background:"transparent",border:"none",outline:"none",color:C.txt,fontSize:16,fontFamily:"'DM Sans',sans-serif",lineHeight:1.7,resize:"none"}}/>
      </div>}

      {coachMsg&&<div className="fu" style={{margin:"12px 20px 0",background:C.surUp,border:`1px solid ${C.hyper}40`,borderLeft:`3px solid ${C.hyper}`,borderRadius:10,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
        <div style={{width:22,height:22,borderRadius:6,background:C.hyperG,border:`1px solid ${C.hyper}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:10,color:C.hyper,flexShrink:0}}>G</div>
        <p style={{flex:1,fontSize:13,color:C.txt,lineHeight:1.6}}>{coachMsg}</p>
        <button onClick={()=>setCoachMsg(null)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:16}}>{String.fromCharCode(215)}</button>
      </div>}

      {/* Exercise list */}
      <div style={{padding:"12px 20px 0",display:"flex",flexDirection:"column",gap:10}}>
        {exercises.map((ex,i)=>{
          const done=completedSets[i]||0;
          const isActive=i===currentEx;
          const total=setsOf(ex);
          const allDone=done>=total;
          const exType=isWarmup?"recovery":(ex.type||"hyper");
          const mc=modeColor(exType);
          const mg=modeGlow(exType);
          const timeBased=isTimeBased(ex.reps);

          return(
            <div key={i} onClick={()=>setCurrentEx(i)} style={{background:isActive?C.surUp:C.sur,border:`1px solid ${isActive?mc:allDone?mc+"50":C.bdr}`,borderRadius:12,overflow:"hidden",transition:"all 0.2s",cursor:"pointer"}}>
              {isActive&&<div style={{height:2,background:mc,width:"100%"}}/>}
              <div style={{padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:allDone?0:10}}>
                  <div style={{width:28,height:28,borderRadius:8,background:allDone?mc:isActive?mg:C.bdr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontFamily:"'Space Mono',monospace",color:allDone?"#0A0A0B":isActive?mc:C.mid,fontWeight:700,flexShrink:0,marginTop:1}}>
                    {allDone?String.fromCharCode(10003):i+1}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:allDone?C.mid:C.txt,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      {ex.name}
                      {isActive&&!allDone&&<span style={{fontSize:9,background:mg,color:mc,border:`1px solid ${mc}40`,borderRadius:3,padding:"1px 6px",fontFamily:"'Space Mono',monospace",letterSpacing:"0.06em",flexShrink:0}}>{exType.toUpperCase()}</span>}
                    </div>
                    {ex.note&&<div style={{fontSize:11,color:C.dim,marginTop:3,lineHeight:1.45}}>{ex.note}</div>}
                    {isActive&&!allDone&&<div style={{fontSize:10,color:mc,marginTop:4,fontFamily:"'Space Mono',monospace",letterSpacing:"0.04em",opacity:0.7}}>Tap i for coaching cues {String.fromCharCode(8594)}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    {ex.rpe&&<RPEBadge rpe={ex.rpe}/>}
                    <button onClick={e=>{e.stopPropagation();setDetailEx(ex);}} title="Exercise info" style={{width:26,height:26,borderRadius:6,background:C.bdr,border:"none",color:C.hyper,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono',monospace",fontWeight:700}}>i</button>
                  </div>
                </div>

                {(isActive||!allDone)&&<>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginLeft:40,marginBottom:10,gap:8}}>
                    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",flex:1}}>
                      <span style={{fontSize:12,color:C.mid}}>
                        <span style={{color:mc,fontWeight:700}}>{ex.setsLabel||total}</span>
                        <span style={{color:C.dim,margin:"0 3px"}}>{String.fromCharCode(215)}</span>
                        <span style={{color:mc,fontWeight:700}}>{ex.reps}</span>
                      </span>
                      {ex.tempo&&<button onClick={e=>{e.stopPropagation();setTempoEx(ex.tempo);}} style={{background:C.bdr,border:"none",borderRadius:4,padding:"2px 7px",cursor:"pointer",fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{ex.tempo}</button>}
                      {ex.rest>0&&<span style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{ex.rest}s</span>}
                    </div>
                    {/* Time-based: show timer button OR set dots */}
                    {timeBased?(
                      <button onClick={e=>{e.stopPropagation();isActive&&startExTimer(i);}} style={{background:isActive?mc:"transparent",border:`1px solid ${isActive?mc:C.bdr}`,borderRadius:8,padding:"6px 12px",cursor:isActive?"pointer":"default",fontSize:11,color:isActive?"#fff":C.dim,fontFamily:"'Space Mono',monospace",flexShrink:0}}>
                        {String.fromCharCode(9654)} Timer
                      </button>
                    ):(
                      <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
                        {isActive&&ex.tempo&&!timeBased&&<button onClick={e=>{e.stopPropagation();setTempoActive({exIdx:i,setNum:done+1});}} style={{background:C.hyper,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,color:"#fff",fontFamily:"'Space Mono',monospace",marginRight:4,whiteSpace:"nowrap"}}>Start Set</button>}
                        {Array.from({length:total}).map((_,s)=>(
                          <button key={s} onClick={e=>{e.stopPropagation();isActive&&s===done&&tapSet(i);}} style={{width:32,height:32,borderRadius:8,background:s<done?mc:s===done&&isActive?"transparent":C.bdr,border:s===done&&isActive?`2px solid ${mc}`:s<done?`1px solid ${mc}`:`1px solid ${C.bdr}`,cursor:s===done&&isActive?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:s<done?"#0A0A0B":C.dim,fontWeight:700,fontFamily:"'Space Mono',monospace",transition:"all 0.15s"}}>
                            {s<done?String.fromCharCode(10003):s===done&&isActive?String.fromCharCode(9654):""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Weight + reps log - shown for active exercises */}
                  {(isActive||allDone)&&!timeBased&&done>0&&(
                    <div style={{marginLeft:40,marginBottom:8}}>
                      <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:6,letterSpacing:"0.08em"}}>LOG SETS</div>
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        {Array.from({length:done}).map((_,s)=>{
                          const key=i+"_"+s;
                          const entry=setLog[key]||{};
                          return(
                            <div key={s} style={{display:"flex",gap:6,alignItems:"center"}}>
                              <span style={{fontSize:10,color:mc,fontFamily:"'Space Mono',monospace",width:20}}>S{s+1}</span>
                              <input type="number" placeholder={ex.reps?.split("-")[0]||"reps"} value={entry.reps||""} onChange={e=>{e.stopPropagation();updateLog(i,s,"reps",e.target.value);}} style={{width:56,background:C.bdr,border:`1px solid ${C.bdrL}`,borderRadius:6,padding:"5px 8px",color:C.txt,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center"}}/>
                              <span style={{fontSize:10,color:C.dim}}>reps</span>
                              <input type="number" placeholder={String(profile?.unit||"").includes("Imperial")?"lbs":"kg"} value={entry.weight||""} onChange={e=>{e.stopPropagation();updateLog(i,s,"weight",e.target.value);}} style={{width:56,background:C.bdr,border:`1px solid ${C.bdrL}`,borderRadius:6,padding:"5px 8px",color:C.txt,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center"}}/>
                              <span style={{fontSize:10,color:C.dim}}>{String(profile?.unit||"").includes("Imperial")?"lbs":"kg"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{marginLeft:40,display:"flex",gap:8,flexWrap:"wrap"}}>

                    {isActive&&i<exercises.length-1&&<button onClick={e=>{e.stopPropagation();setCurrentEx(i+1);}} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:11,color:C.dim,fontFamily:"'DM Sans',sans-serif",display:"inline-flex",alignItems:"center",gap:4}}>
                      Skip {String.fromCharCode(8594)}
                    </button>}
                    {isActive&&<button onClick={e=>{e.stopPropagation();setChatInput("Key cue for "+ex.name+" right now - one sentence.");setShowChat(c=>!c);}} style={{background:showChat?C.hyperG:"transparent",border:`1px solid ${showChat?C.hyper:C.bdr}`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:11,color:showChat?C.hyper:C.mid,fontFamily:"'DM Sans',sans-serif",display:"inline-flex",alignItems:"center",gap:4}}>
                      Gary {showChat?String.fromCharCode(8595):String.fromCharCode(9654)}
                    </button>}
                    {allDone&&isActive&&<button onClick={e=>{e.stopPropagation();const ext=(completedSets[i]||0)+1;setCompletedSets(s=>({...s,[i]:ext}));}} style={{background:C.strengthG,border:`1px solid ${C.strength}40`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:11,color:C.strength,fontFamily:"'DM Sans',sans-serif",display:"inline-flex",alignItems:"center",gap:4}}>
                      + Drop Set
                    </button>}
                  </div>
                </>}
              </div>
            </div>
          );
        })}

        {/* Finish workout */}
        {!isWarmup&&<div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"14px 16px",marginTop:16,marginBottom:8}}>
          <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:8,letterSpacing:"0.1em"}}>POST-WORKOUT NOTES FOR GARY</div>
          <textarea value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)} placeholder="How did it feel? Any PRs? What was tough? Gary reads this before your next session..." rows={3} style={{width:"100%",background:"transparent",border:"none",outline:"none",color:C.txt,fontSize:16,fontFamily:"'DM Sans',sans-serif",lineHeight:1.7,resize:"none"}}/>
        </div>}
        <button onClick={()=>{
          const log={date:new Date().toISOString(),session:session.name,notes:sessionNotes,sets:Object.keys(setLog).length};
          try{const prev=JSON.parse(localStorage.getItem("gmt_workout_history")||"[]");localStorage.setItem("gmt_workout_history",JSON.stringify([log,...prev].slice(0,50)));}catch{}
          onBack();
        }} style={{width:"100%",margin:"8px 0 8px",background:tagColor,border:`1px solid ${tagColor}`,borderRadius:10,padding:"14px",cursor:"pointer",fontSize:15,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {isWarmup?"Finish Warm-Up ":"Finish & Save "}
          {String.fromCharCode(8594)}
        </button>
      </div>

      {/* Ask Gary - always visible, auto-opens on response */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 40px)",maxWidth:440,zIndex:50,paddingBottom:16}}>
        {showChat&&<div ref={chatRef} className="fu" style={{background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:12,padding:14,marginBottom:8,maxHeight:220,overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:10,color:C.hyper,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em"}}>ASK GARY</div>
            <button onClick={()=>setShowChat(false)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:16,padding:2,lineHeight:1}}>{String.fromCharCode(215)}</button>
          </div>
          {chatHistory.length===0&&<div style={{fontSize:12,color:C.dim,textAlign:"center",padding:"8px 0"}}>Ask Gary anything about this session...</div>}
          {chatHistory.map((m,ii)=>(
            <div key={ii} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start",marginBottom:10,animation:"fadeUp 0.3s ease forwards"}}>
              {m.from==="coach"&&<div style={{width:22,height:22,borderRadius:6,background:C.hyperG,border:`1px solid ${C.hyper}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:10,color:C.hyper,marginRight:8,flexShrink:0,marginTop:2}}>G</div>}
              <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:10,background:m.from==="user"?C.hyperG:C.sur,border:`1px solid ${m.from==="user"?C.hyper+"40":C.bdr}`,fontSize:13,lineHeight:1.6,color:C.txt}}>{m.text}</div>
            </div>
          ))}
          {coachLoading&&<div style={{display:"flex",gap:4,padding:"4px 0 4px 30px"}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.hyper,animation:`pulse 1.2s ${i*0.2}s infinite`}}/>)}}</div>}
        </div>}
        <div style={{display:"flex",gap:8,background:C.bg,paddingTop:4}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} onFocus={()=>setShowChat(true)} placeholder="Ask Gary about this exercise..." style={{flex:1,background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:10,padding:"12px 14px",color:C.txt,fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
          <button onClick={sendChat} style={{width:44,height:44,background:chatInput.trim()?C.hyper:C.sur,border:`1px solid ${chatInput.trim()?C.hyper:C.bdr}`,borderRadius:10,cursor:"pointer",fontSize:16,color:chatInput.trim()?"#fff":C.dim,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",flexShrink:0}}>{String.fromCharCode(8593)}</button>
        </div>
      </div>
    </div>
  );
};


// --- EXERCISE LIBRARY ---------------------------------------------
const ExerciseLibrary=({favourites,onToggleFav,onAskCoach,onBack})=>{
  const[search,setSearch]=useState("");
  const[filter,setFilter]=useState("All");
  const[libTab,setLibTab]=useState("all");
  const[selected,setSelected]=useState(null);
  const[diagramExpanded,setDiagramExpanded]=useState(false);
  const muscles=["All","Chest","Back","Shoulders","Legs","Biceps","Triceps"];
  const filtered=EXERCISES.filter(e=>{
    const matchM=filter==="All"||e.muscle===filter;
    const matchS=!search||e.name.toLowerCase().includes(search.toLowerCase());
    return matchM&&matchS;
  });
  const ex=selected?EXERCISES.find(e=>e.id===selected):null;
  return(
    <div style={{paddingBottom:100}}>
      {ex?(
        // Detail view
        <div>
          <div style={{position:"sticky",top:0,background:`${C.bg}F0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.bdr}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,zIndex:10}}>
            <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:20,padding:4}}>&#8592;</button>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:"0.06em"}}>{ex.name}</div>
              <div style={{fontSize:11,color:C.mid,fontFamily:"'Space Mono',monospace"}}>{ex.muscle} - {ex.equipment}</div>
            </div>
            <button onClick={()=>onToggleFav(ex.id)} style={{background:favourites.includes(ex.id)?C.strengthG:"transparent",border:`1px solid ${favourites.includes(ex.id)?C.strength:C.bdr}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,color:favourites.includes(ex.id)?C.strength:C.mid,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
              {favourites.includes(ex.id)?"Favourited":"+ Favourite"}
            </button>
          </div>
          <div style={{padding:"20px 20px 0"}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
              <Tag>{ex.muscle}</Tag><Tag color={C.blu}>{ex.equipment}</Tag><Tag color={C.pur}>{ex.category}</Tag>
              {ex.secondary&&<Tag color={C.dim}>+{ex.secondary}</Tag>}
            </div>

            {/* Technique */}
            <div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"18px",marginBottom:14}}>
              <div style={{fontSize:10,color:C.recovery,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>TECHNIQUE</div>
              <p style={{fontSize:14,color:C.txt,lineHeight:1.8}}>{ex.cue}</p>
            </div>

            {/* Muscle Diagram */}
            {!diagramExpanded&&<MuscleDiagram exercise={ex} expanded={false} onExpand={()=>setDiagramExpanded(true)}/>}
            {diagramExpanded&&(
              <div onClick={()=>setDiagramExpanded(false)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.95)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
                <div style={{width:"100%",maxWidth:340}} onClick={e=>e.stopPropagation()}>
                  <MuscleDiagram exercise={ex} expanded={true} onExpand={()=>setDiagramExpanded(false)}/>
                  <div style={{textAlign:"center",marginTop:8,fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>Tap anywhere to close</div>
                </div>
              </div>
            )}
            {/* Coach note */}
            <div style={{background:C.surUp,border:`1px solid ${C.bdrL}`,borderLeft:`3px solid ${C.recovery}`,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
              <div style={{fontSize:10,color:C.recovery,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:8}}>GARY'S NOTE</div>
              <p style={{fontSize:14,color:C.mid,lineHeight:1.7}}>{ex.coachNote}</p>
            </div>

            {/* Grip variations */}
            <div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"18px",marginBottom:14}}>
              <div style={{fontSize:10,color:C.blu,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>GRIP & ANGLE VARIATIONS</div>
              <p style={{fontSize:14,color:C.txt,lineHeight:1.8}}>{ex.grip}</p>
            </div>

            {/* Prescription */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
              {[["SETS",ex.sets],["REPS",ex.reps],["TEMPO",ex.tempo]].map(([l,v])=>(
                <div key={l} style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:4}}>{l}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.hyper}}>{v}</div>
                </div>
              ))}
            </div>
            {ex.rest&&<div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:C.mid}}>Rest period</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:16,color:C.hyper}}>{ex.rest}s</span>
            </div>}

            {/* Equipment alternative */}
            <div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"18px",marginBottom:20}}>
              <div style={{fontSize:10,color:C.ora,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>LIMITED EQUIPMENT ALTERNATIVE</div>
              {ex.alt.noAlt?(
                <p style={{fontSize:14,color:C.mid,lineHeight:1.7}}> {ex.alt.desc}</p>
              ):(
                <>
                  <div style={{fontSize:15,fontWeight:600,color:C.txt,marginBottom:6}}>{ex.alt.name}</div>
                  <p style={{fontSize:13,color:C.mid,lineHeight:1.7}}>{ex.alt.desc}</p>
                </>
              )}
            

            {/* GMT Smart Substitutions */}
            {SUBSTITUTION_MATRIX[ex.name]&&<div style={{background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
              <div style={{fontSize:10,color:"#FF8C00",fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10}}>GMT SMART SUBSTITUTIONS</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {[
                  {label:"No equipment",key:"unavailable"},
                  {label:"If fatigued",key:"fatigued"},
                  {label:"Prefer dumbbell",key:"dumbbell"},
                  {label:"Home option",key:"home"},
                  {label:"Too complex",key:"complex"},
                ].filter(s=>SUBSTITUTION_MATRIX[ex.name][s.key]).map(s=>(
                  <div key={s.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:4,borderBottom:`1px solid ${C.bdr}`}}>
                    <span style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{s.label.toUpperCase()}</span>
                    <span style={{fontSize:12,color:C.mid,fontWeight:600}}>{SUBSTITUTION_MATRIX[ex.name][s.key]}</span>
                  </div>
                ))}
              </div>
            </div>}
</div>
          </div>
        </div>
      ):(
        // List view
        <>
          <div style={{padding:"48px 20px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em"}}>EXERCISE LIBRARY</div>
              {onBack&&<button onClick={onBack} style={{background:"none",border:`1px solid ${C.bdr}`,borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>Home</button>}
            </div>
            <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,letterSpacing:"0.04em",marginBottom:16}}>MOVEMENTS</h1>
            <div style={{background:C.sur,border:`1px solid ${C.bdrL}`,borderRadius:10,display:"flex",alignItems:"center",gap:10,padding:"12px 16px",marginBottom:16}}>
              <span style={{color:C.dim,fontSize:16}}></span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exercises..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.txt,fontSize:14,fontFamily:"'DM Sans',sans-serif"}}/>
            </div>
            <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",paddingBottom:4}}>
              {muscles.map(m=><Pill key={m} active={filter===m} onClick={()=>setFilter(m)}>{m}</Pill>)}
            </div>
          </div>

          <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:8}}>
            {filtered.map(e=><ExRow key={e.id} ex={e} onSelect={()=>setSelected(e.id)} fav={favourites.includes(e.id)}/>)}
          </div>
        </>
      )}
    </div>
  );
};
const ExRow=({ex,onSelect,fav})=>(
  <div onClick={onSelect} style={{background:C.sur,border:`1px solid ${fav?C.acc+"30":C.bdr}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accD} onMouseLeave={e=>e.currentTarget.style.borderColor=fav?C.acc+"30":C.bdr}>
    <div>
      <div style={{fontSize:14,fontWeight:500,marginBottom:3,display:"flex",alignItems:"center",gap:8}}>{ex.name}{fav&&<span style={{color:C.strength,fontSize:11}}></span>}</div>
      <div style={{display:"flex",gap:8}}>
        <Tag color={C.mid}>{ex.muscle}</Tag>
        <Tag color={C.dim}>{ex.equipment}</Tag>
      </div>
    </div>
    <span style={{color:C.dim,fontSize:18}}></span>
  </div>
);

// --- WORKOUT LIBRARY ---------------------------------------------
const WorkoutLibraryView=({onStartWorkout,weekSchedule={},favourites=[],onToggleFav=()=>{}})=>{
  const[filter,setFilter]=useState("All");
  const[selected,setSelected]=useState(null);
  const[view,setView]=useState("mine");
  const cats=["All","Warm-Up","Athletic","Bodybuilding","Running","Boxing"];
  const mySessionNames=Object.values(weekSchedule);
  const myWorkouts=WORKOUT_LIBRARY.filter(w=>mySessionNames.includes(w.name)||w.id==="warmup");
  const exploreWorkouts=WORKOUT_LIBRARY.filter(w=>!mySessionNames.includes(w.name)&&w.id!=="warmup");
  const listToShow=view==="mine"?myWorkouts:(filter==="All"?exploreWorkouts:exploreWorkouts.filter(w=>w.cat===filter));
  const wk=selected?WORKOUT_LIBRARY.find(w=>w.id===selected):null;
  return(
    <div style={{paddingBottom:100}}>
      {wk?(
        <>
          <div style={{position:"sticky",top:0,background:`${C.bg}F0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.bdr}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,zIndex:10}}>
            <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:20,padding:4}}></button>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:"0.06em"}}>{wk.name}</div>
              <div style={{fontSize:10,color:C.mid,fontFamily:"'Space Mono',monospace"}}>{wk.tag}  ~{wk.duration}</div>
            </div>
          </div>
          <div style={{padding:"20px 20px 0"}}>
            {/* Gary intro */}
            <div style={{background:C.surUp,border:`1px solid ${C.accD}40`,borderLeft:`3px solid ${C.acc}`,borderRadius:10,padding:"16px 18px",marginBottom:12}}>
              <div style={{fontSize:10,color:C.recovery,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:8}}>GARY</div>
              <p style={{fontSize:14,color:C.mid,lineHeight:1.75}}>{wk.gary}</p>
            </div>
            {/* Intensity level note */}
            <div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px 14px",marginBottom:20,fontSize:12,color:C.mid,lineHeight:1.6}}>
              <span style={{color:C.hyper,fontWeight:600}}>Sets/reps shown are for intermediate athletes.</span> Advanced (7+ yrs): 1-2 sets per compound to absolute failure, 6-8 reps. Beginners: 3 sets, 8-10 reps, RPE 7-8. Corrective movements always use science-based volume regardless of level.
            </div>
            {/* Exercise list */}
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {wk.exercises.map((ex,i)=>(
                <div key={i} style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:ex.name.startsWith("SUPERSET")?C.hyper:C.txt}}>{ex.name}</div>
                      {ex.note&&<div style={{fontSize:12,color:C.dim,marginTop:3,lineHeight:1.5}}>{ex.note}</div>}
                    </div>
                    {ex.rpe&&<RPEBadge rpe={ex.rpe}/>}
                  </div>
                  <div style={{display:"flex",gap:16,marginTop:6}}>
                    <span style={{fontSize:12,color:C.mid}}><span style={{color:C.hyper,fontWeight:600}}>{ex.setsLabel||ex.sets}</span><span style={{color:C.dim,margin:"0 3px"}}>x</span><span style={{color:C.hyper,fontWeight:600}}>{ex.reps}</span></span>
                    {ex.tempo&&<span style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{ex.tempo}</span>}
                    {ex.rest>0&&<span style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{ex.rest}s</span>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>onStartWorkout("LIB",wk)} style={{flex:1}}>Start Workout</Btn>
              <button onClick={e=>{e.stopPropagation();}} style={{width:44,height:44,background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:8,cursor:"pointer",fontSize:16,color:C.mid,display:"flex",alignItems:"center",justifyContent:"center"}}>
              </button>
            </div>
          </div>
        </>
      ):(
        <>
          <div style={{padding:"48px 20px 16px"}}>
            <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:8}}>WORKOUT LIBRARY</div>
            <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,letterSpacing:"0.04em",marginBottom:12}}>SESSIONS</h1>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <button onClick={()=>setView("mine")} style={{flex:1,background:view==="mine"?C.hyperG:C.sur,border:`1px solid ${view==="mine"?C.hyper:C.bdr}`,borderRadius:8,padding:"10px",cursor:"pointer",color:view==="mine"?C.hyper:C.mid,fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:view==="mine"?600:400}}>Your Programme</button>
              <button onClick={()=>setView("explore")} style={{flex:1,background:view==="explore"?C.recoveryG:C.sur,border:`1px solid ${view==="explore"?C.recovery:C.bdr}`,borderRadius:8,padding:"10px",cursor:"pointer",color:view==="explore"?C.recovery:C.mid,fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:view==="explore"?600:400}}>Explore</button>
              <button onClick={()=>setView("exercises")} style={{flex:1,background:view==="exercises"?C.strengthG:C.sur,border:`1px solid ${view==="exercises"?C.strength:C.bdr}`,borderRadius:8,padding:"10px",cursor:"pointer",color:view==="exercises"?C.strength:C.mid,fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:view==="exercises"?600:400}}>Exercises</button>
            </div>
            {view==="explore"&&<>
              <div style={{background:C.sur,border:`1px solid ${C.recovery}30`,borderRadius:8,padding:"10px 14px",marginBottom:12}}>
                <p style={{fontSize:12,color:C.mid,lineHeight:1.6}}>Exploring outside your programme? We are about intuitive training as much as science. We will flag when we stray from the prescription - but learning what resonates with you is the process.</p>
              </div>
              <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",paddingBottom:4,marginBottom:4}}>
                {cats.map(c=><Pill key={c} active={filter===c} onClick={()=>setFilter(c)}>{c}</Pill>)}
              </div>
            </>}
          </div>
          <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:12}}>
            {view==="exercises"&&null /* exercises rendered below */}
            {view!=="exercises"&&listToShow.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:C.dim,fontSize:14}}>No sessions yet. Complete setup to see your programme.</div>}
            {view!=="exercises"&&listToShow.map(w=>(
              <div key={w.id} onClick={()=>setSelected(w.id)} style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"18px 20px",cursor:"pointer",transition:"all 0.15s"}} >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{marginBottom:6}}><Tag color={w.cat==="Warm-Up"?C.blu:w.cat==="Athletic"?C.ora:w.cat==="Running"?C.recovery:C.hyper}>{w.cat}</Tag></div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:"0.04em"}}>{w.name}</div>
                    <div style={{fontSize:12,color:C.mid,marginTop:2}}>{w.tag}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:C.hyper}}>{w.exercises.length}</div>
                    <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace"}}>EX</div>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:C.dim,fontFamily:"'Space Mono',monospace"}}>~{w.duration}</span>
                  <span style={{color:C.dim,fontSize:16}}></span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- TYPING INDICATOR ---------------------------------------------
const TypingDots=()=>(
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
    <div style={{width:28,height:28,borderRadius:8,background:C.hyperG,border:`1px solid ${C.hyper}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:C.hyper,flexShrink:0}}>G</div>
    <div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,borderBottomLeftRadius:4,padding:"14px 18px",display:"flex",gap:5,alignItems:"center"}}>
      {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.hyper,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
    </div>
  </div>
);

// --- COACH CHAT ---------------------------------------------------
const buildOpener=(profile)=>{
  const lims=(profile?.limitations||[]).filter(l=>l!=="None");
  const sleep=parseFloat(profile?.recovery?.sleep||"8");
  const stress=parseFloat(profile?.recovery?.stress||"5");
  const level=getLevel(profile?.trainingAge);
  const isFemale=profile?.gender==="Female";
  const isAdvanced=level==="advanced";
  const isRunnerProfile=Array.isArray(profile?.goals)&&profile.goals.some(g=>g.toLowerCase().includes("run")||g.toLowerCase().includes("marathon")||g.toLowerCase().includes("endurance"));
  const runCtx=profile?.runningContext||{};
  const hasRaceGoal=runCtx.raceGoal&&runCtx.raceGoal.trim().length>0;

  // Runner-specific openers
  if(isRunnerProfile){
    const runnerLims=lims.filter(l=>["Shin Splints","IT Band","Achilles / Calf","Plantar Fasciitis","Knees"].includes(l));
    if(runnerLims.length>0)return`Profile in. ${runnerLims.join(" and ")} flagged - that tells me exactly where the structural weak points are. Most of these are predictable and fixable with the right targeted work. How long has the ${runnerLims[0].toLowerCase()} been a problem?`;
    if(hasRaceGoal)return`Profile received. ${runCtx.raceGoal} is the target - that changes how we periodise your strength work around your run schedule. The biggest thing I see hold runners back is ignoring strength until they're already injured. We're getting ahead of that. What does your current strength training look like?`;
    if(runCtx.weeklyMiles)return`Profile in. ${runCtx.weeklyMiles} per week of running means your lower legs and posterior chain are taking a significant load. Most runners under-invest in the specific strength work that keeps that sustainable. Have you done any dedicated strength or prehab work before, or are you starting fresh?`;
    return`Profile received. Running combined with structured strength training changes the picture completely. The Ben Patrick protocol, unilateral work, and achilles loading are going to be priorities. What's your history with strength training been like alongside the running?`;
  }

  // Gender-specific opener for female clients
  if(isFemale){
    if(lims.length>0)return`Got your profile. ${lims.join(" and ")} flagged - we will programme around that. For your leg sessions, we're anchoring around hip thrusts and glute-focused work following the research. Is the ${lims[0].toLowerCase()} issue something currently active, or managed?`;
    if(Array.isArray(profile?.goals)&&profile.goals.some(g=>g.includes("Glute")))return`Profile locked. Glute and lower body focus - we're building this around the hip thrust protocol as the anchor, with intelligent isolation layered in. What does your current training look like - any experience with hip thrusts specifically?`;
    return`Profile in. For your leg sessions, we're using a glute-focused protocol - hip thrust anchored, with posterior chain and isolation work built around it. What's your current glute training experience like?`;
  }

  // Advanced clients get HIT-informed opener
  if(isAdvanced){
    if(lims.length>0)return`Got your profile. ${lims.join(" and ")} flagged - changes some exercise selection immediately. With ${profile?.trainingAge} of training, your intensity demands are high. Is the ${lims[0].toLowerCase()} something currently limiting your training?`;
    return`Profile received. ${profile?.trainingAge} of training - we're working at intensity levels most people never reach. One question: are you genuinely training to failure on your compound lifts currently, or leaving reps in the tank?`;
  }

  // Standard openers
  if(lims.length>0)return`Got your profile. ${lims.join(" and ")} flagged - that changes some exercise selection from the start. Is this something currently active, or an old issue you manage?`;
  if(sleep<6.5)return`Profile received. First thing: ${sleep} hours of sleep is below the adaptation threshold. Is that consistent, or just this week?`;
  if(stress>=7)return`Profile in. Stress at ${stress}/10 will blunt recovery. Is this chronic or situational?`;
  return`Assessment complete. One question before we go: what's the biggest thing that's held back your progress until now?`;
};
const isReady=(t)=>/\b(yes|yeah|yep|ready|let.s go|let.s do|absolutely|sure|i.m ready|go|ok|okay|start|begin)\b/.test(t.toLowerCase());

const CoachView=({profile,introMode=false,onReady})=>{
  const[msgs,setMsgs]=useState(()=>{
    if(introMode)return[{from:"coach",text:buildOpener(profile)}];
    try{
      const saved=localStorage.getItem("gmt_coach_msgs");
      if(saved){const parsed=JSON.parse(saved);if(parsed.length>0)return parsed;}
    }catch(e){}
    return[{from:"coach",text:"What are we working on?"}];
  });
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState(null);
  useEffect(()=>{
    const h=e=>{if(e.detail){setInput(e.detail);setTimeout(()=>document.getElementById("gary-send-btn")?.click(),150);}};
    window.addEventListener("gmt_coach_msg",h);
    return()=>window.removeEventListener("gmt_coach_msg",h);
  },[]);
  const[readyConfirmed,setReadyConfirmed]=useState(false);
  const bottomRef=useRef(null);
  const inputRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);
  const send=async(override)=>{
    const text=override||input.trim();
    if(!text||loading)return;
    const userMsg={from:"user",text};
    const updated=[...msgs,userMsg];
    setMsgs(updated);setInput("");setLoading(true);setError(null);
    if(introMode&&!readyConfirmed){
      const lastCoach=[...msgs].reverse().find(m=>m.from==="coach")?.text||"";
      if(lastCoach.toLowerCase().includes("ready")&&isReady(text)){
        setReadyConfirmed(true);
        setMsgs(m=>[...m,{from:"coach",text:"Good. Let's get to work."}]);
        setLoading(false);
        setTimeout(()=>onReady&&onReady(),1400);return;
      }
    }
    try{
      const rawMsgs=updated.map(m=>({role:m.from==="user"?"user":"assistant",content:m.text}));
      const firstUserIdx=rawMsgs.findIndex(m=>m.role==="user");
      const apiMsgs=firstUserIdx>=0?rawMsgs.slice(firstUserIdx):rawMsgs;
      const systemPrompt=buildPrompt(profile,introMode);
      const body={model:"claude-sonnet-4-20250514",max_tokens:1000,system:systemPrompt,messages:apiMsgs};
      const r=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
      });
      const rawText=await r.text();
      if(!r.ok){
        // Show the FULL raw response so we can diagnose
        let display=rawText.slice(0,300);
        try{const p=JSON.parse(rawText);display=p?.error?.message||p?.message||display;}catch(_){}
        throw new Error("API "+r.status+": "+display);
      }
      let d;
      try{d=JSON.parse(rawText);}catch(_){throw new Error("Bad JSON: "+rawText.slice(0,200));}
      const txt=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();
      if(!txt)throw new Error("Empty. Raw: "+rawText.slice(0,200));
      setMsgs(m=>[...m,{from:"coach",text:stripMd(txt)}]);
    }catch(e){setError(e.message||"Connection issue.");}
    finally{setLoading(false);inputRef.current?.focus();}
  };
  useEffect(()=>{
    if(!introMode){try{localStorage.setItem("gmt_coach_msgs",JSON.stringify(msgs));}catch(e){}}
  },[msgs,introMode]);
  const introSugs=["Yes, I'm ready","It's an old injury","I go by feel mostly","Consistency has been my issue","It's chronic stress"];
  const isRunnerConversation=Array.isArray(profile?.goals)&&profile?.goals?.some(g=>g.toLowerCase().includes("run")||g.toLowerCase().includes("marathon")||g.toLowerCase().includes("endurance"));
  const ongoingSugs=isRunnerConversation?
    ["My knee has been bothering me after long runs","When should I do strength vs running?","Build me a pre-run activation routine","How do I train through marathon taper?","Shin splints coming back - what do I adjust?"]:
    ["Sleep has been rough this week","Shoulder feels tight after pressing","Should I add cardio now?","How close am I to deload?","Missed a session - how do I adjust?"];
  const sugs=introMode?introSugs:ongoingSugs;
  const statusText=loading?"Thinking...":introMode?"Intro session":"Active  Direct mode";
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh"}}>
      <div style={{padding:"48px 20px 16px",borderBottom:`1px solid ${C.bdr}`,background:`${C.bg}F8`,backdropFilter:"blur(10px)",position:"sticky",top:0,zIndex:10}}>
        <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:10}}>AI COACHING MODE</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:10,background:`linear-gradient(135deg,${C.strength},${C.hyper})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:C.bg,animation:loading?"glow 1.5s ease-in-out infinite":"none"}}>G</div>
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:"0.04em"}}>GARY MULHOLLAND</div>
              <div style={{fontSize:12,color:loading?C.ora:C.hyper,display:"flex",alignItems:"center",gap:6,transition:"color 0.3s"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:loading?C.ora:C.hyper,animation:"pulse 1.5s infinite",transition:"background 0.3s"}}/>
                {statusText}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"6px 12px",fontSize:10,fontFamily:"'Space Mono',monospace",color:C.dim}}>{msgs.length-1} exchanges</div>
            {!introMode&&<button onClick={()=>{if(window.confirm("Clear chat history?")){try{localStorage.removeItem("gmt_coach_msgs");}catch(e){}window.location.reload();}}} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace"}}>CLEAR</button>}
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 20px 120px",WebkitOverflowScrolling:"touch"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start",marginBottom:14,animation:i===msgs.length-1?"fadeUp 0.3s ease forwards":"none"}}>
            {m.from==="coach"&&<div style={{width:28,height:28,borderRadius:8,background:C.hyperG,border:`1px solid ${C.hyper}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:C.hyper,marginRight:10,flexShrink:0,marginTop:2}}>G</div>}
            <div style={{maxWidth:"78%",padding:"12px 16px",borderRadius:12,background:m.from==="user"?C.hyperG:C.sur,border:`1px solid ${m.from==="user"?C.hyper+"40":C.bdr}`,borderBottomLeftRadius:m.from==="coach"?4:12,borderBottomRightRadius:m.from==="user"?4:12}}>
              <p style={{fontSize:14,color:C.txt,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{m.text}</p>
            </div>
          </div>
        ))}
        {loading&&<TypingDots/>}
        {error&&<div style={{background:`${C.red}15`,border:`1px solid ${C.red}40`,borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:13,color:C.red,display:"flex",alignItems:"center",gap:10}}>
          <span></span><span>{error}</span>
          <button onClick={()=>setError(null)} style={{marginLeft:"auto",background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:16}}></button>
        </div>}
        <div ref={bottomRef}/>
      </div>
      {/* Quick replies */}
      <div style={{padding:"8px 20px 0",display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none"}}>
        {sugs.map((s,i)=><button key={i} onClick={()=>!loading&&send(s)} disabled={loading} style={{flexShrink:0,background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:20,padding:"8px 14px",cursor:loading?"not-allowed":"pointer",color:loading?C.dim:C.mid,fontSize:12,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",opacity:loading?0.5:1}}>{s}</button>)}
      </div>
      {/* Input */}
      <div style={{padding:"12px 20px 24px",display:"flex",gap:10,alignItems:"flex-end",position:"sticky",bottom:0,background:`${C.bg}F8`,backdropFilter:"blur(12px)",borderTop:`1px solid ${C.bdr}`}}>
        <textarea ref={inputRef} value={input} onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Type your message or use quick replies above..." rows={1} disabled={loading} style={{flex:1,background:C.sur,border:`1px solid ${loading?C.bdr:C.bdrL}`,borderRadius:12,padding:"13px 16px",color:C.txt,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",overflow:"hidden",lineHeight:1.5,transition:"border-color 0.2s",opacity:loading?0.6:1}}/>
        <button id="gary-send-btn" onClick={()=>send()} disabled={loading||!input.trim()} style={{width:46,height:46,background:(!loading&&input.trim())?C.hyper:C.sur,border:`1px solid ${(!loading&&input.trim())?C.hyper:C.bdr}`,borderRadius:12,cursor:(!loading&&input.trim())?"pointer":"not-allowed",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",color:(!loading&&input.trim())?C.txt:C.dim,transition:"all 0.2s",flexShrink:0}}>
          {loading?<Spinner/>:""}
        </button>
      </div>
    </div>
  );
};

// --- DASHBOARD ----------------------------------------------------
const weekProgram={};
WORKOUT_LIBRARY.forEach(w=>{if(w.name)weekProgram[w.name]={name:w.name,label:w.name,sessionCode:w.sessionCode,version:w.version,tag:w.tag,exercises:w.exercises};});
const Dashboard=({onStartWorkout,profile,weekSchedule={},sessionCount=0,onNutrition,onReorderDay,onShowRecovery,lastWorkout,onCustomWorkout,onShowProfile,user,onVolumeEngine})=>{
  const days=["MON","TUE","WED","THU","FRI","SAT","SUN"];
  const sched=Object.keys(weekSchedule);
  const today=sched[0]||"MON";
  const todayLabel=weekSchedule[today]||"Push A";
  const todayData=weekProgram[todayLabel]||Object.values(weekProgram)[0]||null;
  // Stoic: rotate by day of year
  const dayOfYear=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/(1000*60*60*24));
  const stoicQ=STOIC_QUOTES[dayOfYear%STOIC_QUOTES.length];
  // Sunlight tracker
  const[sunlightLog,setSunlightLog]=useState(()=>{try{return JSON.parse(localStorage.getItem("gmt_sunlight")||"{}");}catch{return{};}});
  const[sunlightRunning,setSunlightRunning]=useState(false);
  const[sunlightStart,setSunlightStart]=useState(null);
  const[sunlightTick,setSunlightTick]=useState(0);
  const todayKey=new Date().toISOString().slice(0,10);
  const todayMinutes=Math.round((sunlightLog[todayKey]||0)/60);
  useEffect(()=>{let iv;if(sunlightRunning){iv=setInterval(()=>setSunlightTick(t=>t+1),1000);}return()=>clearInterval(iv);},[sunlightRunning]);
  const sunlightElapsed=sunlightRunning&&sunlightStart?Math.floor((Date.now()-sunlightStart)/1000):0;
  const toggleSunlight=()=>{
    if(!sunlightRunning){setSunlightRunning(true);setSunlightStart(Date.now());}
    else{const elapsed=Math.floor((Date.now()-sunlightStart)/1000);const updated={...sunlightLog,[todayKey]:(sunlightLog[todayKey]||0)+elapsed};setSunlightLog(updated);setSunlightRunning(false);setSunlightStart(null);try{localStorage.setItem("gmt_sunlight",JSON.stringify(updated));}catch{}}
  };
  const fmtS=s=>{const m=Math.floor(s/60);const sc=s%60;return m>0?`${m}m ${sc}s`:`${sc}s`;};
  const[recoveryVals,setRecoveryVals]=useState(()=>{try{return JSON.parse(localStorage.getItem("gmt_recovery")||"{}");}catch{return{};}});
  const[expandedCard,setExpandedCard]=useState(null);
  const saveRecovery=(k,v)=>{const n={...recoveryVals,[k]:v};setRecoveryVals(n);try{localStorage.setItem("gmt_recovery",JSON.stringify(n));}catch{}};
  return(
    <div style={{paddingBottom:100}}>
      <div style={{padding:"48px 20px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:6}}>BLOCK 1  HYPERTROPHY</div>
            <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,lineHeight:1,letterSpacing:"0.04em"}}>Let's Train.</h1>
            <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
              <Tag color={getLevel(profile?.trainingAge)==="advanced"?C.red:getLevel(profile?.trainingAge)==="intermediate"?C.ora:C.hyper}>{getLevel(profile?.trainingAge).toUpperCase()}</Tag>
              {profile?.gender==="Female"&&<Tag color={C.pur}>GLUTE PROTOCOL</Tag>}
            </div>
          </div>
          <button onClick={()=>onShowProfile&&onShowProfile()} style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.strength},${C.hyper})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontWeight:700,fontSize:18,color:"#fff",border:"none",cursor:"pointer",flexShrink:0}}>
            {(user?.initial||user?.name?.[0]||profile?.name?.[0]||"G").toUpperCase()}
          </button>
        </div>
      </div>


      {/* -- SUNLIGHT + CUSTOM WORKOUT ROW -- */}
      <div style={{padding:"0 20px 20px",display:"flex",gap:10}}>
        {/* Sunlight card */}
        <div style={{flex:1,background:sunlightRunning?"rgba(255,140,0,0.08)":"rgba(255,255,255,0.02)",border:`1px solid ${sunlightRunning?"rgba(255,140,0,0.35)":"rgba(255,255,255,0.07)"}`,borderRadius:12,padding:"14px 16px",transition:"all 0.3s"}}>
          <div style={{fontSize:10,color:sunlightRunning?"#FF8C00":C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",marginBottom:6}}>SUNLIGHT</div>
          <div style={{fontSize:22,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.05em",color:sunlightRunning?"#FF8C00":C.txt,marginBottom:4}}>
            {sunlightRunning?fmtS(sunlightElapsed):`${todayMinutes}m`}
          </div>
          <div style={{fontSize:10,color:C.dim,marginBottom:10}}>
            {sunlightRunning?"TRACKING...":"today"}
          </div>
          <button onClick={toggleSunlight} style={{background:sunlightRunning?"rgba(255,140,0,0.2)":"rgba(255,140,0,0.08)",border:`1px solid ${sunlightRunning?"rgba(255,140,0,0.4)":"rgba(255,140,0,0.2)"}`,borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:11,color:"#FF8C00",fontFamily:"'Space Mono',monospace",letterSpacing:"0.06em",width:"100%"}}>
            {sunlightRunning?"STOP":"START"}
          </button>
        </div>

        {/* Custom workout card */}
        <div style={{flex:1,background:"rgba(0,102,255,0.05)",border:"1px solid rgba(0,102,255,0.15)",borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all 0.2s"}} onClick={onCustomWorkout}>
          <div style={{fontSize:10,color:"rgba(0,102,255,0.7)",fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",marginBottom:6}}>ASK GARY</div>
          <div style={{fontSize:14,fontWeight:700,color:C.txt,marginBottom:4,lineHeight:1.3}}>Build My Workout</div>
          <div style={{fontSize:11,color:C.mid,lineHeight:1.5,marginBottom:10}}>Custom session for today</div>
          <div style={{background:"rgba(0,102,255,0.15)",border:"1px solid rgba(0,102,255,0.3)",borderRadius:8,padding:"7px 12px",fontSize:11,color:"#0066FF",fontFamily:"'Space Mono',monospace",letterSpacing:"0.06em",textAlign:"center"}}>
            LET'S GO
          </div>
        </div>
      </div>

      {/* Today card */}
      <div style={{padding:"0 20px 24px"}}>
        {sched.includes(today)&&todayData?(<div style={{background:`linear-gradient(135deg,${C.surUp},${C.sur})`,border:`1px solid ${C.bdr}`,borderRadius:14,padding:24,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:120,height:120,borderRadius:"50%",background:C.hyperG,filter:"blur(40px)"}}/>
          <Tag color={todayData?.tag==="Strength"?C.strength:todayData?.tag?.includes("Recovery")?C.recovery:todayData?.cat==="Boxing"?C.red:C.hyper}>TODAY  {today}</Tag>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,letterSpacing:"0.04em",margin:"10px 0 2px",lineHeight:1.1}}>{todayData?.name||todayLabel}</h2>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:20}}><Tag color={todayData?.tag==="Strength"?C.strength:todayData?.cat==="Boxing"?C.red:C.hyper}>{todayData?.tag||"Hypertrophy"}</Tag><span style={{fontSize:12,color:C.mid}}>{todayData?.exercises?.length||6} exercises</span>{todayData?.sessionCode&&<span style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{todayData.sessionCode} v{todayData.version}</span>}</div>
          <Btn onClick={()=>onStartWorkout(today,todayData)} style={{width:"100%"}}>Begin Session </Btn>
        </div>):(
          <div style={{background:`linear-gradient(135deg,${C.recoveryG||C.surUp},${C.sur})`,border:`1px solid ${C.recovery}40`,borderRadius:14,padding:24,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-20,top:-20,width:120,height:120,borderRadius:"50%",background:C.recoveryG,filter:"blur(50px)"}}/>
            <Tag color={C.recovery}>REST DAY  {today}</Tag>
            <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:"0.04em",margin:"10px 0 4px",lineHeight:1.1}}>Active Recovery</h2>
            <p style={{fontSize:12,color:C.mid,marginBottom:16,lineHeight:1.6}}>Rest days build the fitness you earned in training. Stay active without stressing the system.</p>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {[
                {icon:"",task:"Dead Hang",detail:"3 sets of 30s. Spinal decompression + grip health."},
                {icon:"",task:"10,000 Steps",detail:"Walk, do not run. Zone 1 blood flow for recovery."},
                {icon:"",task:"Mobility Circuit",detail:"Hip 90/90, thoracic rotation, ankle circles. 10 min."},
                {icon:"",task:"Prehab Work",detail:"Band pull-aparts, clamshells, face pulls. 3x15 each."},
                {icon:"",task:"Hydration",detail:"Target 3-4L today. Recovery is biochemical."},
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px 12px"}}>
                  <span style={{fontSize:18,flexShrink:0}}>{item.icon}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:C.txt,marginBottom:2}}>{item.task}</div>
                    <div style={{fontSize:11,color:C.dim,lineHeight:1.5}}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px 12px",fontSize:11,color:C.mid,lineHeight:1.6}}>
              Gary says: Adaptation happens in rest, not training. Protect this day.
            </div>
          </div>
        )}
      </div>
      {/* Week */}
      <div style={{padding:"0 20px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em"}}>YOUR WEEK</div>
          <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",opacity:0.6}}>tap to start</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {days.map(d=>{
            const has=sched.includes(d);
            const lbl=weekSchedule[d];
            const isToday=d===today;
            const sess=lbl?weekProgram[lbl]:null;
            return(
              <div key={d}
                draggable={has}
                onDragStart={e=>e.dataTransfer.setData("dragDay",d)}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{e.preventDefault();const from=e.dataTransfer.getData("dragDay");if(from&&from!==d&&onReorderDay)onReorderDay(from,d);}}
                onClick={()=>{if(has&&sess)onStartWorkout(d,Object.assign({name:lbl},sess));}}
                style={{flex:1,background:isToday?C.hyperG:C.sur,border:`1px solid ${isToday?C.hyper:has?C.bdrL:C.bdr}`,borderRadius:8,padding:"10px 3px",textAlign:"center",cursor:has?"pointer":"default",transition:"all 0.15s",userSelect:"none"}}
              >
                <div style={{fontSize:8,fontFamily:"'Space Mono',monospace",color:isToday?C.hyper:C.dim,marginBottom:5}}>{d}</div>
                <div style={{width:6,height:6,borderRadius:"50%",background:has?(isToday?C.hyper:C.mid):C.bdr,margin:"0 auto 4px"}}/>
                {has&&lbl&&<div style={{fontSize:6,color:isToday?C.hyper:C.mid,fontFamily:"'Space Mono',monospace",lineHeight:1.3}}>{lbl.slice(0,8)}</div>}
                {!has&&<div style={{fontSize:6,color:C.dim,fontFamily:"'Space Mono',monospace"}}>rest</div>}
              </div>
            );
          })}
        </div>
        <div style={{fontSize:9,color:C.dim,textAlign:"center",marginTop:6,fontFamily:"'Space Mono',monospace",opacity:0.5}}>Hold & drag to reorder</div>
      </div>
      {/* Recovery */}
      <div style={{padding:"0 20px 24px"}}>
        <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:12}}>DAILY RECOVERY</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {key:"sleep",label:"Sleep",unit:"hrs",color:C.hyper,placeholder:"7.5",max:10,icon:"",rec:"7-9 hrs"},
            {key:"calories",label:"Calories",unit:"kcal",color:C.ora,placeholder:(()=>{const bw=parseFloat(profile?.bodyStats?.weight)||70;const kg=String(profile?.unit||"").includes("Imperial")?bw*0.453592:bw;const hasStr=(profile?.goals||[]).some(g=>/strength|hyper/i.test(g));const hasRun=(profile?.goals||[]).some(g=>/run/i.test(g));return String(Math.round(kg*24*(hasStr?1.55:hasRun?1.65:1.5)));})(),max:5000,icon:"",rec:(()=>{const bw=parseFloat(profile?.bodyStats?.weight)||70;const kg=String(profile?.unit||"").includes("Imperial")?bw*0.453592:bw;const hasStr=(profile?.goals||[]).some(g=>/strength|hyper/i.test(g));const hasRun=(profile?.goals||[]).some(g=>/run/i.test(g));return"~"+Math.round(kg*24*(hasStr?1.55:hasRun?1.65:1.5))+" kcal target";})()},
            {key:"water",label:"Water",unit:"L",color:C.blu,placeholder:(()=>{const bw=parseFloat(profile?.bodyStats?.weight)||70;const kg=String(profile?.unit||"").includes("Imperial")?bw*0.453592:bw;const hasRun=(profile?.goals||[]).some(g=>/run/i.test(g));return(Math.round((kg*0.035+(hasRun?0.5:0.2))*10)/10).toFixed(1);})(),max:5,icon:"",rec:(()=>{const bw=parseFloat(profile?.bodyStats?.weight)||70;const kg=String(profile?.unit||"").includes("Imperial")?bw*0.453592:bw;const hasRun=(profile?.goals||[]).some(g=>/run/i.test(g));return(Math.round((kg*0.035+(hasRun?0.5:0.2))*10)/10).toFixed(1)+"L daily target";})()},
          ].map(r=>{
            const saved=recoveryVals[r.key];
            const val=parseFloat(saved)||null;
            const isExpanded=expandedCard===r.key;
            const canExpand=r.key==="calories"||r.key==="water";
            const bw=parseFloat(profile?.bodyStats?.weight)||70;
            const kg=String(profile?.unit||"").includes("Imperial")?bw*0.453592:bw;
            const hasStr=(profile?.goals||[]).some(g=>/strength|hyper/i.test(g));
            const hasRun=(profile?.goals||[]).some(g=>/run/i.test(g));
            const usesCr=(String(recoveryVals.supplements||"").toLowerCase().includes("creatine"));
            // Calories breakdown
            const tdee=Math.round(kg*24*(hasStr?1.55:hasRun?1.65:1.5));
            const prot=Math.round(kg*2.2);
            const fat=Math.round(tdee*0.28/9);
            const carb=Math.round((tdee-prot*4-fat*9)/4);
            // Water breakdown
            const baseWater=Math.round((kg*0.035+(hasRun?0.5:0.2))*10)/10;
            const crWater=usesCr?0.5:0;
            const totalWater=(baseWater+crWater).toFixed(1);
            return(
              <div key={r.key} style={{background:C.sur,border:`1px solid ${isExpanded?r.color+"60":C.bdr}`,borderRadius:10,overflow:"hidden",transition:"all 0.2s"}}>
                <div onClick={()=>canExpand&&setExpandedCard(isExpanded?null:r.key)}
                  style={{padding:"12px 16px",cursor:canExpand?"pointer":"default"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:13,color:C.mid,fontWeight:600}}>{r.label}</span>
                      {canExpand&&<span style={{fontSize:9,color:r.color,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em"}}>{isExpanded?"HIDE":"EXPAND"}</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <input type="number" inputMode="decimal" placeholder={r.placeholder} defaultValue={saved||""} key={saved}
                        onBlur={e=>saveRecovery(r.key,e.target.value)}
                        onClick={e=>e.stopPropagation()}
                        style={{width:64,background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:6,padding:"5px 8px",color:C.txt,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center"}}/>
                      <span style={{fontSize:11,color:C.dim}}>{r.unit}</span>
                    </div>
                  </div>
                  {val&&<div style={{marginTop:8}}><PBar value={val} max={r.max} color={r.color} h={4}/><div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",marginTop:3,letterSpacing:"0.05em"}}>Target: {r.rec}</div></div>}
                </div>
                {isExpanded&&r.key==="calories"&&(
                  <div style={{padding:"0 16px 14px",borderTop:`1px solid ${C.bdr}`}}>
                    <div style={{fontSize:10,color:C.ora,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10,marginTop:12}}>MACRO BREAKDOWN</div>
                    <div style={{display:"flex",gap:8,marginBottom:12}}>
                      {[{label:"Protein",val:prot,unit:"g",color:"#FF1744",note:"~2.2g/kg"},{label:"Carbs",val:carb,unit:"g",color:C.hyper,note:"Energy"},{label:"Fat",val:fat,unit:"g",color:C.ora,note:"~28%"}].map(m=>(
                        <div key={m.label} style={{flex:1,background:C.surUp,borderRadius:8,padding:"10px 8px",textAlign:"center",border:`1px solid ${m.color}30`}}>
                          <div style={{fontSize:18,fontWeight:700,color:m.color,fontFamily:"'Space Mono',monospace"}}>{m.val}</div>
                          <div style={{fontSize:9,color:C.mid,fontFamily:"'Space Mono',monospace",marginTop:2}}>{m.unit} {m.label}</div>
                          <div style={{fontSize:8,color:C.dim,marginTop:2}}>{m.note}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:C.dim,lineHeight:1.6,marginBottom:10}}>
                      Front-load protein early in the day. Avoid large carb meals directly before training. Eat for performance and body composition, not hunger signals alone.
                    </div>
                    <button onClick={()=>{window.dispatchEvent(new CustomEvent("gmt_coach_msg",{detail:`My TDEE is ~${tdee} kcal. Target macros: ${prot}g protein, ${carb}g carbs, ${fat}g fat. Can you help me optimise my nutrition for my goals?`}));window.dispatchEvent(new CustomEvent("gmt_nav",{detail:"coach"}));}} style={{width:"100%",background:"rgba(0,102,255,0.08)",border:"1px solid rgba(0,102,255,0.25)",borderRadius:8,padding:"10px",color:C.hyper,fontSize:12,fontFamily:"'Space Mono',monospace",cursor:"pointer",letterSpacing:"0.06em"}}>ASK GARY TO REFINE THIS</button>
                  </div>
                )}
                {isExpanded&&r.key==="water"&&(
                  <div style={{padding:"0 16px 14px",borderTop:`1px solid ${C.bdr}`}}>
                    <div style={{fontSize:10,color:C.blu,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:10,marginTop:12}}>HYDRATION BREAKDOWN</div>
                    <div style={{display:"flex",gap:8,marginBottom:12}}>
                      {[{label:"Base",val:baseWater+"L",color:C.blu},{label:"Activity",val:hasRun?"+ 0.5L":"+ 0.2L",color:C.hyper},{label:"Creatine",val:usesCr?"+ 0.5L":"0L",color:usesCr?"#00C9B1":C.dim}].map(m=>(
                        <div key={m.label} style={{flex:1,background:C.surUp,borderRadius:8,padding:"10px 8px",textAlign:"center",border:`1px solid ${m.color}30`}}>
                          <div style={{fontSize:15,fontWeight:700,color:m.color,fontFamily:"'Space Mono',monospace"}}>{m.val}</div>
                          <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",marginTop:2}}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:`${C.blu}10`,border:`1px solid ${C.blu}30`,borderRadius:8,padding:"10px 12px",marginBottom:10}}>
                      <div style={{fontSize:13,color:C.txt,fontWeight:600}}>Daily target: {totalWater}L</div>
                      {usesCr&&<div style={{fontSize:11,color:C.recovery,marginTop:4}}>+500ml for creatine - supports uptake and prevents cramping</div>}
                      {!usesCr&&<div style={{fontSize:11,color:C.dim,marginTop:4}}>Add "creatine" to supplements below to see adjusted target</div>}
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:6}}>SUPPLEMENTS (affects water target)</div>
                      <input placeholder="e.g. creatine, caffeine, magnesium" defaultValue={recoveryVals.supplements||""} onBlur={e=>saveRecovery("supplements",e.target.value)} style={{width:"100%",background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:6,padding:"8px 10px",color:C.txt,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                    </div>
                    <button onClick={()=>{window.dispatchEvent(new CustomEvent("gmt_coach_msg",{detail:`My daily water target is ${totalWater}L (${usesCr?"using creatine":"no creatine"}). I weigh ${Math.round(kg)}kg. Can you advise on optimal hydration timing around training?`}));window.dispatchEvent(new CustomEvent("gmt_nav",{detail:"coach"}));}} style={{width:"100%",background:"rgba(33,150,243,0.08)",border:"1px solid rgba(33,150,243,0.25)",borderRadius:8,padding:"10px",color:C.blu,fontSize:12,fontFamily:"'Space Mono',monospace",cursor:"pointer",letterSpacing:"0.06em"}}>ASK GARY ABOUT HYDRATION</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Coach note */}
      <div style={{padding:"0 20px"}}>
        <div style={{background:C.surUp,border:`1px solid ${C.accD}40`,borderLeft:`3px solid ${C.acc}`,borderRadius:10,padding:"16px 18px"}}>
          <div style={{fontSize:10,color:C.recovery,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:8}}>COACH NOTE</div>
          {lastWorkout&&<div style={{background:C.strengthG,border:`1px solid ${C.strength}30`,borderRadius:6,padding:"8px 10px",marginBottom:8}}>
            <div style={{fontSize:9,color:C.strength,fontFamily:"'Space Mono',monospace",marginBottom:2}}>LAST SESSION</div>
            <div style={{fontSize:12,color:C.mid}}>{String(lastWorkout.session||"")} {lastWorkout.sets?` -- ${lastWorkout.sets} sets logged`:""}</div>
            {lastWorkout.notes&&<div style={{fontSize:11,color:C.dim,marginTop:4,fontStyle:"italic"}}>"{lastWorkout.notes.slice(0,80)}"</div>}
          </div>}
          <p style={{fontSize:14,color:C.mid,lineHeight:1.7,marginBottom:12}}>{lastWorkout?"Great work. Focus on recovery now - protein within 90 minutes, 7-9 hours sleep, and stay mobile tomorrow. I have noted your performance for next session.":"First priority this block: find the muscle before loading it. Every set starts with the squeeze, not the weight. If you cannot feel it in the first rep, the weight is too heavy or the setup is wrong."}</p>
          <button onClick={()=>window.dispatchEvent(new CustomEvent("gmt_nav",{detail:"coach"}))} style={{background:C.hyperG,border:`1px solid ${C.hyper}40`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,color:C.hyper,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Discuss with Gary {String.fromCharCode(8594)}</button>
        </div>
      </div>

      {/* Readiness Card - only after recovery data exists */}
      {(()=>{
        const sleep=parseFloat(recoveryVals.sleep)||0;
        const stress=parseFloat(recoveryVals.stress)||5;
        const sunMins=Math.round((sunlightLog[todayKey]||0)/60);
        const hasData=sleep>0||sunMins>0;
        if(!hasData)return null; // Don't show on first day
        let readiness="moderate";
        let readColor=C.ora;
        let readLabel="MODERATE READINESS";
        let readAdvice="Train as programmed. Monitor bar speed and adjust load if needed.";
        let garyPrompt="My readiness today is moderate. Sleep was average. How should I approach today's session?";
        if(sleep>=7.5&&stress<=4&&sunMins>=10){readiness="high";readColor="#00C9B1";readLabel="HIGH READINESS";readAdvice="You are primed. Push load. This is a day to chase progressive overload on your primary lifts.";garyPrompt="My readiness is high today - great sleep, sun exposure. How do I make the most of today's session?";}
        else if(sleep<6||stress>=7){readiness="low";readColor="#FF1744";readLabel="LOW READINESS";readAdvice="Reduce volume by 30%. Avoid heavy axial loading. Stick to machine and cable work. Recovery is the training today.";garyPrompt="My readiness is low today - poor sleep, high stress. How should I adjust my training?";}
        const openGary=()=>{
          window.dispatchEvent(new CustomEvent("gmt_coach_msg",{detail:garyPrompt}));
          window.dispatchEvent(new CustomEvent("gmt_nav",{detail:"coach"}));
        };
        return(
          <div style={{padding:"0 20px 16px"}}>
            <button onClick={openGary} style={{width:"100%",background:`${readiness==="high"?"rgba(0,201,177,0.06)":readiness==="low"?"rgba(255,23,68,0.06)":"rgba(255,140,0,0.06)"}`,border:`1px solid ${readiness==="high"?"rgba(0,201,177,0.2)":readiness==="low"?"rgba(255,23,68,0.2)":"rgba(255,140,0,0.2)"}`,borderRadius:12,padding:"16px",cursor:"pointer",textAlign:"left"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:10,color:readColor,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em"}}>{readLabel}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {sleep>0&&<span style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{sleep}h sleep</span>}
                  {sunMins>0&&<span style={{fontSize:10,color:"#FF8C00",fontFamily:"'Space Mono',monospace"}}>{sunMins}m sun</span>}
                  <span style={{fontSize:10,color:readColor,fontFamily:"'Space Mono',monospace"}}>Ask Gary -></span>
                </div>
              </div>
              <div style={{fontSize:13,color:C.mid,lineHeight:1.6}}>{readAdvice}</div>
            </button>
          </div>
        );
      })()}
      {/* Volume Engine shortcut */}
      <div style={{padding:"0 20px 24px"}}>
        <button onClick={()=>onVolumeEngine&&onVolumeEngine()} style={{width:"100%",background:"rgba(0,102,255,0.05)",border:"1px solid rgba(0,102,255,0.15)",borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.2s"}}>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:10,color:"rgba(0,102,255,0.7)",fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",marginBottom:3}}>GMT VOLUME ENGINE</div>
            <div style={{fontSize:14,fontWeight:700,color:C.txt}}>Weekly Volume Tracker</div>
            <div style={{fontSize:11,color:C.mid,marginTop:2}}>Sets per muscle - Hypertrophy targets</div>
          </div>
          <div style={{fontSize:20,color:"#0066FF"}}>&rarr;</div>
        </button>
      </div>

      {/* -- STOIC QUOTE (bottom, clickable) -- */}
      <div style={{padding:"0 20px 32px"}}>
        <button onClick={()=>{
          window.dispatchEvent(new CustomEvent("gmt_coach_msg",{detail:`I want to discuss today's stoic quote: "${stoicQ.text}" -- ${stoicQ.author}. What does this mean for how I approach my training?`}));
          window.dispatchEvent(new CustomEvent("gmt_nav",{detail:"coach"}));
        }} style={{width:"100%",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"16px 18px",borderLeft:"3px solid rgba(255,140,0,0.5)",cursor:"pointer",textAlign:"left"}}>
          <div style={{fontSize:11,color:"rgba(255,140,0,0.7)",fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:8,display:"flex",justifyContent:"space-between"}}>
            <span>TODAY'S REFLECTION</span>
            <span style={{color:C.dim}}>Discuss with Gary -></span>
          </div>
          <div style={{fontSize:14,color:C.txt,lineHeight:1.65,fontStyle:"italic",marginBottom:8}}>"{stoicQ.text}"</div>
          <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>-- {stoicQ.author}</div>
        </button>
      </div>
    </div>
  );
};

// --- PROGRESS VIEW ------------------------------------------------
const ProgressView=({sessionCount=0})=>{
  const liftData={"Bench":[80,82.5,85,85,87.5,90,92.5,95,97.5,100],"Squat":[100,105,107.5,110,112.5,117.5,120,125,127.5,130],"Deadlift":[120,125,130,132.5,135,140,142.5,145,150,155]};
  const[sel,setSel]=useState("Bench");
  const data=liftData[sel];const max=Math.max(...data);const min=Math.min(...data)-5;
  return(
    <div style={{paddingBottom:100}}>
      <div style={{padding:"48px 20px 24px"}}>
        <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:8}}>PROGRESS TRACKING</div>
        <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,letterSpacing:"0.04em"}}>YOUR METRICS</h1>
      </div>
      <div style={{padding:"0 20px 20px",display:"flex",gap:8}}>
        {Object.keys(liftData).map(l=><button key={l} onClick={()=>setSel(l)} style={{flex:1,padding:"10px 0",background:sel===l?C.hyperG:C.sur,border:`1px solid ${sel===l?C.hyper:C.bdr}`,borderRadius:8,cursor:"pointer",fontSize:13,color:sel===l?C.hyper:C.mid,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>{l}</button>)}
      </div>
      <div style={{padding:"0 20px 24px"}}>
        <div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20}}>{sel}</span>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:18,color:C.strength}}>{data[data.length-1]}kg</span>
          </div>
          <span style={{fontSize:12,color:C.strength}}> +{data[data.length-1]-data[0]}kg from start</span>
          <div style={{marginTop:20,position:"relative",height:100}}>
            <svg width="100%" height="100%" viewBox={`0 0 ${data.length*30} 100`} preserveAspectRatio="none">
              <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.strength} stopOpacity=".3"/><stop offset="100%" stopColor={C.strength} stopOpacity="0"/></linearGradient></defs>
              <polyline points={data.map((v,i)=>`${i*30+15},${100-((v-min)/(max-min+5))*80}`).join(" ")} fill="none" stroke={C.hyper} strokeWidth="2" strokeLinejoin="round"/>
              <polygon points={`15,100 ${data.map((v,i)=>`${i*30+15},${100-((v-min)/(max-min+5))*80}`).join(" ")} ${(data.length-1)*30+15},100`} fill="url(#lg)"/>
              {data.map((v,i)=><circle key={i} cx={i*30+15} cy={100-((v-min)/(max-min+5))*80} r={i===data.length-1?4:2.5} fill={i===data.length-1?C.hyper:C.bg} stroke={C.strength} strokeWidth="1.5"/>)}
            </svg>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            {["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10"].map((w,i)=><span key={i} style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{w}</span>)}
          </div>
        </div>
      </div>
      <div style={{padding:"0 20px"}}>
        <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:12}}>BENCHMARKS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{name:"Bench Press",val:100,delta:"+20"},{name:"Back Squat",val:130,delta:"+30"},{name:"Deadlift",val:155,delta:"+35"},{name:"OHP",val:70,delta:"+12.5"}].map((s,i)=>(
            <div key={i} style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:16}}>
              <div style={{fontSize:11,color:C.mid,marginBottom:8}}>{s.name}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,lineHeight:1}}>{s.val}<span style={{fontSize:13,color:C.dim}}>kg</span></div>
              <div style={{marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <Tag>5RM</Tag>
                <span style={{fontSize:12,color:C.strength,fontFamily:"'Space Mono',monospace"}}>{s.delta}kg </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- PROGRAM VIEW -------------------------------------------------
const ProgramView=({onStartWorkout,weekSchedule={}})=>{
  const[selected,setSelected]=useState(null);
  const schedule=Object.entries(weekSchedule);
  return(
    <div style={{paddingBottom:100}}>
      <div style={{padding:"48px 20px 24px"}}>
        <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:8}}>ACTIVE PROGRAM</div>
        <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,letterSpacing:"0.04em",marginBottom:4}}>BLOCK 1</h1>
        <p style={{color:C.mid,fontSize:14}}>Hypertrophy Foundation  4-week mesocycle</p>
        <div style={{marginTop:16,display:"flex",gap:10}}><Tag>WEEK 1/4</Tag><Tag color={C.blu}>4 DAYS</Tag></div>
      </div>
      <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:12}}>
        {schedule.length===0?<div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:32,textAlign:"center",color:C.dim,fontSize:14}}>No sessions scheduled yet.</div>
        :schedule.map(([day,lbl])=>{
          const sess=weekProgram[lbl]||weekProgram["Push A"];
          return(
            <div key={day} style={{background:selected===day?C.surUp:C.sur,border:`1px solid ${selected===day?C.hyper:C.bdr}`,borderRadius:12,overflow:"hidden"}}>
              <div onClick={()=>setSelected(selected===day?null:day)} style={{padding:"18px 20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:48,height:48,background:C.bg,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:`1px solid ${C.bdr}`}}>
                    <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{day}</div>
                  </div>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.06em"}}>{lbl}</div>
                    <div style={{fontSize:12,color:C.mid}}>{sess?.tag}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:20,fontFamily:"'Bebas Neue',sans-serif",color:C.hyper}}>{sess?.exercises?.length||6}</div>
                  <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>EX</div>
                </div>
              </div>
              {selected===day&&<div className="fu" style={{borderTop:`1px solid ${C.bdr}`}}>
                {sess?.exercises?.map((ex,i)=>(
                  <div key={i} style={{padding:"12px 20px",borderBottom:i<sess.exercises.length-1?`1px solid ${C.bdr}`:"none",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{ex.name}</div>
                      <div style={{fontSize:11,color:C.mid,marginTop:2}}>{ex.setsLabel||ex.sets} x {ex.reps}</div>
                    </div>
                    {ex.rpe&&<RPEBadge rpe={ex.rpe}/>}
                  </div>
                ))}
                <div style={{padding:16}}><Btn onClick={()=>onStartWorkout(day,sess)} style={{width:"100%"}}>Start {lbl} </Btn></div>
              </div>}
            </div>
          );
        })}
      </div>
      <div style={{padding:"24px 20px 0"}}>
        <div style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:12}}>BLOCK STRUCTURE</div>
          {[{b:"Block 1",l:"Hypertrophy Foundation",w:"Wk 14",cur:true},{b:"Block 2",l:"Strength Accumulation",w:"Wk 58"},{b:"Block 3",l:"Intensification",w:"Wk 911"},{b:"Deload",l:"Recovery + Adaptation",w:"Wk 12"}].map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<3?10:0}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:item.cur?C.hyper:C.bdr,flexShrink:0}}/>
              <div style={{flex:1,fontSize:12,color:item.cur?C.txt:C.mid,fontWeight:item.cur?600:400}}>{item.b}: {item.l}</div>
              <span style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{item.w}</span>
              {item.cur&&<Tag>NOW</Tag>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- NUTRITION VIEW -----------------------------------------------
const NutritionView=({profile})=>{
  const unit=profile?.unit||"kg";
  const[meals,setMeals]=useState(()=>{try{return JSON.parse(localStorage.getItem("gmt_meals")||"[]");}catch{return[];}});
  const[analyzing,setAnalyzing]=useState(false);
  const[showAdd,setShowAdd]=useState(false);
  const[manualEntry,setManualEntry]=useState({name:"",cal:"",protein:"",carbs:"",fat:""});
  const today=new Date().toDateString();
  const todayMeals=meals.filter(m=>m.date===today);
  const totals=todayMeals.reduce((a,m)=>({cal:a.cal+(m.cal||0),protein:a.protein+(m.protein||0),carbs:a.carbs+(m.carbs||0),fat:a.fat+(m.fat||0)}),{cal:0,protein:0,carbs:0,fat:0});
  const saveMeal=(meal)=>{
    const newMeals=[meal,...meals].slice(0,100);
    setMeals(newMeals);
    try{localStorage.setItem("gmt_meals",JSON.stringify(newMeals));}catch(e){}
  };
  const analyzePhoto=async(file)=>{
    setAnalyzing(true);
    try{
      const reader=new FileReader();
      reader.onload=async(e)=>{
        const b64=e.target.result.split(",")[1];
        const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:300,
          system:"You are a nutrition expert. Analyse the food photo and return ONLY a JSON object with keys: name (string), cal (number), protein (number in grams), carbs (number in grams), fat (number in grams), notes (brief string about the food). Be conservative with estimates. No markdown, just raw JSON.",
          messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}},{type:"text",text:"Analyse this meal and give me the nutritional breakdown as JSON."}]}]
        })});
        const d=await res.json();
        const txt=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();
        try{
          const clean=txt.replace(/```json|```/g,"").trim();
          const meal={...JSON.parse(clean),date:today,id:Date.now(),fromPhoto:true};
          saveMeal(meal);
        }catch(pe){console.error("Parse error:",pe,txt);}
        setAnalyzing(false);
      };
      reader.readAsDataURL(file);
    }catch(e){setAnalyzing(false);}
  };
  const targets={cal:2200,protein:180,carbs:220,fat:70};
  const MacroBar=({label,val,target,color})=>(
    <div style={{flex:1}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:10,color:C.mid,fontFamily:"'Space Mono',monospace",letterSpacing:"0.06em"}}>{label}</span>
        <span style={{fontSize:11,color,fontFamily:"'Space Mono',monospace"}}>{Math.round(val)}<span style={{color:C.dim,fontSize:9}}>/{target}g</span></span>
      </div>
      <PBar value={val} max={target} color={color} h={5}/>
    </div>
  );
  return(
    <div style={{paddingBottom:120}}>
      <div style={{padding:"48px 20px 20px"}}>
        <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:8}}>NUTRITION</div>
        <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,letterSpacing:"0.04em",marginBottom:4}}>FUEL.</h1>
        <p style={{fontSize:13,color:C.mid,lineHeight:1.6,marginBottom:20}}>Protein first. Everything else follows.</p>
        {/* Daily totals */}
        <div style={{background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:14,padding:20,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16}}>
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,lineHeight:1,color:C.txt}}>{Math.round(totals.cal)}</div>
              <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>KCAL TODAY</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.strength}}>{Math.round(totals.protein)}g</div>
              <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace"}}>PROTEIN</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <MacroBar label="PROTEIN" val={totals.protein} target={targets.protein} color={C.strength}/>
            <MacroBar label="CARBS" val={totals.carbs} target={targets.carbs} color={C.hyper}/>
            <MacroBar label="FAT" val={totals.fat} target={targets.fat} color={C.ora}/>
          </div>
        </div>
        {/* Action buttons */}
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          <label style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:C.hyperG,border:`1px solid ${C.hyper}`,borderRadius:10,padding:"14px",cursor:"pointer",fontSize:13,color:C.hyper,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
            {analyzing?<span style={{animation:"pulse 1s infinite"}}>Analysing...</span>:<><span style={{fontSize:18}}>Scan</span> Photo Analysis</>}
            {!analyzing&&<input type="file" accept="image/*" capture="environment" onChange={e=>e.target.files[0]&&analyzePhoto(e.target.files[0])} style={{display:"none"}}/>}
          </label>
          <button onClick={()=>setShowAdd(s=>!s)} style={{flex:1,background:showAdd?C.sur:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"14px",cursor:"pointer",fontSize:13,color:C.mid,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>+ Manual Entry</button>
        </div>
        {/* Manual entry */}
        {showAdd&&<div className="fu" style={{background:C.sur,border:`1px solid ${C.bdrL}`,borderRadius:12,padding:16,marginBottom:16}}>
          {[{key:"name",label:"Food Name",type:"text"},{key:"cal",label:"Calories",type:"number"},{key:"protein",label:"Protein (g)",type:"number"},{key:"carbs",label:"Carbs (g)",type:"number"},{key:"fat",label:"Fat (g)",type:"number"}].map(f=>(
            <div key={f.key} style={{marginBottom:10}}>
              <label style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",display:"block",marginBottom:4}}>{f.label.toUpperCase()}</label>
              <input type={f.type} value={manualEntry[f.key]} onChange={e=>setManualEntry(m=>({...m,[f.key]:e.target.value}))} style={{width:"100%",background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px 14px",color:C.txt,fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
            </div>
          ))}
          <Btn onClick={()=>{if(!manualEntry.name)return;saveMeal({...manualEntry,cal:parseInt(manualEntry.cal)||0,protein:parseInt(manualEntry.protein)||0,carbs:parseInt(manualEntry.carbs)||0,fat:parseInt(manualEntry.fat)||0,date:today,id:Date.now()});setManualEntry({name:"",cal:"",protein:"",carbs:"",fat:""});setShowAdd(false);}} style={{width:"100%",marginTop:4}} small>Add Meal</Btn>
        </div>}
        {/* Today's log */}
        {todayMeals.length>0&&<>
          <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:10}}>TODAY</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {todayMeals.map(m=>(
              <div key={m.id} style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:C.txt,marginBottom:2}}>{m.name}{m.fromPhoto&&<span style={{fontSize:10,color:C.hyper,marginLeft:6,fontFamily:"'Space Mono',monospace"}}>AI</span>}</div>
                  {m.notes&&<div style={{fontSize:11,color:C.dim}}>{m.notes}</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:13,color:C.txt}}>{m.cal} kcal</div>
                  <div style={{fontSize:10,color:C.mid}}>{m.protein}g P / {m.carbs}g C / {m.fat}g F</div>
                </div>
              </div>
            ))}
          </div>
        </>}
        {todayMeals.length===0&&<div style={{textAlign:"center",padding:"32px 20px",color:C.dim,fontSize:14,lineHeight:1.7}}>No meals logged yet. Take a photo or add manually. Protein hits the target first - everything else adjusts around it.</div>}
      </div>
    </div>
  );
};


// --- FAVOURITES VIEW ----------------------------------------------
const FavouritesView=({favourites,onToggleFav,profile})=>{
  const favExercises=EXERCISES.filter(e=>favourites.includes(e.id));
  const[chatInput,setChatInput]=useState("");
  const[chatHistory,setChatHistory]=useState([]);
  const[loading,setLoading]=useState(false);
  const[showChat,setShowChat]=useState(false);
  const chatRef=useRef(null);

  const sendChat=async(override)=>{
    const text=override||chatInput.trim();
    if(!text||loading)return;
    const userMsg={from:"user",text};
    const hist=[...chatHistory,userMsg];
    setChatHistory(hist);setChatInput("");setLoading(true);setShowChat(true);
    const favNames=favExercises.map(e=>e.name).join(", ");
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        model:"claude-sonnet-4-20250514",max_tokens:400,
        system:buildPrompt(profile,false)+"\n\nFAVOURITE EXERCISES CONTEXT:\nThe athlete has favourited these exercises: "+favNames+". They may want to discuss programming, technique, or how to incorporate these into their training. Be specific and reference the actual exercises they have saved.",
        messages:hist.map(m=>({role:m.from==="user"?"user":"assistant",content:m.text}))
      })});
      const d=await res.json();
      const txt=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();
      if(txt){setChatHistory(h=>[...h,{from:"coach",text:stripMd(txt)}]);setShowChat(true);}
    }catch(e){setChatHistory(h=>[...h,{from:"coach",text:"Connection issue. Try again."}]);}
    finally{setLoading(false);setTimeout(()=>chatRef.current?.scrollTo(0,99999),100);}
  };

  const quickPrompts=["How should I programme these movements together?","Which of my favourites need the most attention?","Build me a session around my favourites","What am I missing based on these choices?","How do I progress on these over 8 weeks?"];

  return(
    <div style={{paddingBottom:180}}>
      <div style={{padding:"48px 20px 20px"}}>
        <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:8}}>YOUR PICKS</div>
        <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,letterSpacing:"0.04em",marginBottom:4}}>FAVOURITES</h1>
        <p style={{fontSize:13,color:C.mid,marginBottom:0}}>Exercises you have saved. Discuss them with Gary below.</p>
      </div>

      {favExercises.length===0?(
        <div style={{padding:"40px 20px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:16,opacity:0.2}}>*</div>
          <div style={{fontSize:14,color:C.mid,lineHeight:1.7,maxWidth:280,margin:"0 auto"}}>No favourites yet. Browse the Exercise Library and tap the star on any movement to save it here.</div>
        </div>
      ):(
        <>
          <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {favExercises.map(e=>(
              <div key={e.id} style={{background:C.sur,border:`1px solid ${C.strength}20`,borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:C.txt,marginBottom:3}}>{e.name}</div>
                  <div style={{display:"flex",gap:8}}>
                    <Tag color={C.mid}>{e.muscle}</Tag>
                    <Tag color={C.dim}>{e.equipment}</Tag>
                  </div>
                </div>
                <button onClick={()=>onToggleFav(e.id)} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,color:C.dim,fontFamily:"'DM Sans',sans-serif"}}>Remove</button>
              </div>
            ))}
          </div>

          <div style={{padding:"0 20px",marginBottom:12}}>
            <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:10}}>ASK GARY ABOUT YOUR FAVOURITES</div>
            <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",paddingBottom:8}}>
              {quickPrompts.map((q,i)=>(
                <button key={i} onClick={()=>sendChat(q)} style={{flexShrink:0,background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:20,padding:"8px 14px",cursor:"pointer",fontSize:12,color:C.mid,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Gary chat */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 40px)",maxWidth:440,zIndex:50,paddingBottom:80}}>
        {showChat&&<div ref={chatRef} className="fu" style={{background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:12,padding:14,marginBottom:8,maxHeight:260,overflowY:"auto"}}>
          {chatHistory.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start",marginBottom:10}}>
              {m.from==="coach"&&<div style={{width:22,height:22,borderRadius:6,background:C.hyperG,border:`1px solid ${C.hyper}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:10,color:C.hyper,marginRight:8,flexShrink:0,marginTop:2}}>G</div>}
              <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:10,background:m.from==="user"?C.hyperG:C.sur,border:`1px solid ${m.from==="user"?C.hyper+"40":C.bdr}`,fontSize:13,lineHeight:1.65,color:C.txt}}>{m.text}</div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",gap:4,padding:"4px 0 4px 30px"}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.hyper,animation:`pulse 1.2s ${i*0.2}s infinite`}}/>)}</div>}
        </div>}
        <div style={{display:"flex",gap:8,background:C.bg,paddingTop:4}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} onFocus={()=>favExercises.length>0&&setShowChat(true)} placeholder={favExercises.length>0?"Ask Gary about your favourites...":"Add favourites from the exercise library first"} style={{flex:1,background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:10,padding:"12px 14px",color:C.txt,fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
          <button onClick={()=>sendChat()} disabled={!chatInput.trim()||loading} style={{width:44,height:44,background:chatInput.trim()?C.strength:C.sur,border:`1px solid ${chatInput.trim()?C.strength:C.bdr}`,borderRadius:10,cursor:"pointer",fontSize:16,color:chatInput.trim()?"#fff":C.dim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {String.fromCharCode(8593)}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- BOTTOM NAV ---------------------------------------------------
const BottomNav=({active,setActive,user,onProfile})=>{
  const tabs=[
    {id:"home",icon:"H",label:"Home"},
    {id:"program",icon:"P",label:"Programme"},
    {id:"workouts",icon:"W",label:"Workouts"},
    {id:"library",icon:"E",label:"Exercises"},
    {id:"coach",icon:"G",label:"Coach"},
  ];
  const initial=(user?.initial||user?.name?.[0]||"G").toUpperCase();
  return(
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:`${C.bg}F0`,backdropFilter:"blur(20px)",borderTop:`1px solid ${C.bdr}`,display:"flex",padding:"10px 0 24px",zIndex:100,alignItems:"center"}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setActive(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"3px 0"}}>
          <div style={{fontSize:16,width:34,height:34,borderRadius:10,background:active===t.id?"rgba(0,102,255,0.12)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:active===t.id?C.hyper:C.dim,border:active===t.id?`1px solid rgba(0,102,255,0.25)`:"1px solid transparent",transition:"all 0.15s"}}>{t.icon}</div>
          <span style={{fontSize:9,fontFamily:"'Space Mono',monospace",color:active===t.id?C.hyper:C.dim,letterSpacing:"0.04em"}}>{t.label}</span>
        </button>
      ))}
      <button onClick={onProfile} style={{flexShrink:0,width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,rgba(0,102,255,0.25),rgba(0,201,177,0.15))",border:`1px solid rgba(0,102,255,0.35)`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontFamily:"'Bebas Neue',sans-serif",color:"#0066FF",marginRight:10,letterSpacing:"0.05em",transition:"all 0.15s"}}>
        {initial}
      </button>
    </div>
  );
};

// --- COACH INTRO -------------------------------------------------
const CoachIntro=({profile,onReady})=>(
  <div style={{height:"100vh",display:"flex",flexDirection:"column"}}>
    <CoachView profile={profile} introMode onReady={onReady}/>
  </div>
);


// --- TERMS & CONDITIONS ------------------------------------------
const TermsScreen=({onAccept})=>{
  const[checked,setChecked]=useState(false);
  const[dataChecked,setDataChecked]=useState(false);
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",padding:"48px 24px 40px",maxWidth:480,margin:"0 auto"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:"0.15em",marginBottom:8}}>GMT COACH</div>
      <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:32}}>BEFORE WE BEGIN</div>
      <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,lineHeight:1,letterSpacing:"0.04em",marginBottom:8}}>TERMS & CONDITIONS</h2>
      <p style={{color:C.mid,fontSize:14,lineHeight:1.7,marginBottom:24}}>Please read and agree to the following before using GMT Coach.</p>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
        {[
          {title:"Health Disclaimer",body:"GMT Coach provides general fitness programming and educational content. It is not a substitute for medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before starting any new exercise programme, particularly if you have pre-existing medical conditions, injuries, or health concerns. Exercise carries inherent risk. You accept full responsibility for your physical wellbeing."},
          {title:"Not a Medical Device",body:"This app and its AI coaching features are for informational and educational purposes only. GMT Coach does not diagnose, treat, cure, or prevent any condition. Programming suggestions are based on information you provide and general fitness principles."},
          {title:"Programme Improvement",body:"GMT Coach improves its programming every month. With your consent, anonymised usage patterns such as which exercises are favourited, session completion rates, and coaching interaction trends may be used to improve programming quality for all users. No personally identifiable information is shared. You can withdraw consent at any time in Settings."},
          {title:"Data & Privacy",body:"Your profile, workout logs, and coaching conversations are stored locally on your device. AI coaching is processed via Anthropic's Claude API. Please refer to anthropic.com for details on how conversational data is handled."},
          {title:"Intensity Warning",body:"GMT Coach uses high-intensity principles for advanced athletes. Select your training age honestly during setup. Training to failure carries risk if form breaks down. Always prioritise technique over load."},
        ].map((s,i)=>(
          <div key={i} style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"16px 18px"}}>
            <div style={{fontSize:12,fontWeight:700,color:C.txt,marginBottom:8}}>{s.title}</div>
            <p style={{fontSize:13,color:C.mid,lineHeight:1.7}}>{s.body}</p>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
        <button onClick={()=>setChecked(c=>!c)} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:12,textAlign:"left",padding:0}}>
          <div style={{width:24,height:24,borderRadius:6,border:`2px solid ${checked?C.hyper:C.bdr}`,background:checked?C.hyperG:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.15s"}}>
            {checked&&<div style={{width:10,height:10,borderRadius:2,background:C.hyper}}/>}
          </div>
          <span style={{fontSize:14,color:C.txt,lineHeight:1.65}}>I have read and agree to the Terms and Health Disclaimer. I understand GMT Coach is not a medical device and I train at my own risk.</span>
        </button>
        <button onClick={()=>setDataChecked(c=>!c)} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:12,textAlign:"left",padding:0}}>
          <div style={{width:24,height:24,borderRadius:6,border:`2px solid ${dataChecked?C.recovery:C.bdr}`,background:dataChecked?C.recoveryG:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.15s"}}>
            {dataChecked&&<div style={{width:10,height:10,borderRadius:2,background:C.recovery}}/>}
          </div>
          <span style={{fontSize:14,color:C.mid,lineHeight:1.65}}>I consent to anonymised usage data being used to improve GMT Coach programming for all users. (Optional)</span>
        </button>
      </div>
      <Btn onClick={onAccept} disabled={!checked} style={{width:"100%"}}>
        {checked?"I Agree -- Build My Programme":"Accept Terms to Continue"}
      </Btn>
    </div>
  );
};

// --- APP ROOT -----------------------------------------------------
// --- CUSTOM WORKOUT BUILDER ----------------------------------------
const CustomWorkoutBuilder=({profile,onClose,onStartWorkout})=>{
  const[step,setStep]=useState(0); // 0=questions, 1=generating, 2=result
  const[answers,setAnswers]=useState({});
  const[result,setResult]=useState(null);
  const[error,setError]=useState("");

  const questions=[
    {key:"equipment",label:"What equipment do you have available right now?",type:"select",
     opts:["Full gym","Dumbbells only","Barbell + rack","Cables + machines","Home / bodyweight","Heavy bag available","Treadmill available"],multi:true,
     hint:profile?.equipment?`Your usual setup: ${profile.equipment.slice(0,60)}`:""},
    {key:"time",label:"How much time do you have?",type:"select",
     opts:["20 minutes","30 minutes","45 minutes","60 minutes","75+ minutes"],multi:false},
    {key:"energy",label:"How is your energy today?",type:"select",
     opts:["High -- ready to push hard","Medium -- solid session","Low -- something is better than nothing","Recovering -- light movement only"],multi:false},
    {key:"focus",label:"What do you want to work on?",type:"select",
     opts:["Upper body -- push (chest, shoulders, triceps)","Upper body -- pull (back, biceps)","Lower body (quads, hamstrings, glutes)","Full body","Core and stability","Conditioning / cardio","Boxing","Whatever Gary recommends"],multi:true},
    {key:"notes",label:"Anything else Gary should know?",type:"text",placeholder:"Injury, soreness, specific goal for today..."},
  ];

  const q=questions[step];
  const canNext=step<questions.length-1?(q.multi?(answers[q.key]||[]).length>0:!!answers[q.key]):true;

  const handleSelect=(opt)=>{
    if(q.multi){
      const curr=answers[q.key]||[];
      const next=curr.includes(opt)?curr.filter(x=>x!==opt):[...curr,opt];
      setAnswers({...answers,[q.key]:next});
    } else {
      setAnswers({...answers,[q.key]:opt});
    }
  };

  const generateWorkout=async()=>{
    setStep("generating");
    const profileStr=[
      profile?.trainingAge&&`Training age: ${profile.trainingAge}`,
      profile?.goals?.length&&`Goals: ${profile.goals.slice(0,3).join(", ")}`,
      profile?.gender&&`Gender: ${profile.gender}`,
      profile?.bodyStats?.weight&&`Bodyweight: ${profile.bodyStats.weight}`,
    ].filter(Boolean).join(". ");

    const prompt=`You are Gary Mulholland, an elite strength and physique coach. Your doctrine: Train like an athlete. Build like a bodybuilder. Recover like a specialist. Think like a scientist. Your influences: Arnold Schwarzenegger, Dorian Yates, Mike Mentzer, Chris Bumstead, Mike Thurston, Jeff Nippard, Charles Poliquin, Pavel Tsatsouline, Brett Contreras, Ben Patrick, Stuart McGill, Andrew Huberman.

Athlete profile: ${profileStr||"No profile data"}.

Today's parameters:
- Equipment available: ${(answers.equipment||[]).join(", ")||"general gym"}
- Time available: ${answers.time||"45 minutes"}
- Energy level: ${answers.energy||"Medium"}
- Focus: ${(answers.focus||[]).join(", ")||"Gary's recommendation"}
- Notes: ${answers.notes||"None"}

Generate a complete, ready-to-execute workout session. Follow GMT session architecture: movement prep ? primary compound ? secondary compound ? hypertrophy accessory ? isolation ? optional conditioning.

Respond ONLY in this exact JSON format (no markdown, no preamble):
{
  "sessionName": "string -- creative session name",
  "garyNote": "string -- 2-3 sentence coaching briefing in Gary's direct, calm voice",
  "duration": "string -- e.g. 45 min",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": number,
      "reps": "e.g. 6-8 or 12-15 or 45s",
      "rest": number_seconds,
      "tempo": "e.g. 3-1-1-0",
      "rpe": number,
      "note": "string -- brief coaching cue"
    }
  ]
}`;

    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1500,
          system:"You are Gary Mulholland, GMT Coach AI. Respond only in the exact JSON format requested. No markdown fences.",
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await res.json();
      const text=data.content?.map(b=>b.text||"").join("").trim();
      const clean=text.replace(/```json|```/g,"").trim();
      const workout=JSON.parse(clean);
      setResult(workout);
      setStep("result");
    } catch(e){
      setError("Gary is unavailable right now. Check your connection and try again.");
      setStep(0);
    }
  };

  if(step==="generating") return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40}}>
      <div style={{width:48,height:48,borderRadius:"50%",border:`3px solid rgba(0,102,255,0.2)`,borderTop:`3px solid #0066FF`,animation:"spin 1s linear infinite",marginBottom:24}}/>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:"0.1em",marginBottom:8}}>GARY IS THINKING</div>
      <div style={{fontSize:13,color:C.dim,textAlign:"center"}}>Building your perfect session...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(step==="result"&&result) return(
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:100}}>
      <div style={{background:`${C.bg}F0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.bdr}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:20,padding:"4px 8px 4px 0"}}>{"<"}</button>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.1em"}}>CUSTOM SESSION</span>
        <Tag color={C.hyper} style={{marginLeft:"auto"}}>{result.duration||"Custom"}</Tag>
      </div>
      <div style={{padding:"24px 20px"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:"0.04em",lineHeight:1.1,marginBottom:16}}>{result.sessionName}</div>
        {result.garyNote&&<div style={{background:"rgba(0,102,255,0.06)",border:"1px solid rgba(0,102,255,0.15)",borderRadius:12,padding:"14px 16px",marginBottom:24}}>
          <div style={{fontSize:11,color:"rgba(0,102,255,0.7)",fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:6}}>GARY</div>
          <div style={{fontSize:14,color:C.txt,lineHeight:1.65}}>{result.garyNote}</div>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
          {(result.exercises||[]).map((ex,i)=>(
            <div key={i} style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"16px 18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{fontWeight:700,fontSize:15,color:C.txt}}>{ex.name}</div>
                <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",textAlign:"right"}}>
                  {ex.sets}?{ex.reps}
                </div>
              </div>
              <div style={{display:"flex",gap:16,marginBottom:6}}>
                {ex.rest&&<span style={{fontSize:11,color:C.dim}}>Rest {ex.rest}s</span>}
                {ex.tempo&&<span style={{fontSize:11,color:C.dim}}>Tempo {ex.tempo}</span>}
                {ex.rpe&&<span style={{fontSize:11,color:C.ora}}>RPE {ex.rpe}</span>}
              </div>
              {ex.note&&<div style={{fontSize:12,color:C.mid,lineHeight:1.5,marginTop:4,fontStyle:"italic"}}>{ex.note}</div>}
            </div>
          ))}
        </div>
        <Btn onClick={()=>onStartWorkout&&onStartWorkout("Custom",{
          name:result.sessionName,
          gary:result.garyNote||"",
          exercises:(result.exercises||[]).map(ex=>({...ex,note:ex.note||""})),
          tag:"Custom",
          cat:"Custom",
          duration:result.duration||"Custom",
          isCustom:true,
        })} style={{width:"100%",fontSize:16}}>START SESSION ?</Btn>
      </div>
    </div>
  );

  // Questions UI
  return(
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:80}}>
      <div style={{background:`${C.bg}F0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.bdr}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:20,padding:"4px 8px 4px 0"}}>{"<"}</button>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.1em"}}>BUILD MY WORKOUT</span>
        <span style={{marginLeft:"auto",fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{typeof step==="number"?step+1:1}/{questions.length}</span>
      </div>
      <div style={{padding:"32px 20px"}}>
        {/* Progress */}
        <div style={{background:C.surUp,borderRadius:4,height:3,marginBottom:32,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:4,background:`linear-gradient(90deg,${C.hyper},${C.recovery})`,width:`${((typeof step==="number"?step+1:1)/questions.length)*100}%`,transition:"width 0.3s"}}/>
        </div>
        <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:12}}>GARY ASKS</div>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:"0.04em",lineHeight:1.2,marginBottom:6}}>{q.label}</h2>
        {q.hint&&<div style={{fontSize:12,color:C.dim,marginBottom:20,fontStyle:"italic"}}>{q.hint}</div>}
        {!q.hint&&<div style={{marginBottom:20}}/>}

        {q.type==="select"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {q.opts.map(opt=>{
            const sel=q.multi?(answers[q.key]||[]).includes(opt):answers[q.key]===opt;
            return <button key={opt} onClick={()=>handleSelect(opt)} style={{background:sel?"rgba(0,102,255,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${sel?"rgba(0,102,255,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",fontSize:14,color:sel?"#0066FF":C.txt,fontFamily:"'DM Sans',sans-serif",textAlign:"left",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>{opt}</span>
              {sel&&<span style={{fontSize:16}}>?</span>}
            </button>;
          })}
        </div>}

        {q.type==="text"&&<textarea value={answers[q.key]||""} onChange={e=>setAnswers({...answers,[q.key]:e.target.value})} placeholder={q.placeholder||""} style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"14px 16px",color:C.txt,fontSize:14,fontFamily:"'DM Sans',sans-serif",resize:"none",outline:"none",minHeight:100,lineHeight:1.6,boxSizing:"border-box"}} rows={4}/>}

        {error&&<div style={{background:"rgba(255,23,68,0.1)",border:"1px solid rgba(255,23,68,0.3)",borderRadius:8,padding:"12px 14px",marginTop:16,fontSize:13,color:"#FF1744"}}>{error}</div>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"16px 20px 32px",background:`${C.bg}F0`,backdropFilter:"blur(16px)",borderTop:`1px solid ${C.bdr}`,display:"flex",gap:10}}>
        {typeof step==="number"&&step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:"rgba(255,255,255,0.04)",border:`1px solid ${C.bdr}`,borderRadius:12,padding:"14px",cursor:"pointer",fontSize:14,color:C.mid,fontFamily:"'DM Sans',sans-serif"}}>Back</button>}
        {typeof step==="number"&&step<questions.length-1&&<Btn onClick={()=>setStep(s=>s+1)} disabled={!canNext} style={{flex:3}}>Continue</Btn>}
        {typeof step==="number"&&step===questions.length-1&&<Btn onClick={generateWorkout} style={{flex:3}}>Build My Session</Btn>}
      </div>
    </div>
  );
};


// --- VOLUME ENGINE VIEW --------------------------------------------
const VolumeEngineView=({weekSchedule,onBack})=>{
  // Calculate sets per muscle from this week's completed workouts
  const workoutHistory=React.useMemo(()=>{
    try{return JSON.parse(localStorage.getItem("gmt_workout_history")||"[]");}catch{return[];}
  },[]);
  
  // Get this week's sessions
  const weekStart=new Date();weekStart.setHours(0,0,0,0);
  weekStart.setDate(weekStart.getDate()-weekStart.getDay());
  
  const weekSessions=workoutHistory.filter(w=>{
    const d=new Date(w.date||w.completedAt||0);
    return d>=weekStart;
  });
  
  // Count sets per muscle from completed sessions
  const weeklyVolume={Chest:0,Back:0,Quads:0,Hamstrings:0,Glutes:0,Shoulders:0,Biceps:0,Triceps:0,Calves:0,Core:0};
  weekSessions.forEach(session=>{
    (session.exercises||[]).forEach(ex=>{
      const map=MUSCLE_VOLUME_MAP[ex.name];
      if(map){
        const sets=ex.completedSets||ex.sets||3;
        Object.entries(map).forEach(([muscle,factor])=>{
          if(weeklyVolume[muscle]!==undefined){
            weeklyVolume[muscle]+=Math.round(sets*factor);
          }
        });
      }
    });
  });
  
  const goal="hyper"; // Could be dynamic from profile
  
  return(
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:100}}>
      <div style={{background:`${C.bg}F0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.bdr}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:20,padding:"4px 8px 4px 0"}}>{"<"}</button>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.1em"}}>VOLUME ENGINE</div>
          <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.06em"}}>THIS WEEK</div>
        </div>
      </div>
      <div style={{padding:"20px 20px 0"}}>
        {/* Movement Balance Analysis */}
        {(()=>{
          const push=Math.max(1,(weeklyVolume.Chest||0)+(weeklyVolume.Shoulders||0)+(weeklyVolume.Triceps||0));
          const pull=Math.max(1,(weeklyVolume.Back||0)+(weeklyVolume.Biceps||0));
          const quad=Math.max(1,weeklyVolume.Quads||0);
          const ham=Math.max(1,(weeklyVolume.Hamstrings||0)+(weeklyVolume.Glutes||0)*0.5);
          const ppRatio=(pull/push).toFixed(2);
          const qhRatio=(quad/ham).toFixed(2);
          const ppOk=ppRatio>=0.8&&ppRatio<=1.3;
          const qhOk=qhRatio>=0.6&&qhRatio<=1.4;
          return(
            <div style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${C.bdr}`,borderRadius:12,padding:"16px",marginBottom:20}}>
              <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:12}}>MOVEMENT BALANCE</div>
              <div style={{display:"flex",gap:10}}>
                {[
                  {label:"PULL:PUSH",val:ppRatio,ok:ppOk,lo:"More pull needed",hi:"Push-heavy",bal:"Balanced"},
                  {label:"QUAD:HAM+GLUTE",val:qhRatio,ok:qhOk,lo:"Add hinge work",hi:"Quad-dominant",bal:"Balanced"},
                ].map(item=>(
                  <div key={item.label} style={{flex:1,background:item.ok?"rgba(0,201,177,0.06)":"rgba(255,140,0,0.06)",border:`1px solid ${item.ok?"rgba(0,201,177,0.2)":"rgba(255,140,0,0.2)"}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:24,fontFamily:"'Bebas Neue',sans-serif",color:item.ok?"#00C9B1":"#FF8C00"}}>{item.val}</div>
                    <div style={{fontSize:10,color:C.dim,fontFamily:"'Space Mono',monospace",marginTop:2}}>{item.label}</div>
                    <div style={{fontSize:10,color:item.ok?"#00C9B1":"#FF8C00",marginTop:4}}>{item.ok?item.bal:parseFloat(item.val)<(item.label.includes("PULL")?0.8:0.6)?item.lo:item.hi}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:C.dim,marginTop:10,lineHeight:1.5}}>Target: pull:push 0.8-1.3, quad:ham 0.6-1.4. Imbalances drive injury and postural issues over time.</div>
            </div>
          );
        })()}

        <div style={{background:"rgba(0,102,255,0.05)",border:"1px solid rgba(0,102,255,0.15)",borderRadius:12,padding:"14px 16px",marginBottom:20}}>
          <div style={{fontSize:12,color:C.mid,lineHeight:1.6}}>Hypertrophy targets from GMT doctrine. Green = in optimal range. Orange = approaching limit. Red = exceeding recommended ceiling.</div>
        </div>
        {Object.entries(VOLUME_TARGETS).map(([muscle,targets])=>{
          const sets=weeklyVolume[muscle]||0;
          const [lo,hi]=targets[goal]||targets.hyper;
          const pct=Math.min(1,sets/hi);
          const overTarget=sets>hi;
          const inRange=sets>=lo&&sets<=hi;
          const color=overTarget?"#FF1744":inRange?"#00C9B1":sets>lo*0.7?"#FF8C00":"#0066FF";
          return(
            <div key={muscle} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <span style={{fontSize:13,fontWeight:600,color:C.txt}}>{muscle}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,color:color,fontFamily:"'Space Mono',monospace",fontWeight:700}}>{sets}</span>
                  <span style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace"}}>/{lo}-{hi} sets</span>
                </div>
              </div>
              <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden",position:"relative"}}>
                {/* Target zone indicator */}
                <div style={{position:"absolute",left:`${(lo/hi)*100}%`,right:0,top:0,bottom:0,background:"rgba(0,201,177,0.08)",borderLeft:`1px dashed rgba(0,201,177,0.3)`}}/>
                {/* Progress bar */}
                <div style={{height:"100%",width:`${pct*100}%`,background:color,borderRadius:3,transition:"width 0.5s ease"}}/>
              </div>
              {overTarget&&<div style={{fontSize:10,color:"#FF1744",fontFamily:"'Space Mono',monospace",marginTop:4}}>OVER TARGET -- consider reducing {muscle.toLowerCase()} volume this week</div>}
              {inRange&&<div style={{fontSize:10,color:"#00C9B1",fontFamily:"'Space Mono',monospace",marginTop:4}}>IN RANGE</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- AUTH / PROFILE SYSTEM ------------------------------------------
const LoginScreen=({onLogin,onGuest})=>{
  const[email,setEmail]=React.useState("");
  const[pw,setPw]=React.useState("");
  const[name,setName]=React.useState("");
  const[mode,setMode]=React.useState("login"); // login | signup
  const[err,setErr]=React.useState("");

  const handleAuth=()=>{
    if(!email.trim()){setErr("Enter your email.");return;}
    if(!pw.trim()||pw.length<6){setErr("Password must be 6+ characters.");return;}
    if(mode==="signup"&&!name.trim()){setErr("Enter your name.");return;}
    // Store locally (cloud sync is a future feature)
    const user={email:email.trim().toLowerCase(),name:name.trim()||email.split("@")[0],initial:(name.trim()||email)[0].toUpperCase(),createdAt:Date.now()};
    try{localStorage.setItem("gmt_user",JSON.stringify(user));}catch(e){}
    onLogin(user);
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",maxWidth:480,margin:"0 auto"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:"0.15em",color:C.txt,marginBottom:8}}>GMT COACH</div>
      <div style={{fontSize:13,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",marginBottom:48}}>ELITE COACHING INTELLIGENCE</div>
      
      <div style={{width:"100%",background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:16,padding:24,marginBottom:16}}>
        <div style={{display:"flex",gap:0,marginBottom:24,background:C.bg,borderRadius:8,padding:3}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,background:mode===m?C.sur:"transparent",border:"none",borderRadius:6,padding:"8px 0",cursor:"pointer",fontSize:12,color:mode===m?C.txt:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",textTransform:"uppercase",transition:"all 0.15s"}}>
              {m==="login"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>

        {mode==="signup"&&<div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",marginBottom:6}}>YOUR NAME</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex" style={{width:"100%",background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:8,padding:"12px 14px",color:C.txt,fontSize:15,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
        </div>}

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",marginBottom:6}}>EMAIL</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" style={{width:"100%",background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:8,padding:"12px 14px",color:C.txt,fontSize:15,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
        </div>

        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",marginBottom:6}}>PASSWORD</div>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="6+ characters" onKeyDown={e=>e.key==="Enter"&&handleAuth()} style={{width:"100%",background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:8,padding:"12px 14px",color:C.txt,fontSize:15,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
        </div>

        {err&&<div style={{background:"rgba(255,23,68,0.1)",border:"1px solid rgba(255,23,68,0.3)",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#FF1744",fontFamily:"'DM Sans',sans-serif"}}>{err}</div>}

        <Btn onClick={handleAuth} style={{width:"100%"}}>{mode==="login"?"Sign In":"Create Account"}</Btn>
      </div>

      <button onClick={onGuest} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:12,padding:"14px",width:"100%",cursor:"pointer",fontSize:14,color:C.mid,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.02em"}}>
        Continue as Guest
      </button>
      <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",marginTop:10,textAlign:"center",lineHeight:1.6}}>
        Guest mode stores data on this device only.
      </div>
    </div>
  );
};

const ProfileView=({user,profile,onSignOut,onBack})=>{
  const isGuest=!user?.email;
  const initial=(user?.initial||user?.name?.[0]||"G").toUpperCase();
  const goals=(profile?.goals||[]).slice(0,3);
  const trainingAge=profile?.trainingAge||"";
  const equipment=profile?.equipment||"Not specified";

  return(
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:100}}>
      <div style={{background:`${C.bg}F0`,backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.bdr}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:20,padding:"4px 8px 4px 0"}}>{"<"}</button>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.1em"}}>PROFILE</span>
      </div>

      <div style={{padding:"32px 20px"}}>
        {/* Avatar */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#0066FF,#00C9B1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontFamily:"'Bebas Neue',sans-serif",color:"#fff",flexShrink:0}}>
            {initial}
          </div>
          <div>
            <div style={{fontSize:20,fontWeight:700,color:C.txt,marginBottom:4}}>{isGuest?"Guest Athlete":user?.name||"Athlete"}</div>
            <div style={{fontSize:13,color:C.dim,fontFamily:"'Space Mono',monospace"}}>{isGuest?"No account":""+user?.email}</div>
          </div>
        </div>

        {/* Training profile */}
        {[
          {label:"Training Age",value:trainingAge||"Not set"},
          {label:"Goals",value:goals.length?goals.map(g=>g.split("(")[0].trim()).join(", "):"Not set"},
          {label:"Equipment",value:equipment.length>60?equipment.slice(0,60)+"...":equipment},
          {label:"Frequency",value:profile?.frequency||"Not set"},
          {label:"Units",value:String(profile?.unit||"").includes("Imperial")?"Imperial":"Metric"},
        ].map(item=>(
          <div key={item.label} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"14px 0",borderBottom:`1px solid ${C.bdr}`}}>
            <span style={{fontSize:12,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.06em",flexShrink:0,marginRight:12}}>{item.label.toUpperCase()}</span>
            <span style={{fontSize:14,color:C.txt,textAlign:"right"}}>{item.value}</span>
          </div>
        ))}

        {isGuest&&<div style={{background:"rgba(0,102,255,0.08)",border:"1px solid rgba(0,102,255,0.2)",borderRadius:12,padding:16,margin:"24px 0"}}>
          <div style={{fontSize:13,color:"#0066FF",fontFamily:"'Space Mono',monospace",marginBottom:8}}>CREATE AN ACCOUNT</div>
          <div style={{fontSize:14,color:C.mid,lineHeight:1.6}}>Sign up to keep your programme safe across devices.</div>
        </div>}

        <button onClick={onSignOut} style={{width:"100%",background:"rgba(255,23,68,0.08)",border:"1px solid rgba(255,23,68,0.2)",borderRadius:12,padding:"14px",cursor:"pointer",fontSize:14,color:"#FF1744",fontFamily:"'DM Sans',sans-serif",marginTop:24}}>
          {isGuest?"Reset App":"Sign Out"}
        </button>
      </div>
    </div>
  );
};

function AppInner(){
  const[screen,setScreen]=useState(()=>{
    try{return localStorage.getItem("gmt_screen")||"login";}catch{return"login";}
  });
  const[user,setUser]=useState(()=>{
    try{const u=localStorage.getItem("gmt_user");return u?JSON.parse(u):null;}catch{return null;}
  });
  const[showProfile,setShowProfile]=useState(false);
  const handleLogin=(u)=>{setUser(u);try{localStorage.setItem("gmt_user",JSON.stringify(u));}catch(e){}setScreen("terms");};
  const handleGuest=()=>{const g={name:"Guest",initial:"G",guest:true};setUser(g);try{localStorage.setItem("gmt_user",JSON.stringify(g));}catch(e){}setScreen("terms");};
  const handleSignOut=()=>{setUser(null);setShowProfile(false);try{localStorage.clear();}catch(e){}setScreen("login");};
  const[showCustomWorkout,setShowCustomWorkout]=useState(false);
  const[showVolumeEngine,setShowVolumeEngine]=useState(false);
  const[tab,setTab]=useState("home");
  useEffect(()=>{
    const handler=e=>setTab(e.detail||"coach");
    window.addEventListener("gmt_nav",handler);
    return()=>window.removeEventListener("gmt_nav",handler);
  },[]);
  const[activeWorkout,setActiveWorkout]=useState(null);
  const[boxingSession,setBoxingSession]=useState(null);
  const[profile,setProfile]=useState(()=>{
    try{const p=localStorage.getItem("gmt_profile");return p?JSON.parse(p):null;}catch{return null;}
  });
  const[weekSchedule,setWeekSchedule]=useState(()=>{
    try{const s=localStorage.getItem("gmt_schedule");return s?JSON.parse(s):{};}catch{return{};}
  });
  const[sessionCount,setSessionCount]=useState(()=>{
    try{return parseInt(localStorage.getItem("gmt_sessions")||"0");}catch{return 0;}
  });
  const[lastWorkout,setLastWorkout]=useState(()=>{try{const h=JSON.parse(localStorage.getItem("gmt_workout_history")||"[]");return h[0]||null;}catch{return null;}});
  const[favourites,setFavourites]=useState(()=>{try{return JSON.parse(localStorage.getItem("gmt_favs")||"[]");}catch{return[];}});

  const toggleFav=id=>setFavourites(f=>{
    const n=f.includes(id)?f.filter(x=>x!==id):[...f,id];
    try{localStorage.setItem("gmt_favs",JSON.stringify(n));}catch(e){}
    return n;
  });

  return(
    <>
      <style>{fonts}</style>
      <style>{gStyles}</style>
      <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",position:"relative",background:C.bg}}>
        {showCustomWorkout&&<CustomWorkoutBuilder profile={profile} onClose={()=>setShowCustomWorkout(false)} onStartWorkout={(d,s)=>{setShowCustomWorkout(false);setActiveWorkout({day:d,session:s});}}/>}
        {!showCustomWorkout&&showProfile&&<ProfileView user={user} profile={profile} onSignOut={handleSignOut} onBack={()=>setShowProfile(false)}/>}
        {!showCustomWorkout&&!showProfile&&screen==="login"&&<LoginScreen onLogin={handleLogin} onGuest={handleGuest}/>}
        {!showProfile&&screen==="terms"&&<TermsScreen onAccept={()=>{setScreen("onboarding");try{localStorage.setItem("gmt_screen","onboarding");}catch(e){}}}/>}
        {screen==="onboarding"&&<Onboarding onComplete={d=>{setProfile(d);setScreen("coachIntro");try{localStorage.setItem("gmt_profile",JSON.stringify(d));localStorage.setItem("gmt_screen","coachIntro");}catch(e){}}}/>}
        {screen==="coachIntro"&&<CoachIntro profile={profile} onReady={()=>{setScreen("dayPicker");try{localStorage.setItem("gmt_screen","dayPicker");}catch(e){}}}/>}
        {screen==="dayPicker"&&<DayPicker frequency={profile?.frequency} profile={profile} onConfirm={s=>{setWeekSchedule(s);setScreen("main");try{localStorage.setItem("gmt_schedule",JSON.stringify(s));localStorage.setItem("gmt_screen","main");}catch(e){}}}/>}
        {screen==="main"&&!activeWorkout&&!showCustomWorkout&&<>
          {showProfile&&<ProfileView user={user} profile={profile} onSignOut={handleSignOut} onBack={()=>setShowProfile(false)}/>}
        {showCustomWorkout&&<CustomWorkoutBuilder profile={profile} user={user} onClose={()=>setShowCustomWorkout(false)} onStartWorkout={(s)=>{setShowCustomWorkout(false);setActiveWorkout({day:"TODAY",session:s});}}/>}
        {showVolumeEngine&&<VolumeEngineView weekSchedule={weekSchedule} onBack={()=>setShowVolumeEngine(false)}/>}
          {!showProfile&&!showCustomWorkout&&tab==="home"&&<Dashboard onStartWorkout={(d,s)=>{if(s?.isBoxing){
          // Transform exercises (with stationType) into stations format for BoxingTimerView
          const exs=s.exercises||[];
          const stationTypes=[{key:"TREADMILL",type:"treadmill"},{key:"STRENGTH",type:"dumbbell"},{key:"BAG",type:"bag"}];
          const stations=stationTypes.map(({key,type})=>({
            type,
            rounds:exs.filter(e=>(e.stationType||"").toUpperCase().includes(key)).map(e=>({name:e.name,note:e.note||"",combo:e.combo||""})),
          })).filter(st=>st.rounds.length>0);
          setBoxingSession({...s,stations:stations.length?stations:s.stations||[]});
        }else setActiveWorkout({day:d,session:s});}} onCustomWorkout={()=>setShowCustomWorkout(true)} onShowProfile={()=>setShowProfile(true)} user={user} profile={profile} onVolumeEngine={()=>setShowVolumeEngine(true)} weekSchedule={weekSchedule} sessionCount={sessionCount} onNutrition={()=>setTab("nutrition")} lastWorkout={lastWorkout} onReorderDay={(from,to)=>{const ns={...weekSchedule};const tmp=ns[from];ns[from]=ns[to];ns[to]=tmp;setWeekSchedule(ns);try{localStorage.setItem("gmt_schedule",JSON.stringify(ns));}catch{}}} onShowRecovery={()=>setTab("progress")}/>}
          {tab==="program"&&<ProgramView onStartWorkout={(d,s)=>{if(s?.isBoxing){
          // Transform exercises (with stationType) into stations format for BoxingTimerView
          const exs=s.exercises||[];
          const stationTypes=[{key:"TREADMILL",type:"treadmill"},{key:"STRENGTH",type:"dumbbell"},{key:"BAG",type:"bag"}];
          const stations=stationTypes.map(({key,type})=>({
            type,
            rounds:exs.filter(e=>(e.stationType||"").toUpperCase().includes(key)).map(e=>({name:e.name,note:e.note||"",combo:e.combo||""})),
          })).filter(st=>st.rounds.length>0);
          setBoxingSession({...s,stations:stations.length?stations:s.stations||[]});
        }else setActiveWorkout({day:d,session:s});}} weekSchedule={weekSchedule}/>}
          {tab==="library"&&<ExerciseLibrary favourites={favourites} onToggleFav={toggleFav} profile={profile} onBack={()=>setTab("home")} onAskCoach={msg=>{setTab("coach");window.dispatchEvent(new CustomEvent("gmt_coach_msg",{detail:msg}));}}/>}
          {tab==="workouts"&&<WorkoutLibraryView onStartWorkout={(d,s)=>{if(s?.isBoxing){
          // Transform exercises (with stationType) into stations format for BoxingTimerView
          const exs=s.exercises||[];
          const stationTypes=[{key:"TREADMILL",type:"treadmill"},{key:"STRENGTH",type:"dumbbell"},{key:"BAG",type:"bag"}];
          const stations=stationTypes.map(({key,type})=>({
            type,
            rounds:exs.filter(e=>(e.stationType||"").toUpperCase().includes(key)).map(e=>({name:e.name,note:e.note||"",combo:e.combo||""})),
          })).filter(st=>st.rounds.length>0);
          setBoxingSession({...s,stations:stations.length?stations:s.stations||[]});
        }else setActiveWorkout({day:d,session:s});}} weekSchedule={weekSchedule} favourites={favourites} onToggleFav={toggleFav}/>}
          {tab==="favourites"&&<FavouritesView favourites={favourites} onToggleFav={toggleFav} profile={profile}/>}
          {tab==="nutrition"&&<NutritionView profile={profile}/>}
          {tab==="coach"&&<CoachView profile={profile}/>}
          <BottomNav active={tab} setActive={setTab} user={user} onProfile={()=>setShowProfile(true)}/>
        </>}
        {screen==="main"&&boxingSession&&<BoxingTimerView session={boxingSession} profile={profile} onBack={()=>{setBoxingSession(null);const nc=sessionCount+1;setSessionCount(nc);try{localStorage.setItem("gmt_sessions",nc);}catch{}}}/>}
        {screen==="main"&&activeWorkout&&activeWorkout.session?.exercises&&(activeWorkout.session?.boxingMode?<BoxingSessionTimer exercises={activeWorkout.session.exercises||[]} onBack={()=>{setActiveWorkout(null);}}/>:<WorkoutView day={activeWorkout.day} session={activeWorkout.session} onBack={()=>{const nc=sessionCount+1;setSessionCount(nc);setActiveWorkout(null);try{localStorage.setItem("gmt_sessions",nc);const h=JSON.parse(localStorage.getItem("gmt_workout_history")||"[]");if(h[0])setLastWorkout(h[0]);}catch(e){}}} profile={profile} onWarmup={()=>{const wu=WORKOUT_LIBRARY.find(w=>w.id==="warmup");if(wu)setActiveWorkout({day:"WARM-UP",session:wu,isWarmup:true});}}/>)}
      </div>
    </>
  );
}
function App(){return(<ErrorBoundary><AppInner/></ErrorBoundary>);}
export default App;