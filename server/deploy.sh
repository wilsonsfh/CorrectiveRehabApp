#!/bin/bash
set -e

# Load secrets from .env.deploy if it exists (gitignored)
if [ -f "$(dirname "$0")/.env.deploy" ]; then
  source "$(dirname "$0")/.env.deploy"
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_KEY is not set."
  echo "Create server/.env.deploy with: SUPABASE_SERVICE_KEY=your-key"
  exit 1
fi

echo "Deploying corrective-rehab-api to Cloud Run..."

gcloud run deploy corrective-rehab-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 120 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars SUPABASE_URL=https://dazlravqiglzcirrqhvb.supabase.co,SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY"

echo "✓ Deploy complete"
