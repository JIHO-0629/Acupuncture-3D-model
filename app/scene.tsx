import {useEffect,useRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {createExplosionLayout} from './explosion-layout';
import {decodeModelResponse} from './model-download';
import {PointerTap} from './pointer-tap';
import {SYSTEMS,type Atlas,type NeedleHit,type SceneState} from './anatomy';
import {GB_POINTS,type ProjectionMode} from './gb-points';
interface Props {atlas:Atlas;state:SceneState;onSelect:(id:string)=>void;onPointSelect?:(code:string)=>void;onProgress:(n:number)=>void;onError:(s:string)=>void;onNeedleHits?:(hits:NeedleHit[])=>void}
export default function AnatomyScene({atlas,state,onSelect,onPointSelect,onProgress,onError,onNeedleHits}:Props){
  const host=useRef<HTMLDivElement>(null),latest=useRef(state),select=useRef(onSelect),pointSelect=useRef(onPointSelect),needleHits=useRef(onNeedleHits);
  latest.current=state;select.current=onSelect;pointSelect.current=onPointSelect;needleHits.current=onNeedleHits;
 useEffect(()=>{
   const el=host.current!;let disposed=false,frame=0,dirty=true,ready=false,lastView='',lastReset=-1,lastIsolate='',lastRegion='',layoutKey='',amount=0;
   let lastState:SceneState|null=null,lastGb34='',lastAcupuncture='';
  const abort=new AbortController();
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{onError('This browser could not start the 3D viewer. Please try a browser with WebGL enabled.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<768?1.5:2));renderer.setClearColor('#f2f3f3');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;el.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Interactive human anatomy. Drag to orbit, pinch or scroll to zoom, and tap a structure to inspect it.');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.005,100),controls=new OrbitControls(camera,renderer.domElement);
  camera.position.set(1.4,1.05,3.6);controls.target.set(0,.85,0);controls.enableDamping=true;controls.dampingFactor=.085;controls.minDistance=.07;controls.maxDistance=40;controls.maxPolarAngle=Math.PI*.96;const cameraGoalPosition=camera.position.clone(),cameraGoalTarget=controls.target.clone();let cameraTransitioning=false;const moveCamera=(target:T.Vector3,position:T.Vector3,instant=false)=>{cameraGoalTarget.copy(target);cameraGoalPosition.copy(position);if(instant){controls.target.copy(target);camera.position.copy(position);cameraTransitioning=false;}else cameraTransitioning=true;dirty=true;};controls.addEventListener('change',()=>{dirty=true;});controls.addEventListener('start',()=>{cameraTransitioning=false;});
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight(0xffffff,0xa7acb2,1.05));
  const key=new T.DirectionalLight(0xfffaf4,2.3);key.position.set(-2,4,3);scene.add(key);
  const rim=new T.DirectionalLight(0xe9f0ff,1.8);rim.position.set(2,2,-3);scene.add(rim);
  const ground=new T.Mesh(new T.CircleGeometry(30,96),new T.MeshStandardMaterial({color:0xd5d9dc,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.019;scene.add(ground);
  const platform=new T.Mesh(new T.CylinderGeometry(.68,.7,.028,100),new T.MeshStandardMaterial({color:0xeeeeec,metalness:.12,roughness:.67}));platform.position.y=-.016;scene.add(platform);
  const ring=new T.Mesh(new T.RingGeometry(.63,.632,128),new T.MeshBasicMaterial({color:0x8c969f,transparent:true,opacity:.4,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.001;scene.add(ring);
  const innerRing=new T.Mesh(new T.RingGeometry(.55,.551,128),new T.MeshBasicMaterial({color:0xa4aeb8,transparent:true,opacity:.16,side:T.DoubleSide}));innerRing.rotation.x=-Math.PI/2;innerRing.position.y=.001;scene.add(innerRing);
  const width=T.MathUtils.ceilPowerOfTwo(atlas.parts.length),data=new Float32Array(width*4),partTexture=new T.DataTexture(data,width,1,T.RGBAFormat,T.FloatType);partTexture.needsUpdate=true;
  const selectedData=new Uint8Array(width*4),selectionTexture=new T.DataTexture(selectedData,width,1);selectionTexture.needsUpdate=true;
   const pickerMaterial=new T.MeshBasicMaterial({side:T.DoubleSide}),materials:T.Material[]=[],geometries:T.BufferGeometry[]=[],pickers:(T.Mesh|undefined)[]=[],centers=atlas.parts.map(p=>new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(.5));
  const offsets:T.Vector3[]=[],bounds=atlas.parts.map(p=>new T.Box3(new T.Vector3().fromArray(p.bounds[0]),new T.Vector3().fromArray(p.bounds[1])));
  let packingWidth=1,packingHeight=1;
  const markerPositions=new Float32Array(atlas.parts.length*3),markerGeometry=new T.BufferGeometry();markerGeometry.setAttribute('position',new T.BufferAttribute(markerPositions,3));
  const markerMaterial=new T.PointsMaterial({color:0x64748b,size:5,sizeAttenuation:false,transparent:true,opacity:.72,depthTest:false});
  markerMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;');};
  const markers=new T.Points(markerGeometry,markerMaterial);markers.frustumCulled=false;markers.renderOrder=10;markers.visible=false;scene.add(markers);
  const hover=document.createElement('div');hover.className='part-hover';hover.setAttribute('role','tooltip');hover.hidden=true;el.appendChild(hover);
  type Target={index:number;x:number;y:number;left:number;right:number;top:number;bottom:number};let targets:Target[]=[];
  const projected=new T.Vector3();
  const findTarget=(x:number,y:number,radius:number)=>{
   let best=-1,score=Infinity;
   for(const t of targets){const dx=Math.max(t.left-x,0,x-t.right),dy=Math.max(t.top-y,0,y-t.bottom),distance=Math.hypot(dx,dy);if(distance>radius)continue;const candidate=distance+Math.hypot(t.x-x,t.y-y)*.025;if(candidate<score){score=candidate;best=t.index;}}
   return best;
  };
  const materialFor=(system:string)=>{
    const isSurface=system==='integumentary';const m=new T.MeshStandardMaterial({color:isSurface?'#c79d82':SYSTEMS.find(s=>s.id===system)?.color??'#aebbb8',metalness:isSurface?0:.08,roughness:isSurface?.82:.53,side:T.DoubleSide,transparent:false,opacity:1,depthWrite:true});
   m.customProgramCacheKey=()=>`atlas-${isSurface?'surface-toe-cut-v2':'internal'}`;
   m.onBeforeCompile=shader=>{
    shader.uniforms.partState={value:partTexture};shader.uniforms.selectionState={value:selectionTexture};shader.uniforms.stateWidth={value:width};
    shader.vertexShader='attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected; varying vec3 atlasPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\natlasPosition = position; vec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partSelected = texture2D(selectionState, stateUv).r;');
    if(isSurface)shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`if(position.y < 0.085 && abs(position.x) > 0.075){float cut=0.125-max(abs(position.x)-0.08,0.0)*0.60;float blend=smoothstep(cut-0.018,cut,position.z);transformed.y=mix(transformed.y,min(transformed.y,0.024),blend);}\n#include <project_vertex>`);
    shader.fragmentShader='varying float partVisible; varying float partSelected; varying vec3 atlasPosition;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;${isSurface?'\nfloat toeCut = 0.125 - max(abs(atlasPosition.x) - 0.08, 0.0) * 0.60;\nif (atlasPosition.y < 0.085 && abs(atlasPosition.x) > 0.075 && atlasPosition.z > toeCut) discard;':''}`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.85, 0.78), partSelected * 0.75);');
   };materials.push(m);return m;
  };
  const mats=new Map(SYSTEMS.map(s=>[s.id,materialFor(s.id)]));
  let loaded=0;
  const loadChunk=async(ci:number)=>{
   const chunk=atlas.chunks[ci],compressed=!!chunk.gzip&&typeof DecompressionStream!=='undefined';const response=await fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal});const buffer=await decodeModelResponse(response,chunk.bytes,compressed);if(disposed)return;
   const groups=new Map<string,T.BufferGeometry[]>();
   atlas.parts.forEach((p,i)=>{
    if(p.chunk!==ci)return;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,p.positions,p.vertexCount*3),3));
    // GPU normalized signed-short normals keep the complete atlas compact in memory.
    g.setAttribute('normal',new T.BufferAttribute(new Int16Array(buffer,p.normals,p.vertexCount*3),3,true));g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,p.indices,p.indexCount),1));
     g.boundingBox=bounds[i].clone();g.computeBoundingSphere();const pick=new T.Mesh(g,pickerMaterial);pick.matrixAutoUpdate=false;pickers[i]=pick;geometries.push(g);
    g.setAttribute('partIndex',new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i),1));
    const list=groups.get(p.system)??[];list.push(g);groups.set(p.system,list);
   });
   groups.forEach((gs,system)=>{const geometry=mergeGeometries(gs,false);if(!geometry)throw new Error('Could not assemble anatomy geometry.');geometries.push(geometry);const mesh=new T.Mesh(geometry,mats.get(system as never));mesh.frustumCulled=false;scene.add(mesh);});
   lastState=null;loaded++;onProgress(Math.round(loaded/atlas.chunks.length*100));dirty=true;
  };
    (async()=>{try{let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<atlas.chunks.length){const i=cursor++;await loadChunk(i);}}));if(!disposed){ready=true;lastGb34='';lastAcupuncture='';dirty=true;}}catch(e){if(!disposed)onError(e instanceof Error?e.message:'Could not load the anatomy.');}})();
  const fit=(view:string,extent=0)=>{
   if(latest.current.regionFocus)return;
   const aspect=camera.aspect,mobile=el.clientWidth<768,normalDistance=mobile?Math.max(4.5,1.8*el.clientHeight/Math.max(160,el.clientHeight-350)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))):4;
   const reservedHeight=mobile?350:270;const availableAspect=Math.max(.35,(el.clientWidth-(mobile?40:340))/Math.max(160,el.clientHeight-reservedHeight));const atlasDistance=Math.max(packingHeight,packingWidth/availableAspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*(el.clientHeight/Math.max(160,el.clientHeight-reservedHeight))*1.08;
   const distance=T.MathUtils.lerp(normalDistance,Math.max(.2,atlasDistance),extent);if(extent>.8)view='front';
   const direction=view==='front'?new T.Vector3(0,.02,1):view==='back'?new T.Vector3(0,.02,-1):view==='side'?new T.Vector3(1,.02,0):new T.Vector3(.35,.06,1).normalize();
   const target=new T.Vector3(extent>.1&&el.clientWidth>767?-packingWidth*.12:0,extent>.1||mobile?.85:.68,0),position=target.clone().addScaledVector(direction,distance);moveCamera(target,position);
  };
  const resize=()=>{layoutKey='';lastState=null;renderer.setPixelRatio(Math.min(devicePixelRatio,el.clientWidth<768||el.clientHeight<600?1.5:2));camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);fit(latest.current.view,amount);};const observer=new ResizeObserver(resize);observer.observe(el);
   const raycaster=new T.Raycaster(),pointer=new T.Vector2(),tap=new PointerTap(),worldBox=new T.Box3(),hitPoint=new T.Vector3();
   const acupointGroup=new T.Group(),lineGroup=new T.Group(),pointGeometry=new T.SphereGeometry(.0048,16,12),pointCoreGeometry=new T.SphereGeometry(.0029,16,12),pointMaterial=new T.MeshBasicMaterial({color:0x152f3a,depthTest:false}),selectedPointMaterial=new T.MeshBasicMaterial({color:0x102c36,depthTest:false}),pointCoreMaterial=new T.MeshBasicMaterial({color:0xff2f78,depthTest:false}),selectedPointCoreMaterial=new T.MeshBasicMaterial({color:0x2cf3d1,depthTest:false});
    type PointObject={code:string;side:'right'|'left';marker:T.Mesh;core:T.Mesh;label:T.Sprite;texture:T.CanvasTexture;surface:T.Vector3;normal:T.Vector3};const pointObjects:PointObject[]=[];
    const makePointLabel=(code:string,side:'right'|'left')=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=72;const context=canvas.getContext('2d')!;context.fillStyle='rgba(7,24,27,.9)';context.roundRect(2,2,252,68,18);context.fill();context.font='600 30px system-ui';context.textAlign='center';context.textBaseline='middle';context.fillStyle='#eafff8';context.fillText(`${code} · ${side==='right'?'R':'L'}`,128,37);const texture=new T.CanvasTexture(canvas),material=new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}),label=new T.Sprite(material);label.scale.set(.025,.007,1);label.renderOrder=62;label.visible=false;return{label,texture};};
    for(const point of GB_POINTS)for(const side of ['right','left'] as const){const marker=new T.Mesh(pointGeometry,pointMaterial),core=new T.Mesh(pointCoreGeometry,pointCoreMaterial),made=makePointLabel(point.code,side);marker.userData={acupointCode:point.code,side};marker.renderOrder=60;core.renderOrder=61;marker.visible=core.visible=false;pointObjects.push({code:point.code,side,marker,core,label:made.label,texture:made.texture,surface:new T.Vector3(),normal:new T.Vector3()});acupointGroup.add(marker,core,made.label);}scene.add(lineGroup,acupointGroup);
    const needleGeometry=new T.CylinderGeometry(.00065,.00065,1,10),needleMaterial=new T.MeshStandardMaterial({color:0xdbe5e8,metalness:.92,roughness:.16,depthTest:true}),needle=new T.Mesh(needleGeometry,needleMaterial);
    const handleGeometry=new T.CylinderGeometry(.0016,.0016,1,12),handleMaterial=new T.MeshStandardMaterial({color:0x56767b,metalness:.58,roughness:.28,depthTest:true}),needleHandle=new T.Mesh(handleGeometry,handleMaterial);
    needle.visible=needleHandle.visible=false;scene.add(needle,needleHandle);
    const projectionDirection=(seed:T.Vector3,mode:ProjectionMode,side:'right'|'left')=>{if(mode==='anterior')return new T.Vector3(0,0,1);if(mode==='posterior')return new T.Vector3(0,0,-1);if(mode==='dorsal-foot')return new T.Vector3(0,1,.08).normalize();if(mode==='lateral')return new T.Vector3(side==='right'?-1:1,0,0);return seed.clone().sub(new T.Vector3(0,1.59,0)).normalize();};
    const projectToSkin=(seed:T.Vector3,mode:ProjectionMode,side:'right'|'left')=>{const outward=projectionDirection(seed,mode,side),origin=seed.clone().addScaledVector(outward,.24),inward=outward.clone().negate();raycaster.set(origin,inward);let best:T.Intersection|undefined,bestSeedDistance=Infinity;pickers.forEach((mesh,i)=>{if(!mesh||atlas.parts[i].system!=='integumentary')return;for(const hit of raycaster.intersectObject(mesh,false)){const distance=hit.point.distanceTo(seed);if(distance<bestSeedDistance){best=hit;bestSeedDistance=distance;}}});const point=best?.point.clone()??seed.clone(),normal=best?.face?.normal.clone().transformDirection(best.object.matrixWorld).normalize()??outward;if(normal.dot(outward)<0)normal.negate();return{point,normal};};
    // Cosmetic surface refinement only. Toe dimensions and nail placement are derived
    // from the bundled BodyParts3D proximal/distal phalanx bounds, not hand-placed points.
    const nailShape=new T.Shape();nailShape.moveTo(-.72,-1);nailShape.lineTo(.72,-1);nailShape.quadraticCurveTo(1,-1,1,-.70);nailShape.lineTo(1,.68);nailShape.quadraticCurveTo(1,1,.68,1);nailShape.lineTo(-.68,1);nailShape.quadraticCurveTo(-1,1,-1,.68);nailShape.lineTo(-1,-.70);nailShape.quadraticCurveTo(-1,-1,-.72,-1);
    const toePresentation=new T.Group(),toeNailGeometry=new T.ShapeGeometry(nailShape,8),toeSkinMaterial=new T.MeshStandardMaterial({color:0xc79d82,roughness:.86,metalness:0}),toeNailMaterial=new T.MeshStandardMaterial({color:0xc9978a,roughness:.38,metalness:0,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    const toeNames=['big','second','third','fourth','little'] as const;
    for(const side of ['right','left'] as const)for(const toeName of toeNames){
      const proximal=atlas.parts.find(part=>part.name.toLowerCase()===`proximal phalanx of ${side} ${toeName} toe`),distal=atlas.parts.find(part=>part.name.toLowerCase()===`distal phalanx of ${side} ${toeName} toe`);if(!proximal||!distal)continue;
      const proximalBox=new T.Box3(new T.Vector3().fromArray(proximal.bounds[0]),new T.Vector3().fromArray(proximal.bounds[1])),distalBox=new T.Box3(new T.Vector3().fromArray(distal.bounds[0]),new T.Vector3().fromArray(distal.bounds[1])),proximalCenter=proximalBox.getCenter(new T.Vector3()),distalCenter=distalBox.getCenter(new T.Vector3()),axis=distalCenter.clone().sub(proximalCenter).normalize(),base=proximalCenter.clone().addScaledVector(axis,-.008),tip=distalCenter.clone(),toeIndex=toeNames.indexOf(toeName),lateralSpread=[0,.001,.002,.0035,.006][toeIndex]*(side==='right'?-1:1),forward=axis.z>=0?1:-1;
      base.x+=lateralSpread*.35;tip.x+=lateralSpread;tip.z=(forward>0?distalBox.max.z:distalBox.min.z)+forward*.003;
      const direction=tip.clone().sub(base),length=direction.length();axis.copy(direction).normalize();
      const distalWidth=distalBox.max.x-distalBox.min.x,radius=Math.max(.005,distalWidth*(toeName==='big'?.57:.70)),skinGeometry=new T.SphereGeometry(1,32,28),skin=new T.Mesh(skinGeometry,toeSkinMaterial);
      const vertices=skinGeometry.getAttribute('position');
      for(let v=0;v<vertices.count;v++){
        const y=vertices.getY(v),t=(y+1)/2,ring=Math.sqrt(Math.max(0,1-y*y)),x=vertices.getX(v),z=vertices.getZ(v);
        // Broad proximal pad, subtle joint waist, tapered rounded distal pulp.
        const profile=(.93+.13*Math.exp(-Math.pow((t-.30)/.18,2))-.09*Math.exp(-Math.pow((t-.60)/.10,2)))*(1-.12*t);
        const radial=ring>1e-5?Math.pow(ring,.45)/ring:1;
        vertices.setXYZ(v,x*radial*radius*profile,y*length*.57,z*radial*radius*(z>0?.82:1.02)*profile);
      }
      skinGeometry.computeVertexNormals();skin.position.copy(base).lerp(tip,.5);skin.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis);skin.userData={toeSide:side,toeLength:length};skin.renderOrder=42;
      const nail=new T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>(toeNailGeometry,toeNailMaterial),nailCenter=tip.clone().lerp(base,.18),toeAngle=Math.atan2(axis.x,axis.z),nailLength=toeName==='big'?Math.min(.014,length*.30):Math.max(.006,Math.min(.0095,length*.23));
      const curvedNail=new T.SphereGeometry(1,32,20,0,Math.PI*2,0,Math.PI/2);nail.geometry=curvedNail;
      nail.position.copy(nailCenter);nail.position.y+=radius*.78;nail.rotation.set(0,toeAngle,0);nail.scale.set(radius*.65,.00065,nailLength*.48);nail.userData.toeSide=side;nail.renderOrder=43;toePresentation.add(skin,nail);
    }
    function conformToeRoots(){
      const probe=new T.Raycaster(),world=new T.Vector3();
      for(const object of toePresentation.children){
        const mesh=object as T.Mesh;if(!mesh.userData.toeLength)continue;
        mesh.updateMatrixWorld(true);const inverse=mesh.matrixWorld.clone().invert(),positions=mesh.geometry.getAttribute('position'),heightCache=new Map<string,number>();
        for(let i=0;i<positions.count;i++){
          const t=positions.getY(i)/(mesh.userData.toeLength*1.14)+.5;if(t>.72)continue;
          world.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
          const cacheKey=`${Math.round(world.x*500)},${Math.round(world.z*500)}`;let height=heightCache.get(cacheKey);
          if(height===undefined){probe.set(new T.Vector3(world.x,.08,world.z),new T.Vector3(0,-1,0));height=-Infinity;pickers.forEach((picker,j)=>{if(!picker||atlas.parts[j].system!=='integumentary'||!bounds[j].containsPoint(new T.Vector3(world.x,T.MathUtils.clamp(world.y,bounds[j].min.y,bounds[j].max.y),world.z)))return;const hit=probe.intersectObject(picker,false)[0];if(hit)height=Math.max(height!,hit.point.y);});heightCache.set(cacheKey,height);}
          if(Number.isFinite(height)&&world.y>.012){const blend=1-T.MathUtils.smoothstep(t,.35,.85);world.y=T.MathUtils.lerp(world.y,Math.max(world.y,height-.0004),blend);world.applyMatrix4(inverse);positions.setXYZ(i,world.x,world.y,world.z);}
        }
        positions.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();
      }
    };
    toePresentation.visible=false;scene.add(toePresentation);
    const updateAcupuncture=()=>{const config=latest.current.acupuncture;lineGroup.traverse(o=>{if(o instanceof T.Line){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});lineGroup.clear();const projectedBySide:{right:T.Vector3[];left:T.Vector3[]}={right:[],left:[]};for(const definition of GB_POINTS){for(const side of ['right','left'] as const){const object=pointObjects.find(item=>item.code===definition.code&&item.side===side)!;const source=definition.code==='GB34'&&side==='right'&&latest.current.gb34?latest.current.gb34.position:definition.seed,seed=new T.Vector3(side==='right'?source[0]:-source[0],source[1],source[2]),projected=projectToSkin(seed,definition.projection,side);object.surface.copy(projected.point);object.normal.copy(projected.normal);const markerPosition=projected.point.clone().addScaledVector(projected.normal,.0026);object.marker.position.copy(markerPosition);object.core.position.copy(markerPosition).addScaledVector(projected.normal,.0012);object.label.position.copy(projected.point).addScaledVector(projected.normal,.016).add(new T.Vector3(0,.009,0));const selected=config?.selectedCode===definition.code,visible=!!config?.visible&&(config.showAll||selected);object.marker.visible=object.core.visible=visible;object.label.visible=visible&&selected&&side==='right';object.marker.material=selected?selectedPointMaterial:pointMaterial;object.core.material=selected?selectedPointCoreMaterial:pointCoreMaterial;object.marker.scale.setScalar(selected?1.08:1);object.core.scale.setScalar(selected?1.08:1);projectedBySide[side].push(object.marker.position.clone());}}
     const addSurfaceGuide=(seeds:[number,number,number][],mode:ProjectionMode,color:number,opacity:number)=>{const points=seeds.map(seed=>{const vector=new T.Vector3(...seed),side=vector.x<0?'right':'left';const projected=projectToSkin(vector,mode,side);return projected.point.addScaledVector(projected.normal,.0012);});const curve=new T.CatmullRomCurve3(points,false,'centripetal',.2),geometry=new T.BufferGeometry().setFromPoints(curve.getPoints(Math.max(32,seeds.length*14))),material=new T.LineBasicMaterial({color,transparent:true,opacity,depthTest:false});const line=new T.Line(geometry,material);line.renderOrder=54;lineGroup.add(line);};
     if(config?.visible){addSurfaceGuide([[-.082,1.615,-.012],[-.078,1.636,.016],[-.064,1.650,.047],[-.040,1.657,.068],[0,1.660,.077],[.040,1.657,.068],[.064,1.650,.047],[.078,1.636,.016],[.082,1.615,-.012]],'head',0x6f675c,.32);for(const sign of [-1,1])addSurfaceGuide([[sign*.178,1.335,.006],[sign*.175,1.255,.010],[sign*.164,1.155,.012],[sign*.153,1.035,.014]],'lateral',0x6f675c,.22);addSurfaceGuide([[-.153,.437,-.050],[-.125,.435,-.073],[-.096,.434,-.081],[-.068,.435,-.074]],'posterior',0x6f675c,.24);addSurfaceGuide([[.153,.437,-.050],[.125,.435,-.073],[.096,.434,-.081],[.068,.435,-.074]],'posterior',0x6f675c,.24);}
     if(config?.visible&&config.showAll&&config.showLines){for(const side of ['right','left'] as const){const curve=new T.CatmullRomCurve3(projectedBySide[side],false,'centripetal',.28),geometry=new T.BufferGeometry().setFromPoints(curve.getPoints(220)),material=new T.LineBasicMaterial({color:0xd6a44f,transparent:true,opacity:.34,depthTest:false});const line=new T.Line(geometry,material);line.renderOrder=55;lineGroup.add(line);}}
    };
    const updateGb34=()=>{const config=latest.current.gb34,acupuncture=latest.current.acupuncture;if(!config?.enabled||!ready||acupuncture?.selectedCode!=='GB34'){needle.visible=needleHandle.visible=false;needleHits.current?.([]);return;}const object=pointObjects.find(item=>item.code==='GB34'&&item.side==='right');if(!object)return;const surface=object.surface,trajectory=object.normal.clone().negate(),depth=config.depthMm/1000,totalLength=.07,handleLength=.018,midpoint=depth-totalLength/2,handleMidpoint=depth-totalLength+handleLength/2;needle.position.copy(surface).addScaledVector(trajectory,midpoint);needle.scale.set(1,totalLength,1);needle.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),trajectory);needleHandle.position.copy(surface).addScaledVector(trajectory,handleMidpoint);needleHandle.scale.set(1,handleLength,1);needleHandle.quaternion.copy(needle.quaternion);needle.visible=needleHandle.visible=true;raycaster.set(surface.clone().addScaledVector(trajectory,.00015),trajectory);const hits:NeedleHit[]=[];pickers.forEach((mesh,i)=>{if(!mesh||atlas.parts[i].system==='integumentary')return;const hit=raycaster.intersectObject(mesh,false)[0];if(hit&&hit.distance<=depth+.0002)hits.push({id:atlas.parts[i].id,name:atlas.parts[i].name,system:atlas.parts[i].system,distanceMm:Math.round(hit.distance*10000)/10});});hits.sort((a,b)=>a.distanceMm-b.distanceMm);needleHits.current?.(hits);};
  const down=(e:PointerEvent)=>{hover.hidden=true;tap.down(e.pointerId,e.clientX,e.clientY,e.pointerType==='touch'?12:5);};
  const move=(e:PointerEvent)=>{tap.move(e.pointerId,e.clientX,e.clientY);if(e.buttons||amount<.5||e.pointerType==='touch'){hover.hidden=true;return;}const rect=el.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,index=findTarget(x,y,12);hover.hidden=index<0;renderer.domElement.style.cursor=index<0?'grab':'pointer';if(index>=0){hover.textContent=atlas.parts[index].name;hover.style.left=`${Math.max(8,Math.min(x+14,el.clientWidth-260))}px`;hover.style.top=`${Math.max(8,Math.min(y+18,el.clientHeight-55))}px`;}};
  const cancel=(e:PointerEvent)=>tap.cancel(e.pointerId);
   const up=(e:PointerEvent)=>{
    const validTap=tap.up(e.pointerId,e.clientX,e.clientY);if(!validTap||!ready)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const pointHit=raycaster.intersectObjects(pointObjects.filter(item=>item.marker.visible).map(item=>item.marker),false)[0];if(pointHit){const code=pointHit.object.userData.acupointCode as string|undefined;if(code){pointSelect.current?.(code);return;}}
   let nearest=Infinity,found=-1;const hasSolid=atlas.parts.some((p,i)=>p.system!=='integumentary'&&data[i*4+3]>.5);
   pickers.forEach((mesh,i)=>{if(!mesh||data[i*4+3]<.5||(hasSolid&&atlas.parts[i].system==='integumentary'))return;worldBox.copy(bounds[i]).translate(mesh.position);if(!raycaster.ray.intersectBox(worldBox,hitPoint))return;const hits=raycaster.intersectObject(mesh,false);if(hits[0]&&hits[0].distance<nearest){nearest=hits[0].distance;found=i;}});
   if(found<0&&amount>.45)found=findTarget(e.clientX-rect.left,e.clientY-rect.top,e.pointerType==='touch'?24:16);if(found>=0){hover.hidden=true;select.current(atlas.parts[found].id);}
  };
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);
  const clock=new T.Clock();let lastExtent=-1;
  const animate=()=>{
   if(disposed)return;frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),s=latest.current;
   const changed=lastState?.visible!==s.visible||lastState?.selected!==s.selected||lastState?.isolate!==s.isolate;
   const moving=Math.abs(amount-s.explode)>.0001;
   if(moving){amount=T.MathUtils.damp(amount,s.explode,8,dt);dirty=true;}
   if(changed||moving||lastExtent<0){
    const visible=new Set(s.visible),selection=new Set(s.selected);
    const visibleParts=atlas.parts.filter(p=>s.isolate?selection.has(p.id):visible.has(p.system)||selection.has(p.id));
    const nextLayoutKey=visibleParts.map(p=>p.id).join(',')+':'+camera.aspect.toFixed(3);
    if(nextLayoutKey!==layoutKey){const layout=createExplosionLayout(visibleParts,camera.aspect);packingWidth=layout.width;packingHeight=layout.height;atlas.parts.forEach((p,i)=>{const cell=layout.cells.get(p.id);offsets[i]=cell?new T.Vector3(cell.x,cell.y+.85,0):centers[i].clone();});layoutKey=nextLayoutKey;if(amount>.05&&!s.isolate)fit(s.view,Math.max(0,(amount-.3)/.7));}

    atlas.parts.forEach((p,i)=>{
     const c=centers[i],destination=offsets[i];let dx=0,dy=0,dz=0;
     if(amount<=.45){const t=amount/.45;const group=SYSTEMS.findIndex(sys=>sys.id===p.system);const angle=group/SYSTEMS.length*Math.PI*2;dx=Math.sin(angle)*t*.48;dy=(c.y-.85)*t*.28;dz=Math.cos(angle)*t*.48;}
     else {const t=(amount-.45)/.55,group=SYSTEMS.findIndex(sys=>sys.id===p.system),angle=group/SYSTEMS.length*Math.PI*2;dx=T.MathUtils.lerp(Math.sin(angle)*.48,destination.x-c.x,t);dy=T.MathUtils.lerp((c.y-.85)*.28,destination.y-c.y,t);dz=T.MathUtils.lerp(Math.cos(angle)*.48,-c.z,t);}
     const selected=selection.has(p.id);data.set([dx,dy,dz,(s.isolate?selected:visible.has(p.system)||selected)?1:0],i*4);selectedData[i*4]=selected?255:0;
     markerPositions.set(data[i*4+3]>.5?[c.x+dx,c.y+dy,c.z+dz]:[10000,10000,10000],i*3);const mesh=pickers[i];if(mesh){mesh.position.set(dx,dy,dz);mesh.updateMatrix();mesh.updateMatrixWorld(true);}
    });partTexture.needsUpdate=true;selectionTexture.needsUpdate=true;markerGeometry.attributes.position.needsUpdate=true;lastState=s;lastExtent=amount;dirty=true;
   }
    const acupunctureKey=JSON.stringify([s.acupuncture,s.gb34?.position,s.gb34?.revision]);if(acupunctureKey!==lastAcupuncture){updateAcupuncture();lastAcupuncture=acupunctureKey;lastGb34='';dirty=true;}
    const gb34Key=JSON.stringify([s.gb34,s.acupuncture?.selectedCode]);if(gb34Key!==lastGb34){updateGb34();lastGb34=gb34Key;dirty=true;}
    if(s.view!==lastView||s.reset!==lastReset){fit(s.view,amount);lastView=s.view;lastReset=s.reset;}
   if(moving&&!s.isolate)fit(amount>.5?'front':s.view,Math.max(0,(amount-.3)/.7));
   const isolateKey=s.isolate?s.selected.join(',')+':'+s.reset+':'+s.inspectorOpen+':'+camera.aspect:'';
    if(isolateKey!==lastIsolate||(s.isolate&&moving)){
     if(s.isolate){const box=new T.Box3();atlas.parts.forEach((p,i)=>{if(s.selected.includes(p.id))box.union(bounds[i].clone().translate(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])));});
     if(!box.isEmpty()){const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());const w=el.clientWidth,h=el.clientHeight,mobile=w<768,landscape=w>h&&h<=600;let left=20,right=w-20,top=mobile?175:110,bottom=h-170;if(s.inspectorOpen){if(landscape){right=w-335;top=100;bottom=h-125;}else if(mobile){const sheet=document.querySelector('.detail-sheet')?.getBoundingClientRect(),header=document.querySelector('.identity')?.getBoundingClientRect();top=(header?.bottom??94)+16;bottom=(sheet?.top??h*.58-139)-16;}else{right=w-370;left=w>1100?285:25;}}const availableWidth=Math.max(150,right-left),availableHeight=Math.max(40,bottom-top);camera.setViewOffset(w,h,w/2-(left+right)/2,h/2-(top+bottom)/2,w,h);const distance=Math.max(.07,Math.max(size.y*h/availableHeight,size.x*w/availableWidth/camera.aspect,size.z)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*1.35);controls.maxDistance=Math.max(40,distance*2);moveCamera(center,center.clone().add(new T.Vector3(.2,.1,1).normalize().multiplyScalar(distance)));}
    }else if(lastIsolate){camera.clearViewOffset();fit(s.view,amount);}
     lastIsolate=isolateKey;
    }
    const regionKey=JSON.stringify(s.regionFocus);if(regionKey!==lastRegion){if(s.regionFocus){camera.clearViewOffset();const center=new T.Vector3().fromArray(s.regionFocus.center),radius=Math.max(.025,s.regionFocus.radiusMm/1000),footView=s.regionFocus.viewHint==='dorsal-foot';camera.up.set(0,footView?0:1,footView?-1:0);if(footView)center.x+=.024;const distance=Math.max(.11,radius/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*2.2)*(footView?1.12:1),direction=(footView?new T.Vector3(0,1,.015):new T.Vector3(-1,.08,.32)).normalize();moveCamera(center,center.clone().addScaledVector(direction,distance));}lastRegion=regionKey;}
   controls.enableRotate=amount<.8;controls.mouseButtons.LEFT=amount<.8?T.MOUSE.ROTATE:T.MOUSE.PAN;controls.touches.ONE=amount<.8?T.TOUCH.ROTATE:T.TOUCH.PAN;ground.visible=platform.visible=ring.visible=innerRing.visible=amount<.5&&!s.isolate;const showToePresentation=s.visible.length===1&&s.visible[0]==='integumentary'&&!s.isolate,focusRightFoot=s.regionFocus?.viewHint==='dorsal-foot';if(toePresentation.visible!==showToePresentation){toePresentation.visible=showToePresentation;dirty=true;}toePresentation.children.forEach(child=>{const visible=!focusRightFoot||child.userData.toeSide==='right';if(child.visible!==visible){child.visible=visible;dirty=true;}});markers.visible=amount>.75;controls.autoRotate=s.rotate&&!s.isolate&&amount<.4;controls.autoRotateSpeed=.65;if(cameraTransitioning){const smoothing=1-Math.exp(-9*dt);camera.position.lerp(cameraGoalPosition,smoothing);controls.target.lerp(cameraGoalTarget,smoothing);if(camera.position.distanceToSquared(cameraGoalPosition)<1e-7&&controls.target.distanceToSquared(cameraGoalTarget)<1e-7){camera.position.copy(cameraGoalPosition);controls.target.copy(cameraGoalTarget);cameraTransitioning=false;}dirty=true;}controls.update();if(controls.autoRotate)dirty=true;
   if(dirty){renderer.render(scene,camera);targets=[];if(amount>.45){const hasSolid=atlas.parts.some((p,i)=>p.system!=='integumentary'&&data[i*4+3]>.5);atlas.parts.forEach((p,i)=>{if(data[i*4+3]<.5||(hasSolid&&p.system==='integumentary'))return;let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;for(let corner=0;corner<8;corner++){projected.set(p.bounds[(corner&1)?1:0][0]+data[i*4],p.bounds[(corner&2)?1:0][1]+data[i*4+1],p.bounds[(corner&4)?1:0][2]+data[i*4+2]).project(camera);const x=(projected.x+1)*el.clientWidth/2,y=(1-projected.y)*el.clientHeight/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}projected.copy(centers[i]).add(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])).project(camera);if(projected.z< -1||projected.z>1)return;targets.push({index:i,x:(projected.x+1)*el.clientWidth/2,y:(1-projected.y)*el.clientHeight/2,left,right,top,bottom});});}dirty=false;}

  };animate();
  const contextLost=(e:Event)=>{e.preventDefault();onError('The 3D session was paused by your device. Reload to continue.');};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());lineGroup.traverse(o=>{if(o instanceof T.Line){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});pointObjects.forEach(item=>{item.texture.dispose();item.label.material.dispose();});scene.traverse(o=>{if(o instanceof T.Mesh&&!geometries.includes(o.geometry)){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});env.dispose();partTexture.dispose();selectionTexture.dispose();pickerMaterial.dispose();markerGeometry.dispose();markerMaterial.dispose();needleGeometry.dispose();needleMaterial.dispose();handleGeometry.dispose();handleMaterial.dispose();pointGeometry.dispose();pointCoreGeometry.dispose();pointMaterial.dispose();selectedPointMaterial.dispose();pointCoreMaterial.dispose();selectedPointCoreMaterial.dispose();hover.remove();renderer.dispose();renderer.domElement.remove();};
 },[atlas]);
 return <div className="scene" ref={host}/>;
}
