// Sintetizador usando Tone.js con teclado clickable, delay, reverb y presets
const active = {};

// PolySynth with simple synth voices (keep existing effects chain)
const synth = new Tone.PolySynth(Tone.Synth, {maxPolyphony:8, voice: Tone.Synth});

const filter = new Tone.Filter(2000, 'lowpass');
const delay = new Tone.FeedbackDelay(0.25, 0.3);
const reverb = new Tone.Reverb({decay: 2.5, wet: 0.3});
const masterVol = new Tone.Volume(-6).toDestination();

// Connect graph: synth -> filter -> [delay,reverb,master]
synth.connect(filter);
filter.connect(delay);
filter.connect(reverb);
filter.connect(masterVol);
delay.connect(masterVol);
reverb.connect(masterVol);

function updateOsc(type){ synth.set({oscillator:{type}}); }
function updateEnvelope(a,d,s,r){ synth.set({envelope:{attack:parseFloat(a),decay:parseFloat(d),sustain:parseFloat(s),release:parseFloat(r)}}); }

// UI bindings (controls remain)
document.getElementById('oscType').addEventListener('change', e=> updateOsc(e.target.value));
document.getElementById('masterVol').addEventListener('input', e=> masterVol.volume.value = e.target.value);
document.getElementById('filterCutoff').addEventListener('input', e=> filter.frequency.value = e.target.value);
document.getElementById('delayTime').addEventListener('input', e=> delay.delayTime.value = e.target.value);
document.getElementById('delayFeedback').addEventListener('input', e=> delay.feedback.value = e.target.value);
document.getElementById('reverbWet').addEventListener('input', e=> reverb.wet.value = e.target.value);
['attack','decay','sustain','release'].forEach(id=>{
  document.getElementById(id).addEventListener('input', ()=>{
    updateEnvelope(document.getElementById('attack').value,document.getElementById('decay').value,document.getElementById('sustain').value,document.getElementById('release').value);
  });
});

// Presets: update oscillator, ADSR, filter, delay and reverb
const presets = {
  piano_suave: ()=>{
    const o='sine'; const a=0.005, d=0.2, s=0.6, r=0.6; const f=3500; const rv=0.12; const dt=0.08, df=0.12;
    applyPreset(o,a,d,s,r,f,rv,dt,df,'Piano suave');
  },
  sint_80s: ()=>{
    const o='sawtooth'; const a=0.02, d=0.25, s=0.6, r=1.2; const f=2600; const rv=0.35; const dt=0.28, df=0.32;
    applyPreset(o,a,d,s,r,f,rv,dt,df,'Sintetizador 80s');
  },
  ambiente: ()=>{
    const o='triangle'; const a=0.6, d=0.9, s=0.8, r=2.8; const f=1800; const rv=0.8; const dt=0.5, df=0.5;
    applyPreset(o,a,d,s,r,f,rv,dt,df,'Ambiente espacial');
  },
  bajo: ()=>{
    const o='sawtooth'; const a=0.01, d=0.2, s=0.8, r=0.6; const f=600; const rv=0.08; const dt=0.02, df=0.08;
    applyPreset(o,a,d,s,r,f,rv,dt,df,'Bajo profundo');
  },
  organo: ()=>{
    const o='square'; const a=0.01, d=0.3, s=0.7, r=0.9; const f=2200; const rv=0.18; const dt=0.06, df=0.12;
    applyPreset(o,a,d,s,r,f,rv,dt,df,'Órgano clásico');
  },
  lead: ()=>{
    const o='sawtooth'; const a=0.01, d=0.12, s=0.5, r=0.6; const f=3200; const rv=0.22; const dt=0.16, df=0.18;
    applyPreset(o,a,d,s,r,f,rv,dt,df,'Lead brillante');
  },
  pad: ()=>{
    const o='triangle'; const a=0.5, d=0.8, s=0.75, r=2.5; const f=2000; const rv=0.6; const dt=0.35, df=0.4;
    applyPreset(o,a,d,s,r,f,rv,dt,df,'Pad atmosférico');
  },
  percusion: ()=>{
    const o='square'; const a=0.001, d=0.05, s=0.0, r=0.08; const f=4000; const rv=0.06; const dt=0.02, df=0.04;
    applyPreset(o,a,d,s,r,f,rv,dt,df,'Percusión corta');
  }
};

function applyPreset(osc, a,d,s,r, cutoff, revWet, delayTime, delayFb, displayName){
  document.getElementById('oscType').value = osc;
  document.getElementById('attack').value = a;
  document.getElementById('decay').value = d;
  document.getElementById('sustain').value = s;
  document.getElementById('release').value = r;
  document.getElementById('filterCutoff').value = cutoff;
  document.getElementById('reverbWet').value = revWet;
  document.getElementById('delayTime').value = delayTime;
  document.getElementById('delayFeedback').value = delayFb;
  // update synth nodes
  updateOsc(osc);
  updateEnvelope(a,d,s,r);
  filter.frequency.value = cutoff;
  reverb.wet.value = revWet;
  delay.delayTime.value = delayTime;
  delay.feedback.value = delayFb;
  // show preset name
  const ind = document.getElementById('presetIndicator');
  if(ind) ind.textContent = `Preajuste: ${displayName}`;
}

document.getElementById('preset').addEventListener('change', e=>{
  const v = e.target.value;
  if(presets[v]) presets[v]();
});

