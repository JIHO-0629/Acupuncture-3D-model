/** Structural audit for the completed CV/GV three-source pass. */
import fs from 'node:fs';
import path from 'node:path';

const root=new URL('..',import.meta.url);
const read=(relative)=>JSON.parse(fs.readFileSync(new URL(relative,root),'utf8'));
const source={CV:read('data/meridians/source/CV.json'),GV:read('data/meridians/source/GV.json')};
const generated={CV:read('data/meridians/CV.json'),GV:read('data/meridians/GV.json')};
const expected={CV:24,GV:28};
const failures=[];
const assert=(ok,message)=>{if(!ok)failures.push(message);};

for(const id of ['CV','GV']){
 assert(source[id].points.length===expected[id],`${id} source count`);
 assert(generated[id].points.length===expected[id],`${id} generated count`);
 const seen=new Set();
 for(const row of source[id].points){
  assert(!seen.has(row.code),`${row.code} duplicate`);seen.add(row.code);
  assert(row.sourceValidation?.kcmric==='matched',`${row.code} KCMRIC`);
  assert(row.sourceValidation?.who==='matched',`${row.code} WHO`);
  assert(row.sourceValidation?.localImage==='matched',`${row.code} local image`);
  const image=path.join(path.dirname(source[id].sourceFile),'images',id,`${id}${row.code.slice(2).padStart(2,'0')}.png`);
  assert(fs.existsSync(image),`${row.code} image missing: ${image}`);
 }
 for(const row of generated[id].points){
  assert(row.seed.length===3&&row.seed.every(Number.isFinite),`${row.code} finite seed`);
  assert(Math.abs(row.seed[0])<.005,`${row.code} not on median plane (${row.seed[0]})`);
  assert(row.status==='implemented_unverified',`${row.code} status must remain implemented_unverified until exhaustive app-view sign-off`);
 }
}

const cv8=generated.CV.points.find(row=>row.code==='CV8');
assert(cv8?.needlingStatus==='absolute_no_needling','CV8 absolute_no_needling');
assert(/금침|자침하지/.test(cv8?.needlingRestriction??''),'CV8 explicit Korean no-needling label');
const gv28=generated.GV.points.find(row=>row.code==='GV28');
assert(gv28?.projection==='direct'&&gv28?.region==='oral-mucosa','GV28 oral direct projection');

// Ordered midline runs: trunk CV ascends CV1→CV24; GV ascends to vertex and then descends the face.
for(let n=2;n<=24;n++)assert(generated.CV.points[n-1].seed[1]>generated.CV.points[n-2].seed[1],`CV${n-1}→CV${n} vertical order`);
for(let n=2;n<=20;n++)assert(generated.GV.points[n-1].seed[1]>generated.GV.points[n-2].seed[1],`GV${n-1}→GV${n} ascent order`);
for(let n=21;n<=28;n++)assert(generated.GV.points[n-1].seed[1]<generated.GV.points[n-2].seed[1],`GV${n-1}→GV${n} facial descent order`);

if(failures.length){console.error(failures.map(item=>`FAIL ${item}`).join('\n'));process.exit(1);}
console.log('PASS CV24 + GV28: KCMRIC → WHO → local image records complete');
console.log('PASS median-plane, sequence, CV8 no-needling, and GV28 oral-projection invariants');
