"""Adds the in-app update strings to the web client dictionaries.

The dictionaries are maintained by Weblate and are not fully sorted, so the new keys are inserted as
plain lines right after an existing anchor key. Everything else in the file stays untouched, which
keeps the diff to the two new lines.

Usage: python add-update-strings.py
"""

import io
import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Locale -> (value for ButtonUpdate, value for Update, value for ButtonCheckForUpdates)
TRANSLATIONS = {
    'en-us': ('Update', 'Update', 'Check for updates'),
    'en-gb': ('Update', 'Update', 'Check for updates'),
    'pl': ('Aktualizuj', 'Aktualizacja', 'Sprawdź aktualizacje'),
}

# The new key is written after the line holding this key, which keeps the alphabetical order.
ANCHORS = {
    'ButtonUpdate': 'ButtonUninstall',
    'Update': 'Up',
    'ButtonCheckForUpdates': 'ButtonCast',
}


def insertion_index(lines, anchor_key):
    marker = f'"{anchor_key}":'
    for index, line in enumerate(lines):
        if line.lstrip().startswith(marker):
            return index
    raise SystemExit(f'Anchor {anchor_key} not found')


def update_locale(locale, button_value, menu_value, check_value):
    path = os.path.join(REPO, 'src', 'strings', f'{locale}.json')

    with io.open(path, encoding='utf-8', newline='') as handle:
        lines = handle.readlines()

    existing = set(json.loads(''.join(lines)))

    # Insert the later line first so the indexes of the earlier one stay valid.
    pending = []
    for key, value in (('Update', menu_value), ('ButtonUpdate', button_value), ('ButtonCheckForUpdates', check_value)):
        if key not in existing:
            pending.append((ANCHORS[key], key, value))

    if not pending:
        print(f'{locale}: already up to date')
        return

    for anchor, key, value in sorted(pending, key=lambda item: insertion_index(lines, item[0]), reverse=True):
        index = insertion_index(lines, anchor)
        indent = lines[index][:len(lines[index]) - len(lines[index].lstrip())]
        lines.insert(index + 1, f'{indent}"{key}": {json.dumps(value, ensure_ascii=False)},\r\n')

    with io.open(path, 'w', encoding='utf-8', newline='') as handle:
        handle.writelines(lines)

    print(f'{locale}: added {", ".join(key for _, key, _ in pending)}')


if __name__ == '__main__':
    for locale, (button_value, menu_value, check_value) in TRANSLATIONS.items():
        update_locale(locale, button_value, menu_value, check_value)
