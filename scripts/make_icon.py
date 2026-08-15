from PIL import Image, ImageDraw

SIZE = 512
img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# Dark rounded-square background (like the gold/black palette)
d.rounded_rectangle([20, 20, SIZE - 20, SIZE - 20], radius=110, fill=(28, 28, 30, 255))

# Envelope body (white)
cx, cy = SIZE / 2, SIZE / 2
w, h = 250, 180
x0, y0 = cx - w / 2, cy - h / 2 + 20
d.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=22, fill=(255, 255, 255, 255))
# Flap
d.polygon([(x0, y0), (cx, y0 + h * 0.55), (x0 + w, y0)], fill=(230, 230, 232, 255))
# Gold accent line
d.line([(x0 + 8, y0 + 6), (x0 + w - 8, y0 + 6)], fill=(201, 145, 59, 255), width=8)

img.save('/home/ubuntu/email-sender-desktop/assets/icon.png')
img.resize((256, 256), Image.LANCZOS).save('/home/ubuntu/email-sender-desktop/assets/icon256.png')
img.resize((128, 128), Image.LANCZOS).save('/home/ubuntu/email-sender-desktop/assets/icon128.png')
print('done')
