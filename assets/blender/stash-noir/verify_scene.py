import bpy, json
from pathlib import Path
out=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(out/'stash-noir.blend'))
s=bpy.context.scene
images=[i for i in bpy.data.images if i.source=='FILE']
report={'blender_version':bpy.app.version_string,'objects':len(s.objects),'meshes':sum(o.type=='MESH' for o in s.objects),'collections':[c.name for c in s.collection.children],'camera':s.camera.name if s.camera else None,'packed_images':{i.name:bool(i.packed_file) for i in images},'engine':s.render.engine,'resolution':[s.render.resolution_x,s.render.resolution_y,s.render.resolution_percentage]}
assert s.camera and len(s.objects)>100
assert len(images)==3 and all(i.packed_file for i in images)
assert bpy.data.objects.get('LID • rotate X to open / close')
(out/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('VERIFIED',json.dumps(report,ensure_ascii=False))
