# TRAVIS IS NOT REQUIRED NOW
# generate service-account from google IAM

# we have added volume (bind mount) because we want to add service-account.json file inside of container
docker run -it -v $(pwd):/app ruby:2.4 sh
# docker run -it -v ${pwd}:/app ruby:2.4 sh --> FOR WINDOWS

# after we are inside the container shell install travis-ci cli
gem install travis

# login with github tokens "repo", "user:email", "read:org"
travis login --github-token <github_token> --com

travis encrypt-file service-account.json -r <github_username>/<repo_name> --com
