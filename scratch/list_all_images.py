import os

workspace_root = r"c:\Users\bodyg\OneDrive\Pictures\sem5\fyp-project"
exclude_dirs = {'node_modules', '.git', '.github', '.gemini', 'dist', '__pycache__'}
image_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'}

def list_images():
    print(f"Scanning for images in {workspace_root}...")
    found_images = []
    
    for root, dirs, files in os.walk(workspace_root):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in image_extensions:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, workspace_root)
                size_kb = os.path.getsize(full_path) / 1024
                found_images.append((rel_path, size_kb))
                
    print(f"\nFound {len(found_images)} images:")
    for path, size in sorted(found_images):
        print(f"  - {path} ({size:.1f} KB)")

if __name__ == "__main__":
    list_images()
