import requests
from bs4 import BeautifulSoup
import re

GUEST_API_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
}

def test():
    params = {
        "keywords": "software intern",
        "location": "Malaysia",
        "start": 0,
        "count": 5,
        "f_JT": "I",
    }
    resp = requests.get(GUEST_API_URL, params=params, headers=HEADERS)
    print("Status code:", resp.status_code)
    if resp.status_code != 200:
        return
        
    soup = BeautifulSoup(resp.text, "html.parser")
    cards = soup.find_all("li")
    print(f"Found {len(cards)} cards.")
    
    for i, card in enumerate(cards[:3]):
        print(f"\n--- Card {i+1} ---")
        title_el = card.find("h3", class_=re.compile(r"base-search-card__title"))
        title = title_el.text.strip() if title_el else "N/A"
        print("Title:", title)
        
        # Check all img tags
        imgs = card.find_all("img")
        for j, img in enumerate(imgs):
            print(f"  Img {j+1} attributes:")
            for attr, val in img.attrs.items():
                print(f"    {attr}: {val}")

if __name__ == "__main__":
    test()
