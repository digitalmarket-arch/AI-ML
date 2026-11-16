#!/usr/bin/env python3
"""Make AI Marg's app icons in assets/icons/. Run:  python3 scripts/make-icons.py

The icons show the letters "AI" in a bold serif, haldi yellow (#f3b91d) on indigo (#2d388a), the colours of the
site's favicon. manifest.webmanifest lists three of them; index.html links apple-touch-icon.png; sw.js shows
icon-192.png and badge-96.png with each reminder.

  icon-192.png, icon-512.png  rounded square on a transparent background (the app icon on most phones)
  maskable-512.png            full square; the letters stay inside the middle 80% (the safe zone of Android's masks)
  apple-touch-icon.png        180 px full square with no transparency (iPhone and iPad round the corners themselves)
  badge-96.png                white letters on transparent (Android's status bar uses only the shape)

Needs Pillow (pip install pillow) and a bold serif font: DejaVu Serif Bold, Liberation Serif Bold or FreeSerif Bold
is found by itself; ICON_FONT=/path/to/font.ttf picks another.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = os.path.join(ROOT, 'assets', 'icons')
INDIGO = (0x2D, 0x38, 0x8A)
HALDI = (0xF3, 0xB9, 0x1D)
WHITE = (0xFF, 0xFF, 0xFF)
TEXT = 'AI'
SS = 4  # each icon is drawn 4 times larger, then scaled down, for smooth edges
FONTS = [
    os.environ.get('ICON_FONT', ''),
    '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSerif-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf',
    '/Library/Fonts/DejaVuSerif-Bold.ttf',
    'C:/Windows/Fonts/georgiab.ttf',
]


def font_file():
    for f in FONTS:
        if f and os.path.isfile(f):
            return f
    sys.exit('No bold serif font found. Install DejaVu Serif (fonts-dejavu) or set ICON_FONT=/path/to/font.ttf')


def letters(big, box_w, box_h, gap):
    """The letters as a mask (mode L) of big x big pixels: as large as fits box_w x box_h (fractions of the side),
    with gap (a fraction of the letter height) between A and I, and their ink centred."""
    path = font_file()

    def ink(size):
        f = ImageFont.truetype(path, size)
        parts = []
        for ch in TEXT:
            m = Image.new('L', (size * 2, size * 2), 0)
            ImageDraw.Draw(m).text((size // 2, size // 2), ch, font=f, fill=255)
            parts.append(m.crop(m.getbbox()))
        h = max(p.height for p in parts)
        space = int(round(gap * h))
        w = sum(p.width for p in parts) + space * (len(parts) - 1)
        out = Image.new('L', (w, h), 0)
        x = 0
        for p in parts:
            out.paste(p, (x, h - p.height))  # both letters stand on the same baseline (they are both capitals)
            x += p.width + space
        return out

    ref = ink(1000)
    scale = min(box_w * big / ref.width, box_h * big / ref.height)
    g = ink(max(8, int(1000 * scale)))
    mask = Image.new('L', (big, big), 0)
    mask.paste(g, ((big - g.width) // 2, (big - g.height) // 2))
    return mask


def make(name, size, shape, color, box_w, box_h, opaque=False, gap=0.08):
    big = size * SS
    img = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if shape == 'rounded':
        d.rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * 0.22), fill=INDIGO + (255,))  # the favicon's corner
    elif shape == 'full':
        d.rectangle((0, 0, big, big), fill=INDIGO + (255,))
    ink = Image.new('RGBA', (big, big), color + (255,))
    img.paste(ink, (0, 0), letters(big, box_w, box_h, gap))
    img = img.resize((size, size), Image.LANCZOS)
    if opaque:
        flat = Image.new('RGB', (size, size), INDIGO)
        flat.paste(img, (0, 0), img)
        img = flat
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, name), optimize=True)
    print('wrote assets/icons/' + name, '(%d x %d)' % (size, size))


if __name__ == '__main__':
    make('icon-192.png', 192, 'rounded', HALDI, 0.70, 0.50)
    make('icon-512.png', 512, 'rounded', HALDI, 0.70, 0.50)
    # the safe zone is a circle 80% across: the letters' box (56% x 40%) has a diagonal of 69%
    make('maskable-512.png', 512, 'full', HALDI, 0.56, 0.40, opaque=True)
    make('apple-touch-icon.png', 180, 'full', HALDI, 0.64, 0.46, opaque=True)
    make('badge-96.png', 96, None, WHITE, 0.84, 0.62, gap=0.10)  # Android's status bar draws it inside about 83%
