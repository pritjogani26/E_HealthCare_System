# import os


# def collect_frontend_code(root_dir, output_file):
#     # extensions = {".sql"}
#     extensions = {".ts", ".tsx", ".js", ".jsx", ".css", ".json"}
#     excludes = {
#         "node_modules",
#         "build",
#         "dist",
#         ".git",
#         "package-lock.json",
#         "yarn.lock",
#     }

#     with open(output_file, "w", encoding="utf-8") as outfile:
#         # First, add package.json specifically if it exists in the root
#         pkg_json = os.path.join(root_dir, "package.json")
#         if os.path.exists(pkg_json):
#             outfile.write(
#                 f"// {os.path.relpath(pkg_json, os.path.dirname(root_dir))}\n"
#             )
#             try:
#                 with open(pkg_json, "r", encoding="utf-8") as infile:
#                     outfile.write(infile.read())
#             except Exception as e:
#                 outfile.write(f"Error reading file: {e}")
#             outfile.write("\n\n")

#         # Now walk through src
#         src_dir = os.path.join(root_dir, "src")
#         if os.path.exists(src_dir):
#             for root, dirs, files in os.walk(src_dir):
#                 # Modify dirs in-place to skip excluded directories
#                 dirs[:] = [d for d in dirs if d not in excludes]

#                 for file in files:
#                     if file in excludes:
#                         continue

#                     ext = os.path.splitext(file)[1]
#                     if ext in extensions:
#                         file_path = os.path.join(root, file)
#                         try:
#                             # Use relpath to get path relative to frontend parent or project root
#                             rel_path = os.path.relpath(
#                                 file_path, os.path.dirname(root_dir)
#                             )
#                             outfile.write(f"// {rel_path}\n")

#                             with open(file_path, "r", encoding="utf-8") as infile:
#                                 outfile.write(infile.read())
#                             outfile.write("\n\n")
#                         except Exception as e:
#                             print(f"Error reading {file_path}: {e}")


# if __name__ == "__main__":
#     frontend_dir = r"e:\Project\frontend"
#     output_path = r"frontend_full_code.txt"
#     collect_frontend_code(frontend_dir, output_path)
#     print(f"Code collected to {output_path}")


import os


def collect_frontend_code(root_dir: str, output_file: str):
    # Allowed extensions
    extensions = {".ts", ".tsx", ".js", ".jsx", ".css", ".json"}

    # Folders / files to ignore
    excludes = {
        "node_modules",
        "build",
        "dist",
        ".git",
        "package-lock.json",
        "yarn.lock",
    }

    # Keyword filter
    keyword = "regi"

    # Specific files to always include
    specific_files = {
        "package.json",
        "AuthContext.tsx",
        "apiService.ts",
        "App.tsx",
        "index.ts",
    }

    with open(output_file, "w", encoding="utf-8") as outfile:

        # ---- Include package.json if exists ----
        pkg_json = os.path.join(root_dir, "package.json")
        if os.path.exists(pkg_json):
            outfile.write(f"// package.json\n")
            with open(pkg_json, "r", encoding="utf-8") as f:
                outfile.write(f.read())
            outfile.write("\n\n")

        # ---- Walk src directory ----
        src_dir = os.path.join(root_dir, "src")

        if not os.path.exists(src_dir):
            print("src folder not found.")
            return

        for root, dirs, files in os.walk(src_dir):

            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in excludes]

            for file in files:

                if file in excludes:
                    continue

                ext = os.path.splitext(file)[1]
                if ext not in extensions:
                    continue

                filename_lower = file.lower()

                # Condition 1: file contains "register"
                contains_keyword = keyword in filename_lower

                # Condition 2: file is in specific list
                is_specific = file in specific_files

                if not (contains_keyword or is_specific):
                    continue

                file_path = os.path.join(root, file)

                try:
                    rel_path = os.path.relpath(file_path, root_dir)

                    outfile.write("=" * 80 + "\n")
                    outfile.write(f"FILE: {rel_path}\n")
                    outfile.write("=" * 80 + "\n\n")

                    with open(file_path, "r", encoding="utf-8") as infile:
                        outfile.write(infile.read())

                    outfile.write("\n\n")

                except Exception as e:
                    print(f"Error reading {file_path}: {e}")


if __name__ == "__main__":

    frontend_dir = r"E:\Project\frontend"
    output_path = r"frontend_filtered_code.txt"

    collect_frontend_code(frontend_dir, output_path)

    print(f"\nCode collected successfully -> {output_path}")
