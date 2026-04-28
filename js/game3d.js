// ══════════════════════════════════════════
//  game3d.js  –  3D Temple Run Engine
//  Three.js r128 · Mobile Swipe Controls
// ══════════════════════════════════════════

'use strict';

/* ─── CONSTANTS ─── */
const LANE_X    = [3.5, 0, -3.5];
const TRACK_W   = 12;
const SEG_LEN   = 22;
const SEGS      = 14;
const CAM_Y     = 5.8;
const CAM_Z     = -9.5;
const JUMP_VY   = 0.34;
const GRAV      = 0.046;

const LVLS = [
  // Level 1: EASY   — slow speed, forgiving obstacle rate, 3 lives, target 400pts
  { id:1, name:'Grey City',    diff:'EASY',     skyTop:0x1a1a2e, skyBot:0x3a3a5c, gnd:0x4a4e69, trk:0x5a5a7a, edge:0x7a7a9a, builds:[0x3d405b,0x4a4e69,0x5c5c7a], fog:0x2a2a45, fn:18,ff:52, amb:0x334455, dir:0x8899bb, hT:0x223344, hB:0x2a2a3a, scoreTarget:400, baseSpd:9,  obsInt:120, startLives:3 },
  // Level 2: MODERATE — medium speed, more obstacles, 3 lives, target 600pts
  { id:2, name:'Green Suburb', diff:'MODERATE', skyTop:0x0d3b1e, skyBot:0x1a6b3a, gnd:0x2d5a3d, trk:0x3a6b4a, edge:0x52b788, builds:[0x2d5a3d,0x3a8c5f,0x1a6b3a], fog:0x0d2e1a, fn:22,ff:62, amb:0x335544, dir:0x88ffaa, hT:0x1a4a2a, hB:0x0d2e1a, scoreTarget:600, baseSpd:12, obsInt:90,  startLives:3 },
  // Level 3: HARD    — fast speed, heavy obstacles, only 2 lives, target 800pts
  { id:3, name:'Solar City',   diff:'HARD',     skyTop:0x030d20, skyBot:0x0a3d62, gnd:0x1f6b58, trk:0x0d4a3a, edge:0x2eb872, builds:[0x006b77,0x0a5566,0x1a8fa8], fog:0x040c1a, fn:25,ff:70, amb:0x223355, dir:0x44aaff, hT:0x0a1f3a, hB:0x050f1a, scoreTarget:800, baseSpd:15, obsInt:65,  startLives:2 },
];

