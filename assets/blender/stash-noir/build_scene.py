"""Run: Blender --background --python build_scene.py. All assets are packed."""
import bpy, math, random, os, json
from pathlib import Path
from mathutils import Vector
random.seed(29)
OUT=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
    if c.name!='Collection': bpy.data.collections.remove(c)
base=bpy.data.collections.get('Collection');base.name='00 • Studio'
COL=base
def collection(name):
    global COL
    COL=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(COL)
def put(o,name,mat=None):
    o.name=name
    for c in list(o.users_collection):c.objects.unlink(o)
    COL.objects.link(o)
    if mat:o.data.materials.append(mat)
    return o
def mat(name,color,metal=0,rough=.5,noise=0,scale=80):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if noise:
        t=n.new('ShaderNodeTexNoise');t.inputs['Scale'].default_value=scale;t.inputs['Detail'].default_value=3
        b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=noise;b.inputs['Distance'].default_value=.018;l.new(t.outputs['Fac'],b.inputs['Height']);l.new(b.outputs['Normal'],p.inputs['Normal'])
        r=n.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.18;r.color_ramp.elements[0].color=(*(v*.4 for v in color),1);r.color_ramp.elements[1].position=.83;r.color_ramp.elements[1].color=(*(min(v*1.45,1) for v in color),1);l.new(t.outputs['Fac'],r.inputs[0]);l.new(r.outputs[0],p.inputs['Base Color'])
    return m
wood=mat('Walnut • long worn grain',(.23,.09,.032),rough=.36)
n=wood.node_tree.nodes;l=wood.node_tree.links;p=n.get('Principled BSDF');tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=4;tex.inputs['Detail'].default_value=5;tex.inputs['Roughness'].default_value=.7
coord=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(1.5,65,18);l.new(coord.outputs['Generated'],mapping.inputs[0]);l.new(mapping.outputs[0],tex.inputs['Vector'])
r=n.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.20;r.color_ramp.elements[0].color=(.036,.012,.005,1);r.color_ramp.elements[1].position=.8;r.color_ramp.elements[1].color=(.42,.20,.073,1);l.new(tex.outputs['Fac'],r.inputs[0]);l.new(r.outputs[0],p.inputs['Base Color']);b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.3;b.inputs['Distance'].default_value=.025;l.new(tex.outputs['Fac'],b.inputs['Height']);l.new(b.outputs[0],p.inputs['Normal'])
leather=mat('Oxblood leather • pebbled',(.075,.027,.013),rough=.46,noise=.4,scale=180)
lining=mat('Tobacco woven lining',(.22,.148,.073),rough=.88,noise=.55,scale=240)
brass=mat('Aged brass',(.43,.28,.10),.78,.31,.2,35)
gold=mat('Polished gold edges',(.66,.45,.17),.8,.23)
stitch=mat('Flax saddle stitching',(.40,.27,.13),rough=.9)
cream=mat('Ivory chip inlay',(.78,.70,.48),rough=.4)
paper=mat('Banknote cut edges',(.57,.56,.38),rough=.9,noise=.12,scale=200)
black=mat('Charcoal',(.015,.021,.020),rough=.37)
wall=mat('Blue charcoal plaster',(.027,.038,.038),rough=.9,noise=.3,scale=25)
silver=mat('Tarnished silver',(.47,.44,.35),.88,.3,.25,40)
pearl=mat('Warm pearl',(.84,.79,.64),.22,.23)
red=mat('Burgundy chips',(.33,.023,.015),rough=.42)
green=mat('Forest chips',(.025,.17,.066),rough=.43)
blue=mat('Navy chips',(.021,.06,.10),rough=.4)
yellow=mat('Ochre chips',(.53,.32,.03),rough=.42)
def cube(name,loc,size,material,bevel=.02):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=put(bpy.context.object,name,material);o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('Soft worn edges','BEVEL');m.width=bevel;m.segments=3
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o
def cyl(name,loc,r,depth,material,verts=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc);o=put(bpy.context.object,name,material);m=o.modifiers.new('Rim bevel','BEVEL');m.width=min(.008,depth*.2);m.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
def ball(name,loc,r,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=r,location=loc);o=put(bpy.context.object,name,material)
    for p in o.data.polygons:p.use_smooth=True
    return o
