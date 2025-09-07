#!/bin/bash

# LegalFlow3 テスト実行スクリプト
# このスクリプトは、LegalFlow3システムのすべてのテストを実行します

set -e  # エラーが発生したら即座に終了

# 色付きの出力用の関数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ヘルプメッセージ
show_help() {
    echo "LegalFlow3 テスト実行スクリプト"
    echo ""
    echo "使用方法:"
    echo "  $0 [オプション]"
    echo ""
    echo "オプション:"
    echo "  -h, --help              このヘルプメッセージを表示"
    echo "  -a, --all               すべてのテストを実行"
    echo "  -b, --backend           バックエンドテストのみ実行"
    echo "  -f, --frontend          フロントエンドテストのみ実行"
    echo "  -i, --integration       統合テストのみ実行"
    echo "  -p, --performance       パフォーマンステストのみ実行"
    echo "  -c, --coverage          カバレッジレポートを生成"
    echo "  -v, --verbose           詳細な出力を表示"
    echo "  -q, --quiet             エラーのみ表示"
    echo "  --clean                 テストデータをクリーンアップ"
    echo "  --setup                 テスト環境をセットアップ"
    echo ""
    echo "例:"
    echo "  $0 --all                # すべてのテストを実行"
    echo "  $0 --backend --coverage # バックエンドテストをカバレッジ付きで実行"
    echo "  $0 --frontend --verbose # フロントエンドテストを詳細出力で実行"
}

# テスト環境のセットアップ
setup_test_environment() {
    log_info "テスト環境をセットアップしています..."

    # 環境変数の設定
    export NODE_ENV=test
    export DATABASE_URL=${DATABASE_URL:-"postgresql://username:password@localhost:5432/legalflow3_test"}

    # テスト用ディレクトリの作成
    mkdir -p test-results
    mkdir -p logs

    log_success "テスト環境のセットアップが完了しました"
}

# テストデータのクリーンアップ
cleanup_test_data() {
    log_info "テストデータをクリーンアップしています..."

    # バックエンドのテストデータをクリーンアップ
    if [ -d "backend/api_service" ]; then
        cd backend/api_service
        if [ -f "package.json" ]; then
            npm run test:cleanup 2>/dev/null || true
        fi
        cd ../..
    fi

    # フロントエンドのテストデータをクリーンアップ
    if [ -d "frontend" ]; then
        cd frontend
        if [ -f "package.json" ]; then
            npm run test:cleanup 2>/dev/null || true
        fi
        cd ..
    fi

    log_success "テストデータのクリーンアップが完了しました"
}

# バックエンドテストの実行
run_backend_tests() {
    log_info "バックエンドテストを実行しています..."

    if [ ! -d "backend/api_service" ]; then
        log_error "バックエンドディレクトリが見つかりません"
        return 1
    fi

    cd backend/api_service

    # 依存関係のインストール
    if [ ! -d "node_modules" ]; then
        log_info "依存関係をインストールしています..."
        npm install
    fi

    # テストの実行
    if [ "$COVERAGE" = "true" ]; then
        log_info "カバレッジレポートを生成しています..."
        npm run test:coverage
    else
        npm run test
    fi

    # パフォーマンステストの実行
    if [ "$PERFORMANCE" = "true" ]; then
        log_info "パフォーマンステストを実行しています..."
        npm run test:performance
    fi

    cd ../..
    log_success "バックエンドテストが完了しました"
}

# フロントエンドテストの実行
run_frontend_tests() {
    log_info "フロントエンドテストを実行しています..."

    if [ ! -d "frontend" ]; then
        log_error "フロントエンドディレクトリが見つかりません"
        return 1
    fi

    cd frontend

    # 依存関係のインストール
    if [ ! -d "node_modules" ]; then
        log_info "依存関係をインストールしています..."
        npm install
    fi

    # テストの実行
    if [ "$COVERAGE" = "true" ]; then
        log_info "カバレッジレポートを生成しています..."
        npm run test:coverage
    else
        npm run test
    fi

    # E2Eテストの実行
    if [ "$E2E" = "true" ]; then
        log_info "E2Eテストを実行しています..."
        npm run test:e2e
    fi

    cd ..
    log_success "フロントエンドテストが完了しました"
}

# 統合テストの実行
run_integration_tests() {
    log_info "統合テストを実行しています..."

    # 統合テストの実行
    if [ -f "package.json" ]; then
        if [ "$COVERAGE" = "true" ]; then
            npm run test:integration:coverage
        else
            npm run test:integration
        fi
    else
        log_warning "統合テストの設定が見つかりません"
    fi

    log_success "統合テストが完了しました"
}

