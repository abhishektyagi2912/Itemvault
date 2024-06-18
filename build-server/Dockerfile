FROM ubuntu:focal

# Update package list in the container
RUN apt-get update     

# Install curl to call the API and get the data from the API in the container
RUN  apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y
RUN apt-get install -y nodejs
RUN apt-get install git -y

WORKDIR /home/app

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

RUN npm install

# Excutable permission to the main.sh file and script.js file
RUN chmod +x main.sh
RUN chmod +x script.js 

ENTRYPOINT [ "/home/app/main.sh" ]