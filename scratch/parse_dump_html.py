import os
from bs4 import BeautifulSoup

path = r"c:\Users\bodyg\OneDrive\Pictures\sem5\fyp-project\fitflow(1)\scraper\dump.html"

def parse():
    if not os.path.exists(path):
        print("dump.html not found.")
        return
        
    with open(path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
        
    print("Searching for images inside JobCards...")
    cards = soup.find_all("article", {"data-card-type": "JobCard"})
    print(f"Found {len(cards)} job cards.")
    
    for i, card in enumerate(cards[:5]):
        print(f"\n--- Card {i+1} ---")
        title = card.find("a", {"data-automation": "jobTitle"})
        title_text = title.text.strip() if title else "N/A"
        print("Title:", title_text)
        
        # Print all image tags inside the card
        imgs = card.find_all("img")
        print("Images:")
        for img in imgs:
            print(f"  src: {img.get('src')}, class: {img.get('class')}, alt: {img.get('alt')}")

if __name__ == "__main__":
    parse()
