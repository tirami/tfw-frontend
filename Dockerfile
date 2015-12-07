FROM ubuntu
 
RUN apt-get update -qq
RUN apt-get install -y build-essential nodejs npm nodejs-legacy vim git
 
RUN mkdir /udadisi-frontend
ADD . /udadisi-frontend
WORKDIR /udadisi-frontend
 
RUN npm install -g phantomjs
RUN npm install -g grunt-cli
RUN npm install -g grunt
RUN npm install -g bower
RUN npm install
RUN bower install --allow-root
 
#EXPOSE 8000

CMD ["npm", "start"]
