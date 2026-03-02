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
  red:"#FF4444",ora:"#FF8C42",pur:"#9B7FFF",
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
   tempo:"3-1-1-0",sets:"4",reps:"46",rest:180,rpe:8,
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
   tempo:"3-1-1-0",sets:"4",reps:"46",rest:180,rpe:8,
   grip:"Overhand (pronated): more lat width. Neutral (parallel handles): more comfortable for shoulders, slightly more bicep. Underhand (chin-up): strong bicep involvement, easier for beginners.",
   alt:{name:"Lat Pulldown",desc:"Excellent alternative  same movement pattern. Use a wide overhand grip. Lean back 10-15  and pull to upper chest.",noAlt:false},
   coachNote:"Initiate by pulling your shoulder blades down before your arms bend. That first movement activates your lats. Without it, you're mostly biceps."},
  {id:"pendlay-row",name:"Pendlay Row",muscle:"Back",secondary:"Biceps, Rear Deltoid",equipment:"Barbell",category:"compound",difficulty:"advanced",
   cue:"Horizontal torso  parallel to floor. Bar starts on the floor each rep (this is what separates Pendlay from bent-over row). Explosive pull to lower chest. Bar returns to floor, full dead stop. No hip drive.",
   tempo:"1-0-1-2",sets:"4",reps:"56",rest:180,rpe:8,
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
   tempo:"2-0-1-0",sets:"4",reps:"46",rest:180,rpe:8,
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
   tempo:"3-1-1-0",sets:"4",reps:"46",rest:180,rpe:8,
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
];

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
      {name:"Hip Circle",sets:2,reps:"10 each way",note:"Active mobility. Both directions.",rest:0},
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
];

