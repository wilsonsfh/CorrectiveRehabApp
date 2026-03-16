#!/bin/bash
set -e

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_KEY env var is not set"
  echo "Usage: SUPABASE_SERVICE_KEY=your-key ./deploy.sh"
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
