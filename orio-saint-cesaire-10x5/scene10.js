// Orio · Saint-Césaire · 10 campus dédiés de 5 MW TI (50 MW). Modèle conceptuel.
// Repère : x = est, z = sud (z = -y du plan 2D). Unités : mètres. Même géométrie que les plans 2D.
(function(){
const P=new URLSearchParams(location.search);
let VIEW=P.get('view')||'aerial';
const INTER=P.get('interactive')==='1';
const ISO=(VIEW==='campus');
const stage=document.getElementById('stage');
const Wpx=INTER?stage.clientWidth:+(P.get('w')||1920), Hpx=INTER?stage.clientHeight:+(P.get('h')||1080);

const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(INTER?Math.min(window.devicePixelRatio||1,2):1);renderer.setSize(Wpx,Hpx);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
stage.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xe9eeea);
if(VIEW!=='plan')scene.fog=new THREE.Fog(0xe9eeea,1600,4200);
scene.add(new THREE.HemisphereLight(0xffffff,0x8a9a7a,0.6));
scene.add(new THREE.AmbientLight(0xffffff,0.12));
const sun=new THREE.DirectionalLight(0xfff6e8,1.25);
sun.position.set(-220,420,320);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-450,right:450,top:450,bottom:-450,near:10,far:1500});sun.shadow.bias=-0.0004;scene.add(sun);

const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8,metalness:.03},o));
const mat={
  ground:M(0xb4c79f,{roughness:1}),site:M(0xc6d6b3,{roughness:1}),
  fields:[M(0xaec392,{roughness:1}),M(0xcfc79f,{roughness:1}),M(0xa3b986,{roughness:1}),M(0xc2cfa6,{roughness:1})],
  asph:M(0x7b8087,{roughness:.95}),paint:new THREE.MeshBasicMaterial({color:0xf4f4f4}),gravel:M(0xc4c2bb,{roughness:1}),pad:M(0xb3b8bd),
  bldg:M(0xf1f2f3,{roughness:.6}),bldgDark:M(0x4a5059,{roughness:.6,metalness:.2}),fin:M(0xd2d6db,{metalness:.2,roughness:.5}),
  roof:M(0xdfe2e5,{roughness:.7}),stripe:new THREE.MeshBasicMaterial({color:0xfef100}),elecA:M(0xfff6a8),elecB:M(0xffe0b0),
  glass:M(0xdff0e6,{transparent:true,opacity:.35,roughness:.05,metalness:.1,depthWrite:false}),
  plants:M(0x5f9a45,{roughness:.9}),plants2:M(0x7cae52,{roughness:.9}),
  cooler:M(0xe4e7ea,{metalness:.2,roughness:.5}),coolerFrame:M(0x6b727b,{metalness:.4}),
  gen:M(0x5b6b58,{roughness:.6,metalness:.2}),trafo:M(0x7d8792,{metalness:.4,roughness:.5}),screen:M(0x8e9a88,{roughness:.9}),
  rack:M(0x1d222a,{roughness:.5,metalness:.4}),led:new THREE.MeshBasicMaterial({color:0x4aa3ff}),cdu:M(0xc9ccd1),floor:M(0xb9bdc2),
  hot:M(0xd0453a,{roughness:.4,metalness:.3}),cold:M(0x3a7bd5,{roughness:.4,metalness:.3}),
  berm:M(0x93ad74,{roughness:1}),conif:M(0x2c5527,{roughness:.95}),conif2:M(0x386a31,{roughness:.95}),greenRoof:M(0x8fae6a,{roughness:1}),vegScreen:M(0x6e8f55,{roughness:1}),trunk:M(0x7a6248),leaf:M(0x6fa24c,{roughness:.9}),leaf2:M(0x5d8f42,{roughness:.9}),
  water:M(0x9cc3d6,{roughness:.15,metalness:.1}),house:M(0xece6dc),houseRoof:M(0x7b6f66),car:M(0x9aa6b4,{metalness:.5,roughness:.35}),
  fence:M(0x8c96a0,{transparent:true,opacity:.35,depthWrite:false}),pylon:M(0x9aa3ad,{metalness:.6,roughness:.4}),
  hqBand:new THREE.MeshBasicMaterial({color:0xe08a2e,transparent:true,opacity:.14,depthWrite:false}),
  ghost:M(0xe8f3ea,{transparent:true,opacity:.28,depthWrite:false}),tank:M(0xd8dadc,{metalness:.4,roughness:.4}),
  cistern:M(0x7aa7c4,{metalness:.2}),solar:M(0x2c3e5a,{metalness:.5,roughness:.3})
};
const lineMat={lot:new THREE.LineDashedMaterial({color:0x1a1a1a,dashSize:7,gapSize:5}),wire:new THREE.LineBasicMaterial({color:0x7e8892,transparent:true,opacity:.8}),
  frame:new THREE.LineBasicMaterial({color:0x8f9b93,transparent:true,opacity:.9}),ghost:new THREE.LineDashedMaterial({color:0x5f9a45,dashSize:4,gapSize:3})};
