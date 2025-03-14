# Use a smaller base image (Alpine Linux)
FROM node:22-alpine AS builder

# create a folder /src in the docker container and go into that folder
RUN mkdir /src
WORKDIR /src

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install application dependencies
RUN npm install --force

# Copy the whole app
COPY . /src

RUN npm run build

#
#----------------Build nginx with dist folder--------------
FROM nginx:1.21.1-alpine

# Add bash
RUN apk add --no-cache bash

COPY --from=builder /src/dist/ion-reader/browser/* /usr/share/nginx/html
COPY ./docker/prod/entrypoint.sh /entrypoint.sh
COPY ./docker/prod/nginx/default.conf /etc/nginx/conf.d/default.conf

RUN chmod +x /entrypoint.sh

# To debug the container
#ENTRYPOINT ["tail", "-f", "/dev/null"]
