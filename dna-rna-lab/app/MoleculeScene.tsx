"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Base = "A" | "T" | "G" | "C" | "U";
const colors: Record<Base, string> = { A: "#df4d50", T: "#397ac5", G: "#27966a", C: "#d6ad24", U: "#8a5ac8" };

function Atom({ position, color, radius = 0.18 }: { position: [number, number, number]; color: string; radius?: number }) {
  return <mesh position={position}><sphereGeometry args={[radius, 24, 24]} /><meshStandardMaterial color={color} roughness={0.32} metalness={0.08} /></mesh>;
}

function Bond({ from, to, color = "#b8c4d2", radius = 0.045 }: { from: THREE.Vector3; to: THREE.Vector3; color?: string; radius?: number }) {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const direction = to.clone().sub(from);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={mid} quaternion={quaternion}><cylinderGeometry args={[radius, radius, direction.length(), 10]} /><meshStandardMaterial color={color} roughness={0.45} /></mesh>;
}

function BaseModel({ base, position, scale = 1 }: { base: Base; position: [number, number, number]; scale?: number }) {
  const color = colors[base];
  const isPurine = base === "A" || base === "G";
  const ringPositions = isPurine
    ? [[-0.23,0,0],[0,0.2,0],[0.23,0,0],[0,-0.2,0],[-0.23,0,0],[-0.46,0.16,0],[-0.66,0,0],[-0.46,-0.16,0]]
    : [[-0.25,0.18,0],[0,0.3,0],[0.25,0.18,0],[0.25,-0.18,0],[0,-0.3,0],[-0.25,-0.18,0]];
  const pts = ringPositions.map(p => new THREE.Vector3(p[0]*scale,p[1]*scale,p[2]*scale));
  return <group position={position}>
    {pts.map((p,i)=><Atom key={i} position={[p.x,p.y,p.z]} color={i%3===0?"#f5f7fa":color} radius={0.095*scale}/>)}
    {pts.map((p,i)=><Bond key={i} from={p} to={pts[(i+1)%pts.length]} color={color} radius={0.028*scale}/>)}
    <Html position={[0,-0.53*scale,0]} center distanceFactor={7} style={{pointerEvents:"none"}}><span className="atom-label" style={{color}}>{base}</span></Html>
  </group>;
}

function Helix({ mode, selectedBase }: { mode: string; selectedBase: Base }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (group.current && mode === "dna") group.current.rotation.y += delta * 0.13;
  });
  const pairs = useMemo(() => Array.from({length:13},(_,i) => {
    const t = i/12;
    const angle = t*Math.PI*4.8;
    const y = (t-.5)*4.4;
    return { i, angle, y, left: new THREE.Vector3(Math.cos(angle)*0.9,y,Math.sin(angle)*0.9), right: new THREE.Vector3(-Math.cos(angle)*0.9,y,-Math.sin(angle)*0.9) };
  }), []);
  const letters: Base[] = ["A","G","C","T","T","A","C","G","A","T","G","C","A"];
  if (mode === "base") return <group>
    <BaseModel base={selectedBase} position={[0,0,0]} scale={1.8}/>
    <Atom position={[0,0.85,0]} color="#f0a34a" radius={0.26}/>
    <Bond from={new THREE.Vector3(0,0.5,0)} to={new THREE.Vector3(0,0.62,0)} color="#d6a25a" radius={0.055}/>
    <Atom position={[0,-0.85,0]} color="#8d9cb1" radius={0.26}/>
    <Bond from={new THREE.Vector3(0,-0.5,0)} to={new THREE.Vector3(0,-0.62,0)} color="#8d9cb1" radius={0.055}/>
    <Html position={[0,-1.4,0]} center><span className="scene-caption">Մոդել՝ ուսումնական սխեմա</span></Html>
  </group>;
  if (mode === "rna") return <group>
    {Array.from({length:13},(_,i)=>{
      const x=(i-6)*0.31;
      const b: Base = (["A","U","G","C","A","U","C","G","U","A","C","G","U"] as Base[])[i];
      return <group key={i}>
        <Atom position={[x,Math.sin(i*.7)*.22,0]} color="#e8a06d" radius={0.11}/>
        <Atom position={[x,Math.sin(i*.7)*.22+.28,0]} color={colors[b]} radius={0.16}/>
        <Bond from={new THREE.Vector3(x,Math.sin(i*.7)*.22,0)} to={new THREE.Vector3(x,Math.sin(i*.7)*.22+.28,0)} color="#e5a06e" radius={0.035}/>
        <Html position={[x,Math.sin(i*.7)*.22+.52,0]} center distanceFactor={8}><span className="atom-label" style={{color:colors[b]}}>{b}</span></Html>
      </group>;
    })}
    <Html position={[0,-.85,0]} center><span className="scene-caption">Միաշղթա ՌՆԹ-ի սխեմատիկ մոդել</span></Html>
  </group>;
  if (mode === "pair") {
    const pair: Base = selectedBase === "A" ? "T" : selectedBase === "T" ? "A" : selectedBase === "G" ? "C" : selectedBase === "C" ? "G" : "A";
    return <group>
      <BaseModel base={selectedBase} position={[-.8,0,0]} scale={1.2}/>
      <BaseModel base={pair} position={[.8,0,0]} scale={1.2}/>
      {[0,1,2].slice(0, selectedBase==="A"||selectedBase==="T"?2:3).map((n)=><Bond key={n} from={new THREE.Vector3(-.18,.12-n*.12,0)} to={new THREE.Vector3(.18,.12-n*.12,0)} color="#8d9cb1" radius={.025}/>)}
      <Html position={[0,-1.05,0]} center><span className="scene-caption">Հիմքերի զույգի ուսումնական մոդել</span></Html>
    </group>;
  }
  return <group ref={group}>
    {pairs.map((p) => {
      const a = letters[p.i];
      const b: Base = a === "A" ? "T" : a === "T" ? "A" : a === "G" ? "C" : "G";
      return <group key={p.i}>
        <Atom position={[p.left.x,p.left.y,p.left.z]} color={colors[a]} radius={0.13}/>
        <Atom position={[p.right.x,p.right.y,p.right.z]} color={colors[b]} radius={0.13}/>
        <Bond from={p.left} to={p.right} color="#b9c4d1" radius={0.025}/>
        {p.i < pairs.length-1 && <>
          <Bond from={p.left} to={pairs[p.i+1].left} color="#9bb9d6" radius={0.04}/>
          <Bond from={p.right} to={pairs[p.i+1].right} color="#9bb9d6" radius={0.04}/>
        </>}
      </group>;
    })}
    <Html position={[0,-2.6,0]} center><span className="scene-caption">ԴՆԹ-ի երկպարույրի պարզեցված 3D մոդել</span></Html>
  </group>;
}

export default function MoleculeScene({ mode = "dna", selectedBase = "A", compact = false }: { mode?: string; selectedBase?: Base; compact?: boolean }) {
  return <div className={compact ? "scene scene-compact" : "scene"}>
    <Canvas camera={{position:[0,0,7], fov:42}} dpr={[1,1.7]} gl={{antialias:true,alpha:true}}>
      <ambientLight intensity={1.15}/>
      <directionalLight position={[4,5,6]} intensity={2.2}/>
      <directionalLight position={[-4,-2,-5]} intensity={0.8} color="#c6dcff"/>
      <Helix mode={mode} selectedBase={selectedBase}/>
      <OrbitControls enablePan={false} minDistance={3} maxDistance={11} />
    </Canvas>
  </div>;
}