function fanTexture(){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle='#d9dde1';g.fillRect(0,0,512,128);
  for(let j=0;j<4;j++){const x=64+j*128,y=64;g.fillStyle='#2f343a';g.beginPath();g.arc(x,y,52,0,7);g.fill();g.strokeStyle='#8a9098';g.lineWidth=3;for(let k=0;k<4;k++){g.beginPath();g.arc(x,y,12+k*11,0,7);g.stroke();}}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
const fanTop=new THREE.MeshStandardMaterial({map:fanTexture(),roughness:.6,metalness:.2});
const coolerMats=[mat.cooler,mat.cooler,fanTop,mat.coolerFrame,mat.cooler,mat.cooler];
const unit=new THREE.BoxGeometry(1,1,1);
function box(p,x,y,z,w,h,d,m,cast=true){const o=new THREE.Mesh(unit,m);o.position.set(x,y+h/2,z);o.scale.set(w,h,d);o.castShadow=cast;o.receiveShadow=true;p.add(o);return o;}
function inst(p,list,m,cast=true,geo=unit){if(!list.length)return;const im=new THREE.InstancedMesh(geo,m,list.length);const o=new THREE.Object3D();
  list.forEach((b,i)=>{o.position.set(b[0],b[1]+(geo===unit?b[4]/2:0),b[2]);o.scale.set(b[3],b[4],b[5]);o.rotation.set(0,b[6]||0,0);o.updateMatrix();im.setMatrixAt(i,o.matrix);});
  im.castShadow=cast;im.receiveShadow=true;p.add(im);return im;}
const cyl=new THREE.CylinderGeometry(1,1,1,14);
function pipe(p,a,b,r,m){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);const o=new THREE.Mesh(cyl,m);o.scale.set(r,A.distanceTo(B),r);o.position.copy(A).add(B).multiplyScalar(.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());o.castShadow=true;p.add(o);return o;}
function plane(p,x,z,w,d,m,y){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);o.receiveShadow=true;p.add(o);return o;}
function dashed(p,pts,m,y=0.15){const g=new THREE.BufferGeometry().setFromPoints(pts.map(q=>new THREE.Vector3(q[0],y,q[1])));const l=new THREE.Line(g,m);l.computeLineDistances();p.add(l);return l;}
let seed=7;const rnd=()=>((seed=(seed*16807)%2147483647)/2147483647);

/* ---------------- géométrie (identique aux plans 2D) ---------------- */
const SITE={x0:-260,x1:260,z0:-121,z1:121};
const CX=[];for(let i=0;i<10;i++)CX.push(-121+i*38);
const BW=32, YARD=[-95,-59], BLDG=[-59,-19], GH=[-19,17];   // z ranges (north = negative z)
const site=new THREE.Group();scene.add(site);
const trunkGeo=new THREE.CylinderGeometry(0.35,0.45,1,6),leafGeo=new THREE.IcosahedronGeometry(1,1);
const TT=[],TL=[],TL2=[],CN=[],CN2=[];
function tree(x,z,h,y0=0){const s=h*0.32;TT.push([x,y0+h*0.3,z,1,h*0.6,1]);(rnd()<.5?TL:TL2).push([x,y0+h*0.72,z,s,s*1.1,s]);}
const coneGeo=new THREE.ConeGeometry(1,1,8);coneGeo.translate(0,0.5,0);
function conifer(x,z,h,y0=0){const r=h*0.24;TT.push([x,y0+0.6,z,0.5,1.2,0.5]);(rnd()<.5?CN:CN2).push([x,y0+0.8,z,r,h,r]);}

