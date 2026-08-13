import os
from bs4 import BeautifulSoup

path = r"c:\Users\bodyg\OneDrive\Pictures\sem5\fyp-project\fitflow(1)\scraper\dump.html"

def find_parents():
    if not os.path.exists(path):
        print("dump.html not found.")
        return
        
    with open(path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
        
    imgs = soup.find_all("img")
    print(f"Total img tags: {len(imgs)}")
    
    for i, img in enumerate(imgs[:5]):
        print(f"\n--- Img {i+1} ---")
        print("src:", img.get("src"))
        
        # Traverse up the parents and print classes/tags
        parent = img.parent
        level = 1
        while parent and level <= 4:
            print(f"  Parent L{level}: tag={parent.name}, class={parent.get('class')}, id={parent.get('id')}, attrs={list(parent.attrs.keys())}")
            parent = parent.parent
            level += 1

if __name__ == "__main__":
    find_parents()
