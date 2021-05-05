FROM nginx:alpine

RUN apk update && apk --no-cache add nodejs npm

# Create app directory
RUN mkdir -p /usr/src/app /usr/src/app/repository_deploy
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --production

# copy nginx config
COPY config/nginx.conf /etc/nginx/nginx.conf

# Bundle app source
COPY . /usr/src/app

# clean the repository
#RUN rm -rf /usr/src/app/repository/*
RUN mkdir -p /opt/repository
RUN mkdir -p /opt/repository_deploy
RUN mkdir -p /opt/repository_default
RUN mkdir -p /opt/repository_deploy_default
RUN cp /usr/src/app/repository/* /opt/repository_default
RUN cp /usr/src/app/repository_deploy/* /opt/repository_deploy_default

RUN chmod 755 /usr/src/app/bin/entrypoint.sh
RUN chmod 755 /usr/src/app/bin/www

# ENV NODE_ENV=docker (is now set in entrypoint.sh)
EXPOSE 2081
RUN dos2unix /usr/src/app/bin/entrypoint.sh
RUN dos2unix /usr/src/app/bin/www
ENTRYPOINT /usr/src/app/bin/entrypoint.sh