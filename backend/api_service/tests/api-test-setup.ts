// backend/api_service/tests/api-test-setup.ts
import request from 'supertest';
import { createApp } from '../src/index'; // createApp関数をインポート

let server: any; // Expressサーバーインスタンス
let agent: any; // supertestエージェント

beforeAll(async () => {
  const app = createApp(); // アプリケーションインスタンスを作成
  server = app.listen(0); // 利用可能なポートでサーバーを起動
  agent = request(server); // supertestエージェントを作成
});

afterAll(async () => {
  await server.close(); // サーバーを閉じる
});

export { agent }; // supertestエージェントをエクスポート
