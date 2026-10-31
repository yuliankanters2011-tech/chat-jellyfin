#!/usr/bin/env bash
# Exercise the published assembly with the actual Jellyfin 12.4 Docker image.
set -euo pipefail
work=$(mktemp -d)
name="chat-jellyfin-ci-${GITHUB_RUN_ID:-$$}"
stage="container starten"
cleanup() {
  code=$?
  if (( code != 0 )); then
    echo "::error::Docker-test mislukt tijdens: $stage (exit $code)"
    docker logs "$name" > "$work/docker.log" 2>&1 || true
    tail -30 "$work/docker.log" | while IFS= read -r line; do
      line=${line//%/%25}; line=${line//$'\r'/%0D}; line=${line//$'\n'/%0A}
      echo "::error::$line"
    done
  fi
  docker rm -f "$name" >/dev/null 2>&1 || true
  rm -rf "$work"
  exit "$code"
}
trap cleanup EXIT
mkdir -p "$work/config/plugins/Chat" "$work/cache"
cp publish/Jellyfin.Plugin.Chat.dll "$work/config/plugins/Chat/"
chmod -R a+rwX "$work"
docker run -d --name "$name" -p 127.0.0.1:18096:8096 \
  -v "$work/config:/config" -v "$work/cache:/cache" jellyfin/jellyfin:12.4 >/dev/null
url=http://127.0.0.1:18096
stage="wachten op Jellyfin"
for _ in $(seq 1 90); do
  if curl -fsS "$url/System/Info/Public" > /dev/null 2>&1; then break; fi
  sleep 2
done
curl -fsS "$url/System/Info/Public" | jq -e '.Version | startswith("12.4")' >/dev/null
stage="Jellyfin Web HTML ophalen en chat-script controleren"
# Check that the actual static-file pipeline injects the script, not only a unit-test stub.
curl -fsS -H 'Accept-Encoding: gzip' "$url/web/index.html" > "$work/page"
grep -Fq '../ChatPlugin/chat.js' "$work/page"
stage="chat JavaScript endpoint controleren"
curl -fsS "$url/ChatPlugin/chat.js" > "$work/chat.js"
grep -Fq '__jellyfinChatLoaded' "$work/chat.js"
stage="installatiewizard uitvoeren"
# Complete a disposable server's startup wizard and sign in as its administrator.
curl -fsS "$url/Startup/User" >/dev/null
curl -fsS -X POST -H 'Content-Type: application/json' -d '{"Name":"chat-test","Password":"chat-test-password"}' "$url/Startup/User" >/dev/null
curl -fsS -X POST "$url/Startup/Complete" >/dev/null
stage="aanmelden bij Jellyfin"
auth='MediaBrowser Client="ChatTest", Device="CI", DeviceId="chat-test-ci", Version="1.0"'
token=$(curl -fsS -X POST -H "Authorization: $auth" -H 'Content-Type: application/json' \
  -d '{"Username":"chat-test","Pw":"chat-test-password"}' "$url/Users/AuthenticateByName" | jq -er '.AccessToken')
request() { curl -fsS -H "X-Emby-Token: $token" "$@"; }
stage="chattoegang controleren"
request "$url/ChatPlugin/me" | jq -e '.enabled == true and .admin == true' >/dev/null
stage="beheerinstellingen controleren"
request "$url/ChatPlugin/settings" | jq -e '(.everyone == true) and (.allowedUsers | type == "array") and (.users | length > 0)' >/dev/null
stage="groepen controleren"
room=$(request "$url/ChatPlugin/rooms" | jq -er '.[0] | select(.name == "Algemeen") | .id')
stage="bericht sturen"
request -X POST -H 'Content-Type: application/json' -d '{"text":"testbericht"}' "$url/ChatPlugin/rooms/$room/messages" >/dev/null
request "$url/ChatPlugin/rooms/$room/messages" | jq -e '.[-1] | .text == "testbericht" and .userName == "chat-test"' >/dev/null
stage="aankondigingsgroep aanmaken"
request -X POST -H 'Content-Type: application/json' -d '{"name":"Aankondigingen","adminOnly":true,"members":[]}' "$url/ChatPlugin/rooms" | jq -e '.name == "Aankondigingen" and .adminOnly == true' >/dev/null
printf 'Jellyfin 12.4 Docker smoke test passed.\n'
