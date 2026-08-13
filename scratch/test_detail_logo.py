import requests
from bs4 import BeautifulSoup
import re

url = "https://www.linkedin.com/jobs/view/intern-software-engineer-at-astro-4423129059"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

print(f"Fetching job detail page: {url}")
r = requests.get(url, headers=headers)
print(f"Status: {r.status_code}")
if r.status_code == 200:
    print(f"Final URL: {r.url}")
    if "authwall" in r.url or "login" in r.url:
        print("Blocked by auth wall!")
    else:
        soup = BeautifulSoup(r.text, "html.parser")
        print("\nAll image tags in the page HTML:")
        imgs = soup.find_all("img")
        for i, img in enumerate(imgs):
            print(f"\nImg {i+1}:")
            for attr, val in img.attrs.items():
                print(f"  {attr}: {val}")
else:
    print("Failed to fetch.")