/* ─── OBSTACLE DEFINITIONS ─── */
// All obstacles use RED/DARK/TOXIC color palette with warning shapes
const OBS = [

  // ── FACTORY: tall industrial block, black smoke stacks, bright orange glow ──
  { name:'Factory', w:2.2,h:3.2,jmp:false,sld:false,fy:0,
    mk(){
      const g=new THREE.Group();
      // Main building — dark grey with orange warning stripes
      const body=new THREE.Mesh(new THREE.BoxGeometry(2.2,3.2,2.0),new THREE.MeshLambertMaterial({color:0x3a3a3a}));
      body.position.y=1.6; body.castShadow=true; g.add(body);
      // Orange hazard stripes on front
      [0.6,1.4,2.2].forEach(y=>{
        const stripe=new THREE.Mesh(new THREE.BoxGeometry(2.25,0.18,0.05),new THREE.MeshBasicMaterial({color:0xff6600}));
        stripe.position.set(0,y,1.03); g.add(stripe);
      });
      // Two thick smoke stacks
      [-0.55,0.55].forEach(x=>{
        const stack=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,2.0,8),new THREE.MeshLambertMaterial({color:0x222222}));
        stack.position.set(x,4.2,0); g.add(stack);
        // Red danger band on each stack
        const band=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.22,8),new THREE.MeshBasicMaterial({color:0xff2200}));
        band.position.set(x,3.6,0); g.add(band);
        // Pulsing smoke puff
        const smoke=new THREE.Mesh(new THREE.SphereGeometry(0.45,7,5),new THREE.MeshBasicMaterial({color:0x666666,transparent:true,opacity:0.72}));
        smoke.position.set(x,5.5,0); smoke.name='smoke'; g.add(smoke);
      });
      // Glowing lava window
      const win=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.5,0.06),new THREE.MeshBasicMaterial({color:0xff4400}));
      win.position.set(0,2.2,1.04); g.add(win);
      // ⚠ Warning sign on front
      const sign=new THREE.Mesh(new THREE.BoxGeometry(0.72,0.72,0.06),new THREE.MeshBasicMaterial({color:0xffcc00}));
      sign.position.set(0,0.9,1.04); g.add(sign);
      const signX=new THREE.Mesh(new THREE.BoxGeometry(0.74,0.08,0.07),new THREE.MeshBasicMaterial({color:0x222200}));
      signX.position.set(0,0.9,1.05); signX.rotation.z=Math.PI/4; g.add(signX);
      return g;
    }
  },

  // ── SMOG CLOUD: big toxic purple-green cloud, clearly hovering danger ──
  { name:'SmogCloud', w:2.4,h:1.2,jmp:false,sld:true,fy:1.1,
    mk(){
      const g=new THREE.Group();
      // Large puffball cloud shape in toxic green-grey
      const puffs=[
        [0,0,0,0.72],[0.62,0.1,0,0.58],[-0.62,0.05,0,0.58],
        [0.3,0.35,0,0.5],[-0.3,0.32,0,0.5],[0,0.38,0,0.48],
        [0.62,-0.18,0,0.4],[-0.62,-0.16,0,0.4]
      ];
      puffs.forEach(([x,y,z,r],i)=>{
        const col=i%2===0?0x7a9e5a:0x5a7a3a; // alternating toxic green shades
        const s=new THREE.Mesh(new THREE.SphereGeometry(r,7,5),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.82}));
        s.position.set(x,y,z); g.add(s);
      });
      // Toxic drip drops hanging below
      [-0.4,0,0.4].forEach(x=>{
        const drip=new THREE.Mesh(new THREE.SphereGeometry(0.1,6,4),new THREE.MeshBasicMaterial({color:0x44ff44,transparent:true,opacity:0.7}));
        drip.position.set(x,-0.55,0); g.add(drip);
      });
      // Skull-like dark center for extra danger cue
      const center=new THREE.Mesh(new THREE.SphereGeometry(0.22,6,5),new THREE.MeshBasicMaterial({color:0x1a2a1a,transparent:true,opacity:0.6}));
      center.position.set(0,0.05,0); g.add(center);
      return g;
    }
  },

  // ── TRASH PILE: overflowing bin with visible garbage, unmistakably dirty ──
  { name:'TrashPile', w:1.8,h:1.2,jmp:true,sld:false,fy:0,
    mk(){
      const g=new THREE.Group();
      // Brown overflowing trash bin base
      const bin=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.45,0.9,8),new THREE.MeshLambertMaterial({color:0x5a3a1a}));
      bin.position.y=0.45; bin.castShadow=true; g.add(bin);
      // Black danger stripes on bin
      [0.25,0.55,0.85].forEach(y=>{
        const s=new THREE.Mesh(new THREE.CylinderGeometry(0.56,0.56,0.07,8),new THREE.MeshBasicMaterial({color:0x111111}));
        s.position.y=y; g.add(s);
      });
      // Overflowing garbage heap on top (random dirty cubes)
      [[-0.2,0.95,0.1],[0.2,1.05,-0.1],[0,1.2,0],[0.3,0.92,-0.2],[-0.25,1.0,0.2],[0,0.98,0.25]].forEach(([x,y,z])=>{
        const junk=new THREE.Mesh(new THREE.BoxGeometry(0.28+Math.random()*0.22,0.22+Math.random()*0.18,0.28+Math.random()*0.2),
          new THREE.MeshLambertMaterial({color:[0x2a4a2a,0x8b4513,0x3a5a3a,0x6b4423,0x1a3a1a][Math.floor(Math.random()*5)]}));
        junk.position.set(x,y,z); junk.rotation.y=Math.random()*Math.PI; g.add(junk);
      });
      // Toxic green goo dripping (visual cue)
      const goo=new THREE.Mesh(new THREE.SphereGeometry(0.16,6,4),new THREE.MeshBasicMaterial({color:0x44cc00,transparent:true,opacity:0.85}));
      goo.position.set(0.3,0.5,0.52); g.add(goo);
      // Big red X on front face
      const xSign=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.12,0.06),new THREE.MeshBasicMaterial({color:0xff2200}));
      xSign.position.set(0,0.45,0.54); g.add(xSign);
      const xSign2=xSign.clone(); xSign2.rotation.z=Math.PI/2; xSign2.position.set(0,0.45,0.55); g.add(xSign2);
      return g;
    }
  },

  // ── BROKEN CAR: wrecked car, red body, sparks/flames, clearly a hazard ──
  { name:'BrokenCar', w:2.4,h:1.4,jmp:false,sld:false,fy:0,
    mk(){
      const g=new THREE.Group();
      // Main body — dark red wrecked car
      const body=new THREE.Mesh(new THREE.BoxGeometry(2.4,0.75,1.2),new THREE.MeshLambertMaterial({color:0x8b0000}));
      body.position.y=0.57; body.castShadow=true; g.add(body);
      // Cab (smaller top section)
      const cab=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.62,1.05),new THREE.MeshLambertMaterial({color:0x6b0000}));
      cab.position.set(-0.25,1.13,0); g.add(cab);
      // Broken windshield (dark cracked)
      const wind=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.48,0.04),new THREE.MeshBasicMaterial({color:0x112233,transparent:true,opacity:0.7}));
      wind.position.set(-0.25,1.13,0.54); g.add(wind);
      // Crack lines on windshield
      const crack=new THREE.Mesh(new THREE.BoxGeometry(0.92,0.06,0.05),new THREE.MeshBasicMaterial({color:0xffffff}));
      crack.position.set(-0.25,1.13,0.55); crack.rotation.z=0.5; g.add(crack);
      // 4 flat black wheels
      [[-0.78,0.25,-0.42],[0.78,0.25,-0.42],[-0.78,0.25,0.42],[0.78,0.25,0.42]].forEach(([x,y,z])=>{
        const w=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.22,12),new THREE.MeshLambertMaterial({color:0x111111}));
        w.rotation.x=Math.PI/2; w.position.set(x,y,z); g.add(w);
        // Hubcap
        const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.24,8),new THREE.MeshBasicMaterial({color:0x555555}));
        hub.rotation.x=Math.PI/2; hub.position.set(x,y,z); g.add(hub);
      });
      // Flame shooting out of hood
      [[-0.9,0.9,0.3],[-0.6,1.05,0.2],[-1.1,0.85,-0.15]].forEach(([x,y,z])=>{
        const flame=new THREE.Mesh(new THREE.ConeGeometry(0.18,0.6,6),new THREE.MeshBasicMaterial({color:0xff4400,transparent:true,opacity:0.9}));
        flame.position.set(x,y,z); flame.name='flame'; g.add(flame);
      });
      // Red warning light on roof
      const light=new THREE.Mesh(new THREE.SphereGeometry(0.14,6,4),new THREE.MeshBasicMaterial({color:0xff2200}));
      light.position.set(0.1,1.48,0); g.add(light);
      return g;
    }
  },

  // ── FIRE: tall dramatic fire cluster, unmistakably bright orange/red ──
  { name:'Fire', w:1.5,h:1.8,jmp:true,sld:false,fy:0,
    mk(){
      const g=new THREE.Group();
      // Glowing ember base (flat disc)
      const base=new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.7,0.12,10),new THREE.MeshBasicMaterial({color:0xff2200}));
      base.position.y=0.06; g.add(base);
      // Layered flame cones — bright reds, oranges, yellows
      const flameData=[
        [0,0,0,0.45,1.4,0xff1100,1.0,'flame'],
        [0.28,0,0.2,0.32,1.0,0xff4400,0.95,'flame'],
        [-0.28,0,0.18,0.32,0.98,0xff4400,0.95,'flame'],
        [0,0,0,0.28,1.8,0xff8800,0.88,'flame'],
        [0.12,0,-0.2,0.2,1.1,0xffcc00,0.85,'flame'],
        [-0.12,0,0.22,0.2,1.0,0xffcc00,0.85,'flame'],
        [0,0,0,0.14,2.1,0xffff44,0.75,'flame'], // bright yellow tip
      ];
      flameData.forEach(([x,_,z,r,h,col,op,name])=>{
        const f=new THREE.Mesh(new THREE.ConeGeometry(r,h,7),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op}));
        f.position.set(x,h/2,z); f.name=name; g.add(f);
      });
      // Floating ember sparks
      [[-0.4,1.5,-0.2],[0.5,1.2,0.3],[0.1,1.9,-0.3],[-0.3,1.7,0.4]].forEach(([x,y,z])=>{
        const spark=new THREE.Mesh(new THREE.SphereGeometry(0.06,4,3),new THREE.MeshBasicMaterial({color:0xffcc00}));
        spark.position.set(x,y,z); spark.name='flame'; g.add(spark);
      });
      return g;
    }
  },

  // ── BARREL: toxic waste barrels, bright yellow/green hazard markings ──
  { name:'Barrel', w:1.5,h:1.6,jmp:true,sld:false,fy:0,
    mk(){
      const g=new THREE.Group();
      // Arrange 3 barrels in a tight triangle
      const barrelPos=[[-0.5,0.5,0],[0.5,0.5,0],[0,0.5+0.88*0.5,0]];
      barrelPos.forEach(([x,y,z],idx)=>{
        const col=[0x1a1a1a,0x111111,0x222222][idx];
        // Barrel body
        const brl=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.88,10),new THREE.MeshLambertMaterial({color:col}));
        brl.position.set(x,y,z); brl.castShadow=true; g.add(brl);
        // Top cap
        const top=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.07,10),new THREE.MeshLambertMaterial({color:0x333333}));
        top.position.set(x,y+0.47,z); g.add(top);
        // Toxic YELLOW hazard stripe
        const stripe=new THREE.Mesh(new THREE.CylinderGeometry(0.31,0.31,0.15,10),new THREE.MeshBasicMaterial({color:0xffdd00}));
        stripe.position.set(x,y+0.1,z); g.add(stripe);
        // ☢ style green dot (biohazard glow)
        const dot=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,6),new THREE.MeshBasicMaterial({color:0x00ff44}));
        dot.position.set(x,y+0.45,z+0.31); g.add(dot);
        // Leaking goo drip
        const drip=new THREE.Mesh(new THREE.SphereGeometry(0.08,5,4),new THREE.MeshBasicMaterial({color:0x44ff44,transparent:true,opacity:0.88}));
        drip.position.set(x+0.28,y-0.25,z); g.add(drip);
      });
      // Big orange HAZARD label board between barrels
      const board=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.36,0.06),new THREE.MeshBasicMaterial({color:0xff6600}));
      board.position.set(0,0.08,0.52); g.add(board);
      const label=new THREE.Mesh(new THREE.BoxGeometry(1.38,0.22,0.07),new THREE.MeshBasicMaterial({color:0x111100}));
      label.position.set(0,0.08,0.53); g.add(label);
      return g;
    }
  },
];