def path(name,pts,r,material,closed=False):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=12;c.bevel_depth=r;c.bevel_resolution=3
    s=c.splines.new('POLY');s.points.add(len(pts)-1)
    for p,co in zip(s.points,pts):p.co=(*co,1)
    s.use_cyclic_u=closed;o=bpy.data.objects.new(name,c);COL.objects.link(o);o.data.materials.append(material);return o
def ring(name,loc,r,minor,material,rotation=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=10,location=loc,major_radius=r,minor_radius=minor);o=put(bpy.context.object,name,material)
    if rotation:o.rotation_euler=rotation
    return o
def text(name,body,loc,size,material,rot=0):
    c=bpy.data.curves.new(name,'FONT');c.body=body;c.align_x='CENTER';c.align_y='CENTER';c.size=size;c.extrude=.0005;o=bpy.data.objects.new(name,c);COL.objects.link(o);o.location=loc;o.rotation_euler[2]=rot;c.materials.append(material);return o
def image_mat(file):
    m=mat(file,(1,1,1),rough=.67);n=m.node_tree.nodes;t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(OUT/'textures'/file));m.node_tree.links.new(t.outputs['Color'],n.get('Principled BSDF').inputs['Base Color']);return m
note=image_mat('banknote.png');card=image_mat('card-back.png');plaque=image_mat('plaque.png')
def face(name,x,y,z,w,h,material,angle=0):
    verts=[]
    for a,b in [(-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2)]:verts.append((x+a*math.cos(angle)-b*math.sin(angle),y+a*math.sin(angle)+b*math.cos(angle),z))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[(0,1,2,3)]);mesh.uv_layers.new()
    for i,uv in enumerate([(0,0),(1,0),(1,1),(0,1)]):mesh.uv_layers[0].data[i].uv=uv
    o=bpy.data.objects.new(name,mesh);COL.objects.link(o);mesh.materials.append(material);return o
collection('01 • Walnut desk')
for i in range(6):cube('Solid walnut plank %02d'%i,(0,-2.15+i*.82,-.12),(8.2,.812,.24),wood,.025)
for x in [-3.3,3.3]:
    for y in [-1.7,1.6]:cube('Tapered table leg',(x,y,-1.6),(.23,.23,3),wood)
cube('Front apron',(0,-2,-.4),(7.2,.16,.5),wood)
# Fine scratches and shallow nicks catch light across the desk.
wear=mat('Exposed walnut scratches',(.16,.085,.034),rough=.72)
for i in range(175):
    x=random.uniform(-3.8,3.8);y=random.uniform(-2.4,2.25);length=random.uniform(.015,.16)
    path('Desk wear',[(x,y,.002),(x+length,y+random.uniform(-.012,.012),.002)],random.uniform(.0008,.002),wear)
collection('02 • Open leather case')
cx=-1.5;cy=-.2;w=3.5;d=2.5;front=cy-d/2;back=cy+d/2
cube('Case base',(cx,cy,.12),(w,d,.24),leather,.09)
cube('Interior velvet tray',(cx,cy,.267),(w-.16,d-.16,.08),lining)
for x in [cx-w/2+.055,cx+w/2-.055]:cube('Side wall',(x,cy,.36),(.11,d,.43),leather,.035)
for y in [front+.045,back-.045]:cube('Case wall',(cx,y,.36),(w,.10,.43),leather,.035)
for z in [.19,.55]:
    pts=[(cx-w/2+.04,front+.02,z),(cx+w/2-.04,front+.02,z),(cx+w/2-.02,back-.02,z),(cx-w/2+.02,back-.02,z)]
    path('Piped leather rim',pts,.014,stitch,True)
for x in [-1.52,-.66]:cube('Tray partition',(x,cy,.36),(.055,d-.14,.18),leather,.012)
# articulated lid, parented to hinge at rear
hinge=bpy.data.objects.new('LID • rotate X to open / close',None);COL.objects.link(hinge);hinge.location=(cx,back,.48);hinge.rotation_euler[0]=math.radians(-12)
def lidcube(name,loc,sz,m,b=.02):
    o=cube(name,(0,0,0),sz,m,b);o.parent=hinge;o.location=loc;return o
