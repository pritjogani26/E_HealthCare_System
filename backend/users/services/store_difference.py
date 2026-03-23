def generate_difference(old_data: dict, new_data: dict) -> tuple[dict, dict]:
    old_values = {}
    new_values = {}

    all_keys = set(old_data.keys()) | set(new_data.keys())

    for key in all_keys:
        old_val = old_data.get(key)
        new_val = new_data.get(key)

        if old_val != new_val:
            old_values[key] = old_val
            new_values[key] = new_val
    print(f"\nOld Values : {old_values}")
    print(f"\nNew Values : {new_values}")
    # return old_values, new_values