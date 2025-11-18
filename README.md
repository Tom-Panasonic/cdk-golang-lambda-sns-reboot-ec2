# CDK Golang Lambda SNS Reboot EC2

AWS CDK (TypeScript) を使用して、Golang Lambda 関数で EC2 インスタンスを再起動し、SNS 通知を送信するプロジェクトです。

## 前提条件

- Node.js (v18 以上)
- Go (v1.21 以上)
- AWS CLI と AWS 認証情報の設定
- AWS CDK CLI (`npm install -g aws-cdk`)

## セットアップ

1. 依存関係のインストール:

```bash
npm install
```

2. 設定ファイルの作成:
   `os_version.json` ファイルを作成し、EC2 インスタンス ID と SNS トピック ARN を設定してください。

```json
{
  "instanceId": "i-xxxxxxxxxxxxxxxxx",
  "snsTopicArn": "arn:aws:sns:ap-northeast-1:xxxxxxxxxxxx:your-sns-topic-name"
}
```

**注意**: `os_version.json` は Git で管理されません。サンプルファイル `os_version.json.example` を参考にしてください。

## デプロイ

```bash
npm run deploy
```

または

```bash
cdk deploy --profile pcms-dev
```

## 削除

```bash
npm run destroy
```

または

```bash
cdk destroy --profile pcms-dev
```

## プロジェクト構造

```
.
├── bin/                           # CDK アプリケーションのエントリーポイント
├── lib/                           # CDK スタック定義
├── lambda/                        # Golang Lambda 関数
│   ├── main.go                    # Lambda ハンドラー
│   └── go.mod                     # Go モジュール定義
├── os_version.json                # 環境設定 (Git 管理外)
├── os_version.json.example        # 設定サンプル
├── cdk.json                       # CDK 設定
├── package.json                   # Node.js 依存関係
└── tsconfig.json                  # TypeScript 設定
```

## Lambda 関数の機能

Golang で実装された Lambda 関数は以下の処理を行います:

1. 環境変数から EC2 インスタンス ID と SNS トピック ARN を取得
2. 指定された EC2 インスタンスを再起動
3. SNS トピックに再起動通知を送信

## IAM 権限

Lambda 関数には以下の権限が付与されます:

- `ec2:RebootInstances` - EC2 インスタンスの再起動
- `sns:Publish` - SNS トピックへのメッセージ送信
- CloudWatch Logs への書き込み (基本実行ロール)
