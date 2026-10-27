FROM node:26

RUN apt-get update && apt-get install -y \
  apt-transport-https \
  ca-certificates \
  gnupg \
  curl \
  cron \
  lsb-release \
  vim \
  procps

# Set working directory
RUN mkdir /services
WORKDIR /services

# Install node dependencies
COPY services/package.json .
COPY services/package-lock.json .
RUN npm install

# Copy source code
COPY services/package ./package
COPY services/package-tools ./package-tools

CMD ["bash", "-c", "tail -f /dev/null"]