// Dynamic keyboard builder supporting multiple octaves
const keyboardEl = document.getElementById('keyboard');
const baseSequence = [
  {key:'a', base:'C', name:'do'}, {key:'w', base:'C#', name:'do#'}, {key:'s', base:'D', name:'re'}, {key:'e', base:'D#', name:'re#'},
  {key:'d', base:'E', name:'mi'}, {key:'f', base:'F', name:'fa'}, {key:'t', base:'F#', name:'fa#'}, {key:'g', base:'G', name:'sol'},
  {key:'y', base:'G#', name:'sol#'}, {key:'h', base:'A', name:'la'}, {key:'u', base:'A#', name:'la#'}, {key:'j', base:'B', name:'si'}
];

let currentOctaves = 2;
const baseOctave = 4;

function buildKeyboard(octaves){
  keyboardEl.innerHTML = '';
  const noteOrder = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  for(let o=0;o<octaves;o++){
    const octaveNum = baseOctave + o;
    baseSequence.forEach(({key, base, name}, idx) => {
      const isSharp = base.includes('#');
      const noteName = `${base}${octaveNum}`;
      // Skip notes from F5 and above
      if(octaveNum > 5) return;
      if(octaveNum === 5){
        const idxBase = noteOrder.indexOf(base);
        const idxF = noteOrder.indexOf('F');
        if(idxBase >= idxF) return; // omit F5 and later
      }
      const el = document.createElement('div');
      el.className = 'key ' + (isSharp ? 'black' : 'white');
      // for the second octave, remap the first five notes to k,o,l,p,ñ labels
      const secondOctaveLabels = ['k','o','l','p','ñ'];
      let visualKey = key;
      if(o === 1 && idx < 5){ visualKey = secondOctaveLabels[idx]; }
      el.dataset.key = visualKey;
      el.dataset.note = noteName;
      el.dataset.name = name;
      el.innerHTML = `<div class="key-name">${name}</div><div class="key-note">${noteName}</div><div class="key-label">${visualKey.toUpperCase()}</div>`;
      el.addEventListener('mousedown', (ev)=>{ ev.preventDefault(); ensureStarted(); pressNoteVisual(noteName, el); });
      el.addEventListener('mouseup', (ev)=>{ ev.preventDefault(); releaseNoteVisual(noteName, el); });
      el.addEventListener('mouseleave', (ev)=>{ if(el.classList.contains('active')) releaseNoteVisual(noteName, el); });
      el.addEventListener('touchstart', (ev)=>{ ev.preventDefault(); ensureStarted(); pressNoteVisual(noteName, el); }, {passive:false});
      el.addEventListener('touchend', (ev)=>{ ev.preventDefault(); releaseNoteVisual(noteName, el); }, {passive:false});
      keyboardEl.appendChild(el);
    });
  }
}

// physical keyboard mapping: map computer keys to first octave notes (octave baseOctave)
const keyToNote = {};
baseSequence.forEach(item=> keyToNote[item.key] = `${item.base}${baseOctave}`);
// add second-octave mappings for k, o, l, p, ñ (C5 .. E5)
keyToNote['k'] = `C${baseOctave+1}`;
keyToNote['o'] = `C#${baseOctave+1}`;
keyToNote['l'] = `D${baseOctave+1}`;
keyToNote['p'] = `D#${baseOctave+1}`;
keyToNote['ñ'] = `E${baseOctave+1}`;

function pressNoteVisual(note, el){
  synth.triggerAttack(note);
  el.classList.add('active');
}
function releaseNoteVisual(note, el){
  synth.triggerRelease(note);
  el.classList.remove('active');
}

// initial build
const numOctavesInputEl = document.getElementById('numOctaves');
if(numOctavesInputEl) numOctavesInputEl.value = String(currentOctaves);
buildKeyboard(currentOctaves);

// numOctaves control (allow changing but constrained visually)
const numOctavesEl = document.getElementById('numOctaves');
numOctavesEl.addEventListener('input', (e)=>{
  const v = parseInt(e.target.value,10);
  currentOctaves = Math.max(1, Math.min(2, v));
  buildKeyboard(currentOctaves);
});

function setKeyActive(key, on){
  const el = document.querySelector(`.key[data-key="${key}"]`);
  if(el) el.classList.toggle('active', on);
}

function pressKey(k){
  if(!(k in keyToNote)) return;
  if(active[k]) return;
  active[k] = true;
  const note = keyToNote[k];
  synth.triggerAttack(note);
  setKeyActive(k, true);
}

function releaseKey(k){
  if(!(k in keyToNote)) return;
  if(!active[k]) return;
  const note = keyToNote[k];
  synth.triggerRelease(note);
  delete active[k];
  setKeyActive(k, false);
}

// Ensure audio context resumes on first interaction
let started = false;
function ensureStarted(){
  if(!started){
    // do not auto-start here; require pressing the splash button first
    return false;
  }
}

// Splash start button handling: require user to start audio
const splash = document.getElementById('splash');
const startBtn = document.getElementById('startBtn');
startBtn.addEventListener('click', async ()=>{
  // visual feedback: make button purple immediately
  startBtn.classList.add('pressed');
  await Tone.start();
  started = true;
  // fade out splash then remove and reveal UI
  splash.classList.add('fade-out');
  setTimeout(()=>{
    splash.remove();
    const main = document.querySelector('.container');
    if(main) main.classList.remove('hidden');
  }, 360);
});

window.addEventListener('keydown', e=>{
  if(!started) return; // ignore before explicit start
  const k = e.key.toLowerCase();
  if(!(k in keyToNote)) return;
  e.preventDefault();
  pressKey(k);
});

window.addEventListener('keyup', e=>{
  if(!started) return;
  const k = e.key.toLowerCase();
  if(!(k in keyToNote)) return;
  e.preventDefault();
  releaseKey(k);
});

// Initialize UI with defaults
updateOsc(document.getElementById('oscType').value);
updateEnvelope(document.getElementById('attack').value,document.getElementById('decay').value,document.getElementById('sustain').value,document.getElementById('release').value);