lidcube('Lid leather shell',(0,.025,1.15),(w,.17,2.4),leather,.085)
lidcube('Lid woven inset',(0,-.074,1.15),(w-.23,.036,2.15),lining,.035)
for x in [-w/2+.06,w/2-.06]:lidcube('Lid raised frame',(x,-.09,1.15),(.07,.08,2.28),leather)
for z in [.06,2.3]:lidcube('Lid raised frame',(0,-.09,z),(w-.08,.08,.07),leather)
lidcube('Leather document pocket',(0,-.115,.53),(w-.35,.065,.7),leather,.04)
for x in [-.52,.52]:lidcube('Pocket division',(x,-.153,.51),(.014,.007,.61),stitch,.002)
for z in [1.7,2.04]:
    lidcube('Lid retaining strap',(0,-.139,z),(w-.16,.055,.15),leather)
    for x in [-1.2,1.2]:
        o=cyl('Brass strap rivet',(0,0,0),.052,.02,brass);o.parent=hinge;o.location=(x,-.18,z);o.rotation_euler[0]=math.pi/2
for z in [.22,.84,1.65,1.75,1.99,2.10]:
    for i in range(66):lidcube('Saddle stitch',(-1.53+i*.047,-.16,z),(.021,.006,.005),stitch,.001)
for x in [-2.6,-.38]:
    cube('Latch escutcheon',(x,front-.025,.35),(.39,.035,.21),brass,.015)
    o=cyl('Latch lock',(x,front-.053,.37),.065,.025,brass);o.rotation_euler[0]=math.pi/2
    cube('Key slot',(x,front-.07,.37),(.008,.007,.047),black,.001)
for x in [-2.1,-.91]:cube('Handle anchor',(x,front-.06,.23),(.16,.16,.13),brass)
path('Curved leather carrying handle',[(-2.1,front-.1,.24),(-2.08,front-.36,.15),(-1.96,front-.48,.12),(-1.75,front-.52,.11),(-1.26,front-.52,.11),(-1.02,front-.46,.13),(-.91,front-.1,.24)],.085,leather)
collection('03 • Banded cash bundles')
for row,y in enumerate([-.98,-.21,.56]):
    for layer in range(2 if row!=1 else 3):
        x=-2.39+random.uniform(-.025,.025);z=.32+layer*.092;a=random.uniform(-.022,.022)
        o=cube('Banknote bundle',(x,y,z+.04),(1.38,.61,.085),paper,.009);o.rotation_euler[2]=a
        for j in range(7):
            zz=z+.006+j*.010
            path('Cut paper layers',[(x-.68,y-.307,zz),(x+.68,y-.307,zz)],.0015,lining)
        face('Fictional engraved banknote',x,y,z+.084,1.36,.60,note,a)
        cube('Kraft currency band',(x,y,z+.088),(.20,.624,.009),cream,.001)
        text('Cash band mark','10,000',(x,y,z+.095),.059,lining,math.pi/2)
collection('04 • Casino chips')
for row,y in enumerate([-.99,-.49,.01,.51]):
    for col,x in enumerate([-1.29,-.91]):
        m=[blue,green,red,black,yellow,cream][(row+col*2)%6];count=random.randint(5,8)
        for j in range(count):
            z=.32+j*.036;xx=x+random.uniform(-.007,.007);yy=y+random.uniform(-.007,.007)
            cyl('Clay poker chip',(xx,yy,z),.172,.034,m,40)
            for k in range(8):
                a=k*math.tau/8+.11*col
                o=cube('Ivory edge insert',(xx+.160*math.cos(a),yy+.160*math.sin(a),z),(.036,.032,.027),cream,.002);o.rotation_euler[2]=a
        cyl('Chip ivory center',(xx,yy,z+.019),.12,.007,cream,40);ring('Chip embossed ring',(xx,yy,z+.024),.135,.004,gold)
        text('Chip denomination',str([100,25,5,50][row]),(xx,yy,z+.025),.067,m)
