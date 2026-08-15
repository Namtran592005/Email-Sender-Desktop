#!/bin/bash
# Chụp UI các trang: seed data, rồi chụp compose, settings, drafts, sent, templates
cd /home/ubuntu/email-sender-desktop
EL=./node_modules/.bin/electron
FLAG="--no-dev --disable-gpu"
export ELECTRON_RUN_AS_NODE=

seed_page() {
  xvfb-run -a $EL . $FLAG --url "?seed=1" > /dev/null 2>&1
  sleep 8
  pkill -f electron
}

shot() {
  local url=$1 out=$2
  xvfb-run -a $EL . $FLAG --screenshot --url "$url" > /tmp/shot_$$.log 2>&1 &
  local pid=$!
  for i in $(seq 1 20); do
    if [ -f "$out" ]; then break; fi
    sleep 1
  done
  wait $pid 2>/dev/null
  pkill -f electron
}

seed_page
shot "?page=compose" /tmp/ui-compose.png
shot "?page=settings" /tmp/ui-settings.png
shot "?page=drafts" /tmp/ui-drafts.png
shot "?page=templates" /tmp/ui-templates.png
shot "?page=sent" /tmp/ui-sent.png
ls -la /tmp/ui-*.png
