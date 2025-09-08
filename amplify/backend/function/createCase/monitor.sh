#!/bin/bash
# LegalFlow3 - Lambda Function Monitoring Script
# Monitoring script for createCase Lambda function

set -e

# Configuration
FUNCTION_NAME="LegalFlow3-createCase"
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"
METRICS_NAMESPACE="LegalFlow3/CreateCase"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
}

# Check if AWS credentials are configured
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi
}

# Get function status
get_function_status() {
    log_info "Getting function status..."

    aws lambda get-function \
        --function-name $FUNCTION_NAME \
        --query 'Configuration.[State,StateReason,LastUpdateStatus,LastUpdateStatusReason]' \
        --output table
}

# Get function metrics
get_function_metrics() {
    local start_time=$1
    local end_time=$2

    if [ -z "$start_time" ]; then
        start_time=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)
    fi

    if [ -z "$end_time" ]; then
        end_time=$(date -u +%Y-%m-%dT%H:%M:%S)
    fi

    log_info "Getting function metrics from $start_time to $end_time..."

    # Get invocations
    INVOCATIONS=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/Lambda \
        --metric-name Invocations \
        --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
        --start-time $start_time \
        --end-time $end_time \
        --period 300 \
        --statistics Sum \
        --query 'Datapoints[0].Sum' \
        --output text)

    # Get errors
    ERRORS=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/Lambda \
        --metric-name Errors \
        --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
        --start-time $start_time \
        --end-time $end_time \
        --period 300 \
        --statistics Sum \
        --query 'Datapoints[0].Sum' \
        --output text)

    # Get duration
    DURATION=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/Lambda \
        --metric-name Duration \
        --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
        --start-time $start_time \
        --end-time $end_time \
        --period 300 \
        --statistics Average \
        --query 'Datapoints[0].Average' \
        --output text)

    # Get throttles
    THROTTLES=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/Lambda \
        --metric-name Throttles \
        --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
        --start-time $start_time \
        --end-time $end_time \
        --period 300 \
        --statistics Sum \
        --query 'Datapoints[0].Sum' \
        --output text)

    # Get concurrent executions
    CONCURRENT=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/Lambda \
        --metric-name ConcurrentExecutions \
        --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
        --start-time $start_time \
        --end-time $end_time \
        --period 300 \
        --statistics Maximum \
        --query 'Datapoints[0].Maximum' \
        --output text)

    # Display metrics
    echo "=== Function Metrics ==="
    echo "Invocations: ${INVOCATIONS:-0}"
    echo "Errors: ${ERRORS:-0}"
    echo "Average Duration: ${DURATION:-0} ms"
    echo "Throttles: ${THROTTLES:-0}"
    echo "Max Concurrent Executions: ${CONCURRENT:-0}"

    # Calculate error rate
    if [ "$INVOCATIONS" != "None" ] && [ "$INVOCATIONS" -gt 0 ]; then
        ERROR_RATE=$(echo "scale=2; $ERRORS * 100 / $INVOCATIONS" | bc -l)
        echo "Error Rate: $ERROR_RATE%"
    else
        echo "Error Rate: 0%"
    fi
}

# Get function logs
get_function_logs() {
    local start_time=$1
    local end_time=$2
    local limit=${3:-100}

    if [ -z "$start_time" ]; then
        start_time=$(date -u -d '1 hour ago' +%s)000
    else
        start_time=$(date -u -d "$start_time" +%s)000
    fi

    if [ -z "$end_time" ]; then
        end_time=$(date -u +%s)000
    else
        end_time=$(date -u -d "$end_time" +%s)000
    fi

    log_info "Getting function logs from $(date -d @$((start_time/1000)) -u) to $(date -d @$((end_time/1000)) -u)..."

    aws logs filter-log-events \
        --log-group-name $LOG_GROUP \
        --start-time $start_time \
        --end-time $end_time \
        --max-items $limit \
        --query 'events[].message' \
        --output text
}

# Get error logs
get_error_logs() {
    local start_time=$1
    local end_time=$2
    local limit=${3:-50}

    if [ -z "$start_time" ]; then
        start_time=$(date -u -d '1 hour ago' +%s)000
    else
        start_time=$(date -u -d "$start_time" +%s)000
    fi

    if [ -z "$end_time" ]; then
        end_time=$(date -u +%s)000
    else
        end_time=$(date -u -d "$end_time" +%s)000
    fi

    log_info "Getting error logs from $(date -d @$((start_time/1000)) -u) to $(date -d @$((end_time/1000)) -u)..."

    aws logs filter-log-events \
        --log-group-name $LOG_GROUP \
        --start-time $start_time \
        --end-time $end_time \
        --filter-pattern "ERROR" \
        --max-items $limit \
        --query 'events[].message' \
        --output text
}

# Test function
test_function() {
    log_info "Testing function..."

    # Create test event
    cat > test-event.json << EOF
{
  "arguments": {
    "input": {
      "name": "Monitor Test Case",
      "categoryId": "test-category-123"
    }
  },
  "identity": {
    "sub": "test-user-123"
  }
}
EOF

    # Invoke the function
    aws lambda invoke \
        --function-name $FUNCTION_NAME \
        --payload file://test-event.json \
        --cli-binary-format raw-in-base64-out \
        response.json

    # Check response
    if [ $? -eq 0 ]; then
        log_info "Function test successful."
        cat response.json
    else
        log_error "Function test failed."
        exit 1
    fi

    # Clean up
    rm test-event.json response.json
}

