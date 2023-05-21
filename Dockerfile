FROM node:18.16.0

# make directory for application
RUN mkdir -p /var/app

# set workdir 
WORKDIR /var/app

COPY . .

# install dependency files
RUN npm install

# install pm2
RUN npm install -g pm2

# set production
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8081

# execute pm2
ENTRYPOINT [ "pm2-runtime", "start", "bin/www" ]