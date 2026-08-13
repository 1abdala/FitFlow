import os
import json

log_path = r"C:\Users\bodyg\.gemini\antigravity\brain\67944ace-f2ec-4d8d-a3e1-d57238b94e63\.system_generated\logs\transcript.jsonl"

def search():
    if not os.path.exists(log_path):
        print("Log path does not exist.")
        return
        
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                step = json.loads(line)
                content = step.get("content", "")
                if "generate_internship_matches" in content:
                    print("Found in content:", content[:500])
                    print("---")
            except Exception as e:
                pass

if __name__ == "__main__":
    search()
