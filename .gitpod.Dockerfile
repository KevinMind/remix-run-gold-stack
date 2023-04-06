FROM gitpod/workspace-full

# install github cli
RUN brew install gh

# install vercel cli
RUN pnpm i -g vercel prisma

# install planest scale cli
RUN brew install planetscale/tap/pscale




