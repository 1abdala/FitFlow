import requests

url = "https://media.licdn.com/dms/image/v2/C510BAQGDlPEJILPXbw/company-logo_100_100/company-logo_100_100/0/1630575649647/grabapp_logo?e=2147483647&v=beta&t=TvYHYNrA_efi01q3rJbCDAKfqjgiVBaiMGrGwDem2rU"

print("Test 1: Request with Referer header (simulating hotlinking from dashboard)")
headers_with_ref = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "http://localhost:5173/"
}
r1 = requests.get(url, headers=headers_with_ref)
print(f"Status: {r1.status_code}")

print("\nTest 2: Request without Referer header (no-referrer policy)")
headers_no_ref = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
r2 = requests.get(url, headers=headers_no_ref)
print(f"Status: {r2.status_code}")
