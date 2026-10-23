from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1] / "client" / "public"
ROOT.mkdir(parents=True, exist_ok=True)

width, height = 1200, 630
image = Image.new("RGB", (width, height))
pixels = image.load()
start = (16, 45, 32)
end = (23, 99, 66)
for y in range(height):
    for x in range(width):
        t = min(1, (x / width * 0.55 + y / height * 0.45))
        pixels[x, y] = tuple(round(start[i] * (1 - t) + end[i] * t) for i in range(3))

draw = ImageDraw.Draw(image, "RGBA")
for radius in range(330, 0, -3):
    alpha = max(0, int(5 * (1 - radius / 330)))
    draw.ellipse((1030 - radius, 140 - radius, 1030 + radius, 140 + radius), fill=(114, 195, 139, alpha))

regular = "/System/Library/Fonts/Supplemental/Arial.ttf"
bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
draw.rounded_rectangle((78, 76, 150, 148), radius=20, fill=(244, 255, 246))
draw.text((93, 89), "L", font=ImageFont.truetype(bold, 43), fill=(23, 99, 66))
draw.ellipse((129, 127, 140, 138), fill=(104, 189, 131))
draw.text((174, 94), "LDC Practice", font=ImageFont.truetype(bold, 26), fill=(239, 251, 241))
draw.text((80, 227), "KERALA PSC · LOWER DIVISION CLERK", font=ImageFont.truetype(bold, 25), fill=(184, 229, 194))
draw.text((76, 300), "Kerala PSC LDC", font=ImageFont.truetype(bold, 62), fill=(255, 255, 255))
draw.text((76, 375), "Exam Practice", font=ImageFont.truetype(bold, 62), fill=(255, 255, 255))
draw.text((80, 456), "Previous-year questions · Topic practice · Mock exams", font=ImageFont.truetype(regular, 28), fill=(212, 239, 218))
draw.rounded_rectangle((80, 548, 372, 553), radius=3, fill=(158, 226, 174))
image.save(ROOT / "og-image.png", optimize=True)

size = 192
icon = Image.new("RGB", (size, size), (23, 99, 66))
icon_draw = ImageDraw.Draw(icon)
icon_draw.rounded_rectangle((30, 30, 162, 162), radius=38, fill=(244, 255, 246))
icon_draw.text((49, 43), "L", font=ImageFont.truetype(bold, 86), fill=(23, 99, 66))
icon_draw.ellipse((123, 119, 143, 139), fill=(104, 189, 131))
icon.save(ROOT / "icons" / "maskable-192.png", optimize=True)