if(!ISO){
plane(scene,0,0,5000,5000,mat.ground,-0.4);
for(let x=-1300;x<1300;x+=210)for(let z=-1100;z<1100;z+=170){const cx=x+105,cz=z+85;
  if(cx>-430&&cx<280&&cz>-220&&cz<170)continue; if(Math.abs(cz-190)<60)continue; if(cx<-260&&cz>-230&&cz<200)continue;
  plane(scene,cx,cz,198,158,mat.fields[Math.floor(rnd()*4)],-0.36);}
plane(scene,0,0,520,242,mat.site,-0.3);
dashed(scene,[[SITE.x0,SITE.z0],[SITE.x1,SITE.z0],[SITE.x1,SITE.z1],[SITE.x0,SITE.z1],[SITE.x0,SITE.z0]],lineMat.lot,0.2);
// route 112 + nouvelle rue publique
plane(scene,0,190,5000,14,mat.asph,-0.28);{const d=[];for(let x=-1600;x<1600;x+=12)d.push([x,-0.27,190,5,0.02,0.3]);inst(scene,d,mat.paint,false);}
plane(scene,-150,155,12,70,mat.asph,-0.27);
// résidences ouest et nord-ouest
const village=new THREE.Group();scene.add(village);
plane(village,-335,0,8,360,mat.asph,-0.27);plane(village,-280,-140,240,8,mat.asph,-0.27);
{const H=[],R=[];const add=(x,z)=>{H.push([x,-0.3,z,11,5.5,9]);R.push([x,5.2,z,12,1.6,10]);};
 for(let z=-110;z<=170;z+=22){add(-305,z);add(-360,z);}
 for(let x=-390;x<=-170;x+=22){add(x,-160);add(x,-182);}
 inst(village,H,mat.house);inst(village,R,mat.houseRoof);}
for(let i=0;i<260;i++){const x=-1100+rnd()*2200,z=-900+rnd()*1800;if(x>-420&&x<400&&z>-230&&z<300)continue;if(Math.abs(z-190)<20)continue;if(rnd()<.55)tree(x,z,7+rnd()*7);}
for(let i=0;i<80;i++){const x=-400+rnd()*120,z=-200+rnd()*380;if(Math.abs(x+335)<6)continue;tree(x,z,6+rnd()*5);}
// buttes plantées ouest, nord, est
function berm(x,z,w,d,h){const g=new THREE.BoxGeometry(1,1,1);const pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){if(pos.getY(i)>0){if(w>d)pos.setZ(i,pos.getZ(i)*0.35);else pos.setX(i,pos.getX(i)*0.35);}}
  g.computeVertexNormals();const o=new THREE.Mesh(g,mat.berm);o.scale.set(w,h,d);o.position.set(x,h/2-0.3,z);o.receiveShadow=true;o.castShadow=true;site.add(o);}
berm(-254,0,12,242,5);berm(6,-115,496,12,5);berm(254,0,12,242,5);
for(const xo of [-258,-254,-250])for(let z=-118;z<=118;z+=5)conifer(xo+(rnd()-.5)*1.5,z+(xo===-254?2.5:0),9+rnd()*4,xo===-254?4.6:2.5);
for(const zo of [-119,-115,-111])for(let x=-246;x<=250;x+=5.5)conifer(x+(zo===-115?2.7:0),zo+(rnd()-.5)*1.2,8+rnd()*4,zo===-115?4.6:2.5);
for(const xo of [252,256])for(let z=-105;z<=118;z+=5.5)conifer(xo,z+(xo===256?2.7:0),8+rnd()*3,3.5);
for(let x=-246;x<=160;x+=9){if(Math.abs(x+150)<12)continue;tree(x,118,8+rnd()*3);}
// servitude Hydro-Québec (bande diagonale, tampon ouest)
{const a=new THREE.Vector2(-247,121),b=new THREE.Vector2(-193,-121);const dir=b.clone().sub(a);
 const band=new THREE.Mesh(new THREE.PlaneGeometry(30,dir.length()+60),mat.hqBand);band.rotation.x=-Math.PI/2;band.rotation.z=Math.atan2(dir.x,dir.y);
 band.position.set((a.x+b.x)/2,-0.2,(a.y+b.y)/2);scene.add(band);
 const pyl=new THREE.CylinderGeometry(0.5,2.4,1,4);const towers=[[-260,180],[-232,55],[-206,-65],[-180,-185]];
 towers.forEach(t=>{const m=new THREE.Mesh(pyl,mat.pylon);m.scale.set(1,30,1);m.position.set(t[0],15,t[1]);m.castShadow=true;scene.add(m);box(scene,t[0],26,t[1],14,0.5,0.6,mat.pylon);});
 for(const dx of [-6,0,6])scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(towers.map(t=>new THREE.Vector3(t[0]+dx,26,t[1]))),lineMat.wire));}