# Create CloudWatch alarms
create_alarms() {
    log_info "Creating CloudWatch alarms..."

    # Error alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "LegalFlow3-CreateCase-Errors" \
        --alarm-description "Alarm for CreateCase function errors" \
        --metric-name Errors \
        --namespace AWS/Lambda \
        --statistic Sum \
        --period 300 \
        --evaluation-periods 2 \
        --threshold 5 \
        --comparison-operator GreaterThanOrEqualToThreshold \
        --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
        --treat-missing-data notBreaching

    # Duration alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "LegalFlow3-CreateCase-Duration" \
        --alarm-description "Alarm for CreateCase function duration" \
        --metric-name Duration \
        --namespace AWS/Lambda \
        --statistic Average \
        --period 300 \
        --evaluation-periods 2 \
        --threshold 25000 \
        --comparison-operator GreaterThanThreshold \
        --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
        --treat-missing-data notBreaching

    # Throttle alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "LegalFlow3-CreateCase-Throttles" \
        --alarm-description "Alarm for CreateCase function throttles" \
        --metric-name Throttles \
        --namespace AWS/Lambda \
        --statistic Sum \
        --period 300 \
        --evaluation-periods 2 \
        --threshold 10 \
        --comparison-operator GreaterThanOrEqualToThreshold \
        --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
        --treat-missing-data notBreaching

    log_info "CloudWatch alarms created successfully."
}

# Get alarm status
get_alarm_status() {
    log_info "Getting alarm status..."

    aws cloudwatch describe-alarms \
        --alarm-names "LegalFlow3-CreateCase-Errors" "LegalFlow3-CreateCase-Duration" "LegalFlow3-CreateCase-Throttles" \
        --query 'MetricAlarms[].{Name:AlarmName,State:StateValue,Reason:StateReason}' \
        --output table
}

# Generate monitoring report
generate_report() {
    local start_time=$1
    local end_time=$2

    if [ -z "$start_time" ]; then
        start_time=$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S)
    fi

    if [ -z "$end_time" ]; then
        end_time=$(date -u +%Y-%m-%dT%H:%M:%S)
    fi

    log_info "Generating monitoring report from $start_time to $end_time..."

    # Create report file
    REPORT_FILE="monitoring-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "=== LegalFlow3 CreateCase Function Monitoring Report ==="
        echo "Generated on: $(date)"
        echo "Time Range: $start_time to $end_time"
        echo ""

        echo "=== Function Status ==="
        aws lambda get-function \
            --function-name $FUNCTION_NAME \
            --query 'Configuration.[State,StateReason,LastUpdateStatus,LastUpdateStatusReason]' \
            --output table

        echo ""
        echo "=== Function Metrics ==="
        get_function_metrics "$start_time" "$end_time"

        echo ""
        echo "=== Alarm Status ==="
        get_alarm_status

        echo ""
        echo "=== Recent Errors ==="
        get_error_logs "$start_time" "$end_time" 20

    } > $REPORT_FILE

    log_info "Monitoring report generated: $REPORT_FILE"
}

# Main monitoring function
main() {
    local action=$1
    local start_time=$2
    local end_time=$3

    log_info "Starting monitoring for $FUNCTION_NAME..."

    # Pre-monitoring checks
    check_aws_cli
    check_aws_credentials

    case $action in
        "status")
            get_function_status
            ;;
        "metrics")
            get_function_metrics "$start_time" "$end_time"
            ;;
        "logs")
            get_function_logs "$start_time" "$end_time"
            ;;
        "errors")
            get_error_logs "$start_time" "$end_time"
            ;;
        "test")
            test_function
            ;;
        "alarms")
            create_alarms
            ;;
        "alarm-status")
            get_alarm_status
            ;;
        "report")
            generate_report "$start_time" "$end_time"
            ;;
        *)
            log_error "Invalid action. Use: status, metrics, logs, errors, test, alarms, alarm-status, or report"
            exit 1
            ;;
    esac

    log_info "Monitoring process completed successfully!"
}

# Show usage
show_usage() {
    echo "Usage: $0 <action> [start_time] [end_time]"
    echo ""
    echo "Actions:"
    echo "  status                    - Get function status"
    echo "  metrics [start] [end]     - Get function metrics"
    echo "  logs [start] [end]        - Get function logs"
    echo "  errors [start] [end]      - Get error logs"
    echo "  test                      - Test function"
    echo "  alarms                    - Create CloudWatch alarms"
    echo "  alarm-status              - Get alarm status"
    echo "  report [start] [end]      - Generate monitoring report"
    echo ""
    echo "Time format: YYYY-MM-DDTHH:MM:SS (UTC)"
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 metrics '2024-01-01T00:00:00' '2024-01-01T23:59:59'"
    echo "  $0 logs '2024-01-01T00:00:00' '2024-01-01T23:59:59'"
    echo "  $0 errors '2024-01-01T00:00:00' '2024-01-01T23:59:59'"
    echo "  $0 test"
    echo "  $0 alarms"
    echo "  $0 alarm-status"
    echo "  $0 report '2024-01-01T00:00:00' '2024-01-01T23:59:59'"
}

# Check arguments
if [ $# -lt 1 ]; then
    show_usage
    exit 1
fi

# Run main function
main "$@"