const isRunner=(goals)=>Array.isArray(goals)&&goals.some(g=>g.toLowerCase().includes("run")||g.toLowerCase().includes("marathon")||g.toLowerCase().includes("endurance"));
const STEPS=[
  {id:"trainingAge",title:"Training Experience",sub:"How long have you trained consistently?",type:"select",opts:["Less than 1 year","1-2 years","2-4 years","4-7 years","7+ years"]},
  {id:"age",title:"Your Age",sub:"Age significantly shapes how we programme recovery, intensity and volume.",type:"select",opts:["16-20","21-29","30-39","40-49","50+"]},
  {id:"gender",title:"One More Thing",sub:"This shapes how we structure your programme.",type:"select",opts:["Male","Female","Prefer not to say"]},
  {id:"frequency",title:"Weekly Frequency",sub:"How many days per week can you commit?",type:"select",opts:["3 days","4 days","5 days","6 days"]},
  {id:"goals",title:"Your Goals",sub:"Select all that apply. We build your programme around every one.",type:"multi",opts:["Hypertrophy (muscle size & density)","Strength (max force output)","Aesthetics (lean, proportional physique)","Body Recomposition (lose fat, build muscle)","Athletic Performance","Glute & Lower Body Focus","Marathon / Ultra Running","Long Distance Running","Recreational / 5K-10K Running"]},
  {id:"unit",title:"Units",sub:"Choose your preferred units. All measurements throughout the app will use these.",type:"select",opts:["Metric (kg / km / cm)","Imperial (lbs / miles / ft)"]},
  {id:"bodyStats",title:"Height & Weight",sub:"This helps us contextualise your strength numbers and build the right programme for your body.",type:"inputs",fields:[{key:"height",label:"Height"},{key:"weight",label:"Bodyweight"}]},
  {id:"runningContext",title:"Your Running",sub:"Tell us about your running. Skip if running is not a goal.",type:"inputs",fields:[{key:"weeklyMiles",label:"Weekly mileage"},{key:"longestRun",label:"Longest recent run"},{key:"raceGoal",label:"Next race distance (e.g. 10K, half, marathon)",unit:""}],optional:true},
  {id:"benchmarks",title:"Strength Benchmarks",sub:"Approximate 5-rep max. Honest estimates are fine. Skip if you are a runner new to lifting.",type:"inputs",fields:[{key:"squat",label:"Back Squat"},{key:"bench",label:"Bench Press"},{key:"deadlift",label:"Deadlift"},{key:"ohp",label:"OHP"}]},
  {id:"limitations",title:"Pain / Limitations",sub:"Select any current concerns. Include any running-related injuries.",type:"multi",opts:["Lower back","Knees","Shoulders","Hips","Neck","Shin Splints","IT Band","Achilles / Calf","Plantar Fasciitis","None"]},
  {id:"recovery",title:"Recovery Baseline",sub:"Honest answers change the programme.",type:"inputs",fields:[{key:"sleep",label:"Avg sleep per night",unit:"hrs"},{key:"stress",label:"Daily stress level",unit:"/10"}]},
  // -- BOXING BEGINNER 1 -------------------------------------
  {
    id:"boxing-beg-1",cat:"Boxing",name:"Foundation Fight",sessionCode:"BFD",version:"1.0",tag:"Boxing",duration:"45 min",
    gary:"This is where fighters are made. Before you throw a single punch, I need you to understand: power comes from the ground up. Every combo starts with your feet, rotates through your hips, and finishes with your fist. We are building the language of boxing today. Three rounds at each station. 60 seconds of work, 30 seconds rest. The timer is your trainer.",
    exercises:[
      {name:"Treadmill Warm-Up Run",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 1-3. Speed 6-8, flat. Comfortable pace. Build heart rate gradually. Between rounds: 30s walk.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Jab-Cross Floor Drill",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 4-6. Shadowbox only. Orthodox or southpaw stance. Jab extends the lead hand, cross rotates the rear hip. 30 reps per minute target. No arm-punching - rotate the torso.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Heavy Bag: Jab-Cross Basics",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 7-9. Gloves on. Stand 1 arm's length from the bag. Jab to measure distance, cross for power. Breathe out sharp on contact. Reset stance after every combo. Mayweather cue: 'Stay on your toes, never flat-footed.'",rest:30,type:"cardio",isTimeBased:true},
      {name:"Floor: Squat + Shoulder Tap",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 10-12. Core and lower body. 10 squats then 10 shoulder taps in plank. Fighters need strong legs - your power generation starts here.",rest:30,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Body Shot Focus",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 13-15. Dig hooks to the body. Bend your knees to get to body level - do not hunch over. Canelo principle: body shots drain the engine. Aim for liver (right hook) and ribs (left hook).",rest:30,type:"cardio",isTimeBased:true},
      {name:"Finish: Burpee + Shadow Combo",sets:1,setsLabel:"AMRAP",reps:"3 min",note:"3-minute AMRAP challenge. 1 burpee, stand up, throw 1-2-1 combo (jab-cross-jab). Keep moving. This is your conditioning finisher.",rest:0,type:"cardio",isTimeBased:true},
    ]
  },
  // -- BOXING BEGINNER 2 -------------------------------------
  {
    id:"boxing-beg-2",cat:"Boxing",name:"Defense & Flow",sessionCode:"BDF",version:"1.0",tag:"Boxing",duration:"45 min",
    gary:"Mayweather said it best: hit and don't get hit. Today we add movement. A punch you slip is better than a punch you block. We are learning the pull, the roll, and how to angle off after every combination. Three rounds each station. Stay light on your feet the whole session.",
    exercises:[
      {name:"Treadmill: Interval Warm-Up",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 1-3. 40s at speed 7, 20s at speed 9. Incline 0. Simulates the explosive-recovery rhythm of a real round.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Shadow: Slip & Counter Drill",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 4-6. Imagine a jab coming. Slip outside (move head off centreline), return a cross. Slip inside, return a left hook. Continuous rhythm. Mayweather's whole defensive game lives in this drill.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Heavy Bag: Pull-Back Combo",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 7-9. Throw jab-cross, then pull straight back (lean back on rear foot), throw jab again. The pull makes you a moving target. Do not stand still after punching.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Floor: Lateral Band Walks + Press-Ups",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 10-12. 15 lateral steps each direction (resistance band if available), then 10 press-ups. Lateral hip strength for footwork. Pressing strength for punch power.",rest:30,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Roll Under Hook",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 13-15. Jab-cross, then roll under an imaginary hook (dip knees, U-shape with head), come up with left hook to body and right hand to head. This is the cornerstone Canelo combination.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Finish: Mountain Climbers + Combos",sets:1,setsLabel:"AMRAP",reps:"3 min",note:"10 mountain climbers, spring up, throw 5-punch combo (1-2-3-2-1). Keep your guard up between every burst. This separates conditioned fighters from tired ones.",rest:0,type:"cardio",isTimeBased:true},
    ]
  },
  // -- BOXING INTERMEDIATE 1 ---------------------------------
  {
    id:"boxing-int-1",cat:"Boxing",name:"Power Combinations",sessionCode:"BPC",version:"1.0",tag:"Boxing",duration:"45 min",
    gary:"You know the basics. Now we build power. Tyson threw the hardest punches in heavyweight history because of hip rotation and timing, not because he was just big. Every punch in today's session should snap. Short, sharp, violent. Throw with bad intentions and reset immediately. The bag should be moving.",
    exercises:[
      {name:"Treadmill: Speed Intervals",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 1-3. 30s at speed 10 (sprint), 30s at speed 5 (recovery). Incline 0. Explosive cardiovascular conditioning matching real round intensity.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Floor: Dumbbell Punch-Out + Squat",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 4-6. Hold light dumbbells (2-4kg). Squat down, drive up, throw rapid alternating punches x10 at eye level. The squat to punch motion trains the power transfer from legs to fists.",rest:30,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 3-Punch Power Rounds",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 7-9. Tyson combo: right hook to body, left hook to body, right uppercut to chin. Dig the body shots deep. The uppercut should follow the body shots naturally as guard drops. Every 3rd combo, reset stance and breathe.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Floor: Core Power Circuit",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 10-12. 15 Russian twists (plate or bodyweight), 10 dead bugs, 10 bicycle crunches each side. Rotational core power transfers directly to punch force. Non-negotiable for any fighter.",rest:30,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: 5-Punch Explosive Combos",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 13-15. Combo: 1-2-3-2-1 (jab-cross-lead hook-cross-jab). Throw in bursts of 3-5 combos, reset. Full power each punch. Breathe sharp out each time. Canelo's signature: the 5-punch combination finisher.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Finish: Bag Sprint Rounds",sets:1,setsLabel:"ALL OUT",reps:"3 min",note:"3-minute non-stop bag work. No combos - freestyle. Throw everything. Move, punch, move. This is your championship round. Leave nothing in the tank.",rest:0,type:"cardio",isTimeBased:true},
    ]
  },
  // -- BOXING INTERMEDIATE 2 ---------------------------------
  {
    id:"boxing-int-2",cat:"Boxing",name:"Speed & Movement",sessionCode:"BSM",version:"1.0",tag:"Boxing",duration:"45 min",
    gary:"Mayweather's speed came from relaxation, not tension. Tight muscles are slow muscles. Every punch today should be fast and loose until the moment of impact, then snap. We are also working the feet: angles, pivots, circling. A moving fighter is a hard target. A fast fighter wins rounds.",
    exercises:[
      {name:"Treadmill: Footwork Ladder",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 1-3. Speed 7, alternate between incline 0 and incline 4 every 20 seconds. Mimics the change of pace and terrain demands of constant ring movement.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Shadow: Speed Combination Rounds",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 4-6. Speed focus. Jab-jab-cross at maximum hand speed. Stay completely relaxed in shoulders. Pivot after every 3 combos - change your angle. Mayweather's output was 40-50 punches per round, mostly jabs.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Heavy Bag: Pivot & Counter",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 7-9. Jab-cross, pivot 45 degrees off the bag, throw cross-hook. The pivot is what separates fighters from brawlers. You are never where your opponent expects you to be.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Floor: Explosive Power Circuit",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 10-12. 5 broad jumps + 5 lateral bounds each side + 10 jump squats. Plyometric leg power for explosive ring movement. Your footwork speed comes from leg power.",rest:30,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Combination Speed Ladder",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 13-15. Start with 1 punch, then 2, then 3, then 4, then 5 - then back down. Each punch crisp and fast. Rest 5 seconds between each set of the ladder. This drill was used extensively by Mayweather in camp.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Finish: Tabata Shadow + Core",sets:1,setsLabel:"ALL OUT",reps:"4 min",note:"8 rounds of 20s shadow boxing (all-out speed), 10s rest. Final 2 rounds on the floor: 20s hollow body hold, 10s rest. This is championship conditioning.",rest:0,type:"cardio",isTimeBased:true},
    ]
  },
  // -- BOXING ADVANCED 1 -------------------------------------
  {
    id:"boxing-adv-1",cat:"Boxing",name:"Championship Rounds",sessionCode:"BCR",version:"1.0",tag:"Boxing",duration:"45 min",
    gary:"Mayweather finished his career undefeated at 50-0. He did it through discipline, angles, and an elite jab. Today's session is built around his principles: the jab controls distance, the shoulder roll neutralises the right hand, movement makes you impossible to hit. You are not just fit today. You are building fight IQ.",
    exercises:[
      {name:"Treadmill: Fight-Pace Rounds",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 1-3. Speed 9-11, incline 0. This is round 12 conditioning. You should be uncomfortably fast. Championship fights are decided by who can still perform when exhausted.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Heavy Bag: Mayweather Jab Clinic",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 4-6. Jab only. But every jab has a job: measuring jab, stinging jab, pawing jab, double jab. Mix them. Vary the height - head level and body level. The jab is the most important punch in boxing. Never neglect it.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Floor: Weighted Core Power",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 7-9. Heavy Russian twists (8-12kg), woodchop cable/band, oblique crunches. Every elite fighter has an elite core. This is where your real power generation lives.",rest:30,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Shoulder Roll Counter",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 10-12. Practise the shoulder roll: lead shoulder comes up to protect the jaw from the right hand. Roll, then counter with right hand to body, left hook to head. This is Mayweather's signature defensive counter. Drill it until it is reflex.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Floor: Explosive Compound Lifts",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 13-15. Dumbbell clean to press x5, jump squat x5, plank to push-up x10. Athletic total-body power. Championship fighters are complete athletes, not just punchers.",rest:30,type:"strength",isTimeBased:true},
      {name:"Finish: 12-Punch Championship Combo",sets:1,setsLabel:"MAX ROUNDS",reps:"3 min",note:"The full combo, as long as you can sustain it: 1-2-3-2-1-2 (body) -3-2-1-2-3-2. This is 12 punches. Control your breathing. Set your feet after every 3rd combo. This is what Mayweather trains to.",rest:0,type:"cardio",isTimeBased:true},
    ]
  },
  // -- BOXING ADVANCED 2 -------------------------------------
  {
    id:"boxing-adv-2",cat:"Boxing",name:"Iron Pressure",sessionCode:"BIP",version:"1.0",tag:"Boxing",duration:"45 min",
    gary:"Tyson's secret was not just power. It was the peek-a-boo style, the constant pressure, and the angles he created before every punch. He was small for a heavyweight but used that to his advantage - always working underneath, attacking the body first, then the head. Today we pressure. We never let the opponent settle. Relentless, calculated aggression.",
    exercises:[
      {name:"Treadmill: Maximum Incline Sprint",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 1-3. Speed 8, incline 10-12. Simulate the physical demands of cutting off the ring and constant pressure. Your legs must never fail in a fight.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Floor: Peek-A-Boo Defensive Drill",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 4-6. Hands high by temples, chin down. Bob and weave L-R-L continuously. Add a left hook each time you come up on the right side. Tyson drilled this thousands of times daily. The defence creates the offence.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Heavy Bag: Body Attack Rounds",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 7-9. 80% body shots. Double left hook to body, right hand to body, left hook up to head. Bend your knees to get to body level - never hunch. Body shots are a long-term weapon: they slow the legs, lower the guard, and open the head.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Floor: Power & Strength Circuit",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 10-12. Barbell or dumbbell rows x8, dips or close-grip press x10, landmine rotational press x8 each side. Tyson's training included significant pulling and pressing work for the explosive snap in his hooks.",rest:30,type:"strength",isTimeBased:true},
      {name:"Heavy Bag: Pressure Combination Rounds",sets:3,setsLabel:"3",reps:"60s",note:"Rounds 13-15. Move forward, throw: jab to body - right to body - left hook to head - right uppercut. Then step to your left, throw right hook to body. Every 3rd combo change your angle of attack. Pressure from multiple angles is what broke Tyson's opponents.",rest:30,type:"cardio",isTimeBased:true},
      {name:"Finish: Rounds of 8",sets:1,setsLabel:"IRON WILL",reps:"3 min",note:"8 combos all-out, 8 seconds rest. Repeat for 3 full minutes. The 8-second recovery mimics the split-second breathers in real rounds. Do not stop moving your feet during recovery. Championship is forged here.",rest:0,type:"cardio",isTimeBased:true},
    ]
  },
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
    if(cur.type==="inputs")m[cur.id]=fv;
    if(cur.type==="multi")m[cur.id]=ms;
    setAns(m);
    if(step<STEPS.length-1){setStep(s=>s+1);setFv({});setMs([]);}
    else onComplete(m);
  };
  const canNext=cur.optional?true:cur.type==="select"?!!ans[cur.id]:cur.type==="multi"?ms.length>0:true;
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
          {cur.fields.map(f=>(
            <div key={f.key}>
              <label style={{fontSize:11,color:C.mid,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em",display:"block",marginBottom:8}}>{f.label.toUpperCase()}</label>
              <div style={{display:"flex",alignItems:"center",background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:8,overflow:"hidden"}}>
                <input type="number" placeholder="0" value={fv[f.key]||""} onChange={e=>setFv(v=>({...v,[f.key]:e.target.value}))} style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"16px 20px",color:C.txt,fontSize:20,fontFamily:"'Space Mono',monospace"}}/>
                <span style={{padding:"0 20px",color:C.dim,fontSize:13,fontFamily:"'Space Mono',monospace"}}>
                  {(()=>{const isImp=String(ans.unit||"").includes("Imperial");if(f.unit!==undefined)return f.unit;const lbl=(f.label||"").toLowerCase();if(lbl.includes("height"))return isImp?"ft/in":"cm";if(lbl.includes("weight")||lbl.includes("bodyweight"))return isImp?"lbs":"kg";if(lbl.includes("mileage")||lbl.includes("run"))return isImp?"miles":"km";return isImp?"lbs":"kg";})()}
                </span>
              </div>
            </div>
          ))}
        </div>}
      </div>
      <div style={{marginTop:32}}>
        <Btn onClick={next} disabled={!canNext} style={{width:"100%"}}>{step<STEPS.length-1?"Continue ":"Build My Programme"}</Btn>
        {cur.optional&&<button onClick={()=>{setStep(s=>s+1);setFv({});}} style={{width:"100%",background:"transparent",border:"none",color:C.dim,cursor:"pointer",padding:"12px",fontSize:13,marginTop:4}}>Skip (not a runner)</button>}
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
    "You are Gary Mulholland, elite strength and performance coach inside the GMT Coach app.",
    "",
    "COACHING PHILOSOPHY: High-intensity principles for advanced athletes. Evidence-based hypertrophy for intermediate. Technique-first for beginners. Glute-focused for female clients. Joint longevity always.",
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
            <input type="number" inputMode="numeric" placeholder="reps" defaultValue={logData?.sets?.[lastSetIdx]?.reps||""} onBlur={e=>onUpdateLog(lastSetIdx,"reps",e.target.value)} style={{width:"100%",background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px",color:C.txt,fontSize:18,fontFamily:"'Space Mono',monospace",outline:"none",textAlign:"center"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:C.dim,fontFamily:"'Space Mono',monospace",marginBottom:4}}>{(unitLabel||"kg").toUpperCase()}</div>
            <input type="number" inputMode="decimal" placeholder={unitLabel||"kg"} defaultValue={logData?.sets?.[lastSetIdx]?.weight||""} onBlur={e=>onUpdateLog(lastSetIdx,"weight",e.target.value)} style={{width:"100%",background:C.surUp,border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px",color:C.txt,fontSize:18,fontFamily:"'Space Mono',monospace",outline:"none",textAlign:"center"}}/>
          </div>
        </div>
        <div style={{fontSize:10,color:C.dim,textAlign:"center",marginTop:8,fontFamily:"'Space Mono',monospace"}}>Log now, lift again in {remaining}s</div>
      </div>}
      <button onClick={onSkip} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:8,padding:"10px 32px",color:C.mid,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Skip Rest</button>
    </div>
  );
};


// --- EXERCISE DETAIL MODAL ----------------------------------------
const ExerciseDetailModal=({ex,onClose,onAskGary})=>{
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
  const isWarmup=session.id==="warmup";
  const exercises=session.exercises||[];
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
                      <div style={{display:"flex",gap:4,flexShrink:0}}>
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
          {coachLoading&&<div style={{display:"flex",gap:4,padding:"4px 0 4px 30px"}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.hyper,animation:`pulse 1.2s ${i*0.2}s infinite`}}/>)}</div>}
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
const ExerciseLibrary=({favourites,onToggleFav,onAskCoach})=>{
  const[search,setSearch]=useState("");
  const[filter,setFilter]=useState("All");
  const[libTab,setLibTab]=useState("all");
  const[selected,setSelected]=useState(null);
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
            <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:20,padding:4}}></button>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:"0.06em"}}>{ex.name}</div>
              <div style={{fontSize:11,color:C.mid,fontFamily:"'Space Mono',monospace"}}>{ex.muscle}  {ex.equipment}</div>
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
            </div>
          </div>
        </div>
      ):(
        // List view
        <>
          <div style={{padding:"48px 20px 16px"}}>
            <div style={{fontSize:11,color:C.dim,fontFamily:"'Space Mono',monospace",letterSpacing:"0.12em",marginBottom:8}}>EXERCISE LIBRARY</div>
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
      <div style={{flex:1,overflowY:"auto",padding:"20px 20px 8px"}}>
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
      <div style={{padding:"12px 20px 40px",display:"flex",gap:10,alignItems:"flex-end"}}>
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
const Dashboard=({onStartWorkout,profile,weekSchedule={},sessionCount=0,onNutrition,onReorderDay,onShowRecovery,lastWorkout})=>{
  const days=["MON","TUE","WED","THU","FRI","SAT","SUN"];
  const sched=Object.keys(weekSchedule);
  const today=sched[0]||"MON";
  const todayLabel=weekSchedule[today]||"Push A";
  const todayData=weekProgram[todayLabel]||Object.values(weekProgram)[0]||null;
  const[recoveryVals,setRecoveryVals]=useState(()=>{try{return JSON.parse(localStorage.getItem("gmt_recovery")||"{}");}catch{return{};}});
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
          <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.strength},${C.hyper})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontWeight:700,fontSize:18,color:"#fff"}}>G</div>
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
            {key:"sleep",label:"Sleep",unit:"hrs",color:C.hyper,placeholder:"7.5",max:10,icon:""},
            {key:"calories",label:"Calories",unit:"kcal",color:C.ora,placeholder:"2200",max:4000,icon:""},
            {key:"water",label:"Water",unit:"L",color:C.blu,placeholder:"2.5",max:5,icon:""},
          ].map(r=>{
            const saved=recoveryVals[r.key];
            const val=parseFloat(saved)||null;
            return(
              <div key={r.key} style={{background:C.sur,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:18}}>{r.icon}</span>
                    <span style={{fontSize:13,color:C.mid}}>{r.label}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" inputMode="decimal" placeholder={r.placeholder} defaultValue={saved||""} key={saved}
                      onBlur={e=>saveRecovery(r.key,e.target.value)}
                      style={{width:64,background:C.surUp,border:`1px solid ${C.bdrL}`,borderRadius:6,padding:"5px 8px",color:C.txt,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center"}}/>
                    <span style={{fontSize:11,color:C.dim}}>{r.unit}</span>
                  </div>
                </div>
                {val&&<div style={{marginTop:8}}><PBar value={val} max={r.max} color={r.color} h={4}/></div>}
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
        <p style={{fontSize:13,color:C.mid,lineHeight:1.6,marginBottom:20}}>Huberman-inspired tracking. Protein first, everything else follows.</p>
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
const BottomNav=({active,setActive})=>{
  const tabs=[
    {id:"home",icon:"",label:"Home"},
    {id:"program",icon:"",label:"Programme"},
    {id:"workouts",icon:"",label:"Workouts"},
    {id:"library",icon:"",label:"Exercises"},
    {id:"coach",icon:"",label:"Coach"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:`${C.bg}F0`,backdropFilter:"blur(20px)",borderTop:`1px solid ${C.bdr}`,display:"flex",padding:"10px 0 24px",zIndex:100}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setActive(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"3px 0"}}>
          <div style={{fontSize:16,width:34,height:34,borderRadius:10,background:active===t.id?C.accG:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:active===t.id?C.hyper:C.dim,border:active===t.id?`1px solid ${C.acc}40`:"1px solid transparent",transition:"all 0.15s"}}>{t.icon}</div>
          <span style={{fontSize:9,fontFamily:"'Space Mono',monospace",color:active===t.id?C.hyper:C.dim,letterSpacing:"0.04em"}}>{t.label}</span>
        </button>
      ))}
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
function AppInner(){
  const[screen,setScreen]=useState(()=>{
    try{return localStorage.getItem("gmt_screen")||"terms";}catch{return"terms";}
  });
  const[tab,setTab]=useState("home");
  useEffect(()=>{
    const handler=e=>setTab(e.detail||"coach");
    window.addEventListener("gmt_nav",handler);
    return()=>window.removeEventListener("gmt_nav",handler);
  },[]);
  const[activeWorkout,setActiveWorkout]=useState(null);
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
        {screen==="terms"&&<TermsScreen onAccept={()=>{setScreen("onboarding");try{localStorage.setItem("gmt_screen","onboarding");}catch(e){}}}/>}
        {screen==="onboarding"&&<Onboarding onComplete={d=>{setProfile(d);setScreen("coachIntro");try{localStorage.setItem("gmt_profile",JSON.stringify(d));localStorage.setItem("gmt_screen","coachIntro");}catch(e){}}}/>}
        {screen==="coachIntro"&&<CoachIntro profile={profile} onReady={()=>{setScreen("dayPicker");try{localStorage.setItem("gmt_screen","dayPicker");}catch(e){}}}/>}
        {screen==="dayPicker"&&<DayPicker frequency={profile?.frequency} profile={profile} onConfirm={s=>{setWeekSchedule(s);setScreen("main");try{localStorage.setItem("gmt_schedule",JSON.stringify(s));localStorage.setItem("gmt_screen","main");}catch(e){}}}/>}
        {screen==="main"&&!activeWorkout&&<>
          {tab==="home"&&<Dashboard onStartWorkout={(d,s)=>setActiveWorkout({day:d,session:s})} profile={profile} weekSchedule={weekSchedule} sessionCount={sessionCount} onNutrition={()=>setTab("nutrition")} lastWorkout={lastWorkout} onReorderDay={(from,to)=>{const ns={...weekSchedule};const tmp=ns[from];ns[from]=ns[to];ns[to]=tmp;setWeekSchedule(ns);try{localStorage.setItem("gmt_schedule",JSON.stringify(ns));}catch{}}} onShowRecovery={()=>setTab("progress")}/>}
          {tab==="program"&&<ProgramView onStartWorkout={(d,s)=>setActiveWorkout({day:d,session:s})} weekSchedule={weekSchedule}/>}
          {tab==="library"&&<ExerciseLibrary favourites={favourites} onToggleFav={toggleFav} profile={profile} onAskCoach={msg=>{setTab("coach");window.dispatchEvent(new CustomEvent("gmt_coach_msg",{detail:msg}));}}/>}
          {tab==="workouts"&&<WorkoutLibraryView onStartWorkout={(d,s)=>setActiveWorkout({day:d,session:s})} weekSchedule={weekSchedule} favourites={favourites} onToggleFav={toggleFav}/>}
          {tab==="favourites"&&<FavouritesView favourites={favourites} onToggleFav={toggleFav} profile={profile}/>}
          {tab==="nutrition"&&<NutritionView profile={profile}/>}
          {tab==="coach"&&<CoachView profile={profile}/>}
          <BottomNav active={tab} setActive={setTab}/>
        </>}
        {screen==="main"&&activeWorkout&&activeWorkout.session?.exercises&&<WorkoutView day={activeWorkout.day} session={activeWorkout.session} onBack={()=>{const nc=sessionCount+1;setSessionCount(nc);setActiveWorkout(null);try{localStorage.setItem("gmt_sessions",nc);const h=JSON.parse(localStorage.getItem("gmt_workout_history")||"[]");if(h[0])setLastWorkout(h[0]);}catch(e){}}} profile={profile} onWarmup={()=>{const wu=WORKOUT_LIBRARY.find(w=>w.id==="warmup");if(wu)setActiveWorkout({day:"WARM-UP",session:wu,isWarmup:true});}}/>}
      </div>
    </>
  );
}
export default function App(){return(<ErrorBoundary><AppInner/></ErrorBoundary>);}
