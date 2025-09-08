#!/bin/bash
# LegalFlow3 - Lambda Function Deployment Script
# Deployment script for createCase Lambda function

set -e

# Configuration
FUNCTION_NAME="LegalFlow3-createCase"
RUNTIME="nodejs18.x"
HANDLER="src/index.handler"
MEMORY_SIZE=256
TIMEOUT=30
ROLE_NAME="LegalFlow3-LambdaRole"

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

# Create IAM role for Lambda function
create_iam_role() {
    log_info "Creating IAM role for Lambda function..."

    # Check if role already exists
    if aws iam get-role --role-name $ROLE_NAME &> /dev/null; then
        log_warn "IAM role $ROLE_NAME already exists. Skipping creation."
        return
    fi

    # Create trust policy
    cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create the role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://trust-policy.json

    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

    # Attach custom policy
    aws iam put-role-policy \
        --role-name $ROLE_NAME \
        --policy-name LegalFlow3LambdaPolicy \
        --policy-document file://iam-policy.json

    # Clean up
    rm trust-policy.json

    log_info "IAM role created successfully."
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm ci --production
}

# Build the function
build_function() {
    log_info "Building Lambda function..."
    npm run build
}

# Create deployment package
create_deployment_package() {
    log_info "Creating deployment package..."

    # Create deployment directory
    mkdir -p deployment

    # Copy source files
    cp -r dist/* deployment/
    cp package.json deployment/
    cp package-lock.json deployment/

    # Install production dependencies
    cd deployment
    npm ci --production
    cd ..

    # Create ZIP file
    cd deployment
    zip -r ../deployment.zip .
    cd ..

    log_info "Deployment package created: deployment.zip"
}

# Deploy the function
deploy_function() {
    log_info "Deploying Lambda function..."

    # Get the role ARN
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)

    # Check if function exists
    if aws lambda get-function --function-name $FUNCTION_NAME &> /dev/null; then
        log_info "Function exists. Updating function code..."
        aws lambda update-function-code \
            --function-name $FUNCTION_NAME \
            --zip-file fileb://deployment.zip
    else
        log_info "Function does not exist. Creating new function..."
        aws lambda create-function \
            --function-name $FUNCTION_NAME \
            --runtime $RUNTIME \
            --role $ROLE_ARN \
            --handler $HANDLER \
            --zip-file fileb://deployment.zip \
            --memory-size $MEMORY_SIZE \
            --timeout $TIMEOUT \
            --environment Variables='{
                "NODE_ENV":"production",
                "CASES_TABLE_NAME":"LegalFlow3-Cases",
                "CASE_ASSIGNMENTS_TABLE_NAME":"LegalFlow3-CaseAssignments",
                "SUBSCRIPTIONS_TABLE_NAME":"LegalFlow3-Subscriptions"
            }'
    fi

    log_info "Function deployed successfully."
}

# Update function configuration
update_function_config() {
    log_info "Updating function configuration..."

    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --environment Variables='{
            "NODE_ENV":"production",
            "CASES_TABLE_NAME":"LegalFlow3-Cases",
            "CASE_ASSIGNMENTS_TABLE_NAME":"LegalFlow3-CaseAssignments",
            "SUBSCRIPTIONS_TABLE_NAME":"LegalFlow3-Subscriptions"
        }'

    log_info "Function configuration updated."
}

# Test the function
test_function() {
    log_info "Testing Lambda function..."

    # Create test event
    cat > test-event.json << EOF
{
  "arguments": {
    "input": {
      "name": "Test Case",
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

# Clean up
cleanup() {
    log_info "Cleaning up..."
    rm -rf deployment deployment.zip
}

# Main deployment function
main() {
    log_info "Starting deployment of $FUNCTION_NAME..."

    # Pre-deployment checks
    check_aws_cli
    check_aws_credentials

    # Create IAM role
    create_iam_role

    # Build and package
    install_dependencies
    build_function
    create_deployment_package

    # Deploy
    deploy_function
    update_function_config

    # Test
    test_function

    # Clean up
    cleanup

    log_info "Deployment completed successfully!"
}

# Run main function
main "$@"