collection('05 • Personal valuables')
# silver cigarette case
cube('Silver cigarette case',(-.13,-.79,.39),(.70,.62,.15),silver,.055)
for x in [-.16,-.12,-.08]:cube('Engraved silver fluting',(x,-.79,.471),(.007,.51,.004),brass,.001)
# pearl necklace on tray
for i in range(49):
    a=i*math.tau/49;x=-.16+.43*math.cos(a);y=.17+.31*math.sin(a);ball('Pearl necklace', (x,y,.36),.036,pearl)
for i in range(19):
    a=i*math.tau/19;ball('Necklace inner loop',(-.14+.16*math.cos(a),.16+.115*math.sin(a),.36),.031,pearl)
ring('Necklace clasp',(.1,-.13,.36),.053,.012,silver)
cyl('Pocket watch body',(-.17,.71,.37),.238,.083,brass)
cyl('Ivory enamel watch dial',(-.17,.71,.415),.205,.01,cream)
ring('Watch bezel',(-.17,.71,.421),.216,.013,gold)
for i in range(12):
    a=i*math.tau/12
    text('Watch hour',str(i or 12),(-.17+.156*math.sin(a),.71+.156*math.cos(a),.426),.034,black)
path('Watch minute hand',[(-.17,.71,.431),(-.09,.84,.431)],.005,black)
path('Watch hour hand',[(-.17,.71,.433),(-.26,.75,.433)],.007,black)
ring('Watch bow',(-.17,.999,.385),.065,.013,brass)
collection('06 • Cards and gaming plaques')
for i in range(18):
    o=cube('Deck card %02d'%i,(.91,-.24,.016+i*.008),(.57,.84,.007),cream,.012);o.rotation_euler[2]=.10
face('Deck NOIR back',.91,-.24,.161,.53,.80,card,.10)
for x,y,a,z in [(1.87,.03,-.22,.032),(2.26,.30,-.42,.013)]:
    o=cube('Loose playing card',(x,y,z),(.57,.84,.012),cream,.016);o.rotation_euler[2]=a;face('Loose patterned card',x,y,z+.0065,.53,.80,card,a)
for x,y,a,z in [(2.40,-1.15,-.16,.037),(2.6,-.94,.06,.083)]:
    o=cube('Golden casino plaque',(x,y,z),(1.34,.55,.047),brass,.025);o.rotation_euler[2]=a;face('Engraved plaque face',x,y,z+.025,1.30,.51,plaque,a)
cyl('Dealer button',(1.25,-1.24,.065),.245,.09,black)
cyl('Dealer button ivory',(1.25,-1.24,.115),.208,.012,cream)
for i in range(8):
    a=i*math.tau/8;o=cube('Dealer edge block',(1.25+.216*math.cos(a),-1.24+.216*math.sin(a),.113),(.055,.066,.014),brass,.002);o.rotation_euler[2]=a
text('Dealer label','DEALER',(1.25,-1.24,.124),.083,black)
collection('07 • Brass desk lamp')
lx,ly=2.0,1.54
cyl('Lamp weighted base',(lx,ly,.07),.44,.14,brass)
cyl('Lamp base step',(lx,ly,.15),.31,.055,brass)
cyl('Lamp base plinth',(lx,ly,.20),.19,.06,gold)
path('Lamp slender stem',[(lx,ly,.20),(lx+.06,ly,1),(lx+.18,ly,2.05),(lx+.03,ly,2.21)],.034,brass)
ball('Lamp stem collar',(lx+.06,ly,1),.065,brass)
# lathed hollow shade, open bottom
verts=[];faces=[]
profile=[(.57,2.12),(.565,2.16),(.47,2.47),(.26,2.64),(.12,2.67),(.11,2.64),(.245,2.61),(.45,2.45),(.544,2.15),(.55,2.12)]
for r,z in profile:
    for i in range(96):
        a=i*math.tau/96;verts.append((lx+.03+r*math.cos(a),ly+r*math.sin(a),z))
for j in range(len(profile)-1):
    for i in range(96):faces.append((j*96+i,j*96+(i+1)%96,(j+1)*96+(i+1)%96,(j+1)*96+i))
