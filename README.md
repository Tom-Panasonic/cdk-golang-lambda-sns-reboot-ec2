# CDK Golang Lambda SNS Reboot EC2

AWS CDK (TypeScript) を使用して、Golang Lambda 関数で EC2 インスタンスを再起動し、SNS 通知を送信するプロジェクトです。

## 前提条件

- Node.js (v18 以上)
- Go (v1.21 以上)
- **Docker** (Lambda 関数のビルドに必要)
- AWS CLI と AWS 認証情報の設定
- AWS CDK CLI (`npm install -g aws-cdk`)

## 初回セットアップ手順

### 1. 依存関係のインストール

```bash
# Node.js 依存関係
npm install

# Go 依存関係
cd lambda
go mod tidy
cd ..
```

### 2. TypeScript のビルド

```bash
npm run build
```

### 3. 設定ファイルの作成

`os_version.json` ファイルをプロジェクトルートに作成し、EC2 インスタンス ID と SNS トピック ARN を設定します。

```bash
# サンプルファイルをコピー
cp os_version.json.example os_version.json

# 内容を編集
vi os_version.json
```

`os_version.json` の例:

```json
{
  "instanceId": "i-xxxxxxxxxxxxxxxxx",
  "snsTopicArn": "arn:aws:sns:ap-northeast-1:xxxxxxxxxxxx:your-sns-topic-name"
}
```

**重要**: `os_version.json` は `.gitignore` に含まれており、Git で管理されません。

### 4. CDK のブートストラップ (初回のみ)

AWS アカウントとリージョンで CDK を初めて使用する場合、ブートストラップが必要です。

```bash
cdk bootstrap --profile pcms-dev
```

### 5. デプロイ前の確認 (オプション)

生成される CloudFormation テンプレートを確認できます。

```bash
# cdk.out をクリーンアップしてから synth
rm -rf cdk.out
npx cdk synth --profile pcms-dev
```

## デプロイ

### 通常のデプロイ

```bash
npm run deploy
```

または

```bash
cdk deploy --profile pcms-dev
```

### トラブルシューティング: ビルドエラーが発生した場合

もし「Uploaded file must be a non-empty zip」エラーが発生した場合:

```bash
# cdk.out ディレクトリをクリーンアップ
rm -rf cdk.out

# 再度 synthesize を実行
npx cdk synth --profile pcms-dev

# デプロイを実行
npm run deploy
```

## 削除

```bash
npm run destroy
```

または

```bash
cdk destroy --profile pcms-dev
```

## 開発時の便利なコマンド

### TypeScript の変更を監視

```bash
npm run watch
```

### CDK Diff (変更内容の確認)

```bash
cdk diff --profile pcms-dev
```

### Lambda 関数の手動ビルド (デバッグ用)

```bash
cd lambda
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
```

### Docker を使った手動ビルド

```bash
docker run --rm \
  -v "$PWD/lambda:/asset-input:z" \
  -v "$PWD/test-output:/asset-output:z" \
  -w /asset-input \
  public.ecr.aws/sam/build-provided.al2:latest \
  bash -c "GOOS=linux GOARCH=amd64 go build -o /asset-output/bootstrap main.go"
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
