#!/bin/sh
set -e
PORT="${PORT:-80}"
sed "s/__PORT__/${PORT}/" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec nginx -g "daemon off;"
