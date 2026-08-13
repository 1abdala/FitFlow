import requests
from bs4 import BeautifulSoup

url = "https://www.linkedin.com/jobs/view/intern-software-engineer-at-astro-4423129059"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, "html.parser")

print("Let's look for specific company logo elements:")

# Look for topcard image
topcard_img = soup.select_one(".topcard__org-image")
if topcard_img:
    print("Found .topcard__org-image:")
    print("  src:", topcard_img.get("src"))
    print("  data-delayed-url:", topcard_img.get("data-delayed-url"))

# Look for any image inside a link to the company page
for a in soup.find_all("a"):
    href = a.get("href", "")
    if "company/" in href or "linkedin.com/company" in href:
        img = a.find("img")
        if img:
            print(f"Found img inside company link ({href}):")
            print("  src:", img.get("src"))
            print("  data-delayed-url:", img.get("data-delayed-url"))

# Or any images with company-logo or logo in class
for img in soup.find_all("img"):
    classes = img.get("class", [])
    classes_str = " ".join(classes) if isinstance(classes, list) else str(classes)
    if "logo" in classes_str.lower() or "brand" in classes_str.lower():
        print(f"Found img with class {classes_str}:")
        print("  src:", img.get("src"))
        print("  data-delayed-url:", img.get("data-delayed-url"))
