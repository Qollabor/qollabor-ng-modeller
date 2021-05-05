#!/bin/sh

NODE_ENV=docker

export $NODE_ENV

echo "copy default to repository"
cp /opt/repository_default/* /opt/repository
cp /opt/repository_deploy_default/* /opt/repository_deploy

echo "Start repository service"
/usr/src/app/bin/www &

echo "Start NGINX"
nginx
