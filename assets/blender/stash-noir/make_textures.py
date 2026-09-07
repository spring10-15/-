from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math, random
random.seed(17)
out=Path(__file__).resolve().parent/'textures'; out.mkdir(exist_ok=True)
font='/System/Library/Fonts/Supplemental/Georgia.ttf'
def f(n): return ImageFont.truetype(font,n)
def guilloche(d,cx,cy,rx,ry,color):
    for k in range(9):
        pts=[]
        for i in range(721):
            a=i*math.pi/360
            r=1+.08*math.sin(a*36+k*.45)
            pts.append((cx+(rx-k*3)*r*math.cos(a),cy+(ry-k*2)*r*math.sin(a)))
        d.line(pts,fill=color,width=1)
def save(im,name):
    im.save(out/name)
im=Image.new('RGB',(1200,520),(204,197,155));d=ImageDraw.Draw(im)
for i in range(22000):
    x=random.randrange(1200);y=random.randrange(520);v=random.randrange(-20,16)
    d.point((x,y),fill=(204+v,197+v,155+v))
ink=(52,65,44)
for inset in [18,23,32,41,48]:d.rectangle((inset,inset,1200-inset,520-inset),outline=ink,width=2)
for x in range(60,1150,11):
    d.line((x,48,x+30,80),fill=ink)
    d.line((x,440,x+30,472),fill=ink)
guilloche(d,600,266,158,177,ink)
# fictional engraved medallion portrait
for i in range(45):
    yy=145+i*5; w=65*math.sqrt(max(0,1-((yy-260)/126)**2))
    d.line((600-w,yy,600+w,yy-9),fill=(88,90,57),width=2)
d.ellipse((559,167,640,285),fill=(125,128,85),outline=ink,width=3)
d.polygon([(560,277),(635,277),(682,351),(516,351)],fill=(98,107,69))
d.line([(581,196),(615,189),(625,229),(610,235),(625,250),(597,257)],fill=ink,width=3)
for x in (145,1055):
    for y in (125,391):
        guilloche(d,x,y,91,48,ink)
        d.text((x,y),'100',font=f(48),fill=ink,anchor='mm')
d.text((600,91),'THE NOIR RESERVE',font=f(39),anchor='mm',fill=ink)
d.text((600,407),'ONE HUNDRED DOLLARS',font=f(30),anchor='mm',fill=ink)
d.text((304,237),'N 031907 A',font=f(21),anchor='mm',fill=ink)
d.text((897,273),'N 031907 A',font=f(21),anchor='mm',fill=ink)
d.text((310,300),'TAVERN / 1927',font=f(17),anchor='mm',fill=ink)
d.text((898,176),'100',font=f(61),anchor='mm',fill=ink)
d.text((600,457),'FICTIONAL GAME CURRENCY',font=f(15),anchor='mm',fill=ink)
save(im,'banknote.png')
for name,title in [('card-back.png','NOIR'),('plaque.png','GOLDEN RESERVE')]:
    w,h=(620,900) if name.startswith('card') else (1200,530)
    im=Image.new('RGB',(w,h),(49,35,19));d=ImageDraw.Draw(im);gold=(188,151,82)
    for inset in (15,22,36,45):d.rounded_rectangle((inset,inset,w-inset,h-inset),radius=15,outline=gold,width=3)
    for x in range(65,w-55,28):
        for y in range(65,h-55,28):
            d.line([(x,y-8),(x+8,y),(x,y+8),(x-8,y),(x,y-8)],fill=(112,85,42),width=1)
    guilloche(d,w/2,h/2,w*.33,h*.32,gold)
    d.rectangle((w*.12,h*.40,w*.88,h*.60),fill=(49,35,19))
    d.text((w/2,h/2),title,font=f(66 if name.startswith('card') else 63),anchor='mm',fill=(227,202,133))
    d.text((w/2,h*.67),'PRIVATE CLUB' if name.startswith('card') else '1 0 0 0',font=f(23),anchor='mm',fill=gold)
    save(im,name)
