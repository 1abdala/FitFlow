import requests

url = "https://media.licdn.com/dms/image/v2/C510BAQGDlPEJILPXbw/company-logo_100_100/company-logo_100_100/0/1630575649647/grabapp_logo?e=2147483647&v=beta&t=TvYHYNrA_efi01q3rJbCDAKfqjgiVBaiMGrGwDem2rU"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "http://localhost:5173/",
    "Sec-Fetch-Dest": "image",
    "Sec-Fetch-Mode": "no-cors",
    "Sec-Fetch-Site": "cross-site"
}

r = requests.get(url, headers=headers)
print("Status code with full browser headers:", r.status_code)
print("Response headers:")
for k, v in r.headers.items():
    print(f"  {k}: {v}")
