import csv
from collections import defaultdict
from pathlib import Path

path = Path(r'C:\Users\27825\Downloads\Table.csv')
rows = []
with path.open(newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

buckets = defaultdict(list)
for row in rows:
    url = row['URL']
    if '/locations/' in url:
        bucket = 'locations'
    elif '/services/' in url:
        bucket = 'services'
    elif '/articles' in url or '/article' in url or '/blog' in url:
        bucket = 'content'
    elif '/booking' in url:
        bucket = 'booking'
    elif '/auth' in url or '/account' in url:
        bucket = 'auth/account'
    elif '/community' in url:
        bucket = 'community'
    elif '/legal' in url or 'privacy' in url or 'popia' in url or 'cookies' in url:
        bucket = 'legal'
    elif '/cleaning' in url:
        bucket = 'flows'
    elif '/_next/' in url or url.endswith('.woff2'):
        bucket = 'static-assets'
    else:
        bucket = 'misc'
    buckets[bucket].append((url, row['Last crawled']))

report_lines = []
for bucket, items in sorted(buckets.items(), key=lambda kv: -len(kv[1])):
    report_lines.append(f"{bucket}: {len(items)}")
Path('data/404-bucket-summary.txt').write_text('\n'.join(report_lines), encoding='utf-8')

with Path('data/404-buckets.csv').open('w', encoding='utf-8', newline='') as f:
    f.write('bucket,url,last_crawled\n')
    for bucket, items in buckets.items():
        for url, date in items:
            f.write(f'{bucket},{url},{date}\n')

print('\n'.join(report_lines))