// bassin, citernes, exploitation, stationnement solaire
{const pond=new THREE.Mesh(new THREE.CircleGeometry(1,48),mat.water);pond.rotation.x=-Math.PI/2;pond.scale.set(24,48,1);pond.position.set(-208,-0.12,40);site.add(pond);}
box(site,-208,-0.3,-44,40,8,28,mat.bldg);box(site,-208,7.7,-44,40.4,0.4,28.4,mat.roof);box(site,-208,1.5,-29.9,34,4,0.1,mat.glass,false);
plane(site,-208,-77,40,30,mat.asph,-0.25);inst(site,[[-208,3.4,-77,38,0.25,26]],mat.solar);
{const c=[];for(let x=-225;x<=-191;x+=3)if(rnd()<.6)c.push([x,-0.3,-77,1.8,1.45,4.3]);inst(site,c,mat.car);}
// voies
plane(site,50,28,400,14,mat.asph,-0.25);plane(site,-150,75,12,93,mat.asph,-0.25);plane(site,-150,-38,12,120,mat.asph,-0.25);plane(site,46,-103,404,8,mat.asph,-0.25);
plane(site,-169,-44,26,10,mat.asph,-0.25);box(site,-160,-0.3,115,8,3.5,6,mat.bldgDark);
// boucle de chaleur
pipe(site,[-140,0.7,24],[255,0.7,24],0.55,mat.hot);pipe(site,[-140,0.7,26],[255,0.7,26],0.55,mat.cold);
pipe(site,[255,0.7,24],[285,0.7,24],0.5,mat.hot);
// pôle chaleur
box(site,132,-0.3,85,40,8,30,mat.bldg);box(site,132,7.7,85,40.4,0.4,30.4,mat.roof);
{const t=new THREE.Mesh(cyl,mat.tank);t.scale.set(7,20,7);t.position.set(124,9.7,58);t.castShadow=true;site.add(t);const t2=t.clone();t2.position.set(141,9.7,58);site.add(t2);}
// serres partagées 1,35 ha
greenhouse(site,-12.5,76.5,215,63,true);
// poste client 120/25 kV, 3 × 47 MVA
plane(site,209,77,82,70,mat.gravel,-0.22);
{const t=[];for(const x of [185,207,229])t.push([x,-0.3,82,8,6.5,9]);inst(site,t,mat.trafo);
 const gp=[];for(let x=175;x<=245;x+=10)gp.push([x,-0.3,55,0.5,12,0.5]);inst(site,gp,mat.pylon);box(site,210,11.6,55,72,0.5,0.5,mat.pylon);
 box(site,240,-0.3,105,14,4,8,mat.bldgDark);
 inst(site,[[209,-0.3,42,82,2.5,0.06],[209,-0.3,112,82,2.5,0.06],[168,-0.3,77,0.06,2.5,70],[250,-0.3,77,0.06,2.5,70]],mat.fence,false);}
// poste Hydro-Québec Saint-Césaire (230-120-49-25 kV), de l'autre côté de la route 112
plane(scene,130,252,180,75,mat.gravel,-0.27);
{const t=[];for(let i=0;i<6;i++)t.push([62+i*28,-0.3,262,9,7,11]);inst(scene,t,mat.trafo);
 const gp=[];for(let x=50;x<=210;x+=16)for(const z of [232,244])gp.push([x,-0.3,z,0.6,14,0.6]);inst(scene,gp,mat.pylon);
 for(const z of [232,244])box(scene,130,13.4,z,162,0.6,0.6,mat.pylon);
 const pyl=new THREE.CylinderGeometry(0.4,2,1,4);for(const p of [[205,205],[205,130]]){const m=new THREE.Mesh(pyl,mat.pylon);m.scale.set(1,24,1);m.position.set(p[0],12,p[1]);scene.add(m);}
 for(const dx of [-3,0,3])scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(205+dx,13.4,232),new THREE.Vector3(205+dx,22,205),new THREE.Vector3(205+dx,22,130),new THREE.Vector3(205+dx,11.8,112)]),lineMat.wire));}
