#!/usr/bin/env bash

set -euo pipefail

# Fetch 5-minute Max CPU and Memory utilization for all EC2 instances
# over the last 45 days and output CSV to stdout.
# Requirements: awscli v2, jq

usage() {
  cat <<'EOF'
Usage: fetch_instance_utilization.sh [--region REGION] [--start RFC3339] [--end RFC3339]

Defaults to the last 45 days at 5-minute granularity. REGION can also be set via AWS_DEFAULT_REGION.

Output columns:
instance_id,instance_name,metric,timestamp,max_value

Notes:
- CPU metric: AWS/EC2 CPUUtilization
- Memory metrics (best-effort):
  - CWAgent mem_used_percent (requires CloudWatch Agent)
  - System/Linux MemoryUtilization (legacy for some setups)
EOF
}

have_cmd() { command -v "$1" >/dev/null 2>&1; }

require_tools() {
  for c in aws jq; do
    if ! have_cmd "$c"; then
      echo "Error: Required tool '$c' not found in PATH" >&2
      exit 1
    fi
  done
}

timestamp_utc() { date -u +%Y-%m-%dT%H:%M:%SZ; }

calc_default_range() {
  END_TIME=$(timestamp_utc)
  START_TIME=$(date -u -d "$END_TIME -45 days" +%Y-%m-%dT%H:%M:%SZ)
}

REGION="${AWS_DEFAULT_REGION:-}"
START_TIME=""
END_TIME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"; shift 2;;
    --start)
      START_TIME="$2"; shift 2;;
    --end)
      END_TIME="$2"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown argument: $1" >&2; usage; exit 1;;
  esac
done

require_tools

if [[ -z "$REGION" ]]; then
  # Try to read default region from AWS config if not provided
  REGION=$(aws configure get region 2>/dev/null || true)
fi

if [[ -z "$REGION" ]]; then
  echo "Error: AWS region not set. Use --region or set AWS_DEFAULT_REGION." >&2
  exit 1
fi

if [[ -z "$START_TIME" || -z "$END_TIME" ]]; then
  calc_default_range
fi

PERIOD_SECONDS=$((5*60))

echo "instance_id,instance_name,metric,timestamp,max_value"

# Get instances with Id and Name tag
instances_json=$(aws ec2 describe-instances \
  --region "$REGION" \
  --query 'Reservations[].Instances[].{Id:InstanceId,Name:Tags[?Key==`Name`]|[0].Value}' \
  --output json)

instance_count=$(echo "$instances_json" | jq 'length')
if [[ "$instance_count" -eq 0 ]]; then
  exit 0
fi

fetch_metric_max_points() {
  local namespace="$1" metric_name="$2" dim_name="$3" dim_value="$4"
  aws cloudwatch get-metric-statistics \
    --region "$REGION" \
    --namespace "$namespace" \
    --metric-name "$metric_name" \
    --dimensions Name="$dim_name",Value="$dim_value" \
    --start-time "$START_TIME" \
    --end-time "$END_TIME" \
    --period "$PERIOD_SECONDS" \
    --statistics Maximum \
    --output json
}

# Iterate instances and emit CSV rows for CPU and memory metrics
for row in $(echo "$instances_json" | jq -rc '.[]'); do
  iid=$(echo "$row" | jq -r '.Id')
  name=$(echo "$row" | jq -r '.Name // ""')

  # CPUUtilization (AWS/EC2)
  cpu_json=$(fetch_metric_max_points "AWS/EC2" "CPUUtilization" "InstanceId" "$iid") || cpu_json='{}'
  echo "$cpu_json" | jq -r --arg iid "$iid" --arg name "$name" \
    '.Datapoints // [] | sort_by(.Timestamp) | .[] | [ $iid, $name, "CPUUtilization", .Timestamp, (.Maximum // null) ] | @csv' |
    awk -F',' -v OFS=',' '{ if ($5 != "" && $5 != "null") print $0 }'

  # Memory via CWAgent: mem_used_percent
  mem_cw_json=$(fetch_metric_max_points "CWAgent" "mem_used_percent" "InstanceId" "$iid") || mem_cw_json='{}'
  echo "$mem_cw_json" | jq -r --arg iid "$iid" --arg name "$name" \
    '.Datapoints // [] | sort_by(.Timestamp) | .[] | [ $iid, $name, "mem_used_percent", .Timestamp, (.Maximum // null) ] | @csv' |
    awk -F',' -v OFS=',' '{ if ($5 != "" && $5 != "null") print $0 }'

  # Memory via System/Linux: MemoryUtilization
  mem_sys_json=$(fetch_metric_max_points "System/Linux" "MemoryUtilization" "InstanceId" "$iid") || mem_sys_json='{}'
  echo "$mem_sys_json" | jq -r --arg iid "$iid" --arg name "$name" \
    '.Datapoints // [] | sort_by(.Timestamp) | .[] | [ $iid, $name, "MemoryUtilization", .Timestamp, (.Maximum // null) ] | @csv' |
    awk -F',' -v OFS=',' '{ if ($5 != "" && $5 != "null") print $0 }'
done

exit 0

