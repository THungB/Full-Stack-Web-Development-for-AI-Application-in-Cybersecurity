import os
import pathspec

def export_project_code():
    root_dir = os.path.abspath(".")
    gitignore_path = os.path.join(root_dir, ".gitignore")
    output_file = os.path.join(root_dir, "exported_source_code.txt")

    # Common binary/non-text extensions to always ignore, even if not in gitignore
    ignore_extensions = {
        ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
        ".db", ".sqlite3", ".pdf", ".mp4", ".zip", ".tar", ".gz",
        ".pyc", ".pyo", ".pyd", ".dll", ".so", ".exe", ".class",
        ".joblib", ".pkl", ".h5", ".pt", ".pth", ".onnx", ".pb"
    }
    
    # Common directories to always ignore completely to save scanning time
    ignore_dirs = {
        ".git", ".venv", "venv", "node_modules", "__pycache__", 
        "dist", "build", ".idea", ".vscode", ".pytest_cache"
    }

    # Load gitignore
    spec = None
    if os.path.exists(gitignore_path):
        with open(gitignore_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            spec = pathspec.PathSpec.from_lines(pathspec.patterns.GitWildMatchPattern, lines)

    with open(output_file, "w", encoding="utf-8") as out_f:
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # Mutate dirnames in-place to skip ignored directories
            dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
            
            # Additional pathspec filtering for directories
            if spec:
                rel_dirpath = os.path.relpath(dirpath, root_dir)
                if rel_dirpath != ".":
                    # Check if directory is ignored by gitignore using trailing slash
                    if spec.match_file(rel_dirpath) or spec.match_file(rel_dirpath + "/"):
                        # Clear its subdirs to stop walking this branch
                        dirnames[:] = []
                        continue

            for file in filenames:
                file_path = os.path.join(dirpath, file)
                rel_path = os.path.relpath(file_path, root_dir)
                
                # Check extension
                ext = os.path.splitext(file)[1].lower()
                if ext in ignore_extensions:
                    continue

                # Check gitignore
                if spec and spec.match_file(rel_path):
                    continue
                    
                # Skip the export script itself and output file
                if file == "export_code.py" or file == "exported_source_code.txt" or file == "implementation_plan.md" or file == "task.md":
                    continue

                try:
                    with open(file_path, "r", encoding="utf-8") as in_f:
                        content = in_f.read()
                        
                    # Write separator and absolute path
                    out_f.write("=" * 80 + "\n")
                    out_f.write(f"FILE: {os.path.abspath(file_path)}\n")
                    out_f.write("=" * 80 + "\n\n")
                    out_f.write(content)
                    out_f.write("\n\n")
                except UnicodeDecodeError:
                    # Skip binary files that don't match our ignore list but are still binary
                    pass
                except Exception as e:
                    print(f"Error reading {rel_path}: {e}")

    print(f"\nHoàn tất! Đã xuất toàn bộ mã nguồn ra file:\n{output_file}")

if __name__ == "__main__":
    export_project_code()
