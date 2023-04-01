FROM gitpod/workspace-full

# Install Auth0 CLI
RUN brew tap auth0/auth0-cli && brew install auth0

# install primsa CLI
RUN brew tap prisma/prisma && brew install prisma


