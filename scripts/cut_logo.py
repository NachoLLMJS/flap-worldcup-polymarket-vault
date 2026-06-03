from rembg import remove
from PIL import Image

inp = Image.open("public/hero/logo-src.png")
out = remove(inp)
out.save("public/hero/logo-cut.png")
print("cut OK", out.size)
