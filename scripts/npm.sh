#!/bin/bash
# Helper script to load nvm and run npm commands
# Usage: ./scripts/npm.sh <npm-command>
# Example: ./scripts/npm.sh install
# Example: ./scripts/npm.sh run lint

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

cd "$(dirname "$0")/.." || exit

# Use the version specified in .nvmrc
nvm use

# Run the npm command with all arguments
npm "$@"

