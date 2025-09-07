@echo off
REM LegalFlow3 テスト実行スクリプト (Windows版)
REM このスクリプトは、LegalFlow3システムのすべてのテストを実行します

setlocal enabledelayedexpansion

REM デフォルト値の設定
set RUN_ALL=false
set RUN_BACKEND=false
set RUN_FRONTEND=false
set RUN_INTEGRATION=false
set RUN_PERFORMANCE=false
set COVERAGE=false
set VERBOSE=false
set QUIET=false
set CLEAN=false
set SETUP=false

REM 引数の解析
:parse_args
if "%~1"=="" goto :end_parse
if "%~1"=="-h" goto :show_help
if "%~1"=="--help" goto :show_help
if "%~1"=="-a" set RUN_ALL=true
if "%~1"=="--all" set RUN_ALL=true
if "%~1"=="-b" set RUN_BACKEND=true
if "%~1"=="--backend" set RUN_BACKEND=true
if "%~1"=="-f" set RUN_FRONTEND=true
if "%~1"=="--frontend" set RUN_FRONTEND=true
if "%~1"=="-i" set RUN_INTEGRATION=true
if "%~1"=="--integration" set RUN_INTEGRATION=true
if "%~1"=="-p" set RUN_PERFORMANCE=true
if "%~1"=="--performance" set RUN_PERFORMANCE=true
if "%~1"=="-c" set COVERAGE=true
if "%~1"=="--coverage" set COVERAGE=true
if "%~1"=="-v" set VERBOSE=true
if "%~1"=="--verbose" set VERBOSE=true
if "%~1"=="-q" set QUIET=true
if "%~1"=="--quiet" set QUIET=true
if "%~1"=="--clean" set CLEAN=true
if "%~1"=="--setup" set SETUP=true
shift
goto :parse_args

:end_parse

REM ヘルプの表示
:show_help
echo LegalFlow3 テスト実行スクリプト (Windows版)
echo.
echo 使用方法:
echo   %0 [オプション]
echo.
echo オプション:
echo   -h, --help              このヘルプメッセージを表示
echo   -a, --all               すべてのテストを実行
echo   -b, --backend           バックエンドテストのみ実行
echo   -f, --frontend          フロントエンドテストのみ実行
echo   -i, --integration       統合テストのみ実行
echo   -p, --performance       パフォーマンステストのみ実行
echo   -c, --coverage          カバレッジレポートを生成
echo   -v, --verbose           詳細な出力を表示
echo   -q, --quiet             エラーのみ表示
echo   --clean                 テストデータをクリーンアップ
echo   --setup                 テスト環境をセットアップ
echo.
echo 例:
echo   %0 --all                # すべてのテストを実行
echo   %0 --backend --coverage # バックエンドテストをカバレッジ付きで実行
echo   %0 --frontend --verbose # フロントエンドテストを詳細出力で実行
goto :eof

REM テスト環境のセットアップ
:setup_test_environment
echo [INFO] テスト環境をセットアップしています...
set NODE_ENV=test
if "%DATABASE_URL%"=="" set DATABASE_URL=postgresql://username:password@localhost:5432/legalflow3_test

REM テスト用ディレクトリの作成
if not exist "test-results" mkdir test-results
if not exist "logs" mkdir logs

echo [SUCCESS] テスト環境のセットアップが完了しました
goto :eof

REM テストデータのクリーンアップ
:cleanup_test_data
echo [INFO] テストデータをクリーンアップしています...

REM バックエンドのテストデータをクリーンアップ
if exist "backend\api_service" (
    cd backend\api_service
    if exist "package.json" (
        npm run test:cleanup 2>nul
    )
    cd ..\..
)

REM フロントエンドのテストデータをクリーンアップ
if exist "frontend" (
    cd frontend
    if exist "package.json" (
        npm run test:cleanup 2>nul
    )
    cd ..
)

echo [SUCCESS] テストデータのクリーンアップが完了しました
goto :eof

REM バックエンドテストの実行
:run_backend_tests
echo [INFO] バックエンドテストを実行しています...

if not exist "backend\api_service" (
    echo [ERROR] バックエンドディレクトリが見つかりません
    exit /b 1
)

cd backend\api_service

REM 依存関係のインストール
if not exist "node_modules" (
    echo [INFO] 依存関係をインストールしています...
    npm install
)

REM テストの実行
if "%COVERAGE%"=="true" (
    echo [INFO] カバレッジレポートを生成しています...
    npm run test:coverage
) else (
    npm run test
)

REM パフォーマンステストの実行
if "%PERFORMANCE%"=="true" (
    echo [INFO] パフォーマンステストを実行しています...
    npm run test:performance
)

cd ..\..
echo [SUCCESS] バックエンドテストが完了しました
goto :eof

REM フロントエンドテストの実行
:run_frontend_tests
echo [INFO] フロントエンドテストを実行しています...

if not exist "frontend" (
    echo [ERROR] フロントエンドディレクトリが見つかりません
    exit /b 1
)

cd frontend

REM 依存関係のインストール
if not exist "node_modules" (
    echo [INFO] 依存関係をインストールしています...
    npm install
)

REM テストの実行
if "%COVERAGE%"=="true" (
    echo [INFO] カバレッジレポートを生成しています...
    npm run test:coverage
) else (
    npm run test
)

REM E2Eテストの実行
if "%E2E%"=="true" (
    echo [INFO] E2Eテストを実行しています...
    npm run test:e2e
)

cd ..
echo [SUCCESS] フロントエンドテストが完了しました
goto :eof

REM 統合テストの実行
:run_integration_tests
echo [INFO] 統合テストを実行しています...

REM 統合テストの実行
if exist "package.json" (
    if "%COVERAGE%"=="true" (
        npm run test:integration:coverage
    ) else (
        npm run test:integration
    )
) else (
    echo [WARNING] 統合テストの設定が見つかりません
)

echo [SUCCESS] 統合テストが完了しました
goto :eof

REM パフォーマンステストの実行
:run_performance_tests
echo [INFO] パフォーマンステストを実行しています...

REM バックエンドのパフォーマンステスト
if exist "backend\api_service" (
    cd backend\api_service
    npm run test:performance
    cd ..\..
)

REM フロントエンドのパフォーマンステスト
if exist "frontend" (
    cd frontend
    npm run test:performance
    cd ..
)

echo [SUCCESS] パフォーマンステストが完了しました
goto :eof

REM テスト結果の集計
:aggregate_test_results
echo [INFO] テスト結果を集計しています...

echo.
echo ==========================================
echo テスト結果サマリー
echo ==========================================
echo テストの実行が完了しました。
echo 詳細な結果は各ディレクトリのtest-resultsフォルダを確認してください。

echo [SUCCESS] テストの実行が完了しました！
goto :eof

REM メイン処理
:main
REM セットアップの実行
if "%SETUP%"=="true" call :setup_test_environment

REM クリーンアップの実行
if "%CLEAN%"=="true" call :cleanup_test_data

REM テストの実行
if "%RUN_ALL%"=="true" (
    echo [INFO] すべてのテストを実行しています...
    call :run_backend_tests
    call :run_frontend_tests
    call :run_integration_tests
    call :run_performance_tests
) else (
    if "%RUN_BACKEND%"=="true" call :run_backend_tests
    if "%RUN_FRONTEND%"=="true" call :run_frontend_tests
    if "%RUN_INTEGRATION%"=="true" call :run_integration_tests
    if "%RUN_PERFORMANCE%"=="true" call :run_performance_tests
)

REM テスト結果の集計
call :aggregate_test_results

goto :eof

REM スクリプトの実行
call :main %*
