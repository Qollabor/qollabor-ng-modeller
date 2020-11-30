#!/bin/sh

NODE_ENV=docker

export $NODE_ENV

echo "Start repository service"
/usr/src/app/bin/www &

echo "Start NGINX"
nginx
