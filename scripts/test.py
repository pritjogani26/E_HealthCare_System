import os
import shutil


def delete_pycache(root_dir: str):
    for root, dirs, files in os.walk(root_dir):
        if "__pycache__" in dirs:
            pycache_path = os.path.join(root, "__pycache__")
            shutil.rmtree(pycache_path)
            print(f"Deleted: {pycache_path}")


if __name__ == "__main__":
    folder_path = input("Enter project folder path: ").strip()

    if os.path.exists(folder_path):
        delete_pycache(folder_path)
        print("\nAll __pycache__ folders removed.")
    else:
        print("Invalid path.")
