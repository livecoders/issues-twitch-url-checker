const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');
const clientId = 'lrmknreis8iakk53pwt87469523kr6';

async function addLabel(labelName) {
  console.log(`Start addLabel: ${labelName}`);
  try {
    const token = core.getInput('repo-token', {required: true});
    const client = new github.GitHub(token);
    await client.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.payload.issue.number,
      labels: [ labelName ]
    });
  } catch (error) {
    core.setFailed(error.message);
  }
  console.log(`End addLabel: ${labelName}`);
}

async function run() {
  console.log('Start run');
  try {
    if (github.context.payload.issue) {
      console.log('Found issue payload');
      if (github.context.payload.issue.labels.filter(label => label.name === "application").length > 0) {
        console.log('Has application label');
        let urls = github.context.payload.issue.body.match(/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm);
        console.log(`Has ${urls.length} urls in the body`);
        for (let index in urls) {
          console.log(urls[index])
          let url = new URL(urls[index]);
          if (url.host.includes('twitch.tv') && (url.pathname.match(/\//g) || []).length == 1) {
            let login = url.pathname.replace('/', '').toLowerCase();
            //get user from twitch
            let result = await axios.get(`https://api.twitch.tv/helix/users?login=${login}`, { headers: { 'Client-Id': clientId } });
            
            if (result.data.data.length === 1) {
              let user = result.data.data[0]
              if (user.broadcaster_type === 'affiliate' || user.broadcaster_type === 'partner') {
                await addLabel(user.broadcaster_type)
              }
            }
          }
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
  console.log('End run');
}

run();