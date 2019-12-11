# Add label for Application Issues javascript action

This action adds an `affiliate` or `partner` label to any issues with the `application` label. The issue has to have a valid Twitch Channel URL to work

## Inputs
repo-token - See usage for what you need in your workflow

## Outputs
NONE

## Example usage

on: 
  issues:
    types: [opened, edited]

jobs:
  twitch_url_check:
    runs-on: ubuntu-latest
    name: A job to label affiliates or partners
    steps:
    - name: The main step
      id: main
      uses: livecoders/issues-twitch-url-checker@master
      with:
        repo-token: "${{ secrets.GITHUB_TOKEN }}"
