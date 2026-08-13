import os
from bs4 import BeautifulSoup

path = r"c:\Users\bodyg\OneDrive\Pictures\sem5\fyp-project\fitflow(1)\scraper\dump.html"

def find_images():
    if not os.path.exists(path):
        print("dump.html not found.")
        return
        
    with open(path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
        
    # Print the title of the document
    print("Page Title:", soup.title.text if soup.title else "No Title")
    
    # List first 10 img tags
    imgs = soup.find_all("img")
    print(f"Total img tags: {len(imgs)}")
    for i, img in enumerate(imgs[:15]):
        print(f"[{i+1}] src: {img.get('src')}, class: {img.get('class')}, alt: {img.get('alt')}")

if __name__ == "__main__":
    find_images()
