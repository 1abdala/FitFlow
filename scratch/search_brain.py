import os

brain_dir = r"C:\Users\bodyg\.gemini\antigravity\brain\67944ace-f2ec-4d8d-a3e1-d57238b94e63"

def search():
    for root, dirs, files in os.walk(brain_dir):
        # Skip system_generated folder to keep it clean
        if ".system_generated" in root:
            continue
        for file in files:
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "generate_internship_matches" in content:
                        print(f"Found in {path}")
                        # Print lines containing it
                        lines = content.splitlines()
                        for i, line in enumerate(lines):
                            if "generate_internship_matches" in line:
                                print(f"  Line {i+1}: {line[:120]}")
            except Exception as e:
                pass

if __name__ == "__main__":
    search()
