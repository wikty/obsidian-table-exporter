from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "assets" / "social-preview.png"
WIDTH = 1280
HEIGHT = 640


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def rounded_box(draw: ImageDraw.ImageDraw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def pill(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, fill: str, text: str, font, text_fill: str):
    rounded_box(draw, (x, y, x + w, y + h), h // 2, fill)
    bbox = draw.textbbox((0, 0), text, font=font)
    tx = x + (w - (bbox[2] - bbox[0])) / 2
    ty = y + (h - (bbox[3] - bbox[1])) / 2 - 1
    draw.text((tx, ty), text, font=font, fill=text_fill)


def draw_table_card(base: Image.Image):
    draw = ImageDraw.Draw(base)
    x, y, w, h = 780, 106, 410, 404
    rounded_box(draw, (x, y, x + w, y + h), 28, "#FFFFFF", "#CBD5E1", 2)
    rounded_box(draw, (x, y, x + w, y + 70), 28, "#E2E8F0")
    draw.rectangle((x, y + 44, x + w, y + 70), fill="#E2E8F0")

    col1 = x + 122
    col2 = x + 286
    for xx in (col1, col2):
        draw.line((xx, y, xx, y + h), fill="#CBD5E1", width=2)
    for yy in (y + 70, y + 156, y + 242, y + 322):
        draw.line((x, yy, x + w, yy), fill="#CBD5E1", width=2)

    header = load_font(24, bold=True)
    cell_bold = load_font(20, bold=True)
    cell = load_font(20)
    draw.text((x + 26, y + 20), "Week", font=header, fill="#0F172A")
    draw.text((x + 146, y + 20), "Owner", font=header, fill="#0F172A")
    draw.text((x + 308, y + 20), "Format", font=header, fill="#0F172A")

    rows = [
        ("2026-W05", "Shaw", "PNG"),
        ("2026-W12", "Ops", "PDF"),
        ("2026-W18", "Research", "CSV"),
        ("2026-W24", "Data team", "Excel"),
    ]
    row_ys = [y + 102, y + 188, y + 274, y + 350]
    for (week, owner, fmt), yy in zip(rows, row_ys):
        draw.text((x + 24, yy), week, font=cell_bold, fill="#1F2937")
        draw.text((x + 146, yy), owner, font=cell, fill="#475569")
        draw.text((x + 308, yy), fmt, font=cell, fill="#475569")


def main():
    image = Image.new("RGB", (WIDTH, HEIGHT), "#F5F1E8")
    draw = ImageDraw.Draw(image)

    rounded_box(draw, (34, 34, WIDTH - 34, HEIGHT - 34), 30, "#FBFCFE", "#1F2937", 2)

    shadow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    rounded_box(shadow_draw, (760, 98, 1200, 520), 32, (15, 23, 42, 32))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    image.paste(shadow, (0, 0), shadow)

    badge_font = load_font(18, bold=True)
    title_font = load_font(68, bold=True)
    subtitle_font = load_font(24)
    body_font = load_font(18)
    section_font = load_font(24, bold=True)

    pill(draw, 84, 78, 156, 38, "#111827", "Obsidian Plugin", badge_font, "#F8FAFC")

    draw.text((84, 155), "Obsidian Table", font=title_font, fill="#0F172A")
    draw.text((84, 228), "Exporter", font=title_font, fill="#0F172A")
    draw.text((84, 304), "Export rendered Markdown tables to PNG, CSV, Excel, and PDF.", font=subtitle_font, fill="#334155")
    draw.text((84, 344), "Built for long tables, spreadsheet handoff,", font=body_font, fill="#475569")
    draw.text((84, 374), "and cleaner sharing outside the vault.", font=body_font, fill="#475569")

    pill(draw, 84, 418, 118, 44, "#DBEAFE", "PNG", load_font(24, bold=True), "#1D4ED8")
    pill(draw, 218, 418, 118, 44, "#DCFCE7", "CSV", load_font(24, bold=True), "#15803D")
    pill(draw, 352, 418, 136, 44, "#FDE68A", "Excel", load_font(24, bold=True), "#92400E")
    pill(draw, 504, 418, 118, 44, "#F3E8FF", "PDF", load_font(24, bold=True), "#7E22CE")

    draw.text((84, 486), "Typical use cases", font=section_font, fill="#111827")
    bullets = [
        "Long tables that are painful to screenshot",
        "PDF output that should break on rows, not random pixels",
    ]
    bullet_y = 520
    for bullet in bullets:
        draw.ellipse((88, bullet_y + 8, 98, bullet_y + 18), fill="#111827")
        draw.text((118, bullet_y), bullet, font=body_font, fill="#334155")
        bullet_y += 36

    draw_table_card(image)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUT, format="PNG", optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
