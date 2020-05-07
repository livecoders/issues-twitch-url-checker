const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');
const clientId = 'lrmknreis8iakk53pwt87469523kr6';
const NOT_AFFILIATE_OR_PARTNER = "It looks like you're not Twitch affiliate or partner yet. Please reapply when you've met all the requirements. We'd be happy to evaluate your application then."

async function addLabel(client, labelName) {
  console.log(`Start addLabel: ${labelName}`);
  try {
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

async function addComment(client, comment) {
  console.log(`Start addComment ${comment}`);
  try {
    await client.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.payload.issue.number,
      body: comment
    });
  } catch (error) {
    core.setFailed(error.message);
  }
  console.log(`End addComment: ${comment}`);
}
async function getAppAccessToken() {
  let result = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${core.getInput('twitch-api-secret', {required: true})}&grant_type=client_credentials`);
  return result.data.access_token
}
async function closeIssue(client) {
  console.log(`Start closeIssue`);
  try {
    await client.issues.update({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.payload.issue.number,
      state: "closed"
    });
  } catch (error) {
    core.setFailed(error.message);
  }
  console.log(`End closeIssue`);
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
          console.log(urls[index]);
          let url = new URL(urls[index]);
          if (url.host.includes('twitch.tv') && (url.pathname.match(/\//g) || []).length == 1) {
            let login = url.pathname.replace('/', '').toLowerCase();
            //get user from twitch
            var appaccessToken = await getAppAccessToken();
            let result = await axios.get(`https://api.twitch.tv/helix/users?login=${login}`, { headers: { 'Client-Id': clientId, 'Authorization': `Bearer ${appaccessToken}` } });
            
            if (result.data.data.length === 1) {
              let user = result.data.data[0];
              const token = core.getInput('repo-token', {required: true});
              const client = new github.GitHub(token);

              if (user.broadcaster_type === 'affiliate' || user.broadcaster_type === 'partner') {
                await addLabel(client, user.broadcaster_type);
              } else {
                console.log("User is not affiliate or partner yet. Commenting and closing issue.");
                await addComment(client, NOT_AFFILIATE_OR_PARTNER);
                await closeIssue(client);
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