mesh=bpy.data.meshes.new('Spun metal shade');mesh.from_pydata(verts,[],faces);o=bpy.data.objects.new('Hollow brass lamp shade',mesh);COL.objects.link(o);mesh.materials.append(brass);mesh.materials.append(cream)
for p in mesh.polygons:p.use_smooth=True;p.material_index=int(p.index//96>=5)
ring('Shade rolled lip',(lx+.03,ly,2.13),.557,.016,gold)
em=mat('Warm glowing bulb',(1,.72,.29),rough=.2);p=em.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.66,.25,1);p.inputs['Emission Strength'].default_value=5
ball('Visible warm bulb',(lx+.03,ly,2.23),.12,em)
cyl('Shade crown cap',(lx+.03,ly,2.663),.12,.026,brass)
collection('08 • Night room and rainy window')
cube('Left room wall',(-4.4,1,1.8),(.2,9,6),wall)
cube('Rear plaster wall',(0,3,1.75),(10,.22,6),wall)
for x in [-4,-2,0,2,4]:cube('Wall panel stile',(x,2.86,1),(.07,.09,2.5),wood)
for z in [-.3,.2,2.4]:cube('Wall panel rail',(0,2.86,z),(9,.09,.10),wood)
# window at right, lying in YZ plane
night=mat('Night outside',(.037,.071,.097),rough=.8)
cube('Night window opening',(4.12,.9,1.7),(.09,3.2,3.7),night)
for y in [-.73,2.53]:cube('Window vertical frame',(4.0,y,1.7),(.25,.13,3.9),wood)
for z in [-.16,1.7,3.6]:cube('Window horizontal frame',(4.,.9,z),(.25,3.4,.13),wood)
cube('Window sill',(3.93,.9,-.03),(.47,3.65,.13),wood)
rain=mat('Rain silver streaks',(.26,.36,.39),.28,.28)
for i in range(100):
    y=random.uniform(-.6,2.4);z=random.uniform(.1,3.5);length=random.uniform(.028,.16)
    path('Rain on glass',[(3.94,y,z),(3.94,y+.014,z-length)],.0018,rain)
# dim external architectural strips
for z in [.42,.63,2.42,2.56]:cube('Distant facade line',(4.055,.9,z),(.01,3.1,.025),black,0)
# radiator behind lamp
for i in range(11):cube('Cast iron radiator fin',(.46+i*.12,2.55,.66),(.085,.25,1.32),black,.04)
collection('09 • Camera and lighting')
def light(name,typ,loc,energy,color,size,target=None):
    data=bpy.data.lights.new(name,typ);data.energy=energy;data.color=color
    if typ=='AREA':data.shape='DISK';data.size=size
    else:data.shadow_soft_size=size
    o=bpy.data.objects.new(name,data);COL.objects.link(o);o.location=loc
    if target:o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o
light('Practical warm lamplight','AREA',(lx+.03,ly,2.13),165,(1,.68,.32),.53,(1,.1,0))
light('Bulb glow','POINT',(lx+.03,ly,2.19),25,(1,.63,.27),.12)
light('Soft amber camera bounce','AREA',(-1.5,-3.0,4.5),145,(1,.78,.52),4,(-1,0,.4))
light('Cool rainy window fill','AREA',(3.85,1.0,2.7),100,(.38,.56,.82),2.7,(-1,0,0))
bpy.ops.object.camera_add(location=(3.1,-8.8,7.8));cam=put(bpy.context.object,'Camera • reference composition');cam.rotation_euler=(Vector((-.25,.20,.72))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='PERSP';cam.data.lens=48;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=80;scene.cycles.use_denoising=True
scene.render.resolution_x=1408;scene.render.resolution_y=768;scene.render.resolution_percentage=100
scene.world.color=(.015,.015,.015)
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'preview.png')
# Open directly into material-preview camera composition.
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT')
scene['reference_note']='Reconstructed from a single supplied image. Hidden geometry inferred; fictional currency and card ornament.'
scene['asset_scope']='Editable still scene; no game integration or real-time optimization.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'stash-noir.blend'))
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'stash-noir.blend'))
print('SCENE_READY',len(scene.objects),flush=True)
bpy.ops.render.render(write_still=True)
print('RENDER_DONE',flush=True)