/* ─── ECO ITEM DEFINITIONS ─── */
// All eco items use BRIGHT GREEN / CYAN / GOLD palette + glowing auras
const ECO = [

  // ── TREE: tall lush layered pine, vivid bright greens, unmistakable ──
  { name:'Tree', pts:10, eco:1, type:'tree',
    mk(){
      const g=new THREE.Group();
      // Thick brown trunk
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.22,0.9,8),new THREE.MeshLambertMaterial({color:0x7b4f2a}));
      trunk.position.y=0.45; trunk.castShadow=true; g.add(trunk);
      // 4 layered canopy cones — vibrant greens from dark to bright
      const tiers=[[0.72,1.1,0x1db954,0.9],[0.58,0.95,0x25d366,1.5],[0.44,0.85,0x2ecc71,2.1],[0.28,0.7,0x5dde8f,2.7]];
      tiers.forEach(([r,h,col,y])=>{
        const cone=new THREE.Mesh(new THREE.ConeGeometry(r,h,8),new THREE.MeshLambertMaterial({color:col}));
        cone.position.y=y; cone.castShadow=true; g.add(cone);
      });
      // Bright lime green glow disc at base
      const glow=new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.85,0.06,12),new THREE.MeshBasicMaterial({color:0x44ff88,transparent:true,opacity:0.35}));
      glow.position.y=0.04; g.add(glow);
      // Bright star/sparkle on top
      const star=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));
      star.position.y=3.3; g.add(star);
      return g;
    }
  },

  // ── SOLAR PANEL: bright blue-white tilted panel with golden sunbeams ──
  { name:'Solar', pts:20, eco:2, type:'solar',
    mk(){
      const g=new THREE.Group();
      // Silver post
      const post=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,1.15,8),new THREE.MeshLambertMaterial({color:0xaaaaaa}));
      post.position.y=0.57; g.add(post);
      // Panel frame (white)
      const frame=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.08,0.85),new THREE.MeshLambertMaterial({color:0xeeeeee}));
      frame.position.set(0,1.22,-0.08); frame.rotation.x=-0.42; g.add(frame);
      // Bright blue solar cells
      const panel=new THREE.Mesh(new THREE.PlaneGeometry(0.96,0.72),new THREE.MeshBasicMaterial({color:0x1155ee,side:THREE.DoubleSide}));
      panel.position.set(0,1.25,-0.07); panel.rotation.x=-0.42; g.add(panel);
      // Shiny grid lines on panel
      for(let i=0;i<3;i++){
        const row=new THREE.Mesh(new THREE.PlaneGeometry(0.97,0.03),new THREE.MeshBasicMaterial({color:0x88aaff,side:THREE.DoubleSide}));
        row.position.set(0,1.08+i*0.22,-0.07+i*0.1); row.rotation.x=-0.42; g.add(row);
      }
      for(let i=0;i<4;i++){
        const col=new THREE.Mesh(new THREE.PlaneGeometry(0.03,0.73),new THREE.MeshBasicMaterial({color:0x88aaff,side:THREE.DoubleSide}));
        col.position.set(-0.36+i*0.24,1.25,-0.07); col.rotation.x=-0.42; g.add(col);
      }
      // Gold sun above
      const sun=new THREE.Mesh(new THREE.SphereGeometry(0.22,8,6),new THREE.MeshBasicMaterial({color:0xffdd00}));
      sun.position.set(0,2.0,0); g.add(sun);
      // Sunray spikes
      for(let i=0;i<8;i++){
        const a=i/8*Math.PI*2;
        const ray=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.38,0.04),new THREE.MeshBasicMaterial({color:0xffee44}));
        ray.position.set(Math.cos(a)*0.42,2.0+Math.sin(a)*0.42,0); ray.rotation.z=a; g.add(ray);
      }
      // Glow halo
      const halo=new THREE.Mesh(new THREE.SphereGeometry(0.55,8,6),new THREE.MeshBasicMaterial({color:0xffee00,transparent:true,opacity:0.18}));
      halo.position.set(0,2.0,0); g.add(halo);
      return g;
    }
  },

  // ── RECYCLE BIN: bold green bin with white ♻ arrows, can't miss it ──
  { name:'RecycleBin', pts:15, eco:1, type:'bin',
    mk(){
      const g=new THREE.Group();
      // Bin body — bright green cylinder
      const bin=new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.32,0.92,10),new THREE.MeshLambertMaterial({color:0x1db954}));
      bin.position.y=0.46; bin.castShadow=true; g.add(bin);
      // Darker lid
      const lid=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.11,10),new THREE.MeshLambertMaterial({color:0x148040}));
      lid.position.y=0.97; g.add(lid);
      // White ♻ arrows (3 arc segments representing recycle symbol)
      for(let i=0;i<3;i++){
        const a=i/3*Math.PI*2;
        const arrow=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.28,0.06),new THREE.MeshBasicMaterial({color:0xffffff}));
        arrow.position.set(Math.cos(a)*0.22,0.46,Math.sin(a)*0.22); arrow.rotation.y=a; g.add(arrow);
        const tip=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.18,4),new THREE.MeshBasicMaterial({color:0xffffff}));
        tip.position.set(Math.cos(a+0.5)*0.22,0.6,Math.sin(a+0.5)*0.22); tip.rotation.y=a+0.5; tip.rotation.x=0.4; g.add(tip);
      }
      // Bright glow ring at base
      const glow=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.05,12),new THREE.MeshBasicMaterial({color:0x44ff88,transparent:true,opacity:0.4}));
      glow.position.y=0.03; g.add(glow);
      // Floating ♻ glow orb above
      const orb=new THREE.Mesh(new THREE.SphereGeometry(0.22,8,6),new THREE.MeshBasicMaterial({color:0x44ffaa,transparent:true,opacity:0.55}));
      orb.position.y=1.45; g.add(orb);
      return g;
    }
  },

  // ── GREEN ORB: dazzling golden energy orb with multi-ring halo ──
  { name:'GreenOrb', pts:25, eco:3, type:'energy',
    mk(){
      const g=new THREE.Group();
      // Inner core — bright white-gold
      const core=new THREE.Mesh(new THREE.SphereGeometry(0.28,12,9),new THREE.MeshBasicMaterial({color:0xffffff}));
      core.position.y=1.0; g.add(core);
      // Mid glow — golden yellow
      const mid=new THREE.Mesh(new THREE.SphereGeometry(0.42,10,8),new THREE.MeshBasicMaterial({color:0xffdd00,transparent:true,opacity:0.88}));
      mid.position.y=1.0; g.add(mid);
      // Outer glow — gold-orange
      const outer=new THREE.Mesh(new THREE.SphereGeometry(0.62,10,8),new THREE.MeshBasicMaterial({color:0xffaa00,transparent:true,opacity:0.38}));
      outer.position.y=1.0; g.add(outer);
      // Three orbiting rings
      [0,Math.PI/3,Math.PI*2/3].forEach((angle,i)=>{
        const ring=new THREE.Mesh(new THREE.TorusGeometry(0.6,0.04,6,20),new THREE.MeshBasicMaterial({color:[0xffee44,0x44ffcc,0xff88ff][i]}));
        ring.position.y=1.0; ring.rotation.x=angle; ring.rotation.z=angle*0.7; g.add(ring);
      });
      // Star sparkles around
      for(let i=0;i<6;i++){
        const a=i/6*Math.PI*2;
        const sp=new THREE.Mesh(new THREE.SphereGeometry(0.07,4,3),new THREE.MeshBasicMaterial({color:0xffffff}));
        sp.position.set(Math.cos(a)*0.85,1.0,Math.sin(a)*0.85); g.add(sp);
      }
      return g;
    }
  },

  // ── WATER ORB: bright cyan-blue water droplet with ripple rings ──
  { name:'Water', pts:12, eco:1, type:'water',
    mk(){
      const g=new THREE.Group();
      // Droplet body — teardrop shape using scaled sphere
      const drop=new THREE.Mesh(new THREE.SphereGeometry(0.36,10,8),new THREE.MeshBasicMaterial({color:0x00ccff}));
      drop.scale.set(1,1.3,1); drop.position.y=0.95; g.add(drop);
      // Bright highlight
      const shine=new THREE.Mesh(new THREE.SphereGeometry(0.14,6,5),new THREE.MeshBasicMaterial({color:0xeeffff,transparent:true,opacity:0.8}));
      shine.position.set(-0.12,1.15,0.2); g.add(shine);
      // Inner glow
      const inner=new THREE.Mesh(new THREE.SphereGeometry(0.26,8,6),new THREE.MeshBasicMaterial({color:0x44eeff,transparent:true,opacity:0.5}));
      inner.position.y=0.95; g.add(inner);
      // 3 expanding ripple rings below
      [0.45,0.7,0.95].forEach((r,i)=>{
        const ripple=new THREE.Mesh(new THREE.TorusGeometry(r,0.035,5,18),new THREE.MeshBasicMaterial({color:0x00aaee,transparent:true,opacity:0.55-i*0.15}));
        ripple.rotation.x=Math.PI/2; ripple.position.y=0.08; g.add(ripple);
      });
      // Glow disc on ground
      const glow=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.04,12),new THREE.MeshBasicMaterial({color:0x00ccff,transparent:true,opacity:0.3}));
      glow.position.y=0.02; g.add(glow);
      return g;
    }
  },

  // ── TURBINE: giant spinning white wind turbine, iconic and tall ──
  { name:'Turbine', pts:30, eco:3, type:'wind',
    mk(){
      const g=new THREE.Group();
      // Thick white pole
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.14,2.5,8),new THREE.MeshLambertMaterial({color:0xf0f0f0}));
      pole.position.y=1.25; g.add(pole);
      // Central hub — bright white sphere
      const hub=new THREE.Mesh(new THREE.SphereGeometry(0.2,10,8),new THREE.MeshLambertMaterial({color:0xffffff}));
      hub.position.y=2.6; g.add(hub);
      // 3 long wide blades (clearly recognisable)
      for(let i=0;i<3;i++){
        const a=i/3*Math.PI*2;
        const blade=new THREE.Mesh(new THREE.BoxGeometry(0.16,1.2,0.07),new THREE.MeshLambertMaterial({color:0xe8e8e8}));
        blade.position.set(Math.sin(a)*0.65,2.6+Math.cos(a)*0.65,0);
        blade.rotation.z=a; g.add(blade);
        // Blue accent stripe on each blade
        const stripe=new THREE.Mesh(new THREE.BoxGeometry(0.07,1.18,0.08),new THREE.MeshBasicMaterial({color:0x4488ff}));
        stripe.position.set(Math.sin(a)*0.65,2.6+Math.cos(a)*0.65,0);
        stripe.rotation.z=a; g.add(stripe);
      }
      // Cyan glow aura around hub
      const aura=new THREE.Mesh(new THREE.SphereGeometry(0.5,8,6),new THREE.MeshBasicMaterial({color:0x44aaff,transparent:true,opacity:0.28}));
      aura.position.y=2.6; g.add(aura);
      // Ground glow disc
      const glow=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.7,0.05,12),new THREE.MeshBasicMaterial({color:0x44ccff,transparent:true,opacity:0.32}));
      glow.position.y=0.03; g.add(glow);
      return g;
    }
  },
];

