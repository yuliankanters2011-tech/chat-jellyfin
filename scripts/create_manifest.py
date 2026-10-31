#!/usr/bin/env python3
"""Create a Jellyfin repository manifest for a built plugin archive."""
import datetime
import hashlib
import json
import pathlib
import sys
from urllib.parse import quote

archive, version, repository, tag = sys.argv[1:]
archive_path = pathlib.Path(archive)
checksum = hashlib.md5(archive_path.read_bytes()).hexdigest()  # Jellyfin requires MD5
manifest = [{
    "guid": "8537738c-f9b3-4b80-a483-33d9229bfc89",
    "name": "Chat",
    "overview": "Chatgroepen en berichten voor Jellyfin",
    "description": "Chat met groepen, toegangsbeheer en aankondigingsgroepen.",
    "owner": "yuliankanters2011-tech",
    "category": "General",
    "versions": [{
        "version": version,
        "changelog": "Chatplugin voor Jellyfin 12.4. Het chat-icoon wordt automatisch toegevoegd aan de door Jellyfin gehoste webclient.",
        "targetAbi": "12.4.0.0",
        "sourceUrl": f"https://github.com/{repository}/releases/download/{quote(tag, safe='')}/{quote(archive_path.name, safe='')}",
        "checksum": checksum,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }],
}]
json.dump(manifest, sys.stdout, indent=2)
print()
