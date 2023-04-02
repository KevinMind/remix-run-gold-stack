FROM gitpod/workspace-full

# Install Auth0 CLI
RUN brew tap auth0/auth0-cli && brew install auth0

# Install mysql + pscale
RUN brew install planetscale/tap/pscale
RUN brew install mysql-client
RUN  echo 'export PATH="/home/linuxbrew/.linuxbrew/opt/mysql-client/bin:$PATH"' >> /home/gitpod/.bash_profile
RUN brew upgrade pscale

# install primsa CLI
RUN brew tap prisma/prisma && brew install prisma

# install vercel cli
RUN npm i -g vercel