// parc de serres potentiel (fantôme)
{const g=new THREE.Group();scene.add(g);for(let i=0;i<3;i++)for(let j=0;j<2;j++){const x=300+i*35,z=-70+j*66;box(g,x,-0.3,z,30,5.5,60,mat.ghost,false);
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(30,5.5,60)),lineMat.frame);e.position.set(x,2.45,z);g.add(e);}
 dashed(g,[[275,-105],[385,-105],[385,45],[275,45],[275,-105]],lineMat.ghost,0.3);}
}

/* ---------------- serre (gable vitrée) ---------------- */
function greenhouse(p,cx,cz,w,d,shared){
  const g=new THREE.Group();p.add(g);const n=shared?Math.round(w/12):1;const span=w/n;
  for(let k=0;k<n;k++){const x=cx-w/2+span/2+k*span;const eave=4.5,ridge=shared?6.2:7.2;
    const sh=new THREE.Shape();sh.moveTo(-span/2,0);sh.lineTo(span/2,0);sh.lineTo(span/2,eave);sh.lineTo(0,ridge);sh.lineTo(-span/2,eave);sh.lineTo(-span/2,0);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false});const m=new THREE.Mesh(geo,mat.glass);m.position.set(x,-0.3,cz-d/2);g.add(m);
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo),lineMat.frame);e.position.copy(m.position);g.add(e);}
  const rows=[];for(let k=0;k<Math.floor(w/4.2);k++)rows.push([cx-w/2+2.5+k*4.2,-0.3,cz,1.6,1.0,d-4]);
  inst(g,rows.filter((_,i)=>i%2),mat.plants);inst(g,rows.filter((_,i)=>!(i%2)),mat.plants2);
}