# パフォーマンステストの実行
run_performance_tests() {
    log_info "パフォーマンステストを実行しています..."

    # バックエンドのパフォーマンステスト
    if [ -d "backend/api_service" ]; then
        cd backend/api_service
        npm run test:performance
        cd ../..
    fi

    # フロントエンドのパフォーマンステスト
    if [ -d "frontend" ]; then
        cd frontend
        npm run test:performance
        cd ..
    fi

    log_success "パフォーマンステストが完了しました"
}

# テスト結果の集計
aggregate_test_results() {
    log_info "テスト結果を集計しています..."

    # テスト結果の集計
    local total_tests=0
    local passed_tests=0
    local failed_tests=0

    # バックエンドのテスト結果を集計
    if [ -f "backend/api_service/test-results/results.json" ]; then
        local backend_tests=$(jq '.total' backend/api_service/test-results/results.json 2>/dev/null || echo "0")
        local backend_passed=$(jq '.passed' backend/api_service/test-results/results.json 2>/dev/null || echo "0")
        local backend_failed=$(jq '.failed' backend/api_service/test-results/results.json 2>/dev/null || echo "0")

        total_tests=$((total_tests + backend_tests))
        passed_tests=$((passed_tests + backend_passed))
        failed_tests=$((failed_tests + backend_failed))
    fi

    # フロントエンドのテスト結果を集計
    if [ -f "frontend/test-results/results.json" ]; then
        local frontend_tests=$(jq '.total' frontend/test-results/results.json 2>/dev/null || echo "0")
        local frontend_passed=$(jq '.passed' frontend/test-results/results.json 2>/dev/null || echo "0")
        local frontend_failed=$(jq '.failed' frontend/test-results/results.json 2>/dev/null || echo "0")

        total_tests=$((total_tests + frontend_tests))
        passed_tests=$((passed_tests + frontend_passed))
        failed_tests=$((failed_tests + frontend_failed))
    fi

    # 結果の表示
    echo ""
    echo "=========================================="
    echo "テスト結果サマリー"
    echo "=========================================="
    echo "総テスト数: $total_tests"
    echo "成功: $passed_tests"
    echo "失敗: $failed_tests"

    if [ $failed_tests -eq 0 ]; then
        log_success "すべてのテストが成功しました！"
        exit 0
    else
        log_error "$failed_tests 個のテストが失敗しました"
        exit 1
    fi
}

# メイン関数
main() {
    local run_all=false
    local run_backend=false
    local run_frontend=false
    local run_integration=false
    local run_performance=false
    local coverage=false
    local verbose=false
    local quiet=false
    local clean=false
    local setup=false

    # 引数の解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -a|--all)
                run_all=true
                shift
                ;;
            -b|--backend)
                run_backend=true
                shift
                ;;
            -f|--frontend)
                run_frontend=true
                shift
                ;;
            -i|--integration)
                run_integration=true
                shift
                ;;
            -p|--performance)
                run_performance=true
                shift
                ;;
            -c|--coverage)
                coverage=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -q|--quiet)
                quiet=true
                shift
                ;;
            --clean)
                clean=true
                shift
                ;;
            --setup)
                setup=true
                shift
                ;;
            *)
                log_error "不明なオプション: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 環境変数の設定
    if [ "$coverage" = "true" ]; then
        export COVERAGE=true
    fi

    if [ "$run_performance" = "true" ]; then
        export PERFORMANCE=true
    fi

    if [ "$run_all" = "true" ]; then
        export E2E=true
    fi

    # セットアップの実行
    if [ "$setup" = "true" ]; then
        setup_test_environment
    fi

    # クリーンアップの実行
    if [ "$clean" = "true" ]; then
        cleanup_test_data
    fi

    # テストの実行
    if [ "$run_all" = "true" ]; then
        log_info "すべてのテストを実行しています..."
        run_backend_tests
        run_frontend_tests
        run_integration_tests
        run_performance_tests
    else
        if [ "$run_backend" = "true" ]; then
            run_backend_tests
        fi

        if [ "$run_frontend" = "true" ]; then
            run_frontend_tests
        fi

        if [ "$run_integration" = "true" ]; then
            run_integration_tests
        fi

        if [ "$run_performance" = "true" ]; then
            run_performance_tests
        fi
    fi

    # テスト結果の集計
    aggregate_test_results
}

# スクリプトの実行
main "$@"
