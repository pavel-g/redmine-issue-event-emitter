#!/bin/bash
cd /app/dist
NODE_TLS_REJECT_UNAUTHORIZED=0 /usr/local/bin/node main.js