/* ---------------- campus dédié de 5 MW ---------------- */
const RACKS=[],LEDS=[],COOL=[],GENS=[],TRAF=[],RAD=[],SCR=[],CDUS=[];
function campus(cx,idx,cut){
  const g=new THREE.Group();site.add(g);
  const bz0=BLDG[0],bz1=BLDG[1],bzc=(bz0+bz1)/2,bd=bz1-bz0,H=9;
  plane(g,cx,(YARD[0]+GH[1])/2,36,GH[1]-YARD[0],mat.pad,-0.22);
  if(cut){
    box(g,cx,-0.25,bzc,BW,0.3,bd,mat.floor,false);
    box(g,cx-BW/2+0.2,0,bzc,0.4,H,bd,mat.bldg);box(g,cx+BW/2-0.2,0,bzc,0.4,1.2,bd,mat.bldg);
    box(g,cx,0,bz0+0.2,BW,H,0.4,mat.bldg);box(g,cx,0,bz1-0.2,BW,3,0.4,mat.bldg);
    // salles électriques A/B (côté cour, nord)
    box(g,cx-8,0,bz0+4,15.6,4,7.6,mat.elecA);box(g,cx+8,0,bz0+4,15.6,4,7.6,mat.elecB);box(g,cx,0,bz0+4,0.4,H,8,mat.hot);
    // salle TI : 2 rangées de 13 baies
    for(const rz of [bzc-3.5,bzc+3.5])for(let k=0;k<13;k++){const rx=cx-14.3+k*2.2;RACKS.push([rx,0,rz,0.6,2.3,1.2]);LEDS.push([rx,0.5,rz+(rz<bzc?-0.62:0.62),0.36,1.5,0.02]);}
    for(const rz of [bzc-3.5,bzc+3.5]){pipe(g,[cx-15,2.9,rz-1.1],[cx+15,2.9,rz-1.1],0.16,mat.hot);pipe(g,[cx-15,3.3,rz-1.1],[cx+15,3.3,rz-1.1],0.16,mat.cold);}
    // salle mécanique (CDU) côté sud
    for(let k=0;k<5;k++)CDUS.push([cx-12+k*6,0,bz1-7,2.2,2.2,2.4]);
    box(g,cx,0,bz1-10,BW-1,3.5,0.25,mat.fin);
  }else{
    box(g,cx,-0.3,bzc,BW,H,bd,mat.bldg);box(g,cx,H-0.3,bzc,BW+0.4,0.5,bd+0.4,mat.greenRoof);
    const fins=[];for(let x=cx-BW/2+1.5;x<cx+BW/2;x+=2.5){fins.push([x,0,bz1+0.15,0.25,H-0.4,0.3]);}inst(g,fins,mat.fin);
    box(g,cx,H-1.6,bz1+0.35,BW,0.5,0.1,mat.stripe,false);
  }
  greenhouse(g,cx,(GH[0]+GH[1])/2,BW,GH[1]-GH[0]-1,false);
  // cour technique : transformateurs près du bâtiment, génératrices, refroidisseurs au nord
  const at=d=>YARD[1]-d;   // distance depuis la façade nord du bâtiment
  for(const [dx,lab] of [[-12.5,'A1'],[-7.5,'A2'],[7.5,'B1'],[12.5,'B2']]){TRAF.push([cx+dx,-0.3,at(3.6),3.2,3.2,3.6]);RAD.push([cx+dx,-0.3,at(5.8),3.4,2.6,0.5]);}
  for(const dx of [-10.5,-3.5,3.5,10.5])GENS.push([cx+dx,-0.3,at(14),3.2,3.6,11]);
  for(const d of [21,24.5,28,31.5])for(const dx of [-10.2,10.2])COOL.push([cx+dx,0.8,at(d),9.6,2.4,2.6]);
  SCR.push([cx,-0.3,YARD[0]-0.3,BW+1,6.5,0.5],[cx-BW/2-0.5,-0.3,(YARD[0]+YARD[1])/2,0.5,6.5,YARD[1]-YARD[0]],[cx+BW/2+0.5,-0.3,(YARD[0]+YARD[1])/2,0.5,6.5,YARD[1]-YARD[0]]);
  pipe(g,[cx+15,0.6,bz1],[cx+15,0.6,GH[1]+4],0.22,mat.hot);pipe(g,[cx+14,0.6,bz1],[cx+14,0.6,GH[1]+4],0.22,mat.cold);
  if(!ISO)inst(g,[[cx,-0.3,YARD[0]-0.6,36,2.4,0.06],[cx,-0.3,GH[1]+1.5,36,2.4,0.06],[cx-18,-0.3,(YARD[0]+GH[1])/2,0.06,2.4,GH[1]-YARD[0]+2],[cx+18,-0.3,(YARD[0]+GH[1])/2,0.06,2.4,GH[1]-YARD[0]+2]],mat.fence,false);
}
if(ISO){plane(scene,0,0,600,600,mat.site,-0.4);campus(0,4,true);}
else CX.forEach((x,i)=>campus(x,i,false));
inst(site,RACKS,mat.rack);inst(site,LEDS,mat.led,false);inst(site,CDUS,mat.cdu);
{const im=new THREE.InstancedMesh(unit,coolerMats,COOL.length);const o=new THREE.Object3D();
 COOL.forEach((b,i)=>{o.position.set(b[0],b[1]+b[4]/2,b[2]);o.scale.set(b[3],b[4],b[5]);o.rotation.set(0,0,0);o.updateMatrix();im.setMatrixAt(i,o.matrix);});
 im.castShadow=true;im.receiveShadow=true;site.add(im);
 const legs=[];COOL.forEach(b=>{for(const sx of [-1,1])for(const sz of [-1,1])legs.push([b[0]+sx*(b[3]/2-0.3),-0.3,b[2]+sz*(b[5]/2-0.2),0.15,1.1,0.15]);});inst(site,legs,mat.coolerFrame);}
inst(site,GENS,mat.gen);inst(site,TRAF,mat.trafo);inst(site,RAD,mat.coolerFrame);inst(site,SCR,mat.vegScreen);
inst(scene,TT,mat.trunk,true,trunkGeo);inst(scene,TL,mat.leaf,true,leafGeo);inst(scene,TL2,mat.leaf2,true,leafGeo);inst(scene,CN,mat.conif,true,coneGeo);inst(scene,CN2,mat.conif2,true,coneGeo);

