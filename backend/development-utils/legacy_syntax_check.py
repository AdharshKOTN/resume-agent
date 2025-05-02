import os
import pkgutil

def find_legacy_print_statements():
    legacy_hits = []
    for mod in pkgutil.iter_modules():
        try:
            mod_path = os.path.join(mod.module_finder.path, mod.name)
            init_file = os.path.join(mod_path, "__init__.py")

            if os.path.exists(init_file):
                with open(init_file, encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if 'print "' in content:  # Looks like Python 2 syntax
                        legacy_hits.append(init_file)
        except Exception as e:
            print(f"Error reading {mod.name}: {e}")

    return legacy_hits

if __name__ == "__main__":
    results = find_legacy_print_statements()
    if results:
        print("\n⚠️  Legacy Python 2 print statements found in:")
        for path in results:
            print(f" - {path}")
    else:
        print("✅ No legacy print syntax found.")
