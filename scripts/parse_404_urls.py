from pathlib import Path

raw = Path('data/404-urls-raw.txt').read_text(encoding='utf-8')
parts = [p.strip() for p in raw.split('\n\n') if p.strip()]
rows = []
for i in range(0, len(parts), 2):
    url = parts[i]
    date = parts[i + 1] if i + 1 < len(parts) else ''
    rows.append((url, date))
lines = ['URL,LastCrawled']
for url, date in rows:
    safe_url = url.replace('"', '""')
    safe_date = date.replace('"', '""')
    lines.append(f'"{safe_url}","{safe_date}"')
Path('data/404-urls.csv').write_text('\n'.join(lines), encoding='utf-8')
print(f'wrote {len(rows)} rows to data/404-urls.csv')