/* ══════════════════════════════════════════
   GAME ENGINE
   ══════════════════════════════════════════ */
const Game = (() => {
  let renderer, scene, camera, clock;
  let running=false, paused=false, over=false;
  let score=0, ecoBar=0, streak=0, maxStreak=0, lives=3, distance=0;
  let speed=0, baseSpeed=0, frame=0, lvlIdx=0, lvlTriggered={};
  let runItems=0,runSolar=0,runTrees=0,runBins=0,runOAvoided=0,runOTotal=0;
  let pLane=1, pY=0, pVY=0, isJump=false, isSlide=false, slideT=0;
  let inv=false, invT=0, hitCD=0, camShake=0;
  let playerMesh=null;
  let segs=[], obs=[], eco=[], parts=[], floats=[];
  let _raf=null;

  /* ── INIT ── */
  let _webglOk = false;
  function init() {
    const cv = document.getElementById('gameCanvas');
    // Explicitly size the canvas to the window before creating renderer
    cv.width  = window.innerWidth;
    cv.height = window.innerHeight;
    let ctxAvailable = false;
    try {
      // Use preserveDrawingBuffer for WebView compatibility
      renderer = new THREE.WebGLRenderer({ canvas:cv, antialias:false, powerPreference:'default', preserveDrawingBuffer:true, alpha:false, failIfMajorPerformanceCaveat:false });
      ctxAvailable = !!renderer.getContext();
    } catch (e) {
      ctxAvailable = false;
    }
    if (!ctxAvailable) {
      // Signal to main.js that WebGL is unavailable — 2D fallback will handle
      _webglOk = false;
      return;
    }
    _webglOk = true;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    camera = new THREE.PerspectiveCamera(70,1,.1,220);
    clock  = new THREE.Clock();
    scene  = new THREE.Scene();
    _resize();
    window.addEventListener('resize', _resize);
    window.addEventListener('orientationchange', () => setTimeout(_resize, 200));
    _initSwipe();
    _initKeyboard();
  }

  function isWebGLOk() { return _webglOk; }

  function _showWebGLError() {
    const screen = document.getElementById('s-game');
    if (!screen) return;
    const existing = document.getElementById('webgl-error-overlay');
    if (existing) return;
    const overlay = document.createElement('div');
    overlay.id = 'webgl-error-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(5, 10, 15, 0.95)';
    overlay.style.color = '#fff';
    overlay.style.textAlign = 'center';
    overlay.style.padding = '24px';
    overlay.style.fontFamily = 'var(--fb), sans-serif';
    overlay.innerHTML = `
      <div style="max-width:380px;">
        <div style="font-size:1.5rem;font-weight:700;margin-bottom:14px;">Graphics unsupported</div>
        <div style="font-size:1rem;line-height:1.6;margin-bottom:20px;">Your phone's browser or WebView does not support WebGL, so the 3D game cannot run here. Try a newer phone browser, enable hardware acceleration, or run the game in a modern browser app.</div>
        <button style="background:#2ecc71;color:#051a08;padding:12px 18px;border:none;border-radius:14px;font-weight:700;cursor:pointer;" onclick="document.getElementById('webgl-error-overlay').remove();Nav.go('s-menu');">Back to Menu</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function _resize() {
    const w=window.innerWidth, h=window.innerHeight;
    renderer.setSize(w,h,false);
    if(camera){ camera.aspect=w/h; camera.updateProjectionMatrix(); }
  }

  /* ── START ── */
  function startFromMenu() { startLevel(1); }

  function startLevel(lvl) {
    lvl = Math.max(1,Math.min(3,lvl));
    lvlIdx = lvl-1;
    DataStore.d.level = lvl; DataStore.save();
    const cfg = LVLS[lvlIdx];
    score=0;ecoBar=0;streak=0;maxStreak=0;distance=0;frame=0;hitCD=0;
    // Use per-level difficulty settings: baseSpd and startLives defined in LVLS config
    lives = cfg.startLives || 3;
    baseSpeed = cfg.baseSpd || (10 + lvlIdx * 1.5);
    speed = baseSpeed;
    running=true;paused=false;over=false;lvlTriggered={};
    runItems=0;runSolar=0;runTrees=0;runBins=0;runOAvoided=0;runOTotal=0;
    pLane=1;pY=0;pVY=0;isJump=false;isSlide=false;slideT=0;
    inv=false;invT=0;camShake=0;
    segs=[];obs=[];eco=[];parts=[];floats=[];
    _buildScene(cfg);
    Nav.go('s-game');
    document.getElementById('ov-pause').classList.add('hidden');
    // Show swipe hint first time
    try {
      if (!localStorage.getItem('er_hint_shown')) {
        document.getElementById('swipe-hint').classList.remove('hidden');
        localStorage.setItem('er_hint_shown','1');
      }
    } catch(e) {
      document.getElementById('swipe-hint').classList.remove('hidden');
    }
    _updateHUD();
    SoundFX.startMusic();
    if(_raf) cancelAnimationFrame(_raf);
    clock.start();
    _raf = requestAnimationFrame(_loop);
  }

  /* ── SCENE ── */
  function _buildScene(cfg) {
    while(scene.children.length) scene.remove(scene.children[0]);
    scene.background = new THREE.Color(cfg.skyBot);
    scene.fog = new THREE.Fog(cfg.fog, cfg.fn, cfg.ff);
    scene.add(new THREE.AmbientLight(cfg.amb,1.3));
    const dl = new THREE.DirectionalLight(cfg.dir,2.6);
    dl.position.set(10,22,-10);dl.castShadow=true;
    dl.shadow.mapSize.set(1024,1024);
    dl.shadow.camera.left=-30;dl.shadow.camera.right=30;
    dl.shadow.camera.top=30;dl.shadow.camera.bottom=-30;dl.shadow.camera.far=130;
    scene.add(dl);
    scene.add(new THREE.HemisphereLight(cfg.hT,cfg.hB,.9));
    _buildSky(cfg);
    for(let i=0;i<SEGS;i++) _addSeg(i*SEG_LEN,cfg);
    _buildPlayer();
    camera.position.set(0,CAM_Y,CAM_Z);
    camera.lookAt(0,1.5,12);
  }

  function _buildSky(cfg) {
    const geo=new THREE.SphereGeometry(160,16,8); geo.scale(-1,1,1);
    const colors=[], pos=geo.attributes.position.array;
    const top=new THREE.Color(cfg.skyTop),bot=new THREE.Color(cfg.skyBot);
    for(let i=0;i<pos.length;i+=3){ const t=Math.max(0,Math.min(1,(pos[i+1]+160)/320)); const c=bot.clone().lerp(top,t); colors.push(c.r,c.g,c.b); }
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    scene.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false})));
  }

  function _addSeg(z,cfg) {
    cfg=cfg||LVLS[lvlIdx];
    const g=new THREE.Group(); g.position.z=z;
    const tr=new THREE.Mesh(new THREE.BoxGeometry(TRACK_W,.3,SEG_LEN),new THREE.MeshLambertMaterial({color:cfg.trk}));
    tr.position.y=-.15;tr.receiveShadow=true;g.add(tr);
    [-1,1].forEach(s=>{ const e=new THREE.Mesh(new THREE.BoxGeometry(.35,.42,SEG_LEN),new THREE.MeshLambertMaterial({color:cfg.edge})); e.position.set(s*(TRACK_W/2-.17),0,0);g.add(e); });
    [-1,1].forEach(s=>{ for(let i=0;i<5;i++){ const d=new THREE.Mesh(new THREE.BoxGeometry(.12,.02,1.3),new THREE.MeshBasicMaterial({color:0xffffff,opacity:.16,transparent:true})); d.position.set(s*3.5,.01,-SEG_LEN/2+2+i*4.2);g.add(d); } });
    [-1,1].forEach(s=>{ const ex=new THREE.Mesh(new THREE.PlaneGeometry(32,SEG_LEN),new THREE.MeshLambertMaterial({color:cfg.gnd})); ex.rotation.x=-Math.PI/2;ex.position.set(s*(TRACK_W/2+16),-.22,0);ex.receiveShadow=true;g.add(ex); });
    _addProps(g,cfg);
    scene.add(g);
    segs.push({mesh:g,z});
  }

  function _addProps(g,cfg) {
    [-1,1].forEach(side=>{
      const n=2+Math.floor(Math.random()*2);
      for(let i=0;i<n;i++){
        const h=3+Math.random()*9,w=2+Math.random()*3,d=2+Math.random()*3;
        const col=cfg.builds[Math.floor(Math.random()*cfg.builds.length)];
        const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col}));
        m.castShadow=true; m.position.set(side*(TRACK_W/2+4+Math.random()*9),h/2-.2,-SEG_LEN/2+Math.random()*SEG_LEN);
        _addWins(m,w,h,d); g.add(m);
        if(lvlIdx===2&&Math.random()>.5){ const p=new THREE.Mesh(new THREE.BoxGeometry(w*.8,.14,d*.8),new THREE.MeshLambertMaterial({color:0x1a3a6a})); p.position.set(m.position.x,h+.07,m.position.z);g.add(p); }
      }
      if(lvlIdx>=1){ const tc=2+Math.floor(Math.random()*4); for(let i=0;i<tc;i++){ const t=_mkTree(); t.position.set(side*(TRACK_W/2+1.5+Math.random()*5),0,-SEG_LEN/2+Math.random()*SEG_LEN); g.add(t); } }
    });
  }

  function _addWins(b,w,h,d){ const rows=Math.floor(h/1.55),cols=Math.floor(w/1.2); for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(Math.random()>.5){ const wn=new THREE.Mesh(new THREE.PlaneGeometry(.38,.48),new THREE.MeshBasicMaterial({color:0xffee88,opacity:.55+Math.random()*.4,transparent:true})); wn.position.set(-w/2+.6+c*1.1,-h/2+.8+r*1.4,d/2+.01);b.add(wn); } }

  function _mkTree(){ const g=new THREE.Group(); const tr=new THREE.Mesh(new THREE.CylinderGeometry(.13,.17,1.2,6),new THREE.MeshLambertMaterial({color:0x5c3d1a})); tr.position.y=.6;tr.castShadow=true;g.add(tr); [0x2d6a4f,0x3a8c5f,0x52b788,0x1a5c3a].forEach((col,i)=>{ const t=new THREE.Mesh(new THREE.ConeGeometry(.92-.2*(i%2),1.25,7),new THREE.MeshLambertMaterial({color:col})); t.position.y=1.5+i*.5;t.castShadow=true;g.add(t); }); return g; }

  function _buildPlayer(){
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(.62,.92,.36),new THREE.MeshLambertMaterial({color:0x2ecc71})); body.position.y=.82;body.castShadow=true;g.add(body);
    const head=new THREE.Mesh(new THREE.BoxGeometry(.46,.46,.46),new THREE.MeshLambertMaterial({color:0xf4a460})); head.position.y=1.52;head.castShadow=true;g.add(head);
    ['legL','legR'].forEach((n,i)=>{ const l=new THREE.Mesh(new THREE.BoxGeometry(.22,.56,.26),new THREE.MeshLambertMaterial({color:0x1a5c3a})); l.position.set(i===0?-.15:.15,.28,0);l.castShadow=true;l.name=n;g.add(l); });
    ['armL','armR'].forEach((n,i)=>{ const a=new THREE.Mesh(new THREE.BoxGeometry(.2,.56,.2),new THREE.MeshLambertMaterial({color:0x2ecc71})); a.position.set(i===0?-.44:.44,.82,0);a.castShadow=true;a.name=n;g.add(a); });
    const bp=new THREE.Mesh(new THREE.BoxGeometry(.4,.52,.2),new THREE.MeshLambertMaterial({color:0x1a8f4e})); bp.position.set(0,.86,-.28);g.add(bp);
    const hat=new THREE.Mesh(new THREE.BoxGeometry(.54,.13,.54),new THREE.MeshLambertMaterial({color:0x27ae60})); hat.position.set(0,1.78,0);g.add(hat);
    g.position.set(LANE_X[1],0,4);
    scene.add(g); playerMesh=g;
  }

  /* ── LOOP ── */
  function _loop() {
    _raf=requestAnimationFrame(_loop);
    if(!running||over||paused){ renderer.render(scene,camera); return; }
    const dt=Math.min(clock.getDelta()*60,4);
    frame++;
    _update(dt);
    renderer.render(scene,camera);
  }

  /* ── UPDATE ── */
  function _update(dt) {
    speed=Math.min(baseSpeed+score*.004,30);
    const mv=speed*dt*.065;
    score+=.1*dt*(speed/baseSpeed);
    distance+=mv*10;
    if(hitCD>0) hitCD-=dt;
    if(inv){ invT-=dt; if(invT<=0) inv=false; }
    if(camShake>0) camShake-=dt*.18;

    // Player X
    const tx=LANE_X[pLane];
    playerMesh.position.x+=(tx-playerMesh.position.x)*.17*dt;
    playerMesh.rotation.z+=(-(tx-playerMesh.position.x)*.3-playerMesh.rotation.z)*.12*dt;

    // Jump/gravity
    if(isJump){ pVY-=GRAV*dt; pY+=pVY; if(pY<=0){ pY=0;isJump=false;pVY=0; SoundFX.play('land'); _spawnParts(playerMesh.position.clone().setY(.1),0x74c69d,5); } }
    playerMesh.position.y=pY;

    // Slide
    if(isSlide){ slideT-=dt; if(slideT<=0) isSlide=false; }

    // Animate player
    _animPlayer(dt);

    // Smooth third-person camera follow
    const camTargetX = playerMesh.position.x;
    const camTargetY = CAM_Y + Math.max(0, pY * 0.28);
    const camTargetZ = playerMesh.position.z - 9;
    camera.position.x += (camTargetX - camera.position.x) * 0.14 * dt;
    camera.position.y += (camTargetY - camera.position.y) * 0.1 * dt;
    camera.position.z += (camTargetZ - camera.position.z) * 0.08 * dt;
    camera.lookAt(playerMesh.position.x, 1.6 + Math.max(0, pY * 0.28), playerMesh.position.z + 13);

    // Scroll track
    const cfg=LVLS[lvlIdx];
    segs.forEach(s=>{s.mesh.position.z-=mv;s.z-=mv;});
    segs=segs.filter(s=>{ if(s.z<-SEG_LEN*2){scene.remove(s.mesh);return false;} return true; });
    while(segs.length<SEGS){ const lz=segs.length?Math.max(...segs.map(s=>s.z)):0; _addSeg(lz+SEG_LEN,cfg); }

    // Obstacles — interval uses per-level config (obsInt), narrows as score rises
    const oi=Math.max(40, LVLS[lvlIdx].obsInt - score * 0.04);
    if(frame%Math.floor(oi)===0) _spawnObs();
    obs.forEach(o=>{
      o.mesh.position.z-=mv; o.z-=mv;
      o.mesh.traverse(child=>{
        if(child.name==='smoke'){child.position.y+=Math.sin(frame*.05)*.03;child.scale.setScalar(1+Math.sin(frame*.08)*.14);}
        if(child.name==='flame'){child.scale.y=.8+Math.sin(frame*.15+child.position.x)*.28;child.rotation.y+=.05*dt;}
      });
      if(!inv&&hitCD<=0&&!o.hit&&_collO(o)){o.hit=true;runOTotal++;_takeHit(o.mesh.position);}
      else if(o.z<-5&&!o.hit){runOAvoided++;streak++;maxStreak=Math.max(maxStreak,streak);}
    });
    obs=obs.filter(o=>{ if(o.z<-8||o.hit){scene.remove(o.mesh);return false;} return true; });

    // Eco items
    if(frame%88===0) _spawnEco();
    eco.forEach(item=>{
      item.mesh.position.z-=mv; item.z-=mv;
      item.mesh.position.y=item.fy+Math.sin(frame*.06+item.bob)*.19;
      item.mesh.rotation.y+=.032*dt;
      if(!item.collected&&_collI(item)){
        item.collected=true;
        score+=item.pts; ecoBar=Math.min(ecoBar+item.eco*2,100);
        runItems++;
        if(item.type==='solar') runSolar++;
        if(item.type==='tree') runTrees++;
        if(item.type==='bin') runBins++;
        SoundFX.play('collect');
        _spawnParts(item.mesh.position.clone(),0x2ecc71,8);
        _spawnFloat(item.mesh.position.clone(),`+${item.pts}`);
      }
    });
    eco=eco.filter(i=>{ if(i.z<-8||i.collected){scene.remove(i.mesh);return false;} return true; });

    // Particles
    parts.forEach(p=>{ p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt; p.vy-=.005*dt;p.life-=dt; p.mesh.material.opacity=Math.max(0,p.life/p.ml); });
    parts=parts.filter(p=>{ if(p.life<=0){scene.remove(p.mesh);return false;} return true; });

    // Float texts
    floats.forEach(f=>{ f.sp.position.y+=f.vy*dt;f.life-=dt; f.sp.material.opacity=Math.max(0,f.life/f.ml); });
    floats=floats.filter(f=>{ if(f.life<=0){scene.remove(f.sp);return false;} return true; });

    // Camera
    const sh=camShake>0?(Math.random()-.5)*camShake*.08:0;
    camera.position.x+=(playerMesh.position.x+sh-camera.position.x)*.09*dt;
    camera.position.y=CAM_Y+sh*.4;
    camera.position.z=CAM_Z;
    camera.lookAt(playerMesh.position.x,1.5,12);

    _checkLevel();
    _updateHUD();
  }

  function _animPlayer(dt){
    playerMesh.scale.y+=(isSlide?.55:1-playerMesh.scale.y)*.16*dt;
    playerMesh.visible=!inv||(Math.floor(frame/4)%2===0);
    const ll=playerMesh.getObjectByName('legL'),lr=playerMesh.getObjectByName('legR');
    if(ll&&lr&&!isJump){ll.rotation.x=Math.sin(frame*.26)*.62;lr.rotation.x=-Math.sin(frame*.26)*.62;}
    const al=playerMesh.getObjectByName('armL'),ar=playerMesh.getObjectByName('armR');
    if(al&&ar){al.rotation.x=-Math.sin(frame*.26)*.52;ar.rotation.x=Math.sin(frame*.26)*.52;}
    if(!isJump&&!isSlide) playerMesh.position.y=pY+Math.abs(Math.sin(frame*.26))*.07;
  }

  function _collO(o){ const px=playerMesh.position.x,pz=playerMesh.position.z||4; if(Math.abs(px-o.mesh.position.x)>o.w/2+.15) return false; if(Math.abs(pz-o.mesh.position.z)>1.6) return false; if(o.jmp&&pY>1.0) return false; if(o.sld&&isSlide&&o.fy>.5) return false; return true; }
  function _collI(i){ return Math.abs(playerMesh.position.x-i.mesh.position.x)<1.25&&Math.abs((playerMesh.position.z||4)-i.mesh.position.z)<1.5; }

  function _takeHit(pos){
    lives--;streak=0;inv=true;invT=120;camShake=8;hitCD=30;
    SoundFX.play('hit');
    vibrate([50,30,80]);
    _spawnParts(pos,0xe63946,12);
    _updateHUD();
    if(lives<=0){over=true;SoundFX.play('gameover');setTimeout(_gameOver,700);}
  }

  function _spawnObs(){ const lane=Math.floor(Math.random()*3),def=OBS[Math.floor(Math.random()*OBS.length)],mesh=def.mk(); mesh.position.set(LANE_X[lane],def.fy,4+SEG_LEN*(SEGS-2)); scene.add(mesh); obs.push({mesh,lane,z:4+SEG_LEN*(SEGS-2),w:def.w,h:def.h,jmp:def.jmp,sld:def.sld,fy:def.fy,hit:false}); }
  function _spawnEco(){ const lane=Math.floor(Math.random()*3),def=ECO[Math.floor(Math.random()*ECO.length)],mesh=def.mk(); const fy=Math.random()<.3?1.5:0; mesh.position.set(LANE_X[lane],fy,4+SEG_LEN*(SEGS-1)); scene.add(mesh); eco.push({mesh,lane,z:4+SEG_LEN*(SEGS-1),pts:def.pts,eco:def.eco,type:def.type,fy,bob:Math.random()*Math.PI*2,collected:false}); }

  function _spawnParts(pos,color,count){ for(let i=0;i<count;i++){ const geo=new THREE.SphereGeometry(.12,4,3),mat=new THREE.MeshBasicMaterial({color,transparent:true}),mesh=new THREE.Mesh(geo,mat); mesh.position.copy(pos);scene.add(mesh); const a=Math.random()*Math.PI*2,e=(Math.random()-.3)*Math.PI,s=.12+Math.random()*.18; parts.push({mesh,vx:Math.cos(a)*Math.cos(e)*s,vy:Math.sin(e)*s+.08,vz:Math.sin(a)*Math.cos(e)*s,life:40+Math.random()*20,ml:60}); } }

  function _spawnFloat(pos,text){ const cv=document.createElement('canvas');cv.width=200;cv.height=56; const cx=cv.getContext('2d');cx.font='bold 32px Orbitron,monospace';cx.fillStyle='#2ecc71';cx.textAlign='center';cx.textBaseline='middle';cx.shadowColor='#2ecc71';cx.shadowBlur=10;cx.fillText(text,100,28); const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthTest:false})); sp.scale.set(2.8,.78,1);sp.position.copy(pos);sp.position.y+=1.8;scene.add(sp); floats.push({sp,vy:.042,life:55,ml:55}); }

  function _checkLevel(){
    // Check if player has reached the score target for the current level
    const target = LVLS[lvlIdx].scoreTarget;
    if(!lvlTriggered['complete'] && score >= target){
      lvlTriggered['complete'] = true;
      over = true; // stop further gameplay immediately
      SoundFX.play('levelup');
      setTimeout(_levelComplete, 800);
    }
  }

  function _levelComplete(){
    if(_raf) cancelAnimationFrame(_raf);
    running = false;
    SoundFX.stopMusic();
    const sc = Math.floor(score);
    const acc = runOTotal > 0 ? Math.round((runOAvoided / (runOTotal + runOAvoided)) * 100) : 98;
    const bonus = Math.floor(ecoBar) * 5;
    const levelNum = lvlIdx + 1;
    const run = { score:sc, items:runItems, streak:maxStreak, solar:runSolar, trees:runTrees, bins:runBins, levelReached:levelNum, accuracy:acc, bonus, gameOver:false };
    DataStore.mergeRun(run);
    const newB = DataStore.checkAchievements();
    LCScreen.show({...run, newBadge:newB.length ? newB[newB.length-1].badge : null});
  }

  function _updateHUD(){
    document.getElementById('h-score').textContent=Math.floor(score).toLocaleString();
    document.getElementById('h-streak').textContent=streak+'x';
    document.getElementById('h-world').textContent=LVLS[lvlIdx].name;
    document.getElementById('h-ecofill').style.width=ecoBar+'%';
    // Show difficulty label in HUD if element exists
    const diffEl=document.getElementById('h-diff');
    if(diffEl) diffEl.textContent=LVLS[lvlIdx].diff;
    const l=document.getElementById('h-lives');l.innerHTML='';const maxLives=LVLS[lvlIdx].startLives||3;for(let i=0;i<maxLives;i++) l.innerHTML+=i<lives?'💚':'🖤';
    // Level progress bar
    const lvlNumEl=document.getElementById('h-lvlnum');
    const lvlFillEl=document.getElementById('h-lvlfill');
    if(lvlNumEl) lvlNumEl.textContent=lvlIdx+1;
    if(lvlFillEl){ const pct=Math.min(100,Math.floor((score/LVLS[lvlIdx].scoreTarget)*100)); lvlFillEl.style.width=pct+'%'; }
  }

  function _gameOver(){
    if(_raf) cancelAnimationFrame(_raf);
    running=false;
    SoundFX.stopMusic();
    const sc=Math.floor(score);
    const acc=runOTotal>0?Math.round((runOAvoided/(runOTotal+runOAvoided))*100):98;
    const bonus=Math.floor(ecoBar)*5;
    // Game Over: retry = reload the CURRENT level (not Level 1)
    // currentLevel is stored so the Retry button knows which level to restart
    const run={score:sc,items:runItems,streak:maxStreak,solar:runSolar,trees:runTrees,bins:runBins,levelReached:lvlIdx+1,accuracy:acc,bonus,gameOver:true,currentLevel:lvlIdx+1};
    DataStore.mergeRun(run);
    const newB=DataStore.checkAchievements();
    LCScreen.show({...run,newBadge:newB.length?newB[newB.length-1].badge:null});
  }

  /* ── ACTIONS ── */
  function _doLeft(){  if(!running||paused||over) return; const prev=pLane; pLane=Math.max(0,pLane-1); if(pLane!==prev) SoundFX.play('lane'); }
  function _doRight(){ if(!running||paused||over) return; const prev=pLane; pLane=Math.min(2,pLane+1); if(pLane!==prev) SoundFX.play('lane'); }
  function _doJump(){  if(!running||paused||over) return; if(!isJump){isJump=true;pVY=JUMP_VY;SoundFX.play('jump');} }
  function _doSlide(){ if(!running||paused||over) return; if(!isJump){isSlide=true;slideT=40;SoundFX.play('slide');} }

  /* ── SWIPE INPUT (mobile) ── */
  function _initSwipe(){
    const zone = document.getElementById('swipe-zone');
    let sx=0,sy=0,st=0;
    const MIN_SWIPE=40, MAX_TIME=500;

    function resetSwipe(){ st = 0; }
    function handleSwipeEnd(x, y){
      if(!running||paused||over||!st) return;
      const dt = Date.now() - st;
      resetSwipe();
      if(dt > MAX_TIME) return; // too slow = no swipe
      const dx = x - sx;
      const dy = y - sy;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if(adx < MIN_SWIPE) return; // too short horizontally
      // Only respond if horizontal swipe dominates (ignore vertical-heavy swipes)
      if(adx < ady * 0.6) return;
      if(dx > 0) _doRight(); else _doLeft();
    }

    zone.addEventListener('touchstart',e=>{
      if(!running||paused||over) return;
      e.preventDefault();
      const touch = e.touches[0];
      sx = touch.clientX; sy = touch.clientY; st = Date.now();
    },{passive:false});

    const swipeEnd = e => {
      if(!running||paused||over) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      handleSwipeEnd(touch.clientX, touch.clientY);
    };

    document.addEventListener('touchend', swipeEnd, {passive:false});
    document.addEventListener('touchcancel', resetSwipe, {passive:false});

    // Prevent scroll when game is active
    zone.addEventListener('touchmove',e=>{ if(running&&!paused&&!over) e.preventDefault(); },{passive:false});
  }

  /* ── KEYBOARD (desktop) ── */
  function _initKeyboard(){
    const keys={};
    document.addEventListener('keydown',e=>{
      if(keys[e.code]) return; keys[e.code]=true;
      if(!running||paused||over){ if(e.code==='Escape'&&paused) resume(); return; }
      if(e.code==='ArrowLeft'||e.code==='KeyA') _doLeft();
      if(e.code==='ArrowRight'||e.code==='KeyD') _doRight();
      if(e.code==='Escape'){ if(paused) resume(); else pause(); }
    });
    document.addEventListener('keyup',e=>{ keys[e.code]=false; });
  }

  /* ── PUBLIC API ── */
  function pause(){
    if(over||!running) return;
    paused=true;
    SoundFX.stopMusic();
    document.getElementById('ov-pause').classList.remove('hidden');
  }
  function resume(){
    paused=false;
    SoundFX.startMusic();
    document.getElementById('ov-pause').classList.add('hidden');
    clock.start();
  }
  // restart() = replay current level from pause menu (lvlIdx is 0-based, lvlIdx+1 = current level number)
  function restart(){ document.getElementById("ov-pause").classList.add("hidden"); startLevel(lvlIdx+1); }
  function quit(){ if(_raf) cancelAnimationFrame(_raf); running=false;paused=false; SoundFX.stopMusic(); Nav.go('s-menu'); MenuScreen.refresh(); }
  // nextLevel() = advance one level (clamped to 3) — was broken (called quit)
  function nextLevel(){ startLevel(Math.min(3, lvlIdx + 2)); }

  return { init, startFromMenu, startLevel, pause, resume, restart, quit, nextLevel, isWebGLOk };
})();
window.Game = Game;
