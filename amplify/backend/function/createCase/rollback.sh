#!/bin/bash
# LegalFlow3 - Lambda Function Rollback Script
# Rollback script for createCase Lambda function

set -e

# Configuration
FUNCTION_NAME="LegalFlow3-createCase"
BACKUP_BUCKET="legalflow3-lambda-backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# List available versions
list_versions() {
    log_info "Listing available versions..."

    aws lambda list-versions-by-function \
        --function-name $FUNCTION_NAME \
        --query 'Versions[?Version != `$LATEST`].[Version,LastModified]' \
        --output table
}

# Rollback to previous version
rollback_to_version() {
    local version=$1

    if [ -z "$version" ]; then
        log_error "Version number is required."
        exit 1
    fi

    log_info "Rolling back to version $version..."

    # Get the function configuration for the specified version
    aws lambda get-function \
        --function-name $FUNCTION_NAME \
        --qualifier $version \
        --query 'Configuration.[Runtime,Handler,MemorySize,Timeout,Environment]' \
        --output json > function-config.json

    # Update the function configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $(jq -r '.Runtime' function-config.json) \
        --handler $(jq -r '.Handler' function-config.json) \
        --memory-size $(jq -r '.MemorySize' function-config.json) \
        --timeout $(jq -r '.Timeout' function-config.json) \
        --environment Variables="$(jq -r '.Environment.Variables' function-config.json)"

    # Clean up
    rm function-config.json

    log_info "Rollback to version $version completed."
}

# Rollback to previous version (automatic)
rollback_previous() {
    log_info "Rolling back to previous version..."

    # Get the current version
    CURRENT_VERSION=$(aws lambda get-function \
        --function-name $FUNCTION_NAME \
        --query 'Configuration.Version' \
        --output text)

    # Get the previous version
    PREVIOUS_VERSION=$(aws lambda list-versions-by-function \
        --function-name $FUNCTION_NAME \
        --query 'Versions[?Version != `$LATEST`] | sort_by(@, &LastModified) | reverse(@) | [1].Version' \
        --output text)

    if [ "$PREVIOUS_VERSION" = "null" ] || [ -z "$PREVIOUS_VERSION" ]; then
        log_error "No previous version found."
        exit 1
    fi

    log_info "Current version: $CURRENT_VERSION"
    log_info "Previous version: $PREVIOUS_VERSION"

    # Rollback to previous version
    rollback_to_version $PREVIOUS_VERSION
}

# Create backup of current version
create_backup() {
    log_info "Creating backup of current version..."

    # Get current version
    CURRENT_VERSION=$(aws lambda get-function \
        --function-name $FUNCTION_NAME \
        --query 'Configuration.Version' \
        --output text)

    # Create backup directory
    BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p $BACKUP_DIR

    # Download function code
    aws lambda get-function \
        --function-name $FUNCTION_NAME \
        --query 'Code.Location' \
        --output text | xargs wget -O $BACKUP_DIR/function.zip

    # Save function configuration
    aws lambda get-function-configuration \
        --function-name $FUNCTION_NAME \
        --output json > $BACKUP_DIR/function-config.json

    # Upload to S3
    aws s3 cp $BACKUP_DIR/function.zip s3://$BACKUP_BUCKET/$BACKUP_DIR/
    aws s3 cp $BACKUP_DIR/function-config.json s3://$BACKUP_BUCKET/$BACKUP_DIR/

    # Clean up local backup
    rm -rf $BACKUP_DIR

    log_info "Backup created: s3://$BACKUP_BUCKET/$BACKUP_DIR/"
}

# Restore from backup
restore_from_backup() {
    local backup_path=$1

    if [ -z "$backup_path" ]; then
        log_error "Backup path is required."
        exit 1
    fi

    log_info "Restoring from backup: $backup_path..."

    # Download backup files
    aws s3 cp s3://$BACKUP_BUCKET/$backup_path/function.zip .
    aws s3 cp s3://$BACKUP_BUCKET/$backup_path/function-config.json .

    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://function.zip

    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $(jq -r '.Runtime' function-config.json) \
        --handler $(jq -r '.Handler' function-config.json) \
        --memory-size $(jq -r '.MemorySize' function-config.json) \
        --timeout $(jq -r '.Timeout' function-config.json) \
        --environment Variables="$(jq -r '.Environment.Variables' function-config.json)"

    # Clean up
    rm function.zip function-config.json

    log_info "Restore from backup completed."
}

# Test the function after rollback
test_function() {
    log_info "Testing function after rollback..."

    # Create test event
    cat > test-event.json << EOF
{
  "arguments": {
    "input": {
      "name": "Test Case After Rollback",
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
        log_info "Function test after rollback successful."
        cat response.json
    else
        log_error "Function test after rollback failed."
        exit 1
    fi

    # Clean up
    rm test-event.json response.json
}

# Main rollback function
main() {
    local action=$1
    local target=$2

    log_info "Starting rollback process for $FUNCTION_NAME..."

    # Pre-rollback checks
    check_aws_cli
    check_aws_credentials

    case $action in
        "list")
            list_versions
            ;;
        "version")
            rollback_to_version $target
            test_function
            ;;
        "previous")
            rollback_previous
            test_function
            ;;
        "backup")
            create_backup
            ;;
        "restore")
            restore_from_backup $target
            test_function
            ;;
        *)
            log_error "Invalid action. Use: list, version, previous, backup, or restore"
            exit 1
            ;;
    esac

    log_info "Rollback process completed successfully!"
}

# Show usage
show_usage() {
    echo "Usage: $0 <action> [target]"
    echo ""
    echo "Actions:"
    echo "  list                    - List available versions"
    echo "  version <version>       - Rollback to specific version"
    echo "  previous                - Rollback to previous version"
    echo "  backup                  - Create backup of current version"
    echo "  restore <backup_path>   - Restore from backup"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 version 5"
    echo "  $0 previous"
    echo "  $0 backup"
    echo "  $0 restore backup-20240101-120000"
}

# Check arguments
if [ $# -lt 1 ]; then
    show_usage
    exit 1
fi

# Run main function
main "$@"
