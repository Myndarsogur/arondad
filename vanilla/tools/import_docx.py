#!/usr/bin/env python3
"""Convert a Word manuscript into the compact manuscript.txt format.

Each audio section in Word must begin with a paragraph like:
    Ker 3.m4a | Kaflaheiti

Use Word's normal manual page breaks inside a section. No third-party Python
packages are required; a .docx file is a ZIP archive containing XML.
"""

from __future__ import annotations

import argparse
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
TRACK = re.compile(r"^Ker\s+(\d{1,3})(?:\.m4a)?(?:\s*[|–—-]\s*(.+))?$", re.IGNORECASE)


def paragraph_text(paragraph: ET.Element) -> str:
    pieces: list[str] = []
    for node in paragraph.iter():
        if node.tag == f"{W}t":
            pieces.append(node.text or "")
        elif node.tag == f"{W}tab":
            pieces.append("\t")
        elif node.tag == f"{W}br":
            pieces.append("\f" if node.get(f"{W}type") == "page" else "\n")
    return "".join(pieces).strip()


def convert(docx_path: Path) -> tuple[str, list[int]]:
    with zipfile.ZipFile(docx_path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))

    output = ["# Innflutt úr Word. @@page táknar Word-síðuskil.", ""]
    found: list[int] = []
    active = False

    for paragraph in root.iter(f"{W}p"):
        text = paragraph_text(paragraph)
        clean = text.replace("\f", " ").strip()
        marker = TRACK.match(clean)
        if marker:
            number = int(marker.group(1))
            title = (marker.group(2) or f"Kafli {len(found) + 1:02d}").strip()
            output.extend([f"@@track Ker {number}.m4a", f"@@title {title}"])
            found.append(number)
            active = True
            continue
        if not active or not text:
            continue
        parts = text.split("\f")
        for index, part in enumerate(parts):
            if index:
                output.append("@@page")
            if part.strip():
                output.append(part.strip())
        output.append("")

    return "\n".join(output).rstrip() + "\n", found


def main() -> int:
    parser = argparse.ArgumentParser(description="Flytja Word-handrit í hrátextasnið hljóðbókarinnar.")
    parser.add_argument("input", type=Path, help="Slóð að .docx-skrá")
    parser.add_argument("output", type=Path, help="Úttak, yfirleitt content/manuscript.txt")
    parser.add_argument("--force", action="store_true", help="Leyfa yfirskrift á skrá sem er þegar til")
    args = parser.parse_args()

    if args.output.exists() and not args.force:
        parser.error(f"Úttaksskráin er þegar til: {args.output} (notaðu --force til að skrifa yfir)")
    try:
        text, found = convert(args.input)
    except (OSError, KeyError, zipfile.BadZipFile) as error:
        print(f"Ekki tókst að lesa Word-skjalið: {error}", file=sys.stderr)
        return 1
    if not found:
        print("Engar merkingar fundust. Bættu 'Ker 3.m4a | Kaflaheiti' við upphaf hverrar hljóðblokkar.", file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(text, encoding="utf-8")
    missing = sorted(set(range(3, 101)) - set(found))
    print(f"Skrifaði {len(found)} hljóðblokkir í {args.output}")
    if missing:
        print("Vantar blokkir fyrir: " + ", ".join(f"Ker {number}.m4a" for number in missing))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