/* ---------------- étiquettes ---------------- */
const LABELS={
 aerial:[['RÉSIDENCES EXISTANTES','Rues Larose, Ostiguy, Girard',[-330,6,60],'#9aa3ad'],['BUTTE 5 m + ÉCRAN DE CONIFÈRES','Trois rangées, essences indigènes',[-150,12,-117],'#5f9a45'],
  ['BASSIN DE RÉTENTION','Eaux pluviales',[-208,1,40],'#3a7bd5'],['EXPLOITATION · NOC','Sécurité, stationnement solaire',[-208,9,-44],'#fef100'],
  ['10 CAMPUS DÉDIÉS · 5 MW','Toits végétalisés, Tier III',[-6,11,-40],'#fef100'],['SERRE SUR CHAQUE CAMPUS','~1 150 m², eau de retour des TI',[-110,7,-2],'#5f9a45'],
  ['SERRES PARTAGÉES','~1,35 ha',[40,7,95],'#5f9a45'],
  ['POSTE CLIENT 120/25 kV','3 × 47 MVA (N+1)',[209,13,70],'#fef100'],['POSTE SAINT-CÉSAIRE','Hydro-Québec, 230-120-49-25 kV',[40,12,262],'#e08a2e'],
  ['ACCÈS PAR LA ROUTE 112','Aucun camion rue Larose',[-150,1,160],'#1a1a1a'],['PARC DE SERRES POTENTIEL','Terres agricoles voisines',[330,6,-25],'#5f9a45']],
 plan:[],
 campus:[['SALLE TI · 5 MW','~25 baies, liquide direct 45 °C',[-6,3,-38],'#fef100'],['SALLES ÉLECTRIQUES A / B','UPS Li-ion, coupe-feu',[-12,5,-55],'#fef100'],
  ['TRANSFORMATEURS A1 A2 B1 B2','25/0,6 kV, ester naturel',[14,3,-61],'#7d8792'],['GÉNÉRATRICES N+1','4 × 2 MWe continues, HVO',[-20,4,-72],'#5b6b58'],
  ['REFROIDISSEURS SECS','8 unités, sans eau',[14,4,-88],'#3a7bd5'],['ÉCRAN ACOUSTIQUE VÉGÉTALISÉ','6,5 m, absorbant, trois côtés',[17,7,-76],'#5f9a45'],
  ['SERRE · 1 150 m²','Rails basse température',[-6,8,0],'#5f9a45'],['EAU CHAUDE ~48 °C','Vers la serre puis la boucle partagée',[15,1,12],'#d0453a']]
};
let cam;
function setCam(v){
  if(v==='plan'){const aspect=Wpx/Hpx,hh=230,hw=hh*aspect;cam=new THREE.OrthographicCamera(-hw,hw,hh,-hh,1,3000);cam.position.set(30,1200,20);cam.up.set(0,0,-1);cam.lookAt(30,0,20);}
  else if(v==='campus'){cam=new THREE.PerspectiveCamera(32,Wpx/Hpx,1,4000);cam.position.set(62,118,36);cam.lookAt(-2,0,-44);}
  else{cam=new THREE.PerspectiveCamera(30,Wpx/Hpx,1,6000);cam.position.set(-520,360,560);cam.lookAt(40,0,20);}
}
setCam(VIEW);
const lab=document.getElementById('labels');
const tags=(LABELS[VIEW]||[]).map(L=>{const d=document.createElement('div');d.className='tag';d.innerHTML='<i style="background:'+L[3]+'"></i><b>'+L[0]+'</b>'+(L[1]?'<span>'+L[1]+'</span>':'');lab.appendChild(d);return [d,new THREE.Vector3(...L[2])];});
function placeTags(){tags.forEach(([d,v])=>{const p=v.clone().project(cam);d.style.left=((p.x+1)/2*Wpx)+'px';d.style.top=((1-p.y)/2*Hpx)+'px';d.style.display=(p.z<1)?'block':'none';});}
if(INTER){
  const ctl=new THREE.OrbitControls(cam,renderer.domElement);ctl.target.set(VIEW==='campus'?-4:20,0,VIEW==='campus'?-38:0);ctl.maxPolarAngle=Math.PI/2.1;ctl.update();
  (function loop(){requestAnimationFrame(loop);ctl.update();renderer.render(scene,cam);placeTags();})();
}else{renderer.render(scene,cam);placeTags();}
document.body.setAttribute('data-ready','1');
})();
