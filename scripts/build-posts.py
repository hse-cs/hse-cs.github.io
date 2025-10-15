#!/usr/bin/env python3
# Converts messages.html -> data/posts.json (never used at runtime; for CI convenience)
import re, json, html, pathlib
root = pathlib.Path(__file__).resolve().parents[1]
src = root / "messages.html"
dst = root / "data" / "posts.json"
html_text = src.read_text(encoding="utf-8", errors="ignore")
blocks = re.findall(r'<div\s+class="text"\s*>(.*?)</div>', html_text, flags=re.DOTALL|re.IGNORECASE)
posts = []
for b in blocks:
    anchors = re.findall(r'<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)</a>', b, flags=re.DOTALL|re.IGNORECASE)
    if not anchors: continue
    title_url, title_text = anchors[0]
    desc_html = re.sub(r'<a\s+[^>]*>.*?</a>', '', b, flags=re.DOTALL|re.IGNORECASE)
    desc_html = re.sub(r'<br\s*/?>', ' ', desc_html, flags=re.IGNORECASE)
    desc = re.sub(r'<[^>]+>', ' ', desc_html)
    desc = ' '.join(desc.split())
    desc = html.unescape(desc).strip()
    type_map = []
    for href, text in anchors[1:]:
        t = text.lower()
        if "arxiv" in t or "paper" in t or "стат" in t: typ = "paper"
        elif "github" in t or "code" in t or "код" in t: typ = "code"
        elif "demo" in t or "демо" in t or "colab" in t or "колаб" in t: typ = "demo"
        else: typ = "link"
        type_map.append({"type": typ, "href": href})
    posts.append({"title": html.unescape(title_text).strip(), "url": title_url, "desc": desc, "links": type_map})
dst.write_text(json.dumps(posts, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {dst} with {len(posts)} posts.")
