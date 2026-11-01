#!/usr/bin/env python3
"""Change only the assembly identity version in the unsigned v33 plugin DLL.

Jellyfin reads Assembly.GetName().Version, so just renaming the zip or changing
its repository manifest would be undone when Jellyfin loads the plugin.
"""
import pathlib
import struct
import sys
import dnfile

source, destination, requested = sys.argv[1:]
parts = requested.split('.')
if len(parts) != 4 or any(not p.isdecimal() or int(p) > 65535 for p in parts):
    raise SystemExit('Expected a four-part assembly version with 16-bit components')
version = tuple(map(int, parts))
if version <= (1, 0, 0, 33):
    raise SystemExit('New assembly version must be newer than 1.0.0.33')
original = pathlib.Path(source).read_bytes()
pe = dnfile.dnPE(data=original)
if not pe.net or not pe.net.mdtables.Assembly or len(pe.net.mdtables.Assembly.rows) != 1:
    raise SystemExit('Expected a .NET assembly with exactly one Assembly row')
row = pe.net.mdtables.Assembly.rows[0]
if str(row.Name) != 'Jellyfin.Plugin.Chat':
    raise SystemExit('Unexpected assembly name')
if (row.MajorVersion, row.MinorVersion, row.BuildNumber, row.RevisionNumber) != (1, 0, 0, 33):
    raise SystemExit('Expected the original version 1.0.0.33 assembly')
if (row.PublicKey is not None and row.PublicKey.value) or pe.net.struct.Flags & 0x8:
    raise SystemExit('Refusing to modify a strong-named assembly')
# The first four bytes of an Assembly row are HashAlgId; four uint16 version
# components follow. Everything else, including IL and embedded web UI, stays intact.
offset = row.struct.get_file_offset() + 4
if original[offset:offset + 8] != struct.pack('<4H', 1, 0, 0, 33):
    raise SystemExit('Unexpected metadata offsets')
patched = original[:offset] + struct.pack('<4H', *version) + original[offset + 8:]
check = dnfile.dnPE(data=patched).net.mdtables.Assembly.rows[0]
if (check.MajorVersion, check.MinorVersion, check.BuildNumber, check.RevisionNumber) != version:
    raise SystemExit('Failed to verify updated assembly version')
pathlib.Path(destination).write_bytes(patched)
print(f'Version 33 DLL verified and renamed to {requested}; only assembly version metadata changed')
