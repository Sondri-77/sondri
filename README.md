# Sondri
Sondri is an all-inclusive AI agent, Business and Coding Expert 

## Continuous deployment

`.github/workflows/deploy.yml` auto-deploys the site to Cloudflare Workers on
every push to `main` that touches `sondri-site/**` (and supports manual runs
from the Actions tab).

**Required secret:** add `CLOUDFLARE_API_TOKEN` under
repo Settings → Secrets and variables → Actions. Create the token in the
Cloudflare dashboard (My Profile → API Tokens → *Edit Cloudflare Workers*
template, scoped to the `Sondri Cockpit` account).

The workflow reads the account id and worker name from `sondri-site/wrangler.jsonc`.
