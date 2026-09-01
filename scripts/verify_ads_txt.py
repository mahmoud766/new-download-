import sys
import os
import urllib.request

# 1. Read public/ads.txt
with open('public/ads.txt', 'r', encoding='utf-8') as f:
    public_content = f.read()

public_lines = [l.strip() for l in public_content.splitlines() if l.strip()]

adsense_line = "google.com, pub-6708942894533593, DIRECT, f08c47fec0942fa0"
has_adsense = adsense_line in public_lines

monumetric_in_file = [l for l in public_lines if l != adsense_line]

# 2. Read dist/ads.txt
with open('dist/ads.txt', 'r', encoding='utf-8') as f:
    dist_content = f.read()

dist_lines = [l.strip() for l in dist_content.splitlines() if l.strip()]

# 3. Test HTTP /ads.txt
port = os.environ.get('PORT', '3000')
try:
    req = urllib.request.urlopen(f'http://127.0.0.1:{port}/ads.txt')
except Exception:
    req = urllib.request.urlopen('http://127.0.0.1:8080/ads.txt')

status = req.getcode()
content_type = req.headers.get('Content-Type')
http_body = req.read().decode('utf-8')
http_lines = [l.strip() for l in http_body.splitlines() if l.strip()]

print(f"=== ADS.TXT AUDIT REPORT ===")
print(f"Public file total lines: {len(public_lines)}")
print(f"AdSense line present: {has_adsense}")
print(f"Monumetric records in public/ads.txt: {len(monumetric_in_file)}")
print(f"Dist file total lines: {len(dist_lines)}")
print(f"Public matches Dist byte-for-byte: {public_content == dist_content}")
print(f"HTTP Status: {status}")
print(f"HTTP Content-Type: {content_type}")
print(f"HTTP response lines: {len(http_lines)}")
print(f"HTTP matches Public byte-for-byte: {http_body == public_content}")

# Check duplicates in Monumetric lines
duplicates = len(monumetric_in_file) - len(set(monumetric_in_file))
print(f"Duplicate lines in list (as requested by provider): {duplicates}")

