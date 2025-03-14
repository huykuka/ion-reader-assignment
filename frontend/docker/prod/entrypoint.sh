#!/bin/sh

# For debugging the container, uncomment the following line
#tail -f /dev/null

exec nginx -g "daemon off;"